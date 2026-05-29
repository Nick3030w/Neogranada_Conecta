import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, chatbubbleOutline, chatbubblesOutline, personOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { ChatService } from '../../../core/services/chat.service';
import { Booking } from '../../../core/interfaces/booking.interface';

export interface AdminChatSummary {
  booking: Booking;
  unreadCount: number;
  lastMessage: string;
}

@Component({
  selector: 'app-admin-chats',
  templateUrl: './chats.page.html',
  styleUrls: ['./chats.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class AdminChatsPage implements OnInit, OnDestroy {
  chatSummaries: AdminChatSummary[] = [];
  loading = true;

  private subs: Subscription[] = [];

  constructor(
    private router:         Router,
    private authService:    AuthService,
    private bookingService: BookingService,
    private chatService:    ChatService,
  ) {
    addIcons({ logOutOutline, chatbubbleOutline, chatbubblesOutline, personOutline });
  }

  ngOnInit(): void {
    const adminUid = this.authService.currentUser?.uid;
    if (!adminUid) { this.loading = false; return; }

    // El admin ve todos los bookings vigentes (pendiente | aprobada)
    const bookingSub = this.bookingService.getAll().subscribe({
      next: bookings => {
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
                const last = msgs[msgs.length - 1];
                // No leídos = mensajes del estudiante (no del admin)
                const unread = msgs.filter(m => m.senderId !== adminUid).length;
                this.chatSummaries[i] = {
                  ...this.chatSummaries[i],
                  lastMessage: last.content,
                  unreadCount: unread,
                };
              }
            },
            error: () => { /* sesión cerrada — ignorar */ },
          });
          this.subs.push(msgSub);
        });
      },
      error: () => { this.loading = false; },
    });

    this.subs.unshift(bookingSub);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];
  }

  private cancelMsgSubs(): void {
    this.subs.slice(1).forEach(s => s.unsubscribe());
    this.subs = this.subs.slice(0, 1);
  }

  openChat(bookingId: string): void {
    this.router.navigate(['/admin/chat', bookingId]);
  }

  goBack(): void    { this.router.navigate(['/admin/home']); }
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
}
