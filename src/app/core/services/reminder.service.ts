import { Injectable, inject } from '@angular/core';
import { Capacitor, PermissionState } from '@capacitor/core';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { BehaviorSubject, Observable } from 'rxjs';
import { Booking } from '../interfaces/booking.interface';
import { NotificationService } from './notification.service';

/** Minutos de anticipación con los que se avisa antes de cada hito de la reserva */
const REMINDER_MINUTES_BEFORE = 15;

/** Permiso de notificaciones. 'unavailable' = web o plugin nativo no registrado. */
export type NotificationPermission = 'granted' | 'denied' | 'prompt' | 'unavailable';

/** Ajuste "Alarmas y recordatorios" de Android. 'unavailable' = no se pudo consultar. */
export type ExactAlarmPermission = 'granted' | 'denied' | 'unavailable';

/** Estado de los permisos que necesitan los recordatorios de reservas. */
export interface ReminderPermissionState {
  notifications: NotificationPermission;
  exactAlarm: ExactAlarmPermission;
}

/** Datos de una reserva necesarios para programar sus recordatorios. */
type ReminderBooking = Pick<Booking, 'id' | 'studentId' | 'resourceName' | 'date' | 'startTime' | 'endTime'>;

const UNAVAILABLE_STATE: ReminderPermissionState = { notifications: 'unavailable', exactAlarm: 'unavailable' };

/**
 * Programa y cancela los recordatorios (notificaciones nativas del sistema +
 * notificación in-app) de inicio y devolución de una reserva.
 *
 * Las notificaciones locales de Capacitor quedan programadas en el sistema
 * operativo, por lo que se disparan aunque la app esté cerrada. El id
 * numérico de cada notificación se deriva de forma determinística del id
 * del booking para poder cancelarlas después sin tener que guardar nada
 * adicional en Firestore.
 *
 * Solo funciona en la app nativa: en web no se programa nada. Guarda las
 * reservas aprobadas para programarlas en cuanto se conceda el permiso de
 * notificaciones, y las reprograma si se habilitan las alarmas exactas.
 */
@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly notificationService = inject(NotificationService);

  private readonly permissionStateSubject = new BehaviorSubject<ReminderPermissionState>(UNAVAILABLE_STATE);
  /** Estado de los permisos en tiempo real */
  readonly permissionState$: Observable<ReminderPermissionState> = this.permissionStateSubject.asObservable();

  /** Reservas aprobadas del estudiante en sesión (última lista recibida) */
  private approvedBookings: ReminderBooking[] = [];

  /** Serializa las llamadas al plugin para que no se mezclen cancelaciones y programaciones */
  private queue: Promise<void> = Promise.resolve();

  private missingPluginWarned = false;

  /** Estado actual de los permisos (sincrónico) */
  get permissionState(): ReminderPermissionState {
    return this.permissionStateSubject.getValue();
  }

  // ── Soporte ────────────────────────────────────────────────────

  /**
   * true en la app nativa con el plugin LocalNotifications registrado.
   * Si el APK se instaló sin sincronizar el plugin, lo avisa en consola.
   */
  isSupported(): boolean {
    if (!Capacitor.isNativePlatform()) return false;
    if (Capacitor.isPluginAvailable('LocalNotifications')) return true;

    if (!this.missingPluginWarned) {
      this.missingPluginWarned = true;
      console.warn(
        'Plugin LocalNotifications no registrado: ejecuta "npx cap sync android" y reinstala la app. ' +
        'Los recordatorios de reservas no se programarán.'
      );
    }
    return false;
  }

  // ── Permisos ───────────────────────────────────────────────────

  /**
   * Consulta el permiso de notificaciones y el de alarmas exactas y publica el
   * resultado. Si alguno pasó a concedido, reprograma las reservas aprobadas.
   */
  async refreshPermissionState(): Promise<ReminderPermissionState> {
    if (!this.isSupported()) {
      this.setPermissionState(UNAVAILABLE_STATE);
      return UNAVAILABLE_STATE;
    }

    const next: ReminderPermissionState = {
      notifications: await this.readNotificationPermission(),
      exactAlarm:    await this.readExactAlarmPermission(),
    };
    this.setPermissionState(next);
    return next;
  }

  /**
   * Pide el permiso de notificaciones. En Android 13+, si el usuario ya lo
   * negó, el sistema puede responder 'denied' sin mostrar ningún diálogo.
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'unavailable';

    try {
      await LocalNotifications.requestPermissions();
    } catch (err: unknown) {
      console.error('Error al solicitar permiso de notificaciones:', err);
    }
    return (await this.refreshPermissionState()).notifications;
  }

  /**
   * Abre la pantalla del sistema "Alarmas y recordatorios" (Android 12+) y
   * devuelve el estado al volver. En Android < 12 responde 'granted' sin abrir nada.
   */
  async openExactAlarmSettings(): Promise<ExactAlarmPermission> {
    if (!this.isSupported()) return 'unavailable';

    try {
      await LocalNotifications.changeExactNotificationSetting();
    } catch (err: unknown) {
      console.error('Error al abrir el ajuste de alarmas exactas:', err);
    }
    return (await this.refreshPermissionState()).exactAlarm;
  }

  private async readNotificationPermission(): Promise<NotificationPermission> {
    try {
      const status = await LocalNotifications.checkPermissions();
      return this.toNotificationPermission(status.display);
    } catch (err: unknown) {
      console.error('Error al consultar el permiso de notificaciones:', err);
      return 'unavailable';
    }
  }

  private async readExactAlarmPermission(): Promise<ExactAlarmPermission> {
    try {
      const status = await LocalNotifications.checkExactNotificationSetting();
      return status.exact_alarm === 'granted' ? 'granted' : 'denied';
    } catch (err: unknown) {
      // Solo existe en Android
      console.warn('No se pudo consultar el ajuste de alarmas exactas:', err);
      return 'unavailable';
    }
  }

  private toNotificationPermission(state: PermissionState): NotificationPermission {
    if (state === 'granted') return 'granted';
    if (state === 'denied') return 'denied';
    return 'prompt';
  }

  /** Publica el estado y reprograma si se acaba de conceder algún permiso. */
  private setPermissionState(next: ReminderPermissionState): void {
    const prev = this.permissionState;
    if (prev.notifications === next.notifications && prev.exactAlarm === next.exactAlarm) return;

    this.permissionStateSubject.next(next);

    const notificationsGranted = prev.notifications !== 'granted' && next.notifications === 'granted';
    // Las ya programadas como inexactas se vuelven a programar como exactas
    const exactAlarmGranted = next.notifications === 'granted'
      && prev.exactAlarm !== 'granted' && next.exactAlarm === 'granted';

    if (notificationsGranted || exactAlarmGranted) {
      void this.enqueue(() => this.scheduleApproved());
    }
  }

  // ── Sincronización con las reservas ────────────────────────────

  /**
   * Sincroniza los recordatorios con las reservas del estudiante: programa las
   * aprobadas (si hay permiso) y cancela las demás. Las aprobadas se guardan
   * para programarlas después si el permiso todavía no está concedido.
   */
  syncBookings(bookings: Booking[]): Promise<void> {
    if (!this.isSupported()) return Promise.resolve();

    this.approvedBookings = bookings
      .filter(b => b.status === 'aprobada')
      .map(b => ({
        id:           b.id,
        studentId:    b.studentId,
        resourceName: b.resourceName,
        date:         b.date,
        startTime:    b.startTime,
        endTime:      b.endTime,
      }));
    const otherIds = bookings.filter(b => b.status !== 'aprobada').map(b => b.id);

    return this.enqueue(async () => {
      // Denegada/cancelada/pendiente: no debe tener recordatorios activos
      for (const id of otherIds) {
        await this.cancelForBooking(id);
      }
      await this.scheduleApproved();
    });
  }

  /** Programa desde cero los recordatorios de las reservas aprobadas guardadas. */
  private async scheduleApproved(): Promise<void> {
    if (this.permissionState.notifications !== 'granted') return;

    for (const booking of this.approvedBookings) {
      // Se reprograma desde cero para evitar duplicados con ids obsoletos
      await this.cancelForBooking(booking.id);
      await this.scheduleForBooking(booking);
    }
  }

  private enqueue(task: () => Promise<void>): Promise<void> {
    this.queue = this.queue
      .then(task)
      .catch((err: unknown) => console.error('Error al sincronizar recordatorios de reserva:', err));
    return this.queue;
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
   * No hace nada si el permiso de notificaciones no está concedido.
   */
  async scheduleForBooking(booking: ReminderBooking): Promise<void> {
    if (this.permissionState.notifications !== 'granted') return;

    // Sin "Alarmas y recordatorios" se programa como inexacta desde el inicio:
    // si se pide exacta, el plugin (8.3+) abre por su cuenta esa pantalla del
    // sistema en cada llamada. El aviso para habilitarla lo maneja la app.
    const exact = this.permissionState.exactAlarm === 'granted';

    const now = new Date();
    const startAt = new Date(
      this.toDate(booking.date, booking.startTime).getTime() - REMINDER_MINUTES_BEFORE * 60_000
    );
    const endAt = new Date(
      this.toDate(booking.date, booking.endTime).getTime() - REMINDER_MINUTES_BEFORE * 60_000
    );

    // Se incluyen los datos del booking en `extra` para poder crear la
    // notificación in-app correspondiente sin volver a consultar Firestore
    // desde el listener nativo (ver initListeners).
    const extraBase = {
      bookingId:    booking.id,
      studentId:    booking.studentId,
      resourceName: booking.resourceName,
      startTime:    booking.startTime,
      endTime:      booking.endTime,
    };

    const notifications: LocalNotificationSchema[] = [];

    // allowWhileIdle: la alarma se dispara aunque el teléfono esté en reposo (Doze)
    if (startAt.getTime() > now.getTime()) {
      notifications.push({
        id: this.hashId(booking.id, 'start'),
        title: 'Tu reserva está por comenzar',
        body: `Tu turno para usar "${booking.resourceName}" empieza a las ${booking.startTime}.`,
        schedule: { at: startAt, allowWhileIdle: true },
        isExactNotification: exact,
        extra: { ...extraBase, kind: 'start' as const },
      });
    }

    if (endAt.getTime() > now.getTime()) {
      notifications.push({
        id: this.hashId(booking.id, 'end'),
        title: 'Debes devolver el recurso pronto',
        body: `Recuerda devolver "${booking.resourceName}" antes de las ${booking.endTime}.`,
        schedule: { at: endAt, allowWhileIdle: true },
        isExactNotification: exact,
        extra: { ...extraBase, kind: 'end' as const },
      });
    }

    if (notifications.length === 0) return;

    try {
      await LocalNotifications.schedule({ notifications });
    } catch (err: unknown) {
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
