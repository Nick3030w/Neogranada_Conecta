import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, checkmarkOutline, closeOutline, chatbubbleOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.page.html',
  styleUrls: ['./confirmation.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class ConfirmationPage {
  bookingId = '';
  status: 'pendiente' | 'aprobada' | 'denegada' = 'pendiente';

  // 8 blades para el spinner personalizado
  readonly blades = Array(8).fill(0);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    addIcons({ logOutOutline, checkmarkOutline, closeOutline, chatbubbleOutline });
    this.bookingId = this.route.snapshot.paramMap.get('bookingId') ?? '';
  }

  goToChat(): void  { this.router.navigate(['/student/chat', this.bookingId]); }
  goHome(): void    { this.router.navigate(['/student/home']); }
  goBack(): void    { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
