import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { ResourceCategory } from '../../../core/interfaces/resource.interface';

interface CatalogCategory {
  id: ResourceCategory;
  label: string;
  emoji: string;
  imageUrl: string;
}

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.page.html',
  styleUrls: ['./catalog.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonIcon],
})
export class CatalogPage {
  categories: CatalogCategory[] = [
    { id: 'laboratorio',          label: 'Laboratorios',          emoji: '🔬', imageUrl: 'assets/images/cat-lab.jpg' },
    { id: 'aula',                 label: 'Aulas',                 emoji: '🏫', imageUrl: 'assets/images/cat-aula.jpg' },
    { id: 'botiquin',             label: 'Botiquín',              emoji: '🩺', imageUrl: 'assets/images/cat-botiquin.jpg' },
    { id: 'elementos_deportivos', label: 'Elementos deportivos',  emoji: '⚽', imageUrl: 'assets/images/cat-deportes.jpg' },
    { id: 'base_datos',           label: 'Base de datos',         emoji: '💾', imageUrl: 'assets/images/cat-bd.jpg' },
    { id: 'material_ludico',      label: 'Material lúdico',       emoji: '🎲', imageUrl: 'assets/images/cat-ludico.jpg' },
  ];

  constructor(private router: Router, private authService: AuthService) {
    addIcons({ logOutOutline });
  }

  selectCategory(categoryId: ResourceCategory): void {
    this.router.navigate(['/student/availability', categoryId]);
  }

  goBack(): void { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
