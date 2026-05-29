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

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly db = inject(Firestore);

  /**
   * Devuelve un Observable con los mensajes del chat de un booking,
   * ordenados por fecha ascendente, en tiempo real.
   */
  getMessages(bookingId: string): Observable<ChatMessage[]> {
    return new Observable(observer => {
      const ref = collection(this.db, 'chats', bookingId, 'messages');
      const q   = query(ref, orderBy('createdAt', 'asc'));

      const unsub = onSnapshot(
        q,
        snap => {
          const messages: ChatMessage[] = snap.docs.map(d => {
            const data = d.data() as Record<string, unknown>;
            return {
              id:         d.id,
              bookingId:  data['bookingId']  as string,
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
   * Envía un mensaje al chat de un booking.
   */
  async sendMessage(params: {
    bookingId:  string;
    senderId:   string;
    senderName: string;
    content:    string;
  }): Promise<void> {
    const ref = collection(this.db, 'chats', params.bookingId, 'messages');
    await addDoc(ref, {
      bookingId:  params.bookingId,
      senderId:   params.senderId,
      senderName: params.senderName,
      content:    params.content.trim(),
      createdAt:  serverTimestamp(),
    });
  }
}
