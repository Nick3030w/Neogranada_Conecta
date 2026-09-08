import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Observable, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { ChatService } from './chat.service';
import { NotificationService } from './notification.service';
import {
  ConversationParticipant,
  ConversationTopic,
  DEFAULT_CONVERSATION_TOPIC,
  DirectConversation,
  StudentContact,
  conversationTopicLabel,
  directConversationId,
  hasUnreadFor,
  isConversationTopic,
  peerIdOf,
} from '../interfaces/chat.interface';
import { UserProfile } from '../interfaces/user.interface';

/** Longitud máxima del resumen guardado en la conversación */
const PREVIEW_LENGTH = 140;

/**
 * Conversaciones directas entre estudiantes.
 *
 * Cada par de estudiantes comparte un único documento en `conversations`,
 * con id determinístico (`uidA__uidB` ordenado). Eso evita hilos duplicados
 * y hace innecesaria cualquier solicitud de amistad: basta con abrir la
 * conversación para empezar a escribir.
 *
 * Los mensajes se delegan a ChatService, que los guarda en
 * `chats/{conversationId}/messages`, la misma estructura que ya usaban los
 * chats de solicitudes. Por eso la pantalla de chat se reutiliza tal cual.
 */
@Injectable({ providedIn: 'root' })
export class StudentChatService {
  private readonly db = inject(Firestore);
  private readonly authService = inject(AuthService);
  private readonly chatService = inject(ChatService);
  private readonly notificationService = inject(NotificationService);

  private readonly COL = 'conversations';

  /**
   * Abre la conversación con otro estudiante, creándola si no existe.
   * @returns el id de la conversación
   */
  async openConversation(
    peer: StudentContact,
    topic: ConversationTopic = DEFAULT_CONVERSATION_TOPIC,
  ): Promise<string> {
    const me = this.authService.currentUser;
    if (!me) throw new Error('NO_SESSION');
    if (me.role !== 'student') throw new Error('ONLY_STUDENTS');
    if (!peer?.uid) throw new Error('INVALID_PEER');
    if (me.uid === peer.uid) throw new Error('SELF_CONVERSATION');

    const id = directConversationId(me.uid, peer.uid);
    const ref = doc(this.db, this.COL, id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        type: 'direct',
        participantIds: [me.uid, peer.uid].sort(),
        participants: {
          [me.uid]: this.toParticipant(me),
          [peer.uid]: this.contactToParticipant(peer),
        },
        topic: isConversationTopic(topic) ? topic : DEFAULT_CONVERSATION_TOPIC,
        lastMessage: '',
        lastMessageAt: null,
        lastSenderId: '',
        lastReadAt: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Refresca la copia de mis datos: el nombre o el programa pueden
      // haber cambiado en el perfil desde la última vez.
      await updateDoc(ref, {
        [`participants.${me.uid}`]: this.toParticipant(me),
        updatedAt: serverTimestamp(),
      });
    }

    return id;
  }

  /**
   * Conversaciones directas del usuario en sesión, en tiempo real.
   *
   * Sigue el stream del perfil en vez de leer el uid una sola vez: al recargar
   * la página, el guard puede dejar pasar antes de que Firestore devuelva el
   * perfil, y así la consulta arranca en cuanto el uid está disponible.
   */
  getMyConversations(): Observable<DirectConversation[]> {
    return this.authService.currentUser$.pipe(
      map((user) => user?.uid ?? ''),
      distinctUntilChanged(),
      switchMap((uid) => (uid ? this.watchConversations(uid) : of([] as DirectConversation[]))),
    );
  }

  private watchConversations(uid: string): Observable<DirectConversation[]> {
    return new Observable((observer) => {
      // Solo array-contains: ordenar en cliente evita exigir un índice compuesto
      const q = query(collection(this.db, this.COL), where('participantIds', 'array-contains', uid));

      const unsub = onSnapshot(
        q,
        (snap) => {
          const conversations = snap.docs
            .map((d) => this.toConversation(d.id, d.data() as Record<string, unknown>))
            .sort((a, b) => this.sortKey(b) - this.sortKey(a));
          observer.next(conversations);
        },
        (err) => observer.error(err),
      );

      return () => unsub();
    });
  }

  /** Una conversación concreta, en tiempo real. */
  getConversation(conversationId: string): Observable<DirectConversation | null> {
    return new Observable((observer) => {
      const unsub = onSnapshot(
        doc(this.db, this.COL, conversationId),
        (snap) => {
          observer.next(
            snap.exists() ? this.toConversation(snap.id, snap.data() as Record<string, unknown>) : null,
          );
        },
        (err) => observer.error(err),
      );

      return () => unsub();
    });
  }

  /**
   * Envía un mensaje directo: guarda el mensaje, actualiza los metadatos de
   * la conversación (para la lista) y avisa al destinatario.
   */
  async sendDirectMessage(params: {
    conversationId: string;
    content: string;
    peerId: string;
    peerName?: string;
    topic?: ConversationTopic;
  }): Promise<void> {
    const me = this.authService.currentUser;
    const text = params.content.trim();
    if (!me || !text) return;

    await this.chatService.sendMessage({
      channelId: params.conversationId,
      senderId: me.uid,
      senderName: me.fullName,
      content: text,
    });

    const preview = text.slice(0, PREVIEW_LENGTH);

    await updateDoc(doc(this.db, this.COL, params.conversationId), {
      lastMessage: preview,
      lastMessageAt: serverTimestamp(),
      lastSenderId: me.uid,
      // Lo que acabo de escribir ya está leído por mí
      [`lastReadAt.${me.uid}`]: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // El aviso es secundario: si falla, el mensaje ya se envió
    if (params.peerId) {
      try {
        await this.notificationService.notifyDirectMessage({
          userId: params.peerId,
          conversationId: params.conversationId,
          senderId: me.uid,
          senderName: me.fullName,
          preview,
          topicLabel: conversationTopicLabel(params.topic),
        });
      } catch {
        /* noop */
      }
    }
  }

  /** Marca la conversación como leída por el usuario en sesión. */
  async markAsRead(conversationId: string): Promise<void> {
    const uid = this.authService.currentUser?.uid;
    if (!uid || !conversationId) return;

    try {
      await updateDoc(doc(this.db, this.COL, conversationId), {
        [`lastReadAt.${uid}`]: serverTimestamp(),
      });
    } catch {
      /* la conversación puede no existir aún; no es crítico */
    }
  }

  /** true si la conversación tiene mensajes sin leer para el usuario en sesión. */
  hasUnread(conversation: DirectConversation): boolean {
    const uid = this.authService.currentUser?.uid;
    return uid ? hasUnreadFor(conversation, uid) : false;
  }

  /** Cuántas conversaciones tienen mensajes sin leer. */
  countUnread(conversations: DirectConversation[]): number {
    return conversations.filter((c) => this.hasUnread(c)).length;
  }

  /** uid del otro participante. */
  peerId(conversation: DirectConversation): string {
    const uid = this.authService.currentUser?.uid ?? '';
    return peerIdOf(conversation, uid);
  }

  /** Datos del otro participante. */
  peer(conversation: DirectConversation): ConversationParticipant | null {
    return conversation.participants?.[this.peerId(conversation)] ?? null;
  }

  // ── Internos ──────────────────────────────────────────────

  private toParticipant(user: UserProfile): ConversationParticipant {
    return {
      fullName: user.fullName ?? '',
      studentCode: user.studentCode ?? '',
      academicProgram: user.academicProgram ?? '',
    };
  }

  private contactToParticipant(contact: StudentContact): ConversationParticipant {
    return {
      fullName: contact.fullName ?? '',
      studentCode: contact.studentCode ?? '',
      academicProgram: contact.academicProgram ?? '',
    };
  }

  private toConversation(id: string, data: Record<string, unknown>): DirectConversation {
    const rawRead = (data['lastReadAt'] as Record<string, Timestamp>) ?? {};
    const lastReadAt: Record<string, Date | undefined> = {};
    Object.keys(rawRead).forEach((uid) => {
      lastReadAt[uid] = rawRead[uid]?.toDate?.();
    });

    const topic = data['topic'];

    return {
      id,
      participantIds: (data['participantIds'] as string[]) ?? [],
      participants: (data['participants'] as Record<string, ConversationParticipant>) ?? {},
      topic: isConversationTopic(topic) ? topic : DEFAULT_CONVERSATION_TOPIC,
      lastMessage: (data['lastMessage'] as string) ?? '',
      lastMessageAt: (data['lastMessageAt'] as Timestamp)?.toDate?.(),
      lastSenderId: (data['lastSenderId'] as string) ?? '',
      lastReadAt,
      createdAt: (data['createdAt'] as Timestamp)?.toDate?.() ?? new Date(),
      updatedAt: (data['updatedAt'] as Timestamp)?.toDate?.() ?? new Date(),
    };
  }

  /** Ordena por último mensaje; las conversaciones sin mensajes usan su creación. */
  private sortKey(conversation: DirectConversation): number {
    return (conversation.lastMessageAt ?? conversation.createdAt).getTime();
  }
}
