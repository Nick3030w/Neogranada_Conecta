import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class StudentCalendarPage {
  currentDate = new Date();
  activeBookingsCount = 0;  // préstamos vigentes del estudiante
  bookedDays: number[] = [];

  readonly dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  readonly monthOptions = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  get yearOptions(): number[] {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - 1 + i);
  }

  constructor(private router: Router, private authService: AuthService) {
    addIcons({ logOutOutline, chevronBackOutline, chevronForwardOutline });
  }

  get calendarDays(): (number | null)[] {
    const year            = this.currentDate.getFullYear();
    const month           = this.currentDate.getMonth();
    const firstDay        = new Date(year, month, 1).getDay();
    const daysInMonth     = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(-(daysInPrevMonth - i));
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push(-(100 + i));
      }
    }
    return days;
  }

  isOtherMonth(day: number | null): boolean {
    return day !== null && day <= 0;
  }

  displayDay(day: number | null): number | null {
    if (day === null) return null;
    if (day > 0)    return day;
    if (day > -100) return -day;
    return day + 100;
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
  }

  nextMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1, 1
    );
  }

  onMonthChange(event: Event): void {
    const month = parseInt((event.target as HTMLSelectElement).value, 10);
    this.currentDate = new Date(this.currentDate.getFullYear(), month, 1);
  }

  onYearChange(event: Event): void {
    const year = parseInt((event.target as HTMLSelectElement).value, 10);
    this.currentDate = new Date(year, this.currentDate.getMonth(), 1);
  }

  goBack(): void { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
