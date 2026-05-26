import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, notifications, notificationsOffOutline,
  checkmarkDoneOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../../core/interfaces/notification.interface';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class NotificationsPage implements OnInit, OnDestroy {
  notifications: AppNotification[] = [];
  loading = true;

  private notifSub?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {
    addIcons({ logOutOutline, notifications, notificationsOffOutline, checkmarkDoneOutline });
  }

  ngOnInit(): void {
    const userId = this.authService.currentUser?.uid;
    if (!userId) { this.loading = false; return; }

    // Escucha en tiempo real las notificaciones del usuario
    this.notifSub = this.notificationService.getByUser(userId).subscribe(data => {
      this.notifications = data;
      this.loading       = false;
    });

    // Marca todas como leídas al abrir la pantalla
    this.notificationService.markAllAsRead(userId).catch(console.error);
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
  }

  /** Icono según el tipo de notificación */
  getIcon(type: AppNotification['type']): string {
    const map: Record<AppNotification['type'], string> = {
      booking_approved: 'checkmark-done-outline',
      booking_denied:   'close-outline',
      booking_pending:  'time-outline',
      chat_message:     'chatbubble-outline',
      general:          'notifications',
    };
    return map[type] ?? 'notifications';
  }

  goBack(): void {
    const role = this.authService.currentUser?.role;
    this.router.navigate([role === 'admin' ? '/admin/home' : '/student/home']);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
