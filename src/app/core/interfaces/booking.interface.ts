export type BookingStatus = 'pendiente' | 'aprobada' | 'denegada' | 'cancelada';

export interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  resourceId: string;
  resourceName: string;
  resourceCategory: string;
  /** Bloque del campus donde se encuentra el recurso, ej: "Bloque D" */
  resourceLocation: string;
  date: string;        // ISO date string YYYY-MM-DD
  startTime: string;   // HH:mm — hora de inicio de la franja reservada
  endTime: string;     // HH:mm — hora de fin de la franja reservada
  /**
   * @deprecated Campo legacy de reservas creadas antes de soportar franja
   * horaria (hora inicio + hora fin). Se conserva solo para no romper
   * documentos antiguos en Firestore; `BookingService` lo traduce a
   * `startTime`/`endTime` al leer. No usar en código nuevo.
   */
  time?: string;
  observations?: string;
  status: BookingStatus;
  denialReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
