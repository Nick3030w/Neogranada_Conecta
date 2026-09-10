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
