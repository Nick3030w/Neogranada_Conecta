import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  gridOutline, videocamOutline, calendarOutline, settingsOutline,
  mapOutline, personOutline, notificationsOutline, logOutOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfile } from '../../../core/interfaces/user.interface';

interface HomeMenuItem {
  label: string;
  icon: string;
  route: string;
  color?: string;
}

@Component({
  selector: 'app-student-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonIcon],
})
export class StudentHomePage implements OnInit {
  user: UserProfile | null = null;

  menuItems: HomeMenuItem[] = [
    { label: 'CATÁLOGO',        icon: 'grid-outline',        route: '/student/catalog' },
    { label: 'TUTORIAL',        icon: 'videocam-outline',    route: '/student/tutorial' },
    { label: 'CALENDARIO',      icon: 'calendar-outline',    route: '/student/calendar' },
    { label: 'CONFIGURACIÓN',   icon: 'settings-outline',    route: '/student/settings' },
    { label: 'MAPA',            icon: 'map-outline',         route: '/student/map' },
    { label: 'PERFIL',          icon: 'person-outline',      route: '/student/profile' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({
      gridOutline, videocamOutline, calendarOutline, settingsOutline,
      mapOutline, personOutline, notificationsOutline, logOutOutline,
    });
  }

  ngOnInit(): void {
    this.user = this.authService.currentUser;
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  goToNotifications(): void {
    this.router.navigate(['/student/notifications']);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  get firstName(): string {
    return this.user?.fullName?.split(' ')[0] ?? 'Estudiante';
  }
}
