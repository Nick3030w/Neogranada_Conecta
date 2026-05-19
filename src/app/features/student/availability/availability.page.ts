import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-availability',
  templateUrl: './availability.page.html',
  styleUrls: ['./availability.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonIcon],
})
export class AvailabilityPage {
  resourceId = '';

  private emojiMap: Record<string, string> = {
    laboratorio:          '🔬',
    aula:                 '🏫',
    botiquin:             '🩺',
    elementos_deportivos: '⚽',
    base_datos:           '💾',
    material_ludico:      '🎲',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    addIcons({ logOutOutline, checkmarkCircleOutline });
    this.resourceId = this.route.snapshot.paramMap.get('resourceId') ?? '';
  }

  getCategoryEmoji(): string {
    return this.emojiMap[this.resourceId] ?? '📦';
  }

  goBack(): void { this.router.navigate(['/student/catalog']); }
  goToBooking(): void { this.router.navigate(['/student/booking', this.resourceId]); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
