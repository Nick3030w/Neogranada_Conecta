import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendar, construct, checkmarkCircle,
  personCircle, notifications, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { ResourceService } from '../../../core/services/resource.service';
import { UserProfile } from '../../../core/interfaces/user.interface';

@Component({
  selector: 'app-admin-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class AdminHomePage implements OnInit {
  user: UserProfile | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private resourceService: ResourceService,
  ) {
    addIcons({notifications,logOutOutline,calendar,construct,checkmarkCircle,personCircle});
  }

  ngOnInit(): void {
    this.user = this.authService.currentUser;
    // Inicializa la colección 'resources' si aún no existe.
    // Solo el admin tiene permisos de escritura sobre esa colección.
    this.resourceService.seedIfEmpty().catch(err =>
      console.error('Error al inicializar recursos:', err)
    );
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  goToNotifications(): void {
    this.router.navigate(['/admin/notifications']);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
