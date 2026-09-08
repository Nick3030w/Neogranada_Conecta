import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActionSheetController, IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, searchOutline, closeCircle, personOutline,
  chatbubbleEllipsesOutline, peopleOutline,
} from 'ionicons/icons';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { MIN_SEARCH_LENGTH, UserService } from '../../../core/services/user.service';
import {
  CONVERSATION_TOPICS,
  ConversationTopic,
  StudentContact,
} from '../../../core/interfaces/chat.interface';

/**
 * Directorio de estudiantes: buscador por nombre o código estudiantil.
 *
 * No hay solicitud de amistad: al elegir a alguien se pide el asunto
 * universitario de la conversación y se abre el chat directamente.
 */
@Component({
  selector: 'app-student-directory',
  templateUrl: './students.page.html',
  styleUrls: ['./students.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSpinner],
})
export class StudentDirectoryPage implements OnInit, OnDestroy {
  term = '';
  results: StudentContact[] = [];
  searching = false;
  /** true cuando ya se buscó al menos una vez con un término válido */
  searched = false;
  errorMessage = '';

  readonly minLength = MIN_SEARCH_LENGTH;

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly actionSheetCtrl = inject(ActionSheetController);

  private readonly term$ = new Subject<string>();
  private termSub?: Subscription;

  constructor() {
    addIcons({
      logOutOutline, searchOutline, closeCircle, personOutline,
      chatbubbleEllipsesOutline, peopleOutline,
    });
  }

  ngOnInit(): void {
    // Espera a que el usuario deje de escribir antes de consultar
    this.termSub = this.term$
      .pipe(debounceTime(280), distinctUntilChanged())
      .subscribe((term) => void this.runSearch(term));
  }

  ngOnDestroy(): void {
    this.termSub?.unsubscribe();
    this.term$.complete();
  }

  onTermChange(value: string): void {
    this.term = value;
    this.errorMessage = '';

    if (this.normalizedLength(value) < this.minLength) {
      this.results = [];
      this.searched = false;
      this.searching = false;
      return;
    }

    this.searching = true;
    this.term$.next(value);
  }

  clearSearch(): void {
    this.term = '';
    this.results = [];
    this.searched = false;
    this.searching = false;
    this.errorMessage = '';
  }

  /** Iniciales para el avatar cuando el estudiante no tiene foto. */
  initialsOf(student: StudentContact): string {
    const parts = (student.fullName ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    const first = parts[0].charAt(0);
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }

  /** Pregunta el asunto y abre el chat con el estudiante elegido. */
  async startChat(student: StudentContact): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: `Escribirle a ${student.fullName.split(' ')[0]}`,
      subHeader: '¿Sobre qué es la conversación?',
      buttons: [
        ...CONVERSATION_TOPICS.map((topic) => ({
          text: topic.label,
          icon: topic.icon,
          data: topic.id,
        })),
        { text: 'Cancelar', role: 'cancel' },
      ],
    });

    await sheet.present();
    const { data, role } = await sheet.onDidDismiss<ConversationTopic>();
    if (role === 'cancel' || !data) return;

    this.router.navigate(['/student/dm', student.uid], { queryParams: { topic: data } });
  }

  goBack(): void { this.router.navigate(['/student/chats']); }

  async logout(): Promise<void> { await this.authService.logout(); }

  // ── Internos ──────────────────────────────────────────────

  private async runSearch(term: string): Promise<void> {
    const myUid = this.authService.currentUser?.uid;

    try {
      this.results = await this.userService.searchStudents(term, myUid);
      this.searched = true;
    } catch {
      this.results = [];
      this.errorMessage = 'No se pudo consultar el directorio. Revisa tu conexión.';
    } finally {
      this.searching = false;
    }
  }

  private normalizedLength(value: string): number {
    return (value ?? '').trim().length;
  }
}
