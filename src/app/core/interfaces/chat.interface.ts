export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
}

export interface ChatChannel {
  bookingId: string;
  studentId: string;
  studentName: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount?: number;
}
