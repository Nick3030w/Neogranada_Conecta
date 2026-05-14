import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, logOutOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonIcon],
})
export class AdminCalendarPage {
  currentDate = new Date();
  totalBookings = 0;

  get monthYear(): string { return this.currentDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }); }

  get calendarDays(): (number | null)[] {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }

  constructor(private router: Router, private authService: AuthService) {
    addIcons({ arrowBackOutline, logOutOutline, chevronBackOutline, chevronForwardOutline });
  }

  prevMonth(): void { this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1); }
  nextMonth(): void { this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1); }
  goBack(): void { this.router.navigate(['/admin/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
