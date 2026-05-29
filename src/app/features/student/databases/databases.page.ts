import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, chevronDownOutline, serverOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

export interface DatabaseItem {
  name: string;
  logoUrl: string;
  showFallback: boolean;
  expanded: boolean;
  description: string;
}

@Component({
  selector: 'app-databases',
  templateUrl: './databases.page.html',
  styleUrls: ['./databases.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class DatabasesPage {

  databases: DatabaseItem[] = [
    {
      name: 'Access Science',
      logoUrl: 'assets/images/db-access-science.png',
      showFallback: false, expanded: false,
      description: 'Enciclopedia científica en línea con artículos, noticias y recursos multimedia sobre ciencia y tecnología.',
    },
    {
      name: 'Access Engineering',
      logoUrl: 'assets/images/db-access-engineering.png',
      showFallback: false, expanded: false,
      description: 'Biblioteca digital de ingeniería de McGraw-Hill con libros, normas y herramientas de cálculo.',
    },
    {
      name: 'AGORA',
      logoUrl: 'assets/images/db-agora.png',
      showFallback: false, expanded: false,
      description: 'Acceso a investigación en agricultura, alimentación y ciencias afines para países en desarrollo.',
    },
    {
      name: 'Agronet',
      logoUrl: 'assets/images/db-agronet.png',
      showFallback: false, expanded: false,
      description: 'Red de información y comunicación del sector agropecuario colombiano del Ministerio de Agricultura.',
    },
    {
      name: 'Ambientalex.info',
      logoUrl: 'assets/images/db-ambientalex.png',
      showFallback: false, expanded: false,
      description: 'Base de datos especializada en legislación y jurisprudencia ambiental de Colombia y Latinoamérica.',
    },
    {
      name: 'ARDI',
      logoUrl: 'assets/images/db-ardi.png',
      showFallback: false, expanded: false,
      description: 'Acceso a investigación para el desarrollo e innovación. Plataforma de WIPO con recursos científicos y tecnológicos.',
    },
    {
      name: 'ASCE',
      logoUrl: 'assets/images/db-asce.png',
      showFallback: false, expanded: false,
      description: 'American Society of Civil Engineers. Publicaciones técnicas y estándares de ingeniería civil.',
    },
    {
      name: 'Biblioteca Digital Mundial',
      logoUrl: 'assets/images/db-biblioteca-digital.png',
      showFallback: false, expanded: false,
      description: 'Colección de documentos históricos y culturales de todo el mundo en múltiples idiomas.',
    },
    {
      name: 'Cambridge University Press',
      logoUrl: 'assets/images/db-cambridge.png',
      showFallback: false, expanded: false,
      description: 'Publicaciones académicas de la Universidad de Cambridge en ciencias, humanidades y ciencias sociales.',
    },
    {
      name: 'Scopus',
      logoUrl: 'assets/images/db-scopus.png',
      showFallback: false, expanded: false,
      description: 'Base de datos de resúmenes y citas de literatura científica revisada por pares. La mayor base de datos de su tipo.',
    },
    {
      name: 'Digitalia English',
      logoUrl: 'assets/images/db-digitalia-english.png',
      showFallback: false, expanded: false,
      description: 'Colección de libros electrónicos académicos en inglés de editoriales iberoamericanas.',
    },
    {
      name: 'Digitalia Film Library',
      logoUrl: 'assets/images/db-digitalia-film.png',
      showFallback: false, expanded: false,
      description: 'Videoteca digital con documentales, películas y contenido audiovisual de carácter académico y cultural.',
    },
    {
      name: 'Digitalia Hispánica',
      logoUrl: 'assets/images/db-digitalia-hispanica.png',
      showFallback: false, expanded: false,
      description: 'Plataforma de libros electrónicos en español de editoriales académicas iberoamericanas.',
    },
    {
      name: 'Ebook Central – Proquest',
      logoUrl: 'assets/images/db-ebook-central.png',
      showFallback: false, expanded: false,
      description: 'Plataforma de libros electrónicos académicos de ProQuest con millones de títulos en todas las disciplinas.',
    },
    {
      name: 'eBooks 7-24',
      logoUrl: 'assets/images/db-ebooks-724.png',
      showFallback: false, expanded: false,
      description: 'Plataforma de libros electrónicos en español disponible las 24 horas con títulos de editoriales líderes.',
    },
    {
      name: 'EBSCO eBook Academic Collection',
      logoUrl: 'assets/images/db-ebsco-academic.png',
      showFallback: false, expanded: false,
      description: 'Colección de libros electrónicos académicos multidisciplinarios de EBSCO para educación superior.',
    },
    {
      name: 'EBSCO eBook Collection',
      logoUrl: 'assets/images/db-ebsco-collection.png',
      showFallback: false, expanded: false,
      description: 'Amplia colección de libros electrónicos de EBSCO en diversas áreas del conocimiento.',
    },
    {
      name: 'EBSCO Engineering Source',
      logoUrl: 'assets/images/db-ebsco-engineering.png',
      showFallback: false, expanded: false,
      description: 'Base de datos especializada en ingeniería con revistas, normas técnicas y publicaciones del sector.',
    },
  ];

  constructor(private router: Router, private authService: AuthService) {
    addIcons({ logOutOutline, chevronDownOutline, serverOutline });
  }

  onImgError(event: Event, db: DatabaseItem): void {
    (event.target as HTMLImageElement).style.display = 'none';
    db.showFallback = true;
  }

  toggleExpand(db: DatabaseItem): void {
    db.expanded = !db.expanded;
  }

  goBack(): void { this.router.navigate(['/student/availability', 'base_datos']); }
  goHome(): void { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
