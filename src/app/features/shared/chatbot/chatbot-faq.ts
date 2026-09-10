/**
 * Preguntas frecuentes que se muestran como "chips" sugeridos dentro del
 * chatbot. Al tocar uno, la pregunta se envía al bot como si el estudiante
 * la hubiera escrito.
 *
 * Estas son solo las sugerencias visibles. La fuente de verdad de las
 * respuestas vive en el servidor (functions/src/knowledge-base.ts), que es
 * el contexto que realmente usa el modelo. Mantenlas alineadas.
 */
export const FAQ_SUGGESTIONS: string[] = [
  '¿Cómo reservo un recurso?',
  '¿Cómo veo mis reservas?',
  '¿Qué significa que mi reserva está pendiente?',
  '¿Cómo cancelo una reserva?',
  '¿Cómo hablo con la dependencia sobre una reserva?',
  '¿Puedo chatear con otros estudiantes?',
  '¿Cómo cambio mi foto de perfil?',
  '¿Cómo activo el modo oscuro?',
  '¿Dónde encuentro los bloques del campus?',
  '¿Cómo recupero mi contraseña?',
];
