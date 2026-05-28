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
  time: string;        // HH:mm
  observations?: string;
  status: BookingStatus;
  denialReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
