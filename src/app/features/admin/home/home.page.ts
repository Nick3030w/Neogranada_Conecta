import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, settingsOutline, checkmarkCircleOutline, personOutline, notificationsOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfile } from '../../../core/interfaces/user.interface';

@Component({
  selector: 'app-admin-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonIcon],
})
export class AdminHomePage implements OnInit {
  user: UserProfile | null = null;

  menuItems = [
    { label: 'CALENDARIO',    icon: 'calendar-outline',          route: '/admin/calendar' },
    { label: 'CONFIGURACIÓN', icon: 'settings-outline',          route: '/admin/settings' },
    { label: 'CONFIRMACIÓN',  icon: 'checkmark-circle-outline',  route: '/admin/confirmation' },
    { label: 'PERFIL',        icon: 'person-outline',            route: '/admin/profile' },
  ];

  constructor(private authService: AuthService, private router: Router) {
    addIcons({ calendarOutline, settingsOutline, checkmarkCircleOutline, personOutline, notificationsOutline, logOutOutline });
  }

  ngOnInit(): void { this.user = this.authService.currentUser; }

  navigate(route: string): void { this.router.navigate([route]); }
  goToNotifications(): void { this.router.navigate(['/admin/notifications']); }
  async logout(): Promise<void> { await this.authService.logout(); }

  get firstName(): string { return this.user?.fullName?.split(' ')[0] ?? 'Administrador'; }
}
