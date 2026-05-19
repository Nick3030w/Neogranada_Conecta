import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonIcon],
})
export class StudentCalendarPage {
  currentDate = new Date();
  activeBookingsCount = 0;
  bookedDays: number[] = [];

  readonly dayHeaders = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  constructor(private router: Router, private authService: AuthService) {
    addIcons({ logOutOutline, chevronBackOutline, chevronForwardOutline });
  }

  get monthName(): string {
    return this.currentDate.toLocaleDateString('es-CO', { month: 'long' });
  }

  get currentYear(): number {
    return this.currentDate.getFullYear();
  }

  get calendarDays(): (number | null)[] {
    const year  = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    const now = new Date();
    return day === now.getDate()
      && this.currentDate.getMonth()    === now.getMonth()
      && this.currentDate.getFullYear() === now.getFullYear();
  }

  hasBooking(day: number | null): boolean {
    return !!day && this.bookedDays.includes(day);
  }

  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
  }

  goBack(): void { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
