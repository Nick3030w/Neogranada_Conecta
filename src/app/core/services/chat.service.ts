import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ChatMessage } from '../interfaces/chat.interface';

/**
 * Mensajería de bajo nivel. Un "canal" es cualquier hilo de mensajes:
 * el chat de una solicitud de reserva (channelId = bookingId) o una
 * conversación directa entre estudiantes (channelId = conversationId).
 * En ambos casos los mensajes viven en `chats/{channelId}/messages`.
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly db = inject(Firestore);

  /**
   * Devuelve un Observable con los mensajes de un canal,
   * ordenados por fecha ascendente, en tiempo real.
   */
  getMessages(channelId: string): Observable<ChatMessage[]> {
    return new Observable(observer => {
      const ref = collection(this.db, 'chats', channelId, 'messages');
      const q   = query(ref, orderBy('createdAt', 'asc'));

      const unsub = onSnapshot(
        q,
        snap => {
          const messages: ChatMessage[] = snap.docs.map(d => {
            const data = d.data() as Record<string, unknown>;
            return {
              id:         d.id,
              // Los mensajes creados antes de generalizar el chat guardaban `bookingId`
              channelId:  (data['channelId'] ?? data['bookingId'] ?? channelId) as string,
              senderId:   data['senderId']   as string,
              senderName: data['senderName'] as string,
              content:    data['content']    as string,
              createdAt:  (data['createdAt'] as Timestamp)?.toDate?.() ?? new Date(),
            };
          });
          observer.next(messages);
        },
        err => observer.error(err),
      );

      return () => unsub();
    });
  }

  /**
   * Envía un mensaje a un canal.
   */
  async sendMessage(params: {
    channelId:  string;
    senderId:   string;
    senderName: string;
    content:    string;
  }): Promise<void> {
    const ref = collection(this.db, 'chats', params.channelId, 'messages');
    await addDoc(ref, {
      channelId:  params.channelId,
      senderId:   params.senderId,
      senderName: params.senderName,
      content:    params.content.trim(),
      createdAt:  serverTimestamp(),
    });
  }
}
