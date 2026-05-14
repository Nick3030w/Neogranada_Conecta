export type NotificationType =
  | 'booking_pending'
  | 'booking_approved'
  | 'booking_denied'
  | 'chat_message'
  | 'general';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  relatedBookingId?: string;
  createdAt: Date;
}
