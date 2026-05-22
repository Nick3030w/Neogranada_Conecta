import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  writeBatch,
  getDocs,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AppNotification, NotificationType } from '../interfaces/notification.interface';
import { Booking } from '../interfaces/booking.interface';

/**
 * NotificationService
 * Gestiona la colección `notifications` en Firestore.
 *
 * Estructura Firestore:
 *   notifications/{notificationId}  →  AppNotification
 *
 * Uso principal:
 *   - El admin llama a notifyBookingApproved() / notifyBookingDenied() al gestionar una solicitud.
 *   - El estudiante escucha getByUser() para ver sus notificaciones en tiempo real.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private firestore = inject(Firestore);
  private readonly COL = 'notifications';

  // ── Helpers ──────────────────────────────────────────────────

  private toNotification(data: Record<string, unknown>, id: string): AppNotification {
    return {
      ...(data as Omit<AppNotification, 'id' | 'createdAt'>),
      id,
      createdAt: (data['createdAt'] as Timestamp)?.toDate?.() ?? new Date(),
    };
  }

  // ── Lectura ──────────────────────────────────────────────────

  /**
   * Notificaciones de un usuario en tiempo real, ordenadas de más reciente a más antigua.
   * Usar en NotificationsPage para mostrar la lista.
   */
  getByUser(userId: string): Observable<AppNotification[]> {
    const ref = collection(this.firestore, this.COL);
    const q   = query(
      ref,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    );
    return (collectionData(q, { idField: 'id' }) as Observable<Record<string, unknown>[]>).pipe(
      map(docs => docs.map(d => this.toNotification(d, d['id'] as string))),
      catchError(() => of([])),
    );
  }

  /**
   * Cuenta de notificaciones no leídas de un usuario.
   * Útil para mostrar el badge en el ícono de notificaciones.
   */
  getUnreadCount(userId: string): Observable<number> {
    return this.getByUser(userId).pipe(
      map(notifications => notifications.filter(n => !n.read).length),
    );
  }

  // ── Escritura ────────────────────────────────────────────────

  /**
   * Crea una notificación genérica para un usuario.
   */
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    relatedBookingId?: string;
  }): Promise<string> {
    const ref = collection(this.firestore, this.COL);
    const docRef = await addDoc(ref, {
      ...data,
      relatedBookingId: data.relatedBookingId ?? '',
      read: false,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }

  // ── Notificaciones de booking ────────────────────────────────

  /**
   * Notifica al estudiante que su solicitud fue recibida y está pendiente.
   * Llamar desde BookingService.create() o desde BookingPage al enviar el formulario.
   */
  async notifyBookingPending(booking: Pick<Booking, 'id' | 'studentId' | 'resourceName'>): Promise<void> {
    await this.create({
      userId:           booking.studentId,
      type:             'booking_pending',
      title:            'Solicitud recibida',
      body:             `Tu solicitud para "${booking.resourceName}" está siendo revisada por el administrador.`,
      relatedBookingId: booking.id,
    });
  }

  /**
   * Notifica al estudiante que su solicitud fue aprobada.
   * Llamar desde AdminConfirmationPage al aprobar.
   */
  async notifyBookingApproved(booking: Pick<Booking, 'id' | 'studentId' | 'resourceName' | 'date' | 'time'>): Promise<void> {
    await this.create({
      userId:           booking.studentId,
      type:             'booking_approved',
      title:            '¡Solicitud aprobada!',
      body:             `Tu solicitud para "${booking.resourceName}" el ${booking.date} a las ${booking.time} fue aprobada.`,
      relatedBookingId: booking.id,
    });
  }

  /**
   * Notifica al estudiante que su solicitud fue denegada.
   * Llamar desde AdminConfirmationPage al denegar.
   */
  async notifyBookingDenied(booking: Pick<Booking, 'id' | 'studentId' | 'resourceName'>, reason: string): Promise<void> {
    await this.create({
      userId:           booking.studentId,
      type:             'booking_denied',
      title:            'Solicitud denegada',
      body:             `Tu solicitud para "${booking.resourceName}" fue denegada. Motivo: ${reason}`,
      relatedBookingId: booking.id,
    });
  }

  /**
   * Notifica al estudiante que recibió un mensaje en el chat de su solicitud.
   */
  async notifyChatMessage(data: {
    userId: string;
    bookingId: string;
    senderName: string;
    resourceName: string;
  }): Promise<void> {
    await this.create({
      userId:           data.userId,
      type:             'chat_message',
      title:            'Nuevo mensaje',
      body:             `${data.senderName} te envió un mensaje sobre tu solicitud de "${data.resourceName}".`,
      relatedBookingId: data.bookingId,
    });
  }

  // ── Marcar como leída ────────────────────────────────────────

  /**
   * Marca una notificación individual como leída.
   */
  async markAsRead(notificationId: string): Promise<void> {
    const ref = doc(this.firestore, this.COL, notificationId);
    await updateDoc(ref, { read: true });
  }

  /**
   * Marca todas las notificaciones no leídas de un usuario como leídas.
   * Usar al abrir la pantalla de notificaciones.
   */
  async markAllAsRead(userId: string): Promise<void> {
    const ref  = collection(this.firestore, this.COL);
    const q    = query(ref, where('userId', '==', userId), where('read', '==', false));
    const snap = await getDocs(q);

    if (snap.empty) return;

    const batch = writeBatch(this.firestore);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  }
}
