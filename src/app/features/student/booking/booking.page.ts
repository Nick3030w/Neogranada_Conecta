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

  // ── Calendario ───────────────────────────────────────────────
  showCalendar = false;
  calDate      = new Date();                          // mes visible
  selectedDay: number | null = null;
  selectedMonth: number | null = null;
  selectedYear: number | null = null;

  readonly dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // ── Picker de horas ───────────────────────────────────────────
  showTimePicker = false;

  // Franjas horarias disponibles 6:00 – 20:00 cada 30 min
  readonly timeSlots: string[] = (() => {
    const slots: string[] = [];
    for (let h = 6; h <= 20; h++) {
      slots.push(`${h.toString().padStart(2,'0')}:00`);
      if (h < 20) slots.push(`${h.toString().padStart(2,'0')}:30`);
    }
    return slots;
  })();

  readonly services = [
    'Laboratorio', 'Aula', 'Biblioteca',
    'Elementos deportivos', 'Base de datos',
    'Instrumentos musicales', 'Material lúdico', 'Botiquín',
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
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
  }

  get date()    { return this.form.get('date')!; }
  get time()    { return this.form.get('time')!; }
  get service() { return this.form.get('service')!; }

  // ── Labels mostrados en las cajas ────────────────────────────
  get selectedDateLabel(): string {
    if (!this.date.value) return 'Seleccionar';
    return this.date.value;
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
    const year      = this.calDate.getFullYear();
    const month     = this.calDate.getMonth();
    const firstDay  = new Date(year, month, 1).getDay();
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
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(this.calDate.getFullYear(), this.calDate.getMonth(), day);
    return d < today;
  }

  selectDate(day: number | null): void {
    if (!day || this.isPast(day)) return;
    this.selectedDay   = day;
    this.selectedMonth = this.calDate.getMonth();
    this.selectedYear  = this.calDate.getFullYear();
    const mm = String(this.selectedMonth + 1).padStart(2,'0');
    const dd = String(day).padStart(2,'0');
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

  // Cierra dropdowns al tocar fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.field-block')) {
      this.showCalendar   = false;
      this.showTimePicker = false;
    }
  }

  // ── Submit ────────────────────────────────────────────────────
  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';
    try {
      await new Promise(r => setTimeout(r, 800));
      this.router.navigate(['/student/confirmation', 'new']);
    } catch {
      this.errorMessage = 'No se pudo procesar la solicitud. Intenta de nuevo.';
    } finally {
      this.loading = false;
    }
  }

  goBack(): void { this.router.navigate(['/student/availability', this.resourceId]); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
