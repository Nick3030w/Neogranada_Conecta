import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { of, switchMap } from 'rxjs';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { BookingService } from './core/services/booking.service';
import { ReminderService } from './core/services/reminder.service';
import { UserProfile } from './core/interfaces/user.interface';
import { Booking } from './core/interfaces/booking.interface';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private bookingService = inject(BookingService);
  private reminderService = inject(ReminderService);

  constructor() {
    // Aplica el tema guardado de inmediato y lo sincroniza con el perfil de usuario
    this.themeService.init();

    // Recordatorios de reservas: pide permiso, escucha disparos nativos y
    // reprograma los recordatorios de las reservas aprobadas del estudiante.
    this.initReminders();
  }

  private async initReminders(): Promise<void> {
    await this.reminderService.initListeners();
    const granted = await this.reminderService.requestPermission();
    if (!granted) return;

    // Cuando cambia el usuario autenticado (login/logout), reprograma
    // los recordatorios de sus reservas aprobadas vigentes. switchMap
    // cancela automáticamente el listener anterior si el usuario cambia.
    this.authService.currentUser$
      .pipe(
        switchMap((user: UserProfile | null) =>
          user && user.role === 'student'
            ? this.bookingService.getByStudent(user.uid)
            : of<Booking[]>([])
        )
      )
      .subscribe(bookings => {
        const uid = this.authService.currentUser?.uid;
        if (!uid) return;

        bookings.forEach(b => {
          if (b.status === 'aprobada') {
            // Se reprograma desde cero para evitar duplicados con ids obsoletos
            this.reminderService.cancelForBooking(b.id).then(() =>
              this.reminderService.scheduleForBooking({
                id:           b.id,
                studentId:    uid,
                resourceName: b.resourceName,
                date:         b.date,
                startTime:    b.startTime,
                endTime:      b.endTime,
              })
            );
          } else {
            // Denegada/cancelada/pendiente: no debe tener recordatorios activos
            this.reminderService.cancelForBooking(b.id);
          }
        });
      });
  }
}
