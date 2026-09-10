/**
 * Cloud Function: proxy seguro entre la app y Gemini.
 *
 * ¿Por qué una función y no llamar a Gemini desde Angular?
 * Porque la API key NUNCA debe viajar al cliente (cualquiera podría extraerla
 * del bundle y gastar la cuota). Aquí la key vive como secreto en el servidor
 * y la app solo llama a esta función, que además exige usuario autenticado.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';
import { buildSystemPrompt } from './knowledge-base';

// La API key de Gemini se guarda como secreto de Firebase (no en el código).
// Se crea con:  firebase functions:secrets:set GEMINI_API_KEY
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

/** Modelo pequeño y económico, ideal para Q&A de FAQ. */
const MODEL = 'gemini-2.5-flash';

/** Un turno de la conversación tal como llega desde la app. */
interface ClientTurn {
  role: 'user' | 'model';
  text: string;
}

interface AskChatbotData {
  /** Pregunta actual del estudiante. */
  message: string;
  /** Historial reciente (opcional) para dar continuidad a la charla. */
  history?: ClientTurn[];
}

export const askChatbot = onCall(
  {
    secrets: [GEMINI_API_KEY],
    region: 'us-central1',
    // Limita el gasto ante picos inesperados.
    maxInstances: 10,
    cors: true,
  },
  async (request): Promise<{ reply: string }> => {
    // 1) Solo usuarios autenticados (estudiantes/admin logueados).
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión para usar el asistente.');
    }

    // 2) Validación de entrada.
    const data = request.data as AskChatbotData;
    const message = (data?.message ?? '').toString().trim();
    if (!message) {
      throw new HttpsError('invalid-argument', 'El mensaje no puede estar vacío.');
    }
    if (message.length > 1000) {
      throw new HttpsError('invalid-argument', 'El mensaje es demasiado largo.');
    }

    // 3) Prepara historial: solo los últimos turnos, y saneado.
    const history = Array.isArray(data.history) ? data.history.slice(-10) : [];
    const contents = [
      ...history
        .filter((t) => t && (t.role === 'user' || t.role === 'model') && t.text)
        .map((t) => ({
          role: t.role,
          parts: [{ text: t.text.toString().slice(0, 1000) }],
        })),
      { role: 'user' as const, parts: [{ text: message }] },
    ];

    // 4) Llama a Gemini con el system prompt que lo ata al contexto de la app.
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() });

      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction: buildSystemPrompt(),
          temperature: 0.3, // respuestas consistentes, poco "creativas"
          maxOutputTokens: 600,
        },
      });

      const reply = (response.text ?? '').trim();
      if (!reply) {
        return {
          reply:
            'Lo siento, no pude generar una respuesta en este momento. Intenta reformular tu pregunta.',
        };
      }

      return { reply };
    } catch (err) {
      console.error('Error llamando a Gemini:', err);
      throw new HttpsError('internal', 'El asistente no está disponible por ahora. Intenta más tarde.');
    }
  }
);
