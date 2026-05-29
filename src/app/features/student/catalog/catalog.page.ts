import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, flaskOutline, schoolOutline, libraryOutline,
  barbellOutline, serverOutline, musicalNotesOutline, trendingUpOutline,
  chevronDownOutline, chevronUpOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { ResourceCategory } from '../../../core/interfaces/resource.interface';

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
export class CatalogPage {
  rankingOpen = false;
  categories: CatalogCategory[] = [
    {
      id: 'aula',
      label: 'Aulas',
      icon: 'school-outline',
      imageUrl: 'assets/images/cat-aula.jpg',
      showFallback: false,
    },
    {
      id: 'elementos_deportivos',
      label: 'Elementos deportivos',
      icon: 'barbell-outline',
      imageUrl: 'assets/images/cat-deportes.jpg',
      showFallback: false,
    },
    {
      id: 'laboratorio',
      label: 'Laboratorios',
      icon: 'flask-outline',
      imageUrl: 'assets/images/cat-lab.jpg',
      showFallback: false,
    },
    {
      id: 'biblioteca',
      label: 'Biblioteca',
      icon: 'library-outline',
      imageUrl: 'assets/images/cat-biblioteca.jpg',
      showFallback: false,
    },
    {
      id: 'base_datos',
      label: 'Base de datos',
      icon: 'server-outline',
      imageUrl: 'assets/images/cat-bd.jpg',
      showFallback: false,
    },
    {
      id: 'instrumentos_musicales',
      label: 'Instrumentos',
      icon: 'musical-notes-outline',
      imageUrl: 'assets/images/cat-musica.jpg',
      showFallback: false,
    },
  ];

  constructor(private router: Router, private authService: AuthService) {
    addIcons({logOutOutline, trendingUpOutline, chevronDownOutline, chevronUpOutline, flaskOutline, schoolOutline, libraryOutline, barbellOutline, serverOutline, musicalNotesOutline});
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
}
