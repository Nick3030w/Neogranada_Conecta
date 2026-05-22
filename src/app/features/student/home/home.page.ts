import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  newspaper, film, calendar, construct,
  map, personCircle, notifications, logOutOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfile } from '../../../core/interfaces/user.interface';

@Component({
  selector: 'app-student-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class StudentHomePage implements OnInit {
  user: UserProfile | null = null;

  constructor(private authService: AuthService, private router: Router) {
    addIcons({ newspaper, film, calendar, construct, map, personCircle, notifications, logOutOutline });
  }

  ngOnInit(): void {
    this.user = this.authService.currentUser;
  }

  navigate(route: string): void { this.router.navigate([route]); }
  goToNotifications(): void     { this.router.navigate(['/student/notifications']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
