import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, notifications, notificationsOffOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { AppNotification } from '../../../core/interfaces/notification.interface';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class NotificationsPage {
  // Datos de ejemplo — se reemplazarán con Firestore
  notifications: AppNotification[] = [
    { id: '1', userId: '', type: 'booking_approved', title: 'Solicitud aprobada',  body: 'Tu solicitud de laboratorio fue aprobada.',      read: false, createdAt: new Date() },
    { id: '2', userId: '', type: 'booking_pending',  title: 'Solicitud pendiente', body: 'Tu solicitud está siendo revisada.',              read: true,  createdAt: new Date() },
    { id: '3', userId: '', type: 'chat_message',     title: 'Nuevo mensaje',       body: 'El administrador te envió un mensaje.',           read: false, createdAt: new Date() },
    { id: '4', userId: '', type: 'booking_denied',   title: 'Solicitud denegada',  body: 'Tu solicitud fue rechazada.',                     read: true,  createdAt: new Date() },
    { id: '5', userId: '', type: 'general',          title: 'Recordatorio',        body: 'Tienes un préstamo activo que vence hoy.',        read: false, createdAt: new Date() },
    { id: '6', userId: '', type: 'general',          title: 'Bienvenido',          body: 'Bienvenido a NeoGranada Conecta.',                read: true,  createdAt: new Date() },
    { id: '7', userId: '', type: 'booking_approved', title: 'Préstamo confirmado', body: 'Tu préstamo de equipos fue confirmado.',          read: false, createdAt: new Date() },
    { id: '8', userId: '', type: 'chat_message',     title: 'Mensaje recibido',    body: 'Tienes un nuevo mensaje en tu solicitud #1234.',  read: true,  createdAt: new Date() },
  ];

  constructor(private router: Router, private authService: AuthService) {
    addIcons({ logOutOutline, notifications, notificationsOffOutline });
  }

  goBack(): void {
    const role = this.authService.currentUser?.role;
    this.router.navigate([role === 'admin' ? '/admin/home' : '/student/home']);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
