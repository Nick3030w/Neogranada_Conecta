import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  newspaper, film, calendar, construct,
  map, personCircle, notifications, logOutOutline, chatbubblesOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { ChatService } from '../../../core/services/chat.service';
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
  hasUnreadChats = false;

  // Todas las suscripciones activas — se cancelan juntas en ngOnDestroy
  private subs: Subscription[] = [];

  constructor(
    private authService:    AuthService,
    private router:         Router,
    private bookingService: BookingService,
    private chatService:    ChatService,
  ) {
    addIcons({
      newspaper, film, calendar, construct,
      map, personCircle, notifications, logOutOutline, chatbubblesOutline,
    });
  }

  ngOnInit(): void {
    this.user = this.authService.currentUser;
    const uid = this.user?.uid;
    if (!uid) return;

    const bookingSub = this.bookingService.getByStudent(uid).subscribe(bookings => {
      // Cancela suscripciones de chat anteriores antes de crear nuevas
      this.cancelChatSubs();

      const active = bookings.filter(
        b => b.status === 'pendiente' || b.status === 'aprobada'
      );

      if (active.length === 0) {
        this.hasUnreadChats = false;
        return;
      }

      let unreadFound = false;
      let checked = 0;

      active.forEach(booking => {
        const msgSub = this.chatService.getMessages(booking.id).subscribe({
          next: msgs => {
            if (msgs.some(m => m.senderId !== uid)) {
              unreadFound = true;
            }
            checked++;
            if (checked === active.length) {
              this.hasUnreadChats = unreadFound;
            }
          },
          error: () => { /* sesión cerrada — ignorar silenciosamente */ },
        });
        this.subs.push(msgSub);
      });
    });

    this.subs.push(bookingSub);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];
  }

  /** Cancela solo las suscripciones de mensajes (no la de bookings) */
  private cancelChatSubs(): void {
    // La primera suscripción es la de bookings, las demás son de mensajes
    this.subs.slice(1).forEach(s => s.unsubscribe());
    this.subs = this.subs.slice(0, 1);
  }

  navigate(route: string): void { this.router.navigate([route]); }
  goToNotifications(): void     { this.router.navigate(['/student/notifications']); }
  goToChats(): void             { this.router.navigate(['/student/chats']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
