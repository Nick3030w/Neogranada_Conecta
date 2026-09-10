import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  newspaper, film, calendar, construct,
  map, personCircle, notifications, logOutOutline, chatbubblesOutline,
  sparkles,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { ChatService } from '../../../core/services/chat.service';
import { StudentChatService } from '../../../core/services/student-chat.service';
import { UserProfile } from '../../../core/interfaces/user.interface';

@Component({
  selector: 'app-student-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class StudentHomePage implements OnInit, OnDestroy {
  user: UserProfile | null = null;
  notificationsMuted = false;

  /** Mensajes sin leer en chats de solicitudes */
  private unreadBookingChats = false;
  /** Mensajes sin leer en chats directos con otros estudiantes */
  private unreadDirectChats = false;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly chatService = inject(ChatService);
  private readonly studentChatService = inject(StudentChatService);

  // Cada fuente tiene su propia referencia: así los listeners de mensajes se
  // pueden reciclar sin tocar por accidente las suscripciones de perfil,
  // reservas o conversaciones.
  private userSub?: Subscription;
  private bookingSub?: Subscription;
  private convSub?: Subscription;
  private msgSubs: Subscription[] = [];

  constructor() {
    addIcons({
      newspaper, film, calendar, construct,
      map, personCircle, notifications, logOutOutline, chatbubblesOutline,
      sparkles,
    });
  }

  /** El indicador de chats combina solicitudes y chats entre estudiantes */
  get hasUnreadChats(): boolean {
    return this.unreadBookingChats || this.unreadDirectChats;
  }

  ngOnInit(): void {
    // Suscripción reactiva al perfil del usuario para detectar cambios en tiempo real
    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.user = user;
      this.notificationsMuted = user?.notificationsMuted ?? false;
    });

    const uid = this.authService.currentUser?.uid;
    if (!uid) return;

    this.watchBookingChats(uid);
    this.watchDirectChats();
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.bookingSub?.unsubscribe();
    this.convSub?.unsubscribe();
    this.cancelMsgSubs();
  }

  navigate(route: string): void { this.router.navigate([route]); }

  goToNotifications(): void {
    if (this.notificationsMuted) return;
    this.router.navigate(['/student/notifications']);
  }

  goToChats(): void { this.router.navigate(['/student/chats']); }

  async logout(): Promise<void> { await this.authService.logout(); }

  // ── Internos ──────────────────────────────────────────────

  /** Marca el indicador si alguna solicitud activa tiene mensajes de la dependencia. */
  private watchBookingChats(uid: string): void {
    this.bookingSub = this.bookingService.getByStudent(uid).subscribe(bookings => {
      this.cancelMsgSubs();

      const active = bookings.filter(
        b => b.status === 'pendiente' || b.status === 'aprobada'
      );

      if (active.length === 0) {
        this.unreadBookingChats = false;
        return;
      }

      let unreadFound = false;
      let checked = 0;

      active.forEach(booking => {
        const msgSub = this.chatService.getMessages(booking.id).subscribe({
          next: msgs => {
            if (msgs.some(m => m.senderId !== uid)) unreadFound = true;

            checked++;
            if (checked === active.length) this.unreadBookingChats = unreadFound;
          },
          error: () => { /* sesión cerrada — ignorar silenciosamente */ },
        });
        this.msgSubs.push(msgSub);
      });
    });
  }

  /** Marca el indicador si hay conversaciones directas sin leer. */
  private watchDirectChats(): void {
    this.convSub = this.studentChatService.getMyConversations().subscribe({
      next: conversations => {
        this.unreadDirectChats = this.studentChatService.countUnread(conversations) > 0;
      },
      error: () => { /* sesión cerrada — ignorar silenciosamente */ },
    });
  }

  private cancelMsgSubs(): void {
    this.msgSubs.forEach(s => s.unsubscribe());
    this.msgSubs = [];
  }
}
