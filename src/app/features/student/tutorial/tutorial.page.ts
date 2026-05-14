import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, logOutOutline, thumbsUpOutline, thumbsDownOutline, playCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.page.html',
  styleUrls: ['./tutorial.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonIcon, IonButton],
})
export class TutorialPage {
  liked: boolean | null = null;
  constructor(private router: Router, private authService: AuthService) {
    addIcons({ arrowBackOutline, logOutOutline, thumbsUpOutline, thumbsDownOutline, playCircleOutline });
  }
  rate(value: boolean): void { this.liked = value; }
  goBack(): void { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
