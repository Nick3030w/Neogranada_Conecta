import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, chatbubbleOutline, chatbubblesOutline } from 'ionicons/icons';
import { Subscription, combineLatest, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { ChatService } from '../../../core/services/chat.service';
import { Booking } from '../../../core/interfaces/booking.interface';

export interface ChatSummary {
  booking: Booking;
  unreadCount: number;
  lastMessage: string;
}

@Component({
  selector: 'app-student-chats',
  templateUrl: './chats.page.html',
  styleUrls: ['./chats.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner],
})
export class StudentChatsPage implements OnInit, OnDestroy {
  chatSummaries: ChatSummary[] = [];
  loading = true;

  private sub?: Subscription;

  constructor(
    private router:      Router,
    private authService: AuthService,
    private bookingService: BookingService,
    private chatService: ChatService,
  ) {
    addIcons({ logOutOutline, chatbubbleOutline, chatbubblesOutline });
  }

  ngOnInit(): void {
    const uid = this.authService.currentUser?.uid;
    if (!uid) { this.loading = false; return; }

    // Escucha los bookings del estudiante en tiempo real
    this.sub = this.bookingService.getByStudent(uid).subscribe(bookings => {
      // Solo muestra bookings que no estén cancelados ni denegados
      const active = bookings.filter(
        b => b.status === 'pendiente' || b.status === 'aprobada'
      );

      // Para cada booking, obtiene los mensajes y calcula no leídos
      const summaries: ChatSummary[] = active.map(booking => {
        return {
          booking,
          unreadCount: 0,
          lastMessage: '',
        };
      });

      this.chatSummaries = summaries;
      this.loading = false;

      // Carga el último mensaje de cada chat
      active.forEach((booking, i) => {
        this.chatService.getMessages(booking.id).subscribe(msgs => {
          if (msgs.length > 0) {
            const last = msgs[msgs.length - 1];
            // Mensajes no leídos = los que no son del estudiante
            const unread = msgs.filter(m => m.senderId !== uid).length;
            this.chatSummaries[i] = {
              ...this.chatSummaries[i],
              lastMessage: last.content,
              unreadCount: unread,
            };
          }
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  openChat(bookingId: string): void {
    this.router.navigate(['/student/chat', bookingId]);
  }

  goBack(): void { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pendiente: 'En revisión',
      aprobada:  'Aprobada',
      denegada:  'Denegada',
      cancelada: 'Cancelada',
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      pendiente: 'status-pending',
      aprobada:  'status-approved',
      denegada:  'status-denied',
      cancelada: 'status-cancelled',
    };
    return map[status] ?? '';
  }
}
