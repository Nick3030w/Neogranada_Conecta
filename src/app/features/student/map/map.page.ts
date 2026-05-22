import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, searchOutline, business, arrowForwardCircle } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { CampusBlock } from '../../../core/interfaces/campus-block.interface';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class MapPage {
  searchQuery = '';

  blocks: CampusBlock[] = [
    { id: 'A', name: 'Bloque A', description: 'Facultad de Ingeniería' },
    { id: 'B', name: 'Bloque B', description: 'Facultad de Ciencias Económicas' },
    { id: 'C', name: 'Bloque C', description: 'Facultad de Derecho' },
    { id: 'D', name: 'Bloque D', description: 'Laboratorios y Talleres' },
    { id: 'E', name: 'Bloque E', description: 'Biblioteca y Recursos Académicos' },
    { id: 'F', name: 'Bloque F', description: 'Bienestar Universitario' },
  ];

  constructor(private router: Router, private authService: AuthService) {
    addIcons({ logOutOutline, searchOutline, business, arrowForwardCircle });
  }

  get filteredBlocks(): CampusBlock[] {
    if (!this.searchQuery.trim()) return this.blocks;
    const q = this.searchQuery.toLowerCase();
    return this.blocks.filter(
      (b) => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q)
    );
  }

  selectBlock(block: CampusBlock): void {
    // TODO: navegar al detalle del bloque o abrir mapa
    console.log('Bloque seleccionado:', block.name);
  }

  goBack(): void { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
