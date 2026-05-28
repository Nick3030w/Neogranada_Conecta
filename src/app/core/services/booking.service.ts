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

  private toBooking(data: Record<string, unknown>, id: string): Booking {
    return {
      ...(data as Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>),
      id,
      createdAt: (data['createdAt'] as Timestamp)?.toDate?.() ?? new Date(),
      updatedAt: (data['updatedAt'] as Timestamp)?.toDate?.() ?? new Date(),
    };
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
    time: string;
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
   * Retorna true si el recurso está libre en la fecha y hora indicadas.
   * Considera ocupado si existe algún booking con status 'pendiente' o 'aprobada'
   * para ese recurso en ese slot exacto.
   *
   * NOTA: Requiere índice compuesto en Firestore:
   *   Colección: bookings
   *   Campos: resourceId (ASC), date (ASC), time (ASC), status (ASC)
   */
  async checkAvailability(resourceId: string, date: string, time: string): Promise<boolean> {
    const q = query(
      collection(this.db, this.COL),
      where('resourceId', '==', resourceId),
      where('date',       '==', date),
      where('time',       '==', time),
      where('status',     'in', ['pendiente', 'aprobada']),
    );
    const snap = await getDocs(q);
    return snap.empty; // true = disponible, false = ocupado
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
