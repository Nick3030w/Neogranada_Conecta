import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Booking, BookingStatus } from '../interfaces/booking.interface';

/**
 * BookingService
 * Gestiona la colección `bookings` en Firestore.
 *
 * Estructura Firestore:
 *   bookings/{bookingId}  →  Booking
 */
@Injectable({ providedIn: 'root' })
export class BookingService {
  private firestore = inject(Firestore);
  private readonly COL = 'bookings';

  // ── Helpers ──────────────────────────────────────────────────

  /** Convierte Timestamps de Firestore a Date en un objeto Booking */
  private toBooking(data: Record<string, unknown>, id: string): Booking {
    return {
      ...(data as Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>),
      id,
      createdAt: (data['createdAt'] as Timestamp)?.toDate?.() ?? new Date(),
      updatedAt: (data['updatedAt'] as Timestamp)?.toDate?.() ?? new Date(),
    };
  }

  // ── Creación ─────────────────────────────────────────────────

  /**
   * Crea una nueva solicitud de reserva con estado `pendiente`.
   * Retorna el ID del documento creado.
   */
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
    const ref = collection(this.firestore, this.COL);
    const docRef = await addDoc(ref, {
      ...data,
      observations: data.observations ?? '',
      status: 'pendiente' as BookingStatus,
      denialReason: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  // ── Lectura ──────────────────────────────────────────────────

  /**
   * Escucha en tiempo real un booking por ID.
   * Ideal para la pantalla de confirmación del estudiante.
   */
  getById(id: string): Observable<Booking | null> {
    const ref = doc(this.firestore, this.COL, id);
    return (docData(ref, { idField: 'id' }) as Observable<Record<string, unknown>>).pipe(
      map(data => data ? this.toBooking(data, id) : null),
      catchError(() => of(null)),
    );
  }

  /**
   * Todos los bookings de un estudiante en tiempo real, ordenados por fecha de creación.
   */
  getByStudent(studentId: string): Observable<Booking[]> {
    const ref = collection(this.firestore, this.COL);
    const q   = query(
      ref,
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc'),
    );
    return (collectionData(q, { idField: 'id' }) as Observable<Record<string, unknown>[]>).pipe(
      map(docs => docs.map(d => this.toBooking(d, d['id'] as string))),
    );
  }

  /**
   * Bookings de un estudiante filtrados por estado.
   */
  getByStudentAndStatus(studentId: string, status: BookingStatus): Observable<Booking[]> {
    const ref = collection(this.firestore, this.COL);
    const q   = query(
      ref,
      where('studentId', '==', studentId),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
    );
    return (collectionData(q, { idField: 'id' }) as Observable<Record<string, unknown>[]>).pipe(
      map(docs => docs.map(d => this.toBooking(d, d['id'] as string))),
    );
  }

  /**
   * Todos los bookings pendientes — para la pantalla del administrador.
   * Escucha en tiempo real: cuando un estudiante crea una solicitud, aparece al instante.
   */
  getPending(): Observable<Booking[]> {
    const ref = collection(this.firestore, this.COL);
    const q   = query(
      ref,
      where('status', '==', 'pendiente'),
      orderBy('createdAt', 'asc'),   // más antiguo primero
    );
    return (collectionData(q, { idField: 'id' }) as Observable<Record<string, unknown>[]>).pipe(
      map(docs => docs.map(d => this.toBooking(d, d['id'] as string))),
    );
  }

  /**
   * Todos los bookings (cualquier estado) — para el calendario del admin.
   */
  getAll(): Observable<Booking[]> {
    const ref = collection(this.firestore, this.COL);
    const q   = query(ref, orderBy('createdAt', 'desc'));
    return (collectionData(q, { idField: 'id' }) as Observable<Record<string, unknown>[]>).pipe(
      map(docs => docs.map(d => this.toBooking(d, d['id'] as string))),
    );
  }

  // ── Actualización de estado ──────────────────────────────────

  /**
   * Aprueba una solicitud.
   * El NotificationService se encarga de crear la notificación al estudiante.
   */
  async approve(bookingId: string): Promise<void> {
    const ref = doc(this.firestore, this.COL, bookingId);
    await updateDoc(ref, {
      status: 'aprobada' as BookingStatus,
      denialReason: '',
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Deniega una solicitud con un motivo obligatorio.
   */
  async deny(bookingId: string, reason: string): Promise<void> {
    if (!reason?.trim()) throw new Error('El motivo de denegación es requerido.');
    const ref = doc(this.firestore, this.COL, bookingId);
    await updateDoc(ref, {
      status: 'denegada' as BookingStatus,
      denialReason: reason.trim(),
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Cancela una solicitud (acción del estudiante).
   */
  async cancel(bookingId: string): Promise<void> {
    const ref = doc(this.firestore, this.COL, bookingId);
    await updateDoc(ref, {
      status: 'cancelada' as BookingStatus,
      updatedAt: serverTimestamp(),
    });
  }
}
