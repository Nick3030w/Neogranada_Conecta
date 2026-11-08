/**
 * Tipos del asistente virtual (NeoBot).
 *
 * El chatbot conversa con una Cloud Function (`askChatbot`) que a su vez
 * consulta a Gemini. Aquí solo viven los tipos que usa el frontend.
 */

/** Rol de cada turno, alineado con lo que espera Gemini. */
export type ChatbotRole = 'user' | 'model';

/** Un mensaje mostrado en la conversación con el bot. */
export interface ChatbotMessage {
  role: ChatbotRole;
  text: string;
  /** Marca los mensajes que aún están esperando respuesta del servidor. */
  pending?: boolean;
}

/** Payload que se envía a la Cloud Function. */
export interface AskChatbotRequest {
  message: string;
  history?: { role: ChatbotRole; text: string }[];
}

/** Respuesta de la Cloud Function. */
export interface AskChatbotResponse {
  reply: string;
}

/**
 * Una conversación con NeoBot guardada en Firestore para que el estudiante
 * pueda consultarla más adelante.
 *
 * Los mensajes se guardan embebidos en el propio documento (no en una
 * subcolección): una charla con el bot es corta y siempre se lee completa,
 * así que un único documento es más simple y barato de leer.
 */
export interface ChatbotConversation {
  /** Id del documento en Firestore. */
  id: string;
  /** uid del estudiante dueño de la conversación. */
  ownerId: string;
  /** Título legible (se deriva del primer mensaje del usuario). */
  title: string;
  /** Turnos de la conversación, en orden. */
  messages: ChatbotStoredMessage[];
  createdAt: Date;
  updatedAt: Date;
}

/** Un turno tal como se guarda (sin el flag efímero `pending`). */
export interface ChatbotStoredMessage {
  role: ChatbotRole;
  text: string;
}
