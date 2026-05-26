import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getFirestore,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Booking, BookingStatus } from '../interfaces/booking.interface';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly COL = 'bookings';

  // Obtiene Firestore directamente desde la app ya inicializada
  private get db() {
    return getFirestore();
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
    date: string;
    time: string;
    service: string;
    observations?: string;
  }): Promise<string> {
    const ref    = collection(this.db, this.COL);
    const docRef = await addDoc(ref, {
      ...data,
      observations: data.observations ?? '',
      status:       'pendiente' as BookingStatus,
      denialReason: '',
      createdAt:    serverTimestamp(),
      updatedAt:    serverTimestamp(),
    });
    return docRef.id;
  }

  // ── Lectura en tiempo real (onSnapshot nativo) ────────────────

  /** Escucha un booking por ID — para la confirmación del estudiante */
  getById(id: string): Observable<Booking | null> {
    return new Observable(observer => {
      const ref  = doc(this.db, this.COL, id);
      const unsub = onSnapshot(
        ref,
        snap => observer.next(snap.exists() ? this.toBooking(snap.data() as Record<string, unknown>, snap.id) : null),
        err  => observer.error(err),
      );
      return () => unsub();
    });
  }

  /** Todos los bookings de un estudiante */
  getByStudent(studentId: string): Observable<Booking[]> {
    return new Observable(observer => {
      const q = query(
        collection(this.db, this.COL),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc'),
      );
      const unsub = onSnapshot(
        q,
        snap => observer.next(snap.docs.map(d => this.toBooking(d.data() as Record<string, unknown>, d.id))),
        err  => observer.error(err),
      );
      return () => unsub();
    });
  }

  /** Todos los bookings pendientes — para el admin */
  getPending(): Observable<Booking[]> {
    return new Observable(observer => {
      const q = query(
        collection(this.db, this.COL),
        where('status', '==', 'pendiente'),
        orderBy('createdAt', 'asc'),
      );
      const unsub = onSnapshot(
        q,
        snap => observer.next(snap.docs.map(d => this.toBooking(d.data() as Record<string, unknown>, d.id))),
        err  => observer.error(err),
      );
      return () => unsub();
    });
  }

  /** Todos los bookings — para el calendario */
  getAll(): Observable<Booking[]> {
    return new Observable(observer => {
      const q = query(
        collection(this.db, this.COL),
        orderBy('createdAt', 'desc'),
      );
      const unsub = onSnapshot(
        q,
        snap => observer.next(snap.docs.map(d => this.toBooking(d.data() as Record<string, unknown>, d.id))),
        err  => observer.error(err),
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
