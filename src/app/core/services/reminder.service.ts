import { Injectable, inject } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Booking } from '../interfaces/booking.interface';
import { NotificationService } from './notification.service';

/** Minutos de anticipación con los que se avisa antes de cada hito de la reserva */
const REMINDER_MINUTES_BEFORE = 15;

/**
 * Programa y cancela los recordatorios (notificaciones nativas del sistema +
 * notificación in-app) de inicio y devolución de una reserva.
 *
 * Las notificaciones locales de Capacitor quedan programadas en el sistema
 * operativo, por lo que se disparan aunque la app esté cerrada. El id
 * numérico de cada notificación se deriva de forma determinística del id
 * del booking para poder cancelarlas después sin tener que guardar nada
 * adicional en Firestore.
 */
@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly notificationService = inject(NotificationService);

  /** true una vez que el usuario concedió el permiso (o ya estaba concedido) */
  private permissionGranted = false;

  // ── Permisos ───────────────────────────────────────────────────

  /** Pide permiso de notificaciones si aún no se ha concedido. Se debe llamar al iniciar la app. */
  async requestPermission(): Promise<boolean> {
    try {
      const current = await LocalNotifications.checkPermissions();
      if (current.display === 'granted') {
        this.permissionGranted = true;
        return true;
      }

      const result = await LocalNotifications.requestPermissions();
      this.permissionGranted = result.display === 'granted';
      return this.permissionGranted;
    } catch (err) {
      console.error('Error al solicitar permiso de notificaciones:', err);
      return false;
    }
  }

  // ── IDs determinísticos ──────────────────────────────────────────
  // Los ids de notificación local en Android son enteros de 32 bits, así que
  // se genera un hash numérico estable a partir del bookingId (string).

  private hashId(bookingId: string, suffix: 'start' | 'end'): number {
    let hash = 0;
    const key = `${bookingId}_${suffix}`;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) | 0; // mantiene el resultado en 32 bits
    }
    return Math.abs(hash) || 1;
  }

  // ── Programación ──────────────────────────────────────────────

  /** Convierte fecha (YYYY-MM-DD) + hora (HH:mm) en un Date local. */
  private toDate(date: string, time: string): Date {
    const [y, m, d] = date.split('-').map(Number);
    const [h, min] = time.split(':').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, h ?? 0, min ?? 0, 0, 0);
  }

  /**
   * Programa los dos recordatorios locales (inicio y devolución) de una
   * reserva aprobada. Si alguno de los hitos ya pasó (o está a menos de
   * `REMINDER_MINUTES_BEFORE` minutos), ese recordatorio se omite.
   */
  async scheduleForBooking(
    booking: Pick<Booking, 'id' | 'studentId' | 'resourceName' | 'date' | 'startTime' | 'endTime'>
  ): Promise<void> {
    if (!this.permissionGranted) {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    const now = new Date();
    const startAt = new Date(
      this.toDate(booking.date, booking.startTime).getTime() - REMINDER_MINUTES_BEFORE * 60_000
    );
    const endAt = new Date(
      this.toDate(booking.date, booking.endTime).getTime() - REMINDER_MINUTES_BEFORE * 60_000
    );

    // Se incluyen los datos del booking en `extra` para poder crear la
    // notificación in-app correspondiente sin volver a consultar Firestore
    // desde el listener nativo (ver app.component.ts).
    const extraBase = {
      bookingId:    booking.id,
      studentId:    booking.studentId,
      resourceName: booking.resourceName,
      startTime:    booking.startTime,
      endTime:      booking.endTime,
    };

    const notifications = [];

    if (startAt.getTime() > now.getTime()) {
      notifications.push({
        id: this.hashId(booking.id, 'start'),
        title: 'Tu reserva está por comenzar',
        body: `Tu turno para usar "${booking.resourceName}" empieza a las ${booking.startTime}.`,
        schedule: { at: startAt },
        extra: { ...extraBase, kind: 'start' as const },
      });
    }

    if (endAt.getTime() > now.getTime()) {
      notifications.push({
        id: this.hashId(booking.id, 'end'),
        title: 'Debes devolver el recurso pronto',
        body: `Recuerda devolver "${booking.resourceName}" antes de las ${booking.endTime}.`,
        schedule: { at: endAt },
        extra: { ...extraBase, kind: 'end' as const },
      });
    }

    if (notifications.length === 0) return;

    try {
      await LocalNotifications.schedule({ notifications });
    } catch (err) {
      console.error('Error al programar recordatorios de reserva:', err);
    }
  }

  /** Cancela ambos recordatorios (inicio y devolución) de una reserva. */
  async cancelForBooking(bookingId: string): Promise<void> {
    try {
      await LocalNotifications.cancel({
        notifications: [
          { id: this.hashId(bookingId, 'start') },
          { id: this.hashId(bookingId, 'end') },
        ],
      });
    } catch (err) {
      console.error('Error al cancelar recordatorios de reserva:', err);
    }
  }

  // ── Notificación in-app al dispararse el recordatorio nativo ────

  private listenersReady = false;

  /**
   * Escucha el evento nativo `localNotificationReceived` y refleja el
   * recordatorio como notificación in-app (para que quede también en el
   * centro de notificaciones de la app, no solo en el sistema operativo).
   * Debe llamarse una sola vez al iniciar la app.
   */
  async initListeners(): Promise<void> {
    if (this.listenersReady) return;
    this.listenersReady = true;

    await LocalNotifications.addListener('localNotificationReceived', (notification) => {
      const extra = notification.extra as {
        bookingId?: string;
        studentId?: string;
        resourceName?: string;
        startTime?: string;
        endTime?: string;
        kind?: 'start' | 'end';
      } | undefined;

      if (!extra?.bookingId || !extra.studentId || !extra.resourceName || !extra.kind) return;

      const booking = {
        id:           extra.bookingId,
        studentId:    extra.studentId,
        resourceName: extra.resourceName,
        startTime:    extra.startTime ?? '',
        endTime:      extra.endTime ?? '',
      };

      const write = extra.kind === 'start'
        ? this.notificationService.notifyReminderStart(booking)
        : this.notificationService.notifyReminderEnd(booking);

      write.catch(err => console.error('Error al registrar recordatorio in-app:', err));
    });
  }
}
