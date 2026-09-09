export type NotificationType =
  | 'booking_pending'
  | 'booking_approved'
  | 'booking_denied'
  | 'booking_reminder_start'
  | 'booking_reminder_end'
  | 'chat_message'
  | 'direct_message'
  | 'general';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  relatedBookingId?: string;
  /** Conversación directa asociada (solo en notificaciones de tipo direct_message) */
  relatedConversationId?: string;
  /** Autor del mensaje directo, para abrir la conversación al tocar la notificación */
  relatedUserId?: string;
  createdAt: Date;
}
