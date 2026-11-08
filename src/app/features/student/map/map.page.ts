import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, searchOutline, business, arrowForwardCircle } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { CampusBlock } from '../../../core/interfaces/campus-block.interface';
import { BLOCKS_LIST } from '../../../core/data/campus-blocks.data';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class MapPage {
  searchQuery = '';

  /** Bloques del campus con su foto de portada (si la tienen). */
  blocks: CampusBlock[] = BLOCKS_LIST.map(b => ({
    id: b.id,
    name: b.name,
    description: '',
    imageUrl: b.coverImage,
  }));

  private router = inject(Router);
  private authService = inject(AuthService);

  constructor() {
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
    this.router.navigate(['/student/block', block.id]);
  }

  goBack(): void { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
