import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline, calendarOutline, timeOutline, caretDown,
  chevronBackOutline, chevronForwardOutline, searchOutline,
  checkmarkCircleOutline, closeCircleOutline, locationOutline,
  documentTextOutline, closeOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ResourceService } from '../../../core/services/resource.service';
import { Resource, ResourceCategory } from '../../../core/interfaces/resource.interface';

// Estado del resultado de la consulta de disponibilidad
type AvailabilityResult = 'idle' | 'checking' | 'available' | 'unavailable';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.page.html',
  styleUrls: ['./booking.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonIcon, IonSpinner],
})
export class BookingPage implements OnInit, OnDestroy {
  form!: FormGroup;
  loading      = false;
  errorMessage = '';

  // ── Categoría recibida por ruta ───────────────────────────────
  categoryId = '';

  // ── Recursos disponibles de la categoría ─────────────────────
  resources: Resource[]  = [];
  loadingResources       = true;
  selectedResource: Resource | null = null;
  showResourcePicker     = false;

  // ── Estado de verificación de disponibilidad ──────────────────
  availabilityResult: AvailabilityResult = 'idle';

  private resourceSub?: Subscription;

  // ── Calendario ───────────────────────────────────────────────
  showCalendar  = false;
  calDate       = new Date();
  selectedDay: number | null   = null;
  selectedMonth: number | null = null;
  selectedYear: number | null  = null;

  readonly dayHeaders = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private bookingService: BookingService,
    private notificationService: NotificationService,
    private resourceService: ResourceService,
  ) {
    addIcons({
      logOutOutline, calendarOutline, timeOutline, caretDown,
      chevronBackOutline, chevronForwardOutline, searchOutline,
      checkmarkCircleOutline, closeCircleOutline, locationOutline,
      documentTextOutline, closeOutline,
    });
    this.categoryId = this.route.snapshot.paramMap.get('resourceId') ?? '';
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      date:         ['', Validators.required],
      time:         ['', Validators.required],
      resource:     ['', Validators.required],
      observations: [''],
    });

    // Escucha en tiempo real los recursos disponibles de esta categoría
    this.resourceSub = this.resourceService
      .getAvailableByCategory(this.categoryId as ResourceCategory)
      .subscribe({
        next: resources => {
          this.resources        = resources;
          this.loadingResources = false;
          // Si el recurso seleccionado ya no está disponible, lo limpiamos
          if (this.selectedResource) {
            const stillAvailable = resources.find(r => r.id === this.selectedResource!.id);
            if (!stillAvailable) {
              this.selectedResource = null;
              this.form.get('resource')!.setValue('');
              this.availabilityResult = 'idle';
            }
          }
        },
        error: () => { this.loadingResources = false; },
      });
  }

  ngOnDestroy(): void {
    this.resourceSub?.unsubscribe();
  }

  // ── Getters de formulario ─────────────────────────────────────
  get date()     { return this.form.get('date')!; }
  get time()     { return this.form.get('time')!; }
  get resource() { return this.form.get('resource')!; }

  get selectedDateLabel(): string { return this.date.value     || 'Seleccionar'; }
  get selectedTimeLabel(): string { return this.time.value     || 'Seleccionar'; }
  get selectedResourceLabel(): string {
    if (!this.selectedResource) return 'Seleccionar';
    return `${this.selectedResource.name} — ${this.selectedResource.location}`;
  }

  // ── Selector de recurso ───────────────────────────────────────
  toggleResourcePicker(): void {
    this.showResourcePicker = !this.showResourcePicker;
    this.showCalendar       = false;
    this.showTimePicker     = false;
  }

  selectResource(res: Resource): void {
    this.selectedResource   = res;
    this.form.get('resource')!.setValue(res.id);
    this.showResourcePicker = false;
    // Resetea el resultado de disponibilidad al cambiar de recurso
    this.availabilityResult = 'idle';
  }

  // ── Calendario ───────────────────────────────────────────────
  toggleCalendar(): void {
    this.showCalendar       = !this.showCalendar;
    this.showTimePicker     = false;
    this.showResourcePicker = false;
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
    // Resetea disponibilidad al cambiar fecha
    this.availabilityResult = 'idle';
  }

  calPrevMonth(): void {
    this.calDate = new Date(this.calDate.getFullYear(), this.calDate.getMonth() - 1, 1);
  }
  calNextMonth(): void {
    this.calDate = new Date(this.calDate.getFullYear(), this.calDate.getMonth() + 1, 1);
  }

  // ── Picker de horas ───────────────────────────────────────────
  toggleTimePicker(): void {
    this.showTimePicker     = !this.showTimePicker;
    this.showCalendar       = false;
    this.showResourcePicker = false;
  }

  selectTime(slot: string): void {
    this.form.get('time')!.setValue(slot);
    this.showTimePicker = false;
    // Resetea disponibilidad al cambiar hora
    this.availabilityResult = 'idle';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.field-block')) {
      this.showCalendar       = false;
      this.showTimePicker     = false;
      this.showResourcePicker = false;
    }
  }

  // ── Verificación de disponibilidad ────────────────────────────
  /**
   * Consulta Firestore para saber si el recurso seleccionado
   * está libre en la fecha y hora elegidas.
   * Requiere que los 3 campos estén completos.
   */
  get canCheck(): boolean {
    return !!this.selectedResource
      && !!this.date.value
      && !!this.time.value;
  }

  async checkAvailability(): Promise<void> {
    if (!this.canCheck) return;
    this.availabilityResult = 'checking';
    this.errorMessage = '';
    try {
      const isAvailable = await this.bookingService.checkAvailability(
        this.selectedResource!.id,
        this.date.value,
        this.time.value,
      );
      this.availabilityResult = isAvailable ? 'available' : 'unavailable';
    } catch (err) {
      console.error('Error en checkAvailability:', err);
      this.availabilityResult = 'idle';
      this.errorMessage = 'No se pudo verificar la disponibilidad. Intenta de nuevo.';
    }
  }

  // ── Submit ────────────────────────────────────────────────────
  async onSubmit(): Promise<void> {
    if (this.form.invalid)              { this.form.markAllAsTouched(); return; }
    if (this.availabilityResult !== 'available') {
      this.errorMessage = 'Debes consultar la disponibilidad antes de confirmar.';
      return;
    }

    const user = this.authService.currentUser;
    if (!user) { this.errorMessage = 'Sesión expirada. Inicia sesión de nuevo.'; return; }

    this.loading      = true;
    this.errorMessage = '';

    try {
      const { date, time, observations } = this.form.value;
      const res = this.selectedResource!;

      // 1. Crea el booking en Firestore con el ID real del recurso
      const bookingId = await this.bookingService.create({
        studentId:        user.uid,
        studentName:      user.fullName,
        resourceId:       res.id,
        resourceName:     res.name,
        resourceCategory: res.category,
        resourceLocation: res.location,
        date,
        time,
        observations: observations ?? '',
      });

      // 2. Notifica al estudiante
      await this.notificationService.notifyBookingPending({
        id:           bookingId,
        studentId:    user.uid,
        resourceName: res.name,
      });

      // 3. Notifica a todos los admins
      await this.notificationService.notifyAdminsNewBooking({
        id:           bookingId,
        studentId:    user.uid,
        studentName:  user.fullName,
        resourceName: res.name,
      });

      // 4. Navega a confirmación
      this.router.navigate(['/student/confirmation', bookingId]);

    } catch (err) {
      console.error('Error al crear booking:', err);
      this.errorMessage = 'No se pudo enviar la solicitud. Verifica tu conexión e intenta de nuevo.';
    } finally {
      this.loading = false;
    }
  }

  // ── Modal de políticas ───────────────────────────────────────
  showPolicies = false;
  openPolicies(): void  { this.showPolicies = true; }
  closePolicies(): void { this.showPolicies = false; }

  goBack(): void { this.router.navigate(['/student/availability', this.categoryId]); }
  goHome(): void { this.router.navigate(['/student/home']); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
