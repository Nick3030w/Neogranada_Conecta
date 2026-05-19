import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonIcon, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, logOutOutline, checkmarkOutline, closeOutline, chatbubblesOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { Booking } from '../../../core/interfaces/booking.interface';

@Component({
  selector: 'app-admin-confirmation',
  templateUrl: './confirmation.page.html',
  styleUrls: ['./confirmation.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonIcon, IonButton, IonSpinner],
})
export class AdminConfirmationPage {
  // Datos de ejemplo — se reemplazarán con Firestore
  pendingBookings: Booking[] = [
    {
      id: '0001', studentId: 'uid1', studentName: 'Juan Pérez',
      resourceId: 'lab1', resourceName: 'Laboratorio de Química',
      resourceCategory: 'laboratorio', date: '2026-05-20', time: '10:00',
      service: 'Laboratorio', observations: 'Práctica de química orgánica',
      status: 'pendiente', createdAt: new Date(), updatedAt: new Date(),
    },
  ];

  constructor(private router: Router, private authService: AuthService) {
    addIcons({logOutOutline,chatbubblesOutline,checkmarkCircleOutline,arrowBackOutline,checkmarkOutline,closeOutline});
  }

  approve(booking: Booking): void {
    booking.status = 'aprobada';
    // TODO: actualizar en Firestore y notificar al estudiante
  }

  deny(booking: Booking): void {
    const reason = prompt('Motivo de denegación (requerido):');
    if (!reason?.trim()) { alert('Debes ingresar un motivo para denegar la solicitud.'); return; }
    booking.status = 'denegada';
    booking.denialReason = reason;
    // TODO: actualizar en Firestore y notificar al estudiante
  }

  openChat(bookingId: string): void { this.router.navigate(['/admin/chat', bookingId]); }
  goBack(): void { this.router.navigate(['/admin/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
