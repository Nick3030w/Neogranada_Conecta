import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/interfaces/booking.interface';

@Component({
  selector: 'app-admin-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class AdminCalendarPage implements OnInit, OnDestroy {
  currentDate = new Date();
  totalBookings = 0;
  bookedDays: number[] = [];

  /** Todos los préstamos vigentes (pendiente | aprobada) de todos los estudiantes */
  private allActiveBookings: Booking[] = [];
  private bookingSub?: Subscription;

  readonly dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  readonly monthOptions = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  get yearOptions(): number[] {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - 1 + i);
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    private bookingService: BookingService,
  ) {
    addIcons({ logOutOutline, chevronBackOutline, chevronForwardOutline });
  }

  ngOnInit(): void {
    this.bookingSub = this.bookingService.getAll().subscribe(bookings => {
      // Préstamos totales = solo los aprobados
      this.allActiveBookings = bookings.filter(
        b => b.status === 'aprobada'
      );
      this.totalBookings = this.allActiveBookings.length;
      this.refreshBookedDays();
    });
  }

  ngOnDestroy(): void {
    this.bookingSub?.unsubscribe();
  }

  /** Recalcula qué días del mes visible tienen al menos un préstamo vigente */
  private refreshBookedDays(): void {
    const year  = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const days = this.allActiveBookings
      .filter(b => {
        const d = new Date(b.date + 'T00:00:00');
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map(b => new Date(b.date + 'T00:00:00').getDate());

    // Eliminar duplicados (varios préstamos en el mismo día)
    this.bookedDays = [...new Set(days)];
  }

  get calendarDays(): (number | null)[] {
    const year      = this.currentDate.getFullYear();
    const month     = this.currentDate.getMonth();
    const firstDay  = new Date(year, month, 1).getDay();       // 0=Sun
    const daysInMonth     = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: (number | null)[] = [];

    // Días del mes anterior para completar la primera fila
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(-(daysInPrevMonth - i)); // negativo = mes anterior
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    // Días del mes siguiente para completar la última fila
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push(-(100 + i)); // negativo especial = mes siguiente
      }
    }

    return days;
  }

  isOtherMonth(day: number | null): boolean {
    return day !== null && day <= 0;
  }

  // Devuelve el número visible para días de otros meses
  displayDay(day: number | null): number | null {
    if (day === null) return null;
    if (day > 0) return day;
    if (day > -100) return -day; // mes anterior
    return day + 100;            // mes siguiente
  }

  isToday(day: number | null): boolean {
    if (!day || day <= 0) return false;
    const now = new Date();
    return day === now.getDate()
      && this.currentDate.getMonth()    === now.getMonth()
      && this.currentDate.getFullYear() === now.getFullYear();
  }

  hasBooking(day: number | null): boolean {
    return !!day && day > 0 && this.bookedDays.includes(day);
  }

  prevMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1, 1
    );
    this.refreshBookedDays();
  }

  nextMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1, 1
    );
    this.refreshBookedDays();
  }

  onMonthChange(event: Event): void {
    const month = parseInt((event.target as HTMLSelectElement).value, 10);
    this.currentDate = new Date(this.currentDate.getFullYear(), month, 1);
    this.refreshBookedDays();
  }

  onYearChange(event: Event): void {
    const year = parseInt((event.target as HTMLSelectElement).value, 10);
    this.currentDate = new Date(year, this.currentDate.getMonth(), 1);
    this.refreshBookedDays();
  }

  goBack(): void { this.router.navigate(['/admin/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
