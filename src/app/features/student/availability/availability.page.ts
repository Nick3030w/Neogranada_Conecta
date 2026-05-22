import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, flaskOutline, schoolOutline, libraryOutline,
  barbellOutline, serverOutline, musicalNotesOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

// Mapas idénticos a catalog.page.ts para mantener consistencia visual
const IMAGE_MAP: Record<string, string> = {
  laboratorio:             'assets/images/cat-lab.jpg',
  aula:                    'assets/images/cat-aula.jpg',
  biblioteca:              'assets/images/cat-biblioteca.jpg',
  elementos_deportivos:    'assets/images/cat-deportes.jpg',
  base_datos:              'assets/images/cat-bd.jpg',
  instrumentos_musicales:  'assets/images/cat-musica.jpg',
  material_ludico:         'assets/images/cat-ludico.jpg',
  botiquin:                'assets/images/cat-botiquin.jpg',
};

const ICON_MAP: Record<string, string> = {
  laboratorio:             'flask-outline',
  aula:                    'school-outline',
  biblioteca:              'library-outline',
  elementos_deportivos:    'barbell-outline',
  base_datos:              'server-outline',
  instrumentos_musicales:  'musical-notes-outline',
  material_ludico:         'game-controller-outline',
  botiquin:                'medkit-outline',
};

@Component({
  selector: 'app-availability',
  templateUrl: './availability.page.html',
  styleUrls: ['./availability.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class AvailabilityPage {
  resourceId   = '';
  isAvailable  = true;   // TODO: consultar estado real desde Firestore
  showFallback = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    addIcons({
      logOutOutline, flaskOutline, schoolOutline, libraryOutline,
      barbellOutline, serverOutline, musicalNotesOutline,
    });
    this.resourceId = this.route.snapshot.paramMap.get('resourceId') ?? '';
  }

  get categoryImageUrl(): string {
    return IMAGE_MAP[this.resourceId] ?? 'assets/images/logo-umng.png';
  }

  get categoryIcon(): string {
    return ICON_MAP[this.resourceId] ?? 'cube-outline';
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
    this.showFallback = true;
  }

  goBack(): void     { this.router.navigate(['/student/catalog']); }
  goToBooking(): void { this.router.navigate(['/student/booking', this.resourceId]); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
