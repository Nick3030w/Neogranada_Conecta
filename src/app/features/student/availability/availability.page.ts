import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, flaskOutline, schoolOutline, libraryOutline,
  barbellOutline, serverOutline, musicalNotesOutline,
  informationCircleOutline, calendarOutline, closeCircleOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ResourceService } from '../../../core/services/resource.service';
import { ResourceCategory, isBookableCategory } from '../../../core/interfaces/resource.interface';

// ── Mapas visuales (idénticos a catalog.page.ts) ──────────────
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

// Texto informativo para categorías no reservables
const INFO_TEXT: Partial<Record<string, string>> = {
  biblioteca:  'La biblioteca está disponible para todos los estudiantes en horario de lunes a viernes de 7:00 a.m. a 9:00 p.m. y sábados de 8:00 a.m. a 5:00 p.m. No requiere reserva previa.',
  base_datos:  'El acceso a las bases de datos académicas está habilitado para todos los estudiantes activos a través del portal institucional. Ingresa con tu correo @unimilitar.edu.co.',
};

@Component({
  selector: 'app-availability',
  templateUrl: './availability.page.html',
  styleUrls: ['./availability.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class AvailabilityPage implements OnInit, OnDestroy {
  categoryId   = '';
  showFallback = false;

  // ── Estado de carga ───────────────────────────────────────────
  loading = true;

  // ── Para categorías reservables ───────────────────────────────
  availableCount = 0;   // cuántos recursos disponibles hay en esta categoría

  private resourceSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private resourceService: ResourceService,
  ) {
    addIcons({logOutOutline,calendarOutline,closeCircleOutline,informationCircleOutline,flaskOutline,schoolOutline,libraryOutline,barbellOutline,serverOutline,musicalNotesOutline,});
    this.categoryId = this.route.snapshot.paramMap.get('resourceId') ?? '';
  }

  ngOnInit(): void {
    // Solo consultamos Firestore si la categoría tiene flujo de reserva
    if (this.isBookable) {
      this.resourceSub = this.resourceService
        .getAvailableByCategory(this.categoryId as ResourceCategory)
        .subscribe({
          next: resources => {
            this.availableCount = resources.length;
            this.loading        = false;
          },
          error: () => {
            this.availableCount = 0;
            this.loading        = false;
          },
        });
    } else {
      // Categorías informativas no necesitan consulta
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.resourceSub?.unsubscribe();
  }

  // ── Getters ───────────────────────────────────────────────────

  /** True si esta categoría tiene flujo de reserva con selector de recurso */
  get isBookable(): boolean {
    return isBookableCategory(this.categoryId);
  }

  /** True si hay al menos un recurso disponible en la categoría */
  get hasAvailable(): boolean {
    return this.availableCount > 0;
  }

  /** Texto informativo para categorías no reservables */
  get infoText(): string {
    return INFO_TEXT[this.categoryId] ?? 'Consulta en la dependencia correspondiente para más información.';
  }

  get categoryImageUrl(): string {
    return IMAGE_MAP[this.categoryId] ?? 'assets/images/logo-umng.png';
  }

  get categoryIcon(): string {
    return ICON_MAP[this.categoryId] ?? 'cube-outline';
  }

  // ── Acciones ──────────────────────────────────────────────────

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
    this.showFallback = true;
  }

  goToBooking(): void {
    if (!this.hasAvailable) return;
    this.router.navigate(['/student/booking', this.categoryId]);
  }

  goBack(): void { this.router.navigate(['/student/catalog']); }

  async logout(): Promise<void> { await this.authService.logout(); }
}
