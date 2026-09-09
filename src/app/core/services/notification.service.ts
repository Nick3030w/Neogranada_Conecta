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
  writeBatch,
  getDocs,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AppNotification, NotificationType } from '../interfaces/notification.interface';
import { Booking } from '../interfaces/booking.interface';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly COL = 'notifications';
  private readonly db: Firestore;

  constructor() {
    this.db = inject(Firestore);
  }

  // ── Helper ────────────────────────────────────────────────────

  private toNotification(data: Record<string, unknown>, id: string): AppNotification {
    return {
      ...(data as Omit<AppNotification, 'id' | 'createdAt'>),
      id,
      createdAt: (data['createdAt'] as Timestamp)?.toDate?.() ?? new Date(),
    };
  }

  // ── Lectura en tiempo real ────────────────────────────────────

  getByUser(userId: string): Observable<AppNotification[]> {
    return new Observable(observer => {
      const q     = query(collection(this.db, this.COL), where('userId', '==', userId));
      const unsub = onSnapshot(
        q,
        snap => observer.next(
          snap.docs
            .map(d => this.toNotification(d.data() as Record<string, unknown>, d.id))
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        ),
        err => observer.error(err),
      );
      return () => unsub();
    });
  }

  // ── Escritura ─────────────────────────────────────────────────

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    relatedBookingId?: string;
    relatedConversationId?: string;
    relatedUserId?: string;
  }): Promise<string> {
    const docRef = await addDoc(collection(this.db, this.COL), {
      ...data,
      relatedBookingId:      data.relatedBookingId ?? '',
      relatedConversationId: data.relatedConversationId ?? '',
      relatedUserId:         data.relatedUserId ?? '',
      read:                  false,
      createdAt:             serverTimestamp(),
    });
    return docRef.id;
  }

  // ── Notificaciones de booking ─────────────────────────────────

  async notifyBookingPending(booking: Pick<Booking, 'id' | 'studentId' | 'resourceName'>): Promise<void> {
    await this.create({
      userId:           booking.studentId,
      type:             'booking_pending',
      title:            'Solicitud recibida',
      body:             `Tu solicitud para "${booking.resourceName}" está siendo revisada por el administrador.`,
      relatedBookingId: booking.id,
    });
  }

  async notifyAdminsNewBooking(
    booking: Pick<Booking, 'id' | 'studentId' | 'resourceName'> & { studentName: string }
  ): Promise<void> {
    const adminsSnap = await getDocs(
      query(collection(this.db, 'users'), where('role', '==', 'admin'))
    );
    if (adminsSnap.empty) return;

    await Promise.all(
      adminsSnap.docs.map(adminDoc =>
        this.create({
          userId:           adminDoc.id,
          type:             'booking_pending',
          title:            'Nueva solicitud pendiente',
          body:             `${booking.studentName} solicitó "${booking.resourceName}". Revisa y gestiona la solicitud.`,
          relatedBookingId: booking.id,
        })
      )
    );
  }

  async notifyBookingApproved(
    booking: Pick<Booking, 'id' | 'studentId' | 'resourceName' | 'date' | 'startTime' | 'endTime'>
  ): Promise<void> {
    await this.create({
      userId:           booking.studentId,
      type:             'booking_approved',
      title:            '¡Solicitud aprobada!',
      body:             `Tu solicitud para "${booking.resourceName}" el ${booking.date} de ${booking.startTime} a ${booking.endTime} fue aprobada.`,
      relatedBookingId: booking.id,
    });
  }

  async notifyBookingDenied(
    booking: Pick<Booking, 'id' | 'studentId' | 'resourceName'>,
    reason: string
  ): Promise<void> {
    await this.create({
      userId:           booking.studentId,
      type:             'booking_denied',
      title:            'Solicitud denegada',
      body:             `Tu solicitud para "${booking.resourceName}" fue denegada. Motivo: ${reason}`,
      relatedBookingId: booking.id,
    });
  }

  // ── Recordatorios de booking ──────────────────────────────────

  /** Avisa que se acerca la hora en que el estudiante debe usar el recurso */
  async notifyReminderStart(
    booking: Pick<Booking, 'id' | 'studentId' | 'resourceName' | 'startTime'>
  ): Promise<void> {
    await this.create({
      userId:           booking.studentId,
      type:             'booking_reminder_start',
      title:            'Tu reserva está por comenzar',
      body:             `Tu turno para usar "${booking.resourceName}" empieza a las ${booking.startTime}.`,
      relatedBookingId: booking.id,
    });
  }

  /** Avisa que se acerca la hora en que el estudiante debe devolver el recurso */
  async notifyReminderEnd(
    booking: Pick<Booking, 'id' | 'studentId' | 'resourceName' | 'endTime'>
  ): Promise<void> {
    await this.create({
      userId:           booking.studentId,
      type:             'booking_reminder_end',
      title:            'Debes devolver el recurso pronto',
      body:             `Recuerda devolver "${booking.resourceName}" antes de las ${booking.endTime}.`,
      relatedBookingId: booking.id,
    });
  }

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

  // ── Chat directo entre estudiantes ────────────────────────────

  /** Avisa a un estudiante de que otro le escribió por chat directo. */
  async notifyDirectMessage(data: {
    userId: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    preview: string;
    topicLabel: string;
  }): Promise<void> {
    await this.create({
      userId:                data.userId,
      type:                  'direct_message',
      title:                 `Mensaje de ${data.senderName}`,
      body:                  `${data.topicLabel}: ${data.preview}`,
      relatedConversationId: data.conversationId,
      relatedUserId:         data.senderId,
    });
  }

  // ── Marcar como leída ─────────────────────────────────────────

  async markAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(this.db, this.COL, notificationId), { read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const snap = await getDocs(
      query(
        collection(this.db, this.COL),
        where('userId', '==', userId),
        where('read', '==', false),
      )
    );
    if (snap.empty) return;

    const batch = writeBatch(this.db);
    snap.docs.forEach(d => batch.update(doc(this.db, this.COL, d.id), { read: true }));
    await batch.commit();
  }
}
