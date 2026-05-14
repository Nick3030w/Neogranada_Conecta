export type BookingStatus = 'pendiente' | 'aprobada' | 'denegada' | 'cancelada';

export interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  resourceId: string;
  resourceName: string;
  resourceCategory: string;
  date: string;        // ISO date string YYYY-MM-DD
  time: string;        // HH:mm
  service: string;
  observations?: string;
  status: BookingStatus;
  denialReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
