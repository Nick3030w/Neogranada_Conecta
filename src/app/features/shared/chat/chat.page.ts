import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonIcon, IonFooter, IonInput, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sendOutline, logOutOutline, personOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';
import { StudentChatService } from '../../../core/services/student-chat.service';
import { UserService } from '../../../core/services/user.service';
import {
  ChatMessage,
  ConversationTopic,
  DEFAULT_CONVERSATION_TOPIC,
  StudentContact,
  conversationTopicIcon,
  conversationTopicLabel,
  isConversationTopic,
} from '../../../core/interfaces/chat.interface';

type ChatMode = 'booking' | 'direct';

/**
 * Pantalla de chat compartida. Atiende dos modos según la ruta:
 *  - booking: `/{rol}/chat/:bookingId`  — estudiante ↔ administración
 *  - direct:  `/student/dm/:peerId`     — estudiante ↔ estudiante
 *
 * En ambos casos los mensajes salen del mismo canal de ChatService; lo único
 * que cambia es cómo se resuelve el id del canal y qué muestra la cabecera.
 */
@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar,
    IonIcon, IonFooter, IonInput, IonSpinner,
  ],
})
export class ChatPage implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollAnchor') private scrollAnchor!: ElementRef<HTMLDivElement>;

  mode: ChatMode = 'booking';

  /** Id del hilo de mensajes: bookingId o conversationId */
  channelId = '';
  /** Solo en modo booking */
  bookingId = '';

  /** Solo en modo direct */
  peer: StudentContact | null = null;
  topic: ConversationTopic = DEFAULT_CONVERSATION_TOPIC;

  newMessage = '';
  messages: ChatMessage[] = [];
  sending = false;
  loading = true;
  errorMessage = '';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly chatService = inject(ChatService);
  private readonly studentChatService = inject(StudentChatService);
  private readonly userService = inject(UserService);

  private msgSub?: Subscription;
  private shouldScroll = false;

  constructor() {
    addIcons({ sendOutline, logOutOutline, personOutline });
  }

  ngOnInit(): void {
    const peerId = this.route.snapshot.paramMap.get('peerId');

    if (peerId) {
      this.mode = 'direct';
      void this.initDirect(peerId);
      return;
    }

    this.mode = 'booking';
    this.bookingId = this.route.snapshot.paramMap.get('bookingId') ?? '';
    this.channelId = this.bookingId;

    if (!this.channelId) {
      this.loading = false;
      this.errorMessage = 'No se encontró la conversación.';
      return;
    }

    this.listenMessages();
  }

  ngOnDestroy(): void {
    this.msgSub?.unsubscribe();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  get currentUser() { return this.authService.currentUser; }

  get isDirect(): boolean { return this.mode === 'direct'; }

  /** Título de la cabecera según el modo */
  get headerTitle(): string {
    if (this.isDirect) return this.peer?.fullName || 'Chat con estudiante';
    return `Chat — Solicitud #${this.bookingId.slice(0, 8).toUpperCase()}`;
  }

  get topicLabel(): string { return conversationTopicLabel(this.topic); }

  get topicIcon(): string { return conversationTopicIcon(this.topic); }

  /** Iniciales del otro estudiante, para el avatar sin foto */
  get peerInitials(): string {
    const parts = (this.peer?.fullName ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    const first = parts[0].charAt(0);
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }

  get emptyStateText(): string {
    return this.isDirect
      ? `Escríbele a ${this.peer?.fullName?.split(' ')[0] ?? 'tu compañero'} para empezar la conversación.`
      : 'Inicia la conversación con la dependencia.';
  }

  isOwn(msg: ChatMessage): boolean {
    return msg.senderId === this.currentUser?.uid;
  }

  async sendMessage(): Promise<void> {
    const text = this.newMessage.trim();
    if (!text || this.sending || !this.currentUser || !this.channelId) return;

    this.sending = true;
    this.newMessage = '';

    try {
      if (this.isDirect) {
        await this.studentChatService.sendDirectMessage({
          conversationId: this.channelId,
          content: text,
          peerId: this.peer?.uid ?? '',
          topic: this.topic,
        });
      } else {
        await this.chatService.sendMessage({
          channelId: this.channelId,
          senderId: this.currentUser.uid,
          senderName: this.currentUser.fullName,
          content: text,
        });
      }
    } catch {
      // Restaura el texto para que no se pierda lo escrito
      this.newMessage = text;
      this.errorMessage = 'No se pudo enviar el mensaje. Revisa tu conexión.';
    } finally {
      this.sending = false;
    }
  }

  goBack(): void {
    if (this.isDirect) {
      this.router.navigate(['/student/chats']);
      return;
    }

    const role = this.currentUser?.role;
    if (role === 'admin') {
      this.router.navigate(['/admin/confirmation']);
    } else {
      this.router.navigate(['/student/confirmation', this.bookingId]);
    }
  }

  // ── Internos ──────────────────────────────────────────────

  /** Resuelve (o crea) la conversación directa con otro estudiante. */
  private async initDirect(peerId: string): Promise<void> {
    const topicParam = this.route.snapshot.queryParamMap.get('topic');
    if (isConversationTopic(topicParam)) this.topic = topicParam;

    try {
      const peer = await this.userService.getStudent(peerId);
      if (!peer) {
        this.loading = false;
        this.errorMessage = 'No encontramos a ese estudiante.';
        return;
      }

      this.peer = peer;
      this.channelId = await this.studentChatService.openConversation(peer, this.topic);
      this.listenMessages();
      await this.studentChatService.markAsRead(this.channelId);
    } catch {
      this.loading = false;
      this.errorMessage = 'No se pudo abrir la conversación. Intenta de nuevo.';
    }
  }

  private listenMessages(): void {
    this.msgSub = this.chatService.getMessages(this.channelId).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.loading = false;
        this.shouldScroll = true;

        // Al recibir mensajes con la pantalla abierta, quedan leídos
        if (this.isDirect && msgs.length > 0) {
          void this.studentChatService.markAsRead(this.channelId);
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No se pudieron cargar los mensajes.';
      },
    });
  }

  private scrollToBottom(): void {
    try {
      this.scrollAnchor?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch { /* noop */ }
  }
}
