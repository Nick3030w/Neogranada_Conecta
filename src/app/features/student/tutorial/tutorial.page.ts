import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, thumbsUp, thumbsDown, playCircle } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.page.html',
  styleUrls: ['./tutorial.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class TutorialPage {
  liked: boolean | null = null;

  // ── Configura aquí el link de YouTube ──────────────────────
  // Reemplaza el valor por la URL real del video cuando esté disponible
  readonly youtubeUrl = 'https://www.youtube.com/watch?v=_ANeO-ppEKo';

  progressPercent = 0; 
  currentTime = '0:00';
  totalTime   = 'duracion_total';

  constructor(private router: Router, private authService: AuthService) {
    addIcons({ logOutOutline, thumbsUp, thumbsDown, playCircle });
  }

  /** Abre el video de YouTube en el navegador del dispositivo */
  openVideo(): void {
    window.open(this.youtubeUrl, '_blank');
  }

  rate(value: boolean): void {
    this.liked = this.liked === value ? null : value; // toggle
  }

  goBack(): void { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
