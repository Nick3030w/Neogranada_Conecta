import { Component, NgZone, OnDestroy, inject } from '@angular/core';
import { AlertController, IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { Subscription, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { BookingService } from './core/services/booking.service';
import { ReminderService } from './core/services/reminder.service';
import { UserProfile } from './core/interfaces/user.interface';
import { Booking } from './core/interfaces/booking.interface';

/** Prefijos de localStorage (+ uid) con la fecha del último aviso automático mostrado */
const NOTIFICATIONS_ALERT_KEY = 'reminders_notifications_alert_';
const EXACT_ALARM_ALERT_KEY = 'reminders_exact_alarm_alert_';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnDestroy {
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private bookingService = inject(BookingService);
  private reminderService = inject(ReminderService);
  private alertCtrl = inject(AlertController);
  private zone = inject(NgZone);

  private reminderSubs = new Subscription();
  private appStateHandle?: PluginListenerHandle;
  /** true mientras hay un aviso de recordatorios abierto (evita encimarlos) */
  private reminderAlertOpen = false;

  /** Respaldo si el plugin App no está registrado en el APK */
  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') void this.reminderService.refreshPermissionState();
  };

  constructor() {
    // Aplica el tema guardado de inmediato y lo sincroniza con el perfil de usuario
    this.themeService.init();

    // Recordatorios de reservas: pide permiso, escucha disparos nativos y
    // reprograma los recordatorios de las reservas aprobadas del estudiante.
    this.initReminders();
  }

  ngOnDestroy(): void {
    this.reminderSubs.unsubscribe();
    void this.appStateHandle?.remove();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private async initReminders(): Promise<void> {
    // En web (ionic serve) o sin el plugin nativo no se programa ni se avisa nada
    if (!this.reminderService.isSupported()) return;

    await this.reminderService.initListeners();

    // Pide el permiso al arrancar si aún no está concedido. Si se niega se
    // sigue igual: las reservas quedan guardadas y se programan cuando se conceda.
    const { notifications } = await this.reminderService.refreshPermissionState();
    if (notifications === 'denied' || notifications === 'prompt') {
      await this.reminderService.requestNotificationPermission();
    }

    // Cuando cambia el usuario autenticado (login/logout), sincroniza los
    // recordatorios de sus reservas. switchMap cancela automáticamente el
    // listener anterior si el usuario cambia.
    this.reminderSubs.add(
      this.authService.currentUser$
        .pipe(
          switchMap((user: UserProfile | null) =>
            user && user.role === 'student'
              ? this.bookingService.getByStudent(user.uid)
              : of<Booking[]>([])
          )
        )
        .subscribe(bookings => void this.reminderService.syncBookings(bookings))
    );

    // Avisos automáticos: al iniciar sesión como estudiante (máximo uno al día)
    this.reminderSubs.add(
      this.authService.currentUser$
        .pipe(
          map(user => (user?.role === 'student' ? user.uid : null)),
          distinctUntilChanged()
        )
        .subscribe(uid => {
          if (uid) void this.showReminderAlerts(uid);
        })
    );

    await this.listenAppResume();
  }

  /**
   * Al volver al primer plano (p. ej. desde Ajustes) vuelve a consultar los
   * permisos. Si se concedieron, el servicio programa las reservas pendientes.
   */
  private async listenAppResume(): Promise<void> {
    if (!Capacitor.isPluginAvailable('App')) {
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      return;
    }

    this.appStateHandle = await App.addListener('appStateChange', ({ isActive }) => {
      // Los eventos nativos llegan fuera de la zona de Angular
      if (isActive) this.zone.run(() => void this.reminderService.refreshPermissionState());
    });
  }

  // ── Avisos de permisos ─────────────────────────────────────────

  /**
   * Avisa si faltan permisos para los recordatorios: primero el de
   * notificaciones y, si ya está concedido, el de alarmas exactas.
   * Cada aviso sale como máximo una vez al día por estudiante.
   */
  private async showReminderAlerts(uid: string): Promise<void> {
    if (this.reminderAlertOpen) return;
    this.reminderAlertOpen = true;

    try {
      let state = this.reminderService.permissionState;

      if (state.notifications === 'denied' || state.notifications === 'prompt') {
        if (!this.claimDailyAlert(NOTIFICATIONS_ALERT_KEY, uid)) return;
        await this.askNotificationPermission();
        state = this.reminderService.permissionState;
      }

      // Las alarmas exactas solo sirven con las notificaciones activas
      if (
        state.notifications === 'granted' &&
        state.exactAlarm === 'denied' &&
        this.claimDailyAlert(EXACT_ALARM_ALERT_KEY, uid)
      ) {
        await this.askExactAlarmPermission();
      }
    } finally {
      this.reminderAlertOpen = false;
    }
  }

  /** Aviso de notificaciones desactivadas, con opción de volver a pedir el permiso. */
  private async askNotificationPermission(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Notificaciones desactivadas',
      message:
        'Sin notificaciones no te llegarán los recordatorios de tus reservas ' +
        '(15 minutos antes de que empiecen y de que terminen).',
      buttons: [
        { text: 'Ahora no', role: 'cancel' },
        { text: 'Reintentar', role: 'confirm' },
      ],
    });
    await alert.present();

    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm') return;

    const result = await this.reminderService.requestNotificationPermission();
    if (result === 'granted' || result === 'unavailable') return;

    // Android 13+ no vuelve a mostrar el diálogo si ya se negó: toca hacerlo a mano
    const help = await this.alertCtrl.create({
      header: 'Activa las notificaciones',
      message:
        'El permiso sigue desactivado. Si Android no mostró el diálogo, actívalo en ' +
        'Ajustes > Apps > Neogranada Conecta > Notificaciones. ' +
        'Puedes revisarlo luego en Configuración > Recordatorios de reservas.',
      buttons: [{ text: 'Entendido', role: 'cancel' }],
    });
    await help.present();
    await help.onDidDismiss();
  }

  /** Aviso para habilitar "Alarmas y recordatorios" (alarmas exactas). */
  private async askExactAlarmPermission(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Recordatorios con retraso',
      message:
        'Neogranada Conecta no tiene permiso de "Alarmas y recordatorios", así que ' +
        'los recordatorios de tus reservas pueden llegar con retraso. ' +
        'Toca Permitir y activa el permiso en la pantalla que se abre.',
      buttons: [
        { text: 'Ahora no', role: 'cancel' },
        { text: 'Permitir', role: 'confirm' },
      ],
    });
    await alert.present();

    const { role } = await alert.onDidDismiss();
    if (role === 'confirm') {
      // Al volver, el servicio reprograma las reservas si quedó concedido
      await this.reminderService.openExactAlarmSettings();
    }
  }

  /** true si el aviso no se ha mostrado hoy; en ese caso lo marca como mostrado. */
  private claimDailyAlert(keyPrefix: string, uid: string): boolean {
    const key = `${keyPrefix}${uid}`;
    const today = new Date().toDateString();
    if (localStorage.getItem(key) === today) return false;
    localStorage.setItem(key, today);
    return true;
  }
}
