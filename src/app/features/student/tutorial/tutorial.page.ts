import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, thumbsUp, thumbsDown } from 'ionicons/icons';
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

  /**
   * Para cambiar el video basta con reemplazar el ID de YouTube.
   * El ID es la parte después de "v=" en la URL.
   * Ejemplo: https://www.youtube.com/watch?v=XXXXXXXXXXX → ID = XXXXXXXXXXX
   *
   * También puedes poner la URL completa de embed directamente:
   * https://www.youtube.com/embed/XXXXXXXXXXX
   */
  private readonly youtubeId = '_ANeO-ppEKo';

  /** URL segura para el iframe — Angular requiere sanitizarla */
  readonly videoUrl: SafeResourceUrl;

  constructor(
    private router: Router,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
  ) {
    addIcons({ logOutOutline, thumbsUp, thumbsDown });

    // Construye la URL de embed con parámetros:
    // rel=0      → no muestra videos relacionados al terminar
    // modestbranding=1 → reduce el logo de YouTube
    // playsinline=1    → reproduce dentro del iframe en iOS (no pantalla completa forzada)
    const embedUrl = `https://www.youtube.com/embed/${this.youtubeId}?rel=0&modestbranding=1&playsinline=1`;
    this.videoUrl  = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  rate(value: boolean): void {
    this.liked = this.liked === value ? null : value;
  }

  goBack(): void { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
