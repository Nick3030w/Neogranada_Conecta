import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, flaskOutline, schoolOutline, libraryOutline,
  barbellOutline, serverOutline, musicalNotesOutline, trendingUpOutline,
  chevronDownOutline, chevronUpOutline, star,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { CATEGORY_LABELS, ResourceCategory } from '../../../core/interfaces/resource.interface';
import { FavoriteCategory } from '../../../core/interfaces/user.interface';

interface CatalogCategory {
  id: ResourceCategory;
  label: string;
  icon: string;
  imageUrl: string;
  showFallback: boolean;
}

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.page.html',
  styleUrls: ['./catalog.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class CatalogPage implements OnInit, OnDestroy {
  rankingOpen = false;

  /** Categoría favorita del estudiante (preferencia de perfil) */
  favoriteCategory: FavoriteCategory = '';

  /**
   * Orden base del catálogo. Se mantiene estable para el panel
   * "Más demandados"; la rejilla usa `categories`, que además puede
   * anteponer la categoría favorita del estudiante.
   */
  readonly rankedCategories: CatalogCategory[] = [
    {
      id: 'aula',
      label: CATEGORY_LABELS['aula'],
      icon: 'school-outline',
      imageUrl: 'assets/images/cat-aula.jpg',
      showFallback: false,
    },
    {
      id: 'elementos_deportivos',
      label: CATEGORY_LABELS['elementos_deportivos'],
      icon: 'barbell-outline',
      imageUrl: 'assets/images/cat-deportes.jpg',
      showFallback: false,
    },
    {
      id: 'laboratorio',
      label: CATEGORY_LABELS['laboratorio'],
      icon: 'flask-outline',
      imageUrl: 'assets/images/cat-lab.jpg',
      showFallback: false,
    },
    {
      id: 'biblioteca',
      label: CATEGORY_LABELS['biblioteca'],
      icon: 'library-outline',
      imageUrl: 'assets/images/cat-biblioteca.jpg',
      showFallback: false,
    },
    {
      id: 'base_datos',
      label: CATEGORY_LABELS['base_datos'],
      icon: 'server-outline',
      imageUrl: 'assets/images/cat-bd.jpg',
      showFallback: false,
    },
    {
      id: 'instrumentos_musicales',
      label: CATEGORY_LABELS['instrumentos_musicales'],
      icon: 'musical-notes-outline',
      imageUrl: 'assets/images/cat-musica.jpg',
      showFallback: false,
    },
  ];

  /** Orden mostrado en la rejilla (favorita primero, si hay) */
  categories: CatalogCategory[] = [...this.rankedCategories];

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  private userSub?: Subscription;

  constructor() {
    addIcons({logOutOutline, trendingUpOutline, chevronDownOutline, chevronUpOutline, flaskOutline, schoolOutline, libraryOutline, barbellOutline, serverOutline, musicalNotesOutline, star});
  }

  ngOnInit(): void {
    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.favoriteCategory = user?.favoriteCategory ?? '';
      this.applyFavoriteOrder();
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  toggleRanking(): void { this.rankingOpen = !this.rankingOpen; }

  onImgError(event: Event, cat: CatalogCategory): void {
    (event.target as HTMLImageElement).style.display = 'none';
    cat.showFallback = true;
  }

  selectCategory(categoryId: ResourceCategory): void {
    this.router.navigate(['/student/availability', categoryId]);
  }

  goBack(): void { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }

  /**
   * Coloca la categoría favorita al inicio de la rejilla.
   * Reutiliza las mismas instancias para no perder el estado de `showFallback`.
   */
  private applyFavoriteOrder(): void {
    const fav = this.favoriteCategory;
    if (!fav) {
      this.categories = [...this.rankedCategories];
      return;
    }
    this.categories = [
      ...this.rankedCategories.filter(c => c.id === fav),
      ...this.rankedCategories.filter(c => c.id !== fav),
    ];
  }
}
