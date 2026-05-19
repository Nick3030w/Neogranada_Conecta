import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, logOutOutline, notificationsOutline, checkmarkCircleOutline, closeCircleOutline, timeOutline, chatbubblesOutline, notificationsOffOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { AppNotification } from '../../../core/interfaces/notification.interface';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonIcon],
})
export class NotificationsPage {
  // Datos de ejemplo — se reemplazarán con Firestore
  notifications: AppNotification[] = [
    { id: '1', userId: '', type: 'booking_approved', title: 'Solicitud aprobada', body: 'Tu solicitud de laboratorio fue aprobada.', read: false, createdAt: new Date() },
    { id: '2', userId: '', type: 'booking_pending',  title: 'Solicitud pendiente', body: 'Tu solicitud está siendo revisada.', read: true, createdAt: new Date(Date.now() - 3600000) },
    { id: '3', userId: '', type: 'chat_message',     title: 'Nuevo mensaje', body: 'El administrador te envió un mensaje.', read: false, createdAt: new Date(Date.now() - 7200000) },
  ];

  constructor(private router: Router, private authService: AuthService) {
    addIcons({logOutOutline,notificationsOffOutline,arrowBackOutline,notificationsOutline,checkmarkCircleOutline,closeCircleOutline,timeOutline,chatbubblesOutline});
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      booking_approved: 'checkmark-circle-outline',
      booking_denied:   'close-circle-outline',
      booking_pending:  'time-outline',
      chat_message:     'chatbubbles-outline',
      general:          'notifications-outline',
    };
    return icons[type] ?? 'notifications-outline';
  }

  getIconColor(type: string): string {
    const colors: Record<string, string> = {
      booking_approved: 'var(--nc-success)',
      booking_denied:   'var(--nc-danger)',
      booking_pending:  'var(--nc-warning)',
      chat_message:     'var(--nc-gold)',
      general:          'var(--nc-gold)',
    };
    return colors[type] ?? 'var(--nc-gold)';
  }

  goBack(): void {
    const role = this.authService.currentUser?.role;
    this.router.navigate([role === 'admin' ? '/admin/home' : '/student/home']);
  }

  async logout(): Promise<void> { await this.authService.logout(); }
}
