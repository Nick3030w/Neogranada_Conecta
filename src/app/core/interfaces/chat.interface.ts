/**
 * Un mensaje de chat. El canal que lo contiene puede ser:
 *  - el chat de una solicitud de reserva (channelId = bookingId)
 *  - una conversación directa entre estudiantes (channelId = conversationId)
 *
 * En ambos casos los mensajes viven en `chats/{channelId}/messages`.
 */
export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
}

// ============================================================
// Conversaciones directas entre estudiantes
// ============================================================

/**
 * Asunto que da contexto universitario a una conversación.
 * Se elige al iniciar el chat y no bloquea el envío de mensajes.
 */
export type ConversationTopic =
  | 'recurso'
  | 'trabajo_grupo'
  | 'estudio'
  | 'deportiva'
  | 'cultural'
  | 'general';

export interface ConversationTopicMeta {
  id: ConversationTopic;
  label: string;
  icon: string;
}

export const CONVERSATION_TOPICS: ConversationTopicMeta[] = [
  { id: 'recurso', label: 'Reserva de un recurso', icon: 'cube-outline' },
  { id: 'trabajo_grupo', label: 'Trabajo en grupo', icon: 'people-outline' },
  { id: 'estudio', label: 'Grupo de estudio', icon: 'book-outline' },
  { id: 'deportiva', label: 'Actividad deportiva', icon: 'barbell-outline' },
  { id: 'cultural', label: 'Actividad cultural', icon: 'musical-notes-outline' },
  { id: 'general', label: 'Tema general', icon: 'chatbubbles-outline' },
];

export const DEFAULT_CONVERSATION_TOPIC: ConversationTopic = 'general';

export function isConversationTopic(value: unknown): value is ConversationTopic {
  return CONVERSATION_TOPICS.some((t) => t.id === value);
}

export function conversationTopicLabel(topic?: ConversationTopic): string {
  return CONVERSATION_TOPICS.find((t) => t.id === topic)?.label
    ?? CONVERSATION_TOPICS[CONVERSATION_TOPICS.length - 1].label;
}

export function conversationTopicIcon(topic?: ConversationTopic): string {
  return CONVERSATION_TOPICS.find((t) => t.id === topic)?.icon ?? 'chatbubbles-outline';
}

/**
 * Estudiante tal como se muestra en el buscador y en la cabecera del chat.
 * Se lee de la colección `users`, por eso incluye la foto.
 */
export interface StudentContact {
  uid: string;
  fullName: string;
  studentCode: string;
  academicProgram: string;
  photoUrl?: string;
}

/**
 * Copia mínima de un participante guardada dentro del documento de la
 * conversación. Deliberadamente NO incluye la foto: al ser un data URL
 * de varios KB, duplicarla en cada conversación haría pesada la lista.
 * Las fotos se leen del perfil cuando hacen falta.
 */
export interface ConversationParticipant {
  fullName: string;
  studentCode: string;
  academicProgram: string;
}

/** Conversación directa uno a uno entre dos estudiantes. */
export interface DirectConversation {
  id: string;
  /** Siempre dos uid, ordenados alfabéticamente */
  participantIds: string[];
  participants: Record<string, ConversationParticipant>;
  topic: ConversationTopic;
  lastMessage: string;
  lastMessageAt?: Date;
  lastSenderId: string;
  /** Última vez que cada participante abrió la conversación */
  lastReadAt: Record<string, Date | undefined>;
  createdAt: Date;
  updatedAt: Date;
}

/** Id determinístico de la conversación entre dos estudiantes. */
export function directConversationId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('__');
}

/** Devuelve el uid del otro participante. */
export function peerIdOf(conversation: DirectConversation, uid: string): string {
  return conversation.participantIds.find((id) => id !== uid) ?? '';
}

/** Devuelve los datos del otro participante. */
export function peerOf(conversation: DirectConversation, uid: string): ConversationParticipant | null {
  const peerId = peerIdOf(conversation, uid);
  return peerId ? (conversation.participants?.[peerId] ?? null) : null;
}

/** true si hay mensajes del otro participante posteriores a la última lectura. */
export function hasUnreadFor(conversation: DirectConversation, uid: string): boolean {
  if (!conversation.lastMessageAt) return false;
  if (conversation.lastSenderId === uid) return false;

  const lastRead = conversation.lastReadAt?.[uid];
  return !lastRead || lastRead.getTime() < conversation.lastMessageAt.getTime();
}
