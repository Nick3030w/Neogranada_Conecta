import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonToggle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, construct } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonToggle],
})
export class SettingsPage implements OnInit {
  notificationsMuted = false;
  darkMode = false;
  loading = false;

  constructor(private router: Router, private authService: AuthService) {
    addIcons({ logOutOutline, construct });
  }

  ngOnInit(): void {
    const user = this.authService.currentUser;
    this.notificationsMuted = user?.notificationsMuted ?? false;
    this.darkMode = user?.darkMode ?? false;
  }

  async toggleNotifications(event: CustomEvent): Promise<void> {
    this.notificationsMuted = event.detail.checked;
    const user = this.authService.currentUser;
    if (user) await this.authService.updateProfile(user.uid, { notificationsMuted: this.notificationsMuted });
  }

  goToProfile(): void {
    const role = this.authService.currentUser?.role;
    this.router.navigate([role === 'admin' ? '/admin/profile' : '/student/profile']);
  }

  async changePassword(): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;
    this.loading = true;
    try {
      await this.authService.sendPasswordReset(user.email);
      alert('Revisa tu correo para cambiar tu contraseña.');
    } catch { /* ignore */ } finally { this.loading = false; }
  }

  async logout(): Promise<void> { await this.authService.logout(); }

  goBack(): void {
    const role = this.authService.currentUser?.role;
    this.router.navigate([role === 'admin' ? '/admin/home' : '/student/home']);
  }
}
