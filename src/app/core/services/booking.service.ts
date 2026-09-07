import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Booking, BookingStatus } from '../interfaces/booking.interface';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly COL = 'bookings';
  private readonly db: Firestore;

  constructor() {
    this.db = inject(Firestore);
  }

  // ── Helper ────────────────────────────────────────────────────

  /** Suma minutos a una hora "HH:mm" y devuelve el resultado en el mismo formato. */
  private static addMinutes(hhmm: string, minutes: number): string {
    const [h, m] = hhmm.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const hh = Math.floor(total / 60) % 24;
    const mm = total % 60;
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  }

  /**
   * Normaliza un booking a startTime/endTime, sin importar si el
   * documento en Firestore viene con el esquema nuevo o con el
   * campo legacy `time` (reservas creadas antes de soportar franja
   * horaria). Las reservas legacy se asumen de 30 minutos de duración.
   */
  private toBooking(data: Record<string, unknown>, id: string): Booking {
    const legacyTime = data['time'] as string | undefined;
    const startTime  = (data['startTime'] as string | undefined) ?? legacyTime ?? '';
    const endTime     = (data['endTime'] as string | undefined)
      ?? (legacyTime ? BookingService.addMinutes(legacyTime, 30) : '');

    return {
      ...(data as Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'startTime' | 'endTime'>),
      id,
      startTime,
      endTime,
      createdAt: (data['createdAt'] as Timestamp)?.toDate?.() ?? new Date(),
      updatedAt: (data['updatedAt'] as Timestamp)?.toDate?.() ?? new Date(),
    };
  }

  /** true si las franjas [aStart,aEnd) y [bStart,bEnd) se solapan. */
  private static rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
    return aStart < bEnd && aEnd > bStart;
  }

  // ── Creación ──────────────────────────────────────────────────

  async create(data: {
    studentId: string;
    studentName: string;
    resourceId: string;
    resourceName: string;
    resourceCategory: string;
    resourceLocation: string;
    date: string;
    startTime: string;
    endTime: string;
    observations?: string;
  }): Promise<string> {
    const docRef = await addDoc(collection(this.db, this.COL), {
      ...data,
      observations: data.observations ?? '',
      status:       'pendiente' as BookingStatus,
      denialReason: '',
      createdAt:    serverTimestamp(),
      updatedAt:    serverTimestamp(),
    });
    return docRef.id;
  }

  // ── Verificación de conflictos de horario ─────────────────────
  /**
   * Retorna true si el recurso está libre durante toda la franja
   * [startTime, endTime) en la fecha indicada. Considera ocupado si
   * existe algún booking con status 'pendiente' o 'aprobada' para ese
   * recurso cuya franja se solape (parcial o totalmente) con la solicitada.
   *
   * La comparación de solapamiento se hace en el cliente porque Firestore
   * no permite combinar múltiples condiciones de rango en una sola query;
   * primero se filtra por igualdad (resourceId + date + status), que sí
   * es eficiente con un índice compuesto:
   *   Colección: bookings
   *   Campos: resourceId (ASC), date (ASC), status (ASC)
   */
  async checkAvailability(
    resourceId: string,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    const q = query(
      collection(this.db, this.COL),
      where('resourceId', '==', resourceId),
      where('date',       '==', date),
      where('status',     'in', ['pendiente', 'aprobada']),
    );
    const snap = await getDocs(q);

    const hasConflict = snap.docs.some(d => {
      const booking = this.toBooking(d.data() as Record<string, unknown>, d.id);
      return BookingService.rangesOverlap(startTime, endTime, booking.startTime, booking.endTime);
    });

    return !hasConflict; // true = disponible, false = ocupado
  }

  // ── Lectura en tiempo real ────────────────────────────────────

  getById(id: string): Observable<Booking | null> {
    return new Observable(observer => {
      const ref   = doc(this.db, this.COL, id);
      const unsub = onSnapshot(
        ref,
        snap => observer.next(
          snap.exists() ? this.toBooking(snap.data() as Record<string, unknown>, snap.id) : null
        ),
        err => observer.error(err),
      );
      return () => unsub();
    });
  }

  getByStudent(studentId: string): Observable<Booking[]> {
    return new Observable(observer => {
      const q     = query(collection(this.db, this.COL), where('studentId', '==', studentId));
      const unsub = onSnapshot(
        q,
        snap => observer.next(
          snap.docs
            .map(d => this.toBooking(d.data() as Record<string, unknown>, d.id))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        ),
        err => observer.error(err),
      );
      return () => unsub();
    });
  }

  getPending(): Observable<Booking[]> {
    return new Observable(observer => {
      const q     = query(collection(this.db, this.COL), where('status', '==', 'pendiente'));
      const unsub = onSnapshot(
        q,
        snap => observer.next(
          snap.docs
            .map(d => this.toBooking(d.data() as Record<string, unknown>, d.id))
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        ),
        err => observer.error(err),
      );
      return () => unsub();
    });
  }

  getAll(): Observable<Booking[]> {
    return new Observable(observer => {
      const q     = collection(this.db, this.COL);
      const unsub = onSnapshot(
        q,
        snap => observer.next(
          snap.docs
            .map(d => this.toBooking(d.data() as Record<string, unknown>, d.id))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        ),
        err => observer.error(err),
      );
      return () => unsub();
    });
  }

  // ── Actualización de estado ───────────────────────────────────

  async approve(bookingId: string): Promise<void> {
    await updateDoc(doc(this.db, this.COL, bookingId), {
      status:       'aprobada' as BookingStatus,
      denialReason: '',
      updatedAt:    serverTimestamp(),
    });
  }

  async deny(bookingId: string, reason: string): Promise<void> {
    if (!reason?.trim()) throw new Error('El motivo de denegación es requerido.');
    await updateDoc(doc(this.db, this.COL, bookingId), {
      status:       'denegada' as BookingStatus,
      denialReason: reason.trim(),
      updatedAt:    serverTimestamp(),
    });
  }

  async cancel(bookingId: string): Promise<void> {
    await updateDoc(doc(this.db, this.COL, bookingId), {
      status:    'cancelada' as BookingStatus,
      updatedAt: serverTimestamp(),
    });
  }
}
