import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  newspaper, film, calendar, construct,
  map, personCircle, notifications, logOutOutline, chatbubblesOutline,
} from 'ionicons/icons';
import { Subscription, switchMap, of } from 'rxjs';
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

  private chatSub?: Subscription;

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

    // Escucha los bookings activos y verifica si hay mensajes del admin no leídos
    this.chatSub = this.bookingService.getByStudent(uid).subscribe(bookings => {
      const active = bookings.filter(
        b => b.status === 'pendiente' || b.status === 'aprobada'
      );

      let unreadFound = false;
      let checked = 0;

      if (active.length === 0) {
        this.hasUnreadChats = false;
        return;
      }

      active.forEach(booking => {
        this.chatService.getMessages(booking.id).subscribe(msgs => {
          // Hay mensajes no leídos si alguno no es del propio estudiante
          if (msgs.some(m => m.senderId !== uid)) {
            unreadFound = true;
          }
          checked++;
          if (checked === active.length) {
            this.hasUnreadChats = unreadFound;
          }
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.chatSub?.unsubscribe();
  }

  navigate(route: string): void    { this.router.navigate([route]); }
  goToNotifications(): void        { this.router.navigate(['/student/notifications']); }
  goToChats(): void                { this.router.navigate(['/student/chats']); }
  async logout(): Promise<void>    { await this.authService.logout(); }
}
