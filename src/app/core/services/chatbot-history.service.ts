import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  deleteDoc,
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
import {
  ChatbotConversation,
  ChatbotMessage,
  ChatbotRole,
  ChatbotStoredMessage,
} from '../interfaces/chatbot.interface';

/** Longitud máxima del título derivado del primer mensaje. */
const TITLE_LENGTH = 60;

/**
 * Historial de conversaciones con NeoBot.
 *
 * Cada conversación es un documento en `chatbotConversations`, con los
 * mensajes embebidos y un `ownerId` que ata la charla a su estudiante. Así
 * cada uno solo ve (y consulta) sus propias conversaciones.
 *
 * No habla con Gemini: eso lo hace ChatbotService a través de la Cloud
 * Function. Este servicio solo se encarga de guardar y recuperar el historial.
 */
@Injectable({ providedIn: 'root' })
export class ChatbotHistoryService {
  private readonly db = inject(Firestore);
  private readonly auth = inject(AuthService);

  private readonly COL = 'chatbotConversations';

  /**
   * Guarda (crea o actualiza) una conversación con sus mensajes.
   *
   * @param conversationId  Si viene vacío, se crea un id nuevo y se devuelve.
   * @param messages        Turnos a persistir (se ignoran los `pending`).
   * @returns el id de la conversación guardada, o '' si no hay nada que guardar.
   */
  async saveConversation(conversationId: string, messages: ChatbotMessage[]): Promise<string> {
    const me = this.auth.currentUser;
    if (!me) return '';

    const stored = this.toStored(messages);
    // Sin al menos un intercambio real no tiene sentido guardar nada.
    if (stored.length === 0) return '';

    const id = conversationId || doc(collection(this.db, this.COL)).id;
    const ref = doc(this.db, this.COL, id);

    await setDoc(
      ref,
      {
        ownerId: me.uid,
        title: this.deriveTitle(stored),
        messages: stored,
        updatedAt: serverTimestamp(),
        // createdAt solo se fija la primera vez; con merge no se pisa después.
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );

    return id;
  }

  /** Conversaciones del estudiante en sesión, en tiempo real (más reciente primero). */
  getMyConversations(): Observable<ChatbotConversation[]> {
    return this.auth.currentUser$.pipe(
      map((user) => user?.uid ?? ''),
      distinctUntilChanged(),
      switchMap((uid) => (uid ? this.watchConversations(uid) : of([] as ChatbotConversation[]))),
    );
  }

  /** Una conversación concreta (para reabrirla). */
  async getConversation(conversationId: string): Promise<ChatbotConversation | null> {
    if (!conversationId) return null;
    const snap = await getDoc(doc(this.db, this.COL, conversationId));
    if (!snap.exists()) return null;

    const conversation = this.toConversation(snap.id, snap.data() as Record<string, unknown>);
    // Defensa extra: nunca devolver una conversación de otro usuario.
    if (conversation.ownerId !== this.auth.currentUser?.uid) return null;
    return conversation;
  }

  /** Renombra una conversación guardada. */
  async renameConversation(conversationId: string, title: string): Promise<void> {
    const clean = title.trim().slice(0, TITLE_LENGTH);
    if (!conversationId || !clean) return;
    await updateDoc(doc(this.db, this.COL, conversationId), {
      title: clean,
      updatedAt: serverTimestamp(),
    });
  }

  /** Elimina una conversación del historial. */
  async deleteConversation(conversationId: string): Promise<void> {
    if (!conversationId) return;
    await deleteDoc(doc(this.db, this.COL, conversationId));
  }

  // ── Internos ──────────────────────────────────────────────

  private watchConversations(uid: string): Observable<ChatbotConversation[]> {
    return new Observable((observer) => {
      // Solo filtramos por ownerId y ordenamos en cliente: evita exigir un
      // índice compuesto en Firestore.
      const q = query(collection(this.db, this.COL), where('ownerId', '==', uid));

      const unsub = onSnapshot(
        q,
        (snap) => {
          const conversations = snap.docs
            .map((d) => this.toConversation(d.id, d.data() as Record<string, unknown>))
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
          observer.next(conversations);
        },
        (err) => observer.error(err),
      );

      return () => unsub();
    });
  }

  /** Quita los mensajes pendientes/vacíos y descarta el flag efímero. */
  private toStored(messages: ChatbotMessage[]): ChatbotStoredMessage[] {
    return messages
      .filter((m) => !m.pending && m.text?.trim())
      .map((m) => ({ role: m.role, text: m.text }));
  }

  /** Usa el primer mensaje del usuario como título de la conversación. */
  private deriveTitle(messages: ChatbotStoredMessage[]): string {
    const firstUser = messages.find((m) => m.role === 'user');
    const base = (firstUser?.text ?? messages[0]?.text ?? 'Conversación').trim();
    return base.length > TITLE_LENGTH ? `${base.slice(0, TITLE_LENGTH - 1)}…` : base;
  }

  private toConversation(id: string, data: Record<string, unknown>): ChatbotConversation {
    const rawMessages = Array.isArray(data['messages']) ? (data['messages'] as unknown[]) : [];
    const messages: ChatbotStoredMessage[] = rawMessages
      .map((m) => m as { role?: unknown; text?: unknown })
      .filter((m) => (m.role === 'user' || m.role === 'model') && typeof m.text === 'string')
      .map((m) => ({ role: m.role as ChatbotRole, text: m.text as string }));

    return {
      id,
      ownerId: (data['ownerId'] as string) ?? '',
      title: (data['title'] as string) ?? 'Conversación',
      messages,
      createdAt: (data['createdAt'] as Timestamp)?.toDate?.() ?? new Date(),
      updatedAt: (data['updatedAt'] as Timestamp)?.toDate?.() ?? new Date(),
    };
  }
}
