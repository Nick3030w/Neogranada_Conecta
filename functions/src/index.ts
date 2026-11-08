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

/**
 * Modelos en orden de preferencia. Si el primero está saturado (503) o sin
 * cuota (429), se intenta con el siguiente. Todos son modelos Flash pequeños
 * y económicos, ideales para Q&A de FAQ. Gemini 3.1 Flash-Lite ofrece
 * límites de uso más altos que modelos anteriores.
 */
const MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-flash-lite-latest'];

/** Espera en milisegundos. */
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** true si el error de Gemini es transitorio y conviene reintentar. */
function isTransient(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  return status === 503 || status === 429 || status === 500;
}

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

    // 4) Llama a Gemini. Ante saturación (503) o falta de cuota (429):
    //    - reintenta el mismo modelo con backoff creciente, y
    //    - si aun así falla, prueba el siguiente modelo de la lista.
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() });
    const systemInstruction = buildSystemPrompt();

    let lastError: unknown = null;

    for (const model of MODELS) {
      // 3 intentos por modelo: esperas de 0.5s, 1.5s y 3.5s.
      const delays = [500, 1500, 3500];

      for (let attempt = 0; attempt < delays.length; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
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
          lastError = err;

          // Si no es transitorio (p. ej. key inválida), no insistas.
          if (!isTransient(err)) {
            console.error(`Error no recuperable con ${model}:`, err);
            throw new HttpsError(
              'internal',
              'El asistente no está disponible por ahora. Intenta más tarde.'
            );
          }

          console.warn(
            `Modelo ${model} no disponible (intento ${attempt + 1}). Reintentando...`
          );

          // Espera antes del siguiente intento (salvo que sea el último).
          if (attempt < delays.length - 1) await sleep(delays[attempt]);
        }
      }
      // Agotados los reintentos de este modelo, pasa al siguiente.
    }

    // Todos los modelos y reintentos fallaron.
    console.error('Gemini saturado tras todos los reintentos:', lastError);
    throw new HttpsError(
      'unavailable',
      'El asistente está muy solicitado en este momento. Espera unos segundos e intenta de nuevo.'
    );
  }
);
