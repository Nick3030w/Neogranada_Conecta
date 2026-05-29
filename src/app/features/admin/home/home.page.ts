import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendar, construct, checkmarkCircle,
  personCircle, notifications, logOutOutline, chatbubblesOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { ChatService } from '../../../core/services/chat.service';
import { ResourceService } from '../../../core/services/resource.service';
import { UserProfile } from '../../../core/interfaces/user.interface';

@Component({
  selector: 'app-admin-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
})
export class AdminHomePage implements OnInit, OnDestroy {
  user: UserProfile | null = null;
  hasUnreadChats = false;

  private subs: Subscription[] = [];

  constructor(
    private authService:    AuthService,
    private router:         Router,
    private bookingService: BookingService,
    private chatService:    ChatService,
    private resourceService: ResourceService,
  ) {
    addIcons({
      notifications, logOutOutline, calendar, construct,
      checkmarkCircle, personCircle, chatbubblesOutline,
    });
  }

  ngOnInit(): void {
    this.user = this.authService.currentUser;
    const adminUid = this.user?.uid;

    this.resourceService.seedIfEmpty().catch(err =>
      console.error('Error al inicializar recursos:', err)
    );

    if (!adminUid) return;

    // Escucha todos los bookings activos y verifica si hay mensajes de estudiantes
    const bookingSub = this.bookingService.getAll().subscribe(bookings => {
      this.cancelMsgSubs();

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
            // No leídos = mensajes del estudiante (no del admin)
            if (msgs.some(m => m.senderId !== adminUid)) {
              unreadFound = true;
            }
            checked++;
            if (checked === active.length) {
              this.hasUnreadChats = unreadFound;
            }
          },
          error: () => { /* sesión cerrada — ignorar */ },
        });
        this.subs.push(msgSub);
      });
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

  navigate(route: string): void    { this.router.navigate([route]); }
  goToNotifications(): void        { this.router.navigate(['/admin/notifications']); }
  goToChats(): void                { this.router.navigate(['/admin/chats']); }
  async logout(): Promise<void>    { await this.authService.logout(); }
}
