import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, calendarOutline, timeOutline, caretDown,
  chevronBackOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ResourceService } from '../../../core/services/resource.service';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.page.html',
  styleUrls: ['./booking.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonIcon, IonSpinner],
})
export class BookingPage implements OnInit {
  form!: FormGroup;
  loading      = false;
  errorMessage = '';
  resourceId   = '';
  resourceName = '';   // nombre legible del recurso para notificaciones

  // ── Calendario ───────────────────────────────────────────────
  showCalendar = false;
  calDate      = new Date();
  selectedDay: number | null = null;
  selectedMonth: number | null = null;
  selectedYear: number | null = null;

  readonly dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // ── Picker de horas ───────────────────────────────────────────
  showTimePicker = false;

  readonly timeSlots: string[] = (() => {
    const slots: string[] = [];
    for (let h = 6; h <= 20; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < 20) slots.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return slots;
  })();

  readonly services = [
    'Laboratorio', 'Aula', 'Biblioteca',
    'Elementos deportivos', 'Base de datos',
    'Instrumentos musicales', 'Material lúdico',
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private bookingService: BookingService,
    private notificationService: NotificationService,
    private resourceService: ResourceService,
  ) {
    addIcons({ logOutOutline, calendarOutline, timeOutline, caretDown, chevronBackOutline, chevronForwardOutline });
    this.resourceId = this.route.snapshot.paramMap.get('resourceId') ?? '';
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      date:         ['', Validators.required],
      time:         ['', Validators.required],
      service:      ['', Validators.required],
      observations: [''],
    });

    // Carga el nombre del recurso para usarlo en la notificación
    if (this.resourceId) {
      this.resourceService.getById(this.resourceId).subscribe(resource => {
        this.resourceName = resource?.name ?? this.resourceId;
      });
    }
  }

  get date()    { return this.form.get('date')!; }
  get time()    { return this.form.get('time')!; }
  get service() { return this.form.get('service')!; }

  get selectedDateLabel(): string {
    return this.date.value || 'Seleccionar';
  }

  get selectedTimeLabel(): string {
    return this.time.value || 'Seleccionar';
  }

  // ── Calendario ───────────────────────────────────────────────
  toggleCalendar(): void {
    this.showCalendar = !this.showCalendar;
    this.showTimePicker = false;
  }

  get calMonthName(): string {
    return this.calDate.toLocaleDateString('es-CO', { month: 'long' });
  }

  get calYear(): number { return this.calDate.getFullYear(); }

  get calendarDays(): (number | null)[] {
    const year        = this.calDate.getFullYear();
    const month       = this.calDate.getMonth();
    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    const now = new Date();
    return day === now.getDate()
      && this.calDate.getMonth()    === now.getMonth()
      && this.calDate.getFullYear() === now.getFullYear();
  }

  isSelected(day: number | null): boolean {
    if (!day) return false;
    return day === this.selectedDay
      && this.calDate.getMonth()    === this.selectedMonth
      && this.calDate.getFullYear() === this.selectedYear;
  }

  isPast(day: number | null): boolean {
    if (!day) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(this.calDate.getFullYear(), this.calDate.getMonth(), day);
    return d < today;
  }

  selectDate(day: number | null): void {
    if (!day || this.isPast(day)) return;
    this.selectedDay   = day;
    this.selectedMonth = this.calDate.getMonth();
    this.selectedYear  = this.calDate.getFullYear();
    const mm = String(this.selectedMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    this.form.get('date')!.setValue(`${this.selectedYear}-${mm}-${dd}`);
    this.showCalendar = false;
  }

  calPrevMonth(): void {
    this.calDate = new Date(this.calDate.getFullYear(), this.calDate.getMonth() - 1, 1);
  }

  calNextMonth(): void {
    this.calDate = new Date(this.calDate.getFullYear(), this.calDate.getMonth() + 1, 1);
  }

  // ── Picker de horas ───────────────────────────────────────────
  toggleTimePicker(): void {
    this.showTimePicker = !this.showTimePicker;
    this.showCalendar   = false;
  }

  selectTime(slot: string): void {
    this.form.get('time')!.setValue(slot);
    this.showTimePicker = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.field-block')) {
      this.showCalendar   = false;
      this.showTimePicker = false;
    }
  }

  // ── Submit — guarda en Firestore ──────────────────────────────
  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const user = this.authService.currentUser;
    if (!user) { this.errorMessage = 'Sesión expirada. Inicia sesión de nuevo.'; return; }

    this.loading = true;
    this.errorMessage = '';

    try {
      const { date, time, service, observations } = this.form.value;

      // 1. Crea el booking en Firestore
      const bookingId = await this.bookingService.create({
        studentId:        user.uid,
        studentName:      user.fullName,
        resourceId:       this.resourceId,
        resourceName:     this.resourceName || this.resourceId,
        resourceCategory: this.resourceId,
        date,
        time,
        service,
        observations: observations ?? '',
      });

      // 2. Notifica al estudiante que su solicitud fue recibida
      await this.notificationService.notifyBookingPending({
        id:           bookingId,
        studentId:    user.uid,
        resourceName: this.resourceName || this.resourceId,
      });

      // 3. Notifica a todos los administradores que hay una nueva solicitud
      await this.notificationService.notifyAdminsNewBooking({
        id:           bookingId,
        studentId:    user.uid,
        studentName:  user.fullName,
        resourceName: this.resourceName || this.resourceId,
      });

      // 4. Navega a la pantalla de confirmación con el ID real
      this.router.navigate(['/student/confirmation', bookingId]);

    } catch (err) {
      console.error('Error al crear booking:', err);
      this.errorMessage = 'No se pudo enviar la solicitud. Verifica tu conexión e intenta de nuevo.';
    } finally {
      this.loading = false;
    }
  }

  goBack(): void { this.router.navigate(['/student/availability', this.resourceId]); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
