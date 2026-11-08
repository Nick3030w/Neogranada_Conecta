import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonIcon, IonSpinner,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, sparklesOutline, chatbubblesOutline, trashOutline,
  chevronForwardOutline, addOutline,
} from 'ionicons/icons';
import { Observable } from 'rxjs';
import { ChatbotHistoryService } from '../../../core/services/chatbot-history.service';
import { ChatbotConversation } from '../../../core/interfaces/chatbot.interface';

/**
 * Historial de conversaciones con NeoBot.
 *
 * Lista las charlas guardadas del estudiante (más reciente primero). Al tocar
 * una se reabre en el chatbot vía `?id=`, para consultarla o continuarla.
 */
@Component({
  selector: 'app-chatbot-history',
  templateUrl: './chatbot-history.page.html',
  styleUrls: ['./chatbot-history.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonIcon, IonSpinner,
  ],
})
export class ChatbotHistoryPage {
  /** Conversaciones del estudiante en tiempo real. */
  readonly conversations$: Observable<ChatbotConversation[]>;

  private readonly router = inject(Router);
  private readonly historyService = inject(ChatbotHistoryService);
  private readonly alertCtrl = inject(AlertController);

  constructor() {
    addIcons({
      arrowBackOutline, sparklesOutline, chatbubblesOutline, trashOutline,
      chevronForwardOutline, addOutline,
    });
    this.conversations$ = this.historyService.getMyConversations();
  }

  /** Vista previa: la última cosa que dijo el bot, o el primer mensaje. */
  preview(conversation: ChatbotConversation): string {
    const last = conversation.messages[conversation.messages.length - 1];
    return last?.text ?? '';
  }

  /** Abre una conversación guardada en el chatbot. */
  open(conversation: ChatbotConversation): void {
    this.router.navigate(['/student/chatbot'], { queryParams: { id: conversation.id } });
  }

  /** Inicia una conversación nueva. */
  startNew(): void {
    this.router.navigate(['/student/chatbot']);
  }

  /** Pide confirmación y borra una conversación. */
  async confirmDelete(conversation: ChatbotConversation, event: Event): Promise<void> {
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: 'Eliminar conversación',
      message: '¿Seguro que quieres eliminar esta conversación? No se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.historyService.deleteConversation(conversation.id);
          },
        },
      ],
    });

    await alert.present();
  }

  goBack(): void {
    this.router.navigate(['/student/chatbot']);
  }
}
