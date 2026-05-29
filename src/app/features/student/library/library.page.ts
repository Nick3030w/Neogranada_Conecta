import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, searchOutline, chevronDownOutline,
  bookOutline, globeOutline, documentTextOutline, cardOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-library',
  templateUrl: './library.page.html',
  styleUrls: ['./library.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class LibraryPage {
  searchQuery    = '';
  catalogType    = 'Catálogo de biblioteca';
  libraryFilter  = 'Todas las bibliotecas';

  readonly fraseDelDia =
    '"En Egipto, a las bibliotecas se las llamaba el tesoro de los remedios del alma. ' +
    'En efecto, curábase en ellas de la ignorancia, la más peligrosa de las enfermedades ' +
    'y el origen de todas las demás."';

  readonly recursos = [
    {
      icon: 'globe-outline',
      title: 'Ingreso a Bases Virtuales y Libros Electrónicos',
      highlight: true,
    },
    {
      icon: 'search-outline',
      title: 'Descubridor',
      highlight: false,
    },
    {
      icon: 'document-text-outline',
      title: 'Repositorio UMNG',
      highlight: false,
    },
    {
      icon: 'card-outline',
      title: 'Pago de multas',
      highlight: false,
    },
  ];

  constructor(private router: Router, private authService: AuthService) {
    addIcons({
      logOutOutline, searchOutline, chevronDownOutline,
      bookOutline, globeOutline, documentTextOutline, cardOutline,
    });
  }

  // El buscador acepta texto pero no ejecuta ninguna acción real
  onSearch(): void { /* solo visual */ }

  goBack(): void { this.router.navigate(['/student/availability', 'biblioteca']); }
  goHome(): void { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
