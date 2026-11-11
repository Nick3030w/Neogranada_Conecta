import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonToggle, ViewWillEnter } from '@ionic/angular/standalone';
import { Capacitor } from '@capacitor/core';
import { addIcons } from 'ionicons';
import { logOutOutline, construct, moonOutline, alarmOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ReminderPermissionState, ReminderService } from '../../../core/services/reminder.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonToggle],
})
export class SettingsPage implements OnInit, OnDestroy, ViewWillEnter {
  notificationsMuted = false;
  darkMode = false;
  loading = false;

  /** Sección de recordatorios: solo en la app nativa y para estudiantes */
  showReminders = false;
  reminderState: ReminderPermissionState = { notifications: 'unavailable', exactAlarm: 'unavailable' };
  reminderBusy = false;

  private router = inject(Router);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private reminderService = inject(ReminderService);

  private userSub?: Subscription;
  private themeSub?: Subscription;
  private reminderSub?: Subscription;

  constructor() {
    addIcons({ logOutOutline, construct, moonOutline, alarmOutline });
  }

  ngOnInit(): void {
    // Suscripción reactiva para recibir cambios en tiempo real
    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.notificationsMuted = user?.notificationsMuted ?? false;
      this.showReminders = Capacitor.isNativePlatform() && user?.role === 'student';
    });

    // El estado del toggle sigue al tema activo (fuente de verdad: ThemeService)
    this.themeSub = this.themeService.theme$.subscribe(theme => {
      this.darkMode = theme === 'dark';
    });

    this.reminderSub = this.reminderService.permissionState$.subscribe(state => {
      this.reminderState = state;
    });
  }

  ionViewWillEnter(): void {
    // Refresh al volver de caché (ion-router-outlet)
    const user = this.authService.currentUser;
    this.notificationsMuted = user?.notificationsMuted ?? false;
    this.darkMode = this.themeService.isDark;

    if (this.showReminders) void this.reminderService.refreshPermissionState();
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.themeSub?.unsubscribe();
    this.reminderSub?.unsubscribe();
  }

  async toggleNotifications(event: CustomEvent): Promise<void> {
    this.notificationsMuted = event.detail.checked;
    const user = this.authService.currentUser;
    if (user) await this.authService.updateProfile(user.uid, { notificationsMuted: this.notificationsMuted });
  }

  /** Alterna entre modo claro y oscuro; aplica en vivo y persiste. */
  async toggleDarkMode(event: CustomEvent): Promise<void> {
    const enabled = event.detail.checked;
    this.darkMode = enabled;
    await this.themeService.toggleDark(enabled);
  }

  // ── Recordatorios de reservas ──────────────────────────────────

  /** true si faltan las notificaciones del sistema (se pueden volver a pedir) */
  get notificationsOff(): boolean {
    return this.reminderState.notifications === 'denied' || this.reminderState.notifications === 'prompt';
  }

  get notificationsLabel(): string {
    if (this.reminderState.notifications === 'granted') return 'Activadas';
    return this.notificationsOff ? 'Desactivadas' : 'No disponible';
  }

  get exactAlarmLabel(): string {
    switch (this.reminderState.exactAlarm) {
      case 'granted': return 'Permitidas';
      case 'denied':  return 'No permitidas';
      default:        return 'No disponible';
    }
  }

  /** Vuelve a pedir el permiso de notificaciones. */
  async retryNotificationPermission(): Promise<void> {
    this.reminderBusy = true;
    try {
      await this.reminderService.requestNotificationPermission();
    } finally {
      this.reminderBusy = false;
    }
  }

  /** Abre la pantalla del sistema "Alarmas y recordatorios". */
  async openExactAlarmSettings(): Promise<void> {
    this.reminderBusy = true;
    try {
      await this.reminderService.openExactAlarmSettings();
    } finally {
      this.reminderBusy = false;
    }
  }

  goToProfile(): void {
    const role = this.authService.currentUser?.role;
    this.router.navigate([role === 'admin' ? '/admin/profile' : '/student/profile']);
  }

  async changePassword(): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;
    this.loading = true;
    try {
      await this.authService.sendPasswordReset(user.email);
      alert('Revisa tu correo para cambiar tu contraseña.');
    } catch { /* ignore */ } finally { this.loading = false; }
  }

  async logout(): Promise<void> { await this.authService.logout(); }

  goBack(): void {
    const role = this.authService.currentUser?.role;
    this.router.navigate([role === 'admin' ? '/admin/home' : '/student/home']);
  }
}
