import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonIcon, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, chatbubbleOutline, checkmarkCircleOutline,
  closeOutline, checkmarkOutline, timeOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Booking } from '../../../core/interfaces/booking.interface';

@Component({
  selector: 'app-admin-confirmation',
  templateUrl: './confirmation.page.html',
  styleUrls: ['./confirmation.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSpinner],
})
export class AdminConfirmationPage implements OnInit, OnDestroy {

  pendingBookings: Booking[] = [];
  loading = true;

  // ── Modal de denegación ───────────────────────────────────────
  showDenyModal   = false;
  denyReason      = '';
  denyReasonError = '';
  bookingToDeny: Booking | null = null;

  // ── Estado de procesamiento por booking ───────────────────────
  processingId: string | null = null;

  private bookingSub?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private bookingService: BookingService,
    private notificationService: NotificationService,
  ) {
    addIcons({
      logOutOutline, chatbubbleOutline, checkmarkCircleOutline,
      closeOutline, checkmarkOutline, timeOutline,
    });
  }

  ngOnInit(): void {
    // Escucha en tiempo real los bookings pendientes.
    // Cuando un estudiante crea una solicitud, aparece aquí al instante.
    this.bookingSub = this.bookingService.getPending().subscribe(bookings => {
      this.pendingBookings = bookings;
      this.loading         = false;
    });
  }

  ngOnDestroy(): void {
    this.bookingSub?.unsubscribe();
  }

  // ── Aprobar ───────────────────────────────────────────────────

  async approve(booking: Booking): Promise<void> {
    if (this.processingId) return;
    this.processingId = booking.id;

    try {
      // 1. Actualiza el estado en Firestore
      await this.bookingService.approve(booking.id);

      // 2. Crea la notificación para el estudiante
      await this.notificationService.notifyBookingApproved({
        id:           booking.id,
        studentId:    booking.studentId,
        resourceName: booking.resourceName,
        date:         booking.date,
        time:         booking.time,
      });

      // La lista se actualiza sola por el listener en tiempo real
    } catch (err) {
      console.error('Error al aprobar booking:', err);
    } finally {
      this.processingId = null;
    }
  }

  // ── Denegar — abre modal ──────────────────────────────────────

  openDenyModal(booking: Booking): void {
    this.bookingToDeny  = booking;
    this.denyReason     = '';
    this.denyReasonError = '';
    this.showDenyModal  = true;
  }

  closeDenyModal(): void {
    this.showDenyModal  = false;
    this.bookingToDeny  = null;
    this.denyReason     = '';
    this.denyReasonError = '';
  }

  async confirmDeny(): Promise<void> {
    if (!this.bookingToDeny) return;

    if (!this.denyReason.trim()) {
      this.denyReasonError = 'El motivo es obligatorio.';
      return;
    }

    if (this.processingId) return;
    this.processingId = this.bookingToDeny.id;

    // Captura los datos antes de cerrar el modal
    const booking = this.bookingToDeny;
    const reason  = this.denyReason.trim();

    this.closeDenyModal();

    try {
      // 1. Actualiza el estado en Firestore
      await this.bookingService.deny(booking.id, reason);

      // 2. Crea la notificación para el estudiante
      await this.notificationService.notifyBookingDenied(
        {
          id:           booking.id,
          studentId:    booking.studentId,
          resourceName: booking.resourceName,
        },
        reason,
      );

    } catch (err) {
      console.error('Error al denegar booking:', err);
    } finally {
      this.processingId = null;
    }
  }

  // ── Navegación ────────────────────────────────────────────────

  openChat(bookingId: string): void {
    this.router.navigate(['/admin/chat', bookingId]);
  }

  goBack(): void    { this.router.navigate(['/admin/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
