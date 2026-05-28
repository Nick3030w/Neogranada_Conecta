import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, chevronBackOutline, schoolOutline, flaskOutline, libraryOutline, desktopOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

export interface BlockSpace {
  name: string;
  type: 'Aula' | 'Laboratorio' | 'Biblioteca' | 'Sala de cómputo' | 'Otro';
  floor?: string;
  description?: string;
}

export interface BlockInfo {
  id: string;
  name: string;
  faculty: string;
  spaces: BlockSpace[];
}

// ── Datos estáticos de los bloques ────────────────────────────
const BLOCKS_DATA: Record<string, BlockInfo> = {
  A: {
    id: 'A',
    name: 'Bloque A',
    faculty: 'Facultad de Ingeniería',
    spaces: [
      { name: 'Aula 101', type: 'Aula', description: 'Aula de clases general' },
      { name: 'Aula 102', type: 'Aula', description: 'Aula de clases general' },
    ],
  },
  B: {
    id: 'B',
    name: 'Bloque B',
    faculty: 'Facultad de Ciencias Económicas',
    spaces: [
      { name: 'Aula especial V-A',  type: 'Aula', description: 'Aula especial piso V'  },
      { name: 'Aula especial V-B',  type: 'Aula', description: 'Aula especial piso V'  },
      { name: 'Aula especial IX-A', type: 'Aula', description: 'Aula especial piso IX' },
      { name: 'Aula especial IX-B', type: 'Aula', description: 'Aula especial piso IX' },
      { name: 'Aula especial X-A',  type: 'Aula', description: 'Aula especial piso X'  },
      { name: 'Aula especial X-B',  type: 'Aula', description: 'Aula especial piso X'  },
    ],
  },
  C: {
    id: 'C',
    name: 'Bloque C',
    faculty: 'Facultad de Derecho',
    spaces: [
      { name: 'Sala de sistemas 1',  type: 'Sala de cómputo', description: 'Sala de cómputo' },
      { name: 'Sala de sistemas 2',  type: 'Sala de cómputo', description: 'Sala de cómputo' },
      { name: 'Sala de sistemas 3',  type: 'Sala de cómputo', description: 'Sala de cómputo' },
      { name: 'Sala de sistemas 4',  type: 'Sala de cómputo', description: 'Sala de cómputo' },
      { name: 'Sala de sistemas 5',  type: 'Sala de cómputo', description: 'Sala de cómputo' },
      { name: 'Aula especial IX-A',  type: 'Aula',            description: 'Aula especial piso IX' },
      { name: 'Aula especial IX-B',  type: 'Aula',            description: 'Aula especial piso IX' },
      { name: 'Aula especial X-A',   type: 'Aula',            description: 'Aula especial piso X'  },
      { name: 'Aula especial X-B',   type: 'Aula',            description: 'Aula especial piso X'  },
    ],
  },
  D: {
    id: 'D',
    name: 'Bloque D',
    faculty: 'Facultad de Medicina',
    spaces: [
      { name: 'Aula especial IV-A',      type: 'Aula',        description: 'Aula especial piso IV'  },
      { name: 'Aula especial IV-B',      type: 'Aula',        description: 'Aula especial piso IV'  },
      { name: 'Aula especial IX-A',      type: 'Aula',        description: 'Aula especial piso IX'  },
      { name: 'Aula especial IX-B',      type: 'Aula',        description: 'Aula especial piso IX'  },
      { name: 'Aula especial X-A',       type: 'Aula',        description: 'Aula especial piso X'   },
      { name: 'Aula especial X-B',       type: 'Aula',        description: 'Aula especial piso X'   },
      { name: 'Laboratorio de Testeo I-II', type: 'Laboratorio', description: 'Laboratorio de testeo' },
    ],
  },
  E: {
    id: 'E',
    name: 'Bloque E',
    faculty: 'Facultad de Ciencias Básicas',
    spaces: [
      { name: 'AE-XI',  type: 'Aula', description: 'Aula especial XI'  },
      { name: 'AE-XII', type: 'Aula', description: 'Aula especial XII' },
    ],
  },
  F: {
    id: 'F',
    name: 'Bloque F',
    faculty: 'Facultad de Relaciones Internacionales',
    spaces: [
      { name: 'Laboratorio de Agregados y Concretos',          type: 'Laboratorio',    description: 'Laboratorio de materiales' },
      { name: 'Laboratorio de Pavimentos I',                   type: 'Laboratorio',    description: 'Laboratorio de pavimentos' },
      { name: 'Laboratorio de Pavimentos II',                  type: 'Laboratorio',    description: 'Laboratorio de pavimentos' },
      { name: 'Laboratorio de Topografía',                     type: 'Laboratorio',    description: 'Laboratorio de topografía' },
      { name: 'Laboratorio de Suelos',                         type: 'Laboratorio',    description: 'Laboratorio de suelos' },
      { name: 'Centro de Cómputo Lab. de Ingeniería I',        type: 'Sala de cómputo', description: 'Sala de cómputo ingeniería' },
      { name: 'Centro de Cómputo Lab. de Ingeniería II',       type: 'Sala de cómputo', description: 'Sala de cómputo ingeniería' },
      { name: 'Laboratorio de Electrónica I',                  type: 'Laboratorio',    description: 'Laboratorio de electrónica' },
      { name: 'Laboratorio de Electrónica II',                 type: 'Laboratorio',    description: 'Laboratorio de electrónica' },
      { name: 'Laboratorio de Fotogrametría y Fotointerpretación', type: 'Laboratorio', description: 'Laboratorio de fotogrametría' },
      { name: 'Laboratorio Calidad de Aguas',                  type: 'Laboratorio',    description: 'Laboratorio de aguas' },
      { name: 'Laboratorio Física Mecánica',                   type: 'Laboratorio',    description: 'Laboratorio de física' },
      { name: 'Laboratorio Calor y Ondas',                     type: 'Laboratorio',    description: 'Laboratorio de física' },
      { name: 'Laboratorio de Hidráulica',                     type: 'Laboratorio',    description: 'Laboratorio de hidráulica' },
      { name: 'Laboratorio Física Óptica y Acústica',          type: 'Laboratorio',    description: 'Laboratorio de física' },
      { name: 'Laboratorio Física Electricidad y Magnetismo',  type: 'Laboratorio',    description: 'Laboratorio de física' },
    ],
  },
};

@Component({
  selector: 'app-block-detail',
  templateUrl: './block-detail.page.html',
  styleUrls: ['./block-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class BlockDetailPage implements OnInit {
  block: BlockInfo | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {
    addIcons({ logOutOutline, chevronBackOutline, schoolOutline, flaskOutline, libraryOutline, desktopOutline });
  }

  ngOnInit(): void {
    const blockId = this.route.snapshot.paramMap.get('blockId') ?? '';
    this.block = BLOCKS_DATA[blockId.toUpperCase()] ?? null;
  }

  getTypeIcon(type: BlockSpace['type']): string {
    const map: Record<BlockSpace['type'], string> = {
      'Aula':           'school-outline',
      'Laboratorio':    'flask-outline',
      'Biblioteca':     'library-outline',
      'Sala de cómputo':'desktop-outline',
      'Otro':           'school-outline',
    };
    return map[type];
  }

  getTypeClass(type: BlockSpace['type']): string {
    const map: Record<BlockSpace['type'], string> = {
      'Aula':           'badge-aula',
      'Laboratorio':    'badge-lab',
      'Biblioteca':     'badge-bib',
      'Sala de cómputo':'badge-comp',
      'Otro':           'badge-otro',
    };
    return map[type];
  }

  goBack(): void    { this.router.navigate(['/student/map']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
