import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonIcon, IonButton, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, logOutOutline, checkmarkCircleOutline, closeCircleOutline, chatbubblesOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.page.html',
  styleUrls: ['./confirmation.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonIcon, IonButton, IonSpinner],
})
export class ConfirmationPage {
  bookingId = '';
  status: 'pendiente' | 'aprobada' | 'denegada' = 'pendiente';

  constructor(private route: ActivatedRoute, private router: Router, private authService: AuthService) {
    addIcons({ arrowBackOutline, logOutOutline, checkmarkCircleOutline, closeCircleOutline, chatbubblesOutline });
    this.bookingId = this.route.snapshot.paramMap.get('bookingId') ?? '';
  }

  goToChat(): void { this.router.navigate(['/student/chat', this.bookingId]); }
  goHome(): void { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
