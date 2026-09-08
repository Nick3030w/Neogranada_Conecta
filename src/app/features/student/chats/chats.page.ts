import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, chatbubbleOutline, chatbubblesOutline,
  personAddOutline, peopleOutline, searchOutline, personOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { ChatService } from '../../../core/services/chat.service';
import { StudentChatService } from '../../../core/services/student-chat.service';
import { Booking } from '../../../core/interfaces/booking.interface';
import {
  ConversationParticipant,
  DirectConversation,
  conversationTopicIcon,
  conversationTopicLabel,
} from '../../../core/interfaces/chat.interface';

export interface ChatSummary {
  booking: Booking;
  unreadCount: number;
  lastMessage: string;
}

type ChatsTab = 'bookings' | 'students';

@Component({
  selector: 'app-student-chats',
  templateUrl: './chats.page.html',
  styleUrls: ['./chats.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class StudentChatsPage implements OnInit, OnDestroy {
  tab: ChatsTab = 'bookings';

  // ── Chats de solicitudes ──
  chatSummaries: ChatSummary[] = [];
  loading = true;

  // ── Chats directos entre estudiantes ──
  conversations: DirectConversation[] = [];
  loadingConversations = true;

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly chatService = inject(ChatService);
  private readonly studentChatService = inject(StudentChatService);

  /** Suscripciones de solicitudes: la de bookings va en el índice 0 */
  private subs: Subscription[] = [];
  private convSub?: Subscription;

  constructor() {
    addIcons({
      logOutOutline, chatbubbleOutline, chatbubblesOutline,
      personAddOutline, peopleOutline, searchOutline, personOutline,
    });
  }

  ngOnInit(): void {
    const uid = this.authService.currentUser?.uid;
    if (!uid) {
      this.loading = false;
      this.loadingConversations = false;
      return;
    }

    this.listenBookingChats(uid);
    this.listenDirectConversations();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];
    this.convSub?.unsubscribe();
  }

  // ── Pestañas ──────────────────────────────────────────────

  selectTab(tab: ChatsTab): void { this.tab = tab; }

  /** Solicitudes con mensajes sin leer */
  get bookingUnread(): number {
    return this.chatSummaries.filter(s => s.unreadCount > 0).length;
  }

  /** Conversaciones directas con mensajes sin leer */
  get directUnread(): number {
    return this.studentChatService.countUnread(this.conversations);
  }

  // ── Chats directos ────────────────────────────────────────

  peerOf(conversation: DirectConversation): ConversationParticipant | null {
    return this.studentChatService.peer(conversation);
  }

  peerName(conversation: DirectConversation): string {
    return this.peerOf(conversation)?.fullName || 'Estudiante';
  }

  peerInitials(conversation: DirectConversation): string {
    const parts = this.peerName(conversation).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    const first = parts[0].charAt(0);
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }

  topicLabel(conversation: DirectConversation): string {
    return conversationTopicLabel(conversation.topic);
  }

  topicIcon(conversation: DirectConversation): string {
    return conversationTopicIcon(conversation.topic);
  }

  hasUnread(conversation: DirectConversation): boolean {
    return this.studentChatService.hasUnread(conversation);
  }

  openDirectChat(conversation: DirectConversation): void {
    const peerId = this.studentChatService.peerId(conversation);
    if (!peerId) return;
    this.router.navigate(['/student/dm', peerId], {
      queryParams: { topic: conversation.topic },
    });
  }

  goToDirectory(): void { this.router.navigate(['/student/students']); }

  // ── Chats de solicitudes ──────────────────────────────────

  openChat(bookingId: string): void {
    this.router.navigate(['/student/chat', bookingId]);
  }

  goBack(): void { this.router.navigate(['/student/home']); }

  async logout(): Promise<void> { await this.authService.logout(); }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pendiente: 'En revisión',
      aprobada:  'Aprobada',
      denegada:  'Denegada',
      cancelada: 'Cancelada',
    };
    return labels[status] ?? status;
  }

  statusClass(status: string): string {
    const classes: Record<string, string> = {
      pendiente: 'status-pending',
      aprobada:  'status-approved',
      denegada:  'status-denied',
      cancelada: 'status-cancelled',
    };
    return classes[status] ?? '';
  }

  // ── Internos ──────────────────────────────────────────────

  private listenDirectConversations(): void {
    this.convSub = this.studentChatService.getMyConversations().subscribe({
      next: conversations => {
        this.conversations = conversations;
        this.loadingConversations = false;
      },
      error: () => { this.loadingConversations = false; },
    });
  }

  private listenBookingChats(uid: string): void {
    const bookingSub = this.bookingService.getByStudent(uid).subscribe({
      next: bookings => {
        // Cancela suscripciones de mensajes anteriores antes de crear nuevas
        this.cancelMsgSubs();

        const active = bookings.filter(
          b => b.status === 'pendiente' || b.status === 'aprobada'
        );

        this.chatSummaries = active.map(booking => ({
          booking,
          unreadCount: 0,
          lastMessage: '',
        }));
        this.loading = false;

        // Suscribe a los mensajes de cada chat
        active.forEach((booking, i) => {
          const msgSub = this.chatService.getMessages(booking.id).subscribe({
            next: msgs => {
              if (msgs.length > 0) {
                const last   = msgs[msgs.length - 1];
                const unread = msgs.filter(m => m.senderId !== uid).length;
                this.chatSummaries[i] = {
                  ...this.chatSummaries[i],
                  lastMessage: last.content,
                  unreadCount: unread,
                };
              }
            },
            error: () => { /* sesión cerrada — ignorar silenciosamente */ },
          });
          this.subs.push(msgSub);
        });
      },
      error: () => { this.loading = false; },
    });

    // La suscripción de bookings va al inicio del array
    this.subs.unshift(bookingSub);
  }

  /** Cancela solo las suscripciones de mensajes (índice 1 en adelante) */
  private cancelMsgSubs(): void {
    this.subs.slice(1).forEach(s => s.unsubscribe());
    this.subs = this.subs.slice(0, 1);
  }
}
