import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import {
  AskChatbotRequest,
  AskChatbotResponse,
  ChatbotMessage,
} from '../interfaces/chatbot.interface';

/**
 * Cliente del asistente virtual (NeoBot).
 *
 * No habla con Gemini directamente: llama a la Cloud Function `askChatbot`,
 * que guarda la API key en el servidor. Así la clave nunca viaja al cliente.
 */
@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly functions = inject(Functions);

  /**
   * Envía la pregunta del estudiante junto con un historial reciente y
   * devuelve la respuesta del bot.
   *
   * @param message  Pregunta actual del usuario.
   * @param history  Mensajes previos (se recortan a los últimos turnos).
   */
  async ask(message: string, history: ChatbotMessage[] = []): Promise<string> {
    const callable = httpsCallable<AskChatbotRequest, AskChatbotResponse>(
      this.functions,
      'askChatbot'
    );

    const payload: AskChatbotRequest = {
      message: message.trim(),
      // Solo enviamos texto ya confirmado (no los mensajes "pending").
      history: history
        .filter((m) => !m.pending && m.text)
        .slice(-10)
        .map((m) => ({ role: m.role, text: m.text })),
    };

    const result = await callable(payload);
    return result.data.reply;
  }
}
