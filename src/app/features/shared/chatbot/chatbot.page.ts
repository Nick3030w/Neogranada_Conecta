import {
  AfterViewChecked,
  Component,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonIcon, IonFooter, IonInput, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sendOutline, arrowBackOutline, sparklesOutline } from 'ionicons/icons';
import { ChatbotService } from '../../../core/services/chatbot.service';
import { ChatbotMessage } from '../../../core/interfaces/chatbot.interface';
import { FAQ_SUGGESTIONS } from './chatbot-faq';

/**
 * Asistente virtual (NeoBot) con FAQ integradas.
 *
 * Las preguntas frecuentes se muestran como chips dentro del propio chat:
 * al tocar uno se envía como pregunta, en lugar de tener una sección de FAQ
 * aparte. Las respuestas las genera la Cloud Function `askChatbot` (Gemini),
 * limitada al contexto de la aplicación.
 */
@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.page.html',
  styleUrls: ['./chatbot.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar,
    IonIcon, IonFooter, IonInput, IonSpinner,
  ],
})
export class ChatbotPage implements AfterViewChecked {
  @ViewChild('scrollAnchor') private scrollAnchor!: ElementRef<HTMLDivElement>;

  /** Sugerencias de FAQ clicables. */
  readonly faqSuggestions = FAQ_SUGGESTIONS;

  messages: ChatbotMessage[] = [];
  newMessage = '';
  sending = false;
  errorMessage = '';

  private readonly router = inject(Router);
  private readonly chatbotService = inject(ChatbotService);

  private shouldScroll = false;

  constructor() {
    addIcons({ sendOutline, arrowBackOutline, sparklesOutline });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  /** Mientras no hay mensajes, mostramos la bienvenida y las FAQ. */
  get showWelcome(): boolean {
    return this.messages.length === 0;
  }

  /** Envía el texto de un chip de FAQ como si el usuario lo hubiera escrito. */
  askSuggestion(question: string): void {
    if (this.sending) return;
    this.newMessage = question;
    void this.send();
  }

  async send(): Promise<void> {
    const text = this.newMessage.trim();
    if (!text || this.sending) return;

    this.errorMessage = '';
    this.newMessage = '';

    // Pinta de inmediato el mensaje del usuario y un placeholder del bot.
    this.messages.push({ role: 'user', text });
    const placeholder: ChatbotMessage = { role: 'model', text: '', pending: true };
    this.messages.push(placeholder);
    this.sending = true;
    this.shouldScroll = true;

    try {
      // Historial sin el placeholder pendiente que acabamos de agregar.
      const history = this.messages.filter((m) => m !== placeholder);
      const reply = await this.chatbotService.ask(text, history);

      placeholder.text = reply;
      placeholder.pending = false;
    } catch (err) {
      // Quita el placeholder y muestra el error debajo del input.
      this.messages = this.messages.filter((m) => m !== placeholder);
      this.errorMessage =
        (err as { message?: string })?.message ||
        'El asistente no está disponible por ahora. Intenta más tarde.';
    } finally {
      this.sending = false;
      this.shouldScroll = true;
    }
  }

  goBack(): void {
    this.router.navigate(['/student/home']);
  }

  private scrollToBottom(): void {
    try {
      this.scrollAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch { /* noop */ }
  }
}
