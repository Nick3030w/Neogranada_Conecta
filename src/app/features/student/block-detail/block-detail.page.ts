import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, chevronBackOutline, schoolOutline, flaskOutline, libraryOutline,
  desktopOutline, musicalNotesOutline, barbellOutline, closeOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { BlockInfo, BlockSpace, BlockSpaceType } from '../../../core/interfaces/campus-block.interface';
import { BLOCKS_DATA } from '../../../core/data/campus-blocks.data';

@Component({
  selector: 'app-block-detail',
  templateUrl: './block-detail.page.html',
  styleUrls: ['./block-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class BlockDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  block: BlockInfo | null = null;

  /** Espacio cuya foto se muestra ampliada (null = visor cerrado). */
  previewSpace: BlockSpace | null = null;

  constructor() {
    addIcons({
      logOutOutline, chevronBackOutline, schoolOutline, flaskOutline, libraryOutline,
      desktopOutline, musicalNotesOutline, barbellOutline, closeOutline,
    });
  }

  ngOnInit(): void {
    const blockId = this.route.snapshot.paramMap.get('blockId') ?? '';
    this.block = BLOCKS_DATA[blockId.toUpperCase()] ?? null;
  }

  getTypeIcon(type: BlockSpaceType): string {
    const map: Record<BlockSpaceType, string> = {
      'Aula':                'school-outline',
      'Laboratorio':         'flask-outline',
      'Biblioteca':          'library-outline',
      'Sala de cómputo':     'desktop-outline',
      'Instrumento musical': 'musical-notes-outline',
      'Elemento deportivo':  'barbell-outline',
      'Otro':                'school-outline',
    };
    return map[type];
  }

  getTypeClass(type: BlockSpaceType): string {
    const map: Record<BlockSpaceType, string> = {
      'Aula':                'badge-aula',
      'Laboratorio':         'badge-lab',
      'Biblioteca':          'badge-bib',
      'Sala de cómputo':     'badge-comp',
      'Instrumento musical': 'badge-music',
      'Elemento deportivo':  'badge-sport',
      'Otro':                'badge-otro',
    };
    return map[type];
  }

  /** Abre el visor con la foto del espacio, si tiene. */
  openPreview(space: BlockSpace): void {
    if (space.imageUrl) this.previewSpace = space;
  }

  closePreview(): void { this.previewSpace = null; }

  goBack(): void    { this.router.navigate(['/student/map']); }
  goHome(): void    { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
