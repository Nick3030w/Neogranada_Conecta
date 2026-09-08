import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, ViewWillEnter } from '@ionic/angular/standalone';
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
export class AdminHomePage implements OnInit, OnDestroy, ViewWillEnter {
  user: UserProfile | null = null;
  hasUnreadChats = false;
  notificationsMuted = false;

  // Referencias separadas: reciclar los listeners de mensajes no debe
  // afectar a las suscripciones de perfil ni de reservas.
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly chatService = inject(ChatService);
  private readonly resourceService = inject(ResourceService);

  private userSub?: Subscription;
  private bookingSub?: Subscription;
  private msgSubs: Subscription[] = [];

  constructor() {
    addIcons({
      notifications, logOutOutline, calendar, construct,
      checkmarkCircle, personCircle, chatbubblesOutline,
    });
  }

  ngOnInit(): void {
    // Suscripción reactiva al perfil del usuario para detectar cambios en tiempo real
    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.user = user;
      this.notificationsMuted = user?.notificationsMuted ?? false;
    });

    const adminUid = this.authService.currentUser?.uid;

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
        this.msgSubs.push(msgSub);
      });
    });

    this.bookingSub = bookingSub;
  }

  ionViewWillEnter(): void {
    // Refresca el estado al volver de caché (ion-router-outlet)
    const user = this.authService.currentUser;
    this.user = user;
    this.notificationsMuted = user?.notificationsMuted ?? false;
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.bookingSub?.unsubscribe();
    this.cancelMsgSubs();
  }

  private cancelMsgSubs(): void {
    this.msgSubs.forEach(s => s.unsubscribe());
    this.msgSubs = [];
  }

  navigate(route: string): void    { this.router.navigate([route]); }
  goToNotifications(): void {
    if (this.notificationsMuted) return;
    this.router.navigate(['/admin/notifications']);
  }
  goToChats(): void                { this.router.navigate(['/admin/chats']); }
  async logout(): Promise<void>    { await this.authService.logout(); }
}
