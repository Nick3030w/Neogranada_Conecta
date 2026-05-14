import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { ResourceCategory } from '../../../core/interfaces/resource.interface';

interface CatalogCategory {
  id: ResourceCategory;
  label: string;
  icon: string;
  imageUrl: string;
}

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.page.html',
  styleUrls: ['./catalog.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonIcon, IonSpinner],
})
export class CatalogPage {
  categories: CatalogCategory[] = [
    { id: 'laboratorio',        label: 'Laboratorios',          icon: '🔬', imageUrl: 'assets/images/cat-lab.jpg' },
    { id: 'aula',               label: 'Aulas',                 icon: '🏫', imageUrl: 'assets/images/cat-aula.jpg' },
    { id: 'botiquin',           label: 'Botiquín',              icon: '🩺', imageUrl: 'assets/images/cat-botiquin.jpg' },
    { id: 'elementos_deportivos', label: 'Elementos deportivos', icon: '⚽', imageUrl: 'assets/images/cat-deportes.jpg' },
    { id: 'base_datos',         label: 'Base de datos',         icon: '💾', imageUrl: 'assets/images/cat-bd.jpg' },
    { id: 'material_ludico',    label: 'Material lúdico',       icon: '🎲', imageUrl: 'assets/images/cat-ludico.jpg' },
  ];

  constructor(private router: Router, private authService: AuthService) {
    addIcons({ arrowBackOutline, logOutOutline });
  }

  goBack(): void { this.router.navigate(['/student/home']); }

  selectCategory(categoryId: ResourceCategory): void {
    this.router.navigate(['/student/availability', categoryId]);
  }

  async logout(): Promise<void> { await this.authService.logout(); }
}
