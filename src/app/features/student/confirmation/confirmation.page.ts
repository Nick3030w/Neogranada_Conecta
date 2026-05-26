import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, checkmarkOutline, closeOutline,
  chatbubbleOutline, timeOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/interfaces/booking.interface';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.page.html',
  styleUrls: ['./confirmation.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class ConfirmationPage implements OnInit, OnDestroy {
  bookingId = '';
  booking: Booking | null = null;
  loadingBooking = true;   // mientras carga por primera vez

  // 8 blades para el spinner personalizado
  readonly blades = Array(8).fill(0);

  private bookingSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private bookingService: BookingService,
  ) {
    addIcons({ logOutOutline, checkmarkOutline, closeOutline, chatbubbleOutline, timeOutline });
    this.bookingId = this.route.snapshot.paramMap.get('bookingId') ?? '';
  }

  ngOnInit(): void {
    if (!this.bookingId) { this.loadingBooking = false; return; }

    // Escucha en tiempo real: cuando el admin cambie el estado,
    // esta pantalla se actualiza automáticamente sin recargar.
    this.bookingSub = this.bookingService.getById(this.bookingId).subscribe(booking => {
      this.booking       = booking;
      this.loadingBooking = false;
    });
  }

  ngOnDestroy(): void {
    this.bookingSub?.unsubscribe();
  }

  /** Estado actual del booking, con fallback a 'pendiente' */
  get status(): 'pendiente' | 'aprobada' | 'denegada' | 'cancelada' {
    return this.booking?.status ?? 'pendiente';
  }

  goToChat(): void  { this.router.navigate(['/student/chat', this.bookingId]); }
  goHome(): void    { this.router.navigate(['/student/home']); }
  goBack(): void    { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
