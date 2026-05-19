import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonIcon, IonButton, IonSpinner, IonSelect, IonSelectOption, IonInput, IonTextarea } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, logOutOutline, calendarOutline, timeOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.page.html',
  styleUrls: ['./booking.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonIcon, IonButton, IonSpinner, IonSelect, IonSelectOption, IonInput, IonTextarea],
})
export class BookingPage implements OnInit {
  form!: FormGroup;
  loading = false;
  errorMessage = '';
  resourceId = '';
  today = new Date().toISOString().split('T')[0];

  services = ['Laboratorio', 'Aula', 'Material lúdico', 'Elementos deportivos', 'Botiquín', 'Base de datos'];

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private authService: AuthService) {
    addIcons({ arrowBackOutline, logOutOutline, calendarOutline, timeOutline });
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

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    // TODO: conectar con BookingService
    setTimeout(() => {
      this.loading = false;
      this.router.navigate(['/student/confirmation', 'new']);
    }, 1000);
  }

  goBack(): void { this.router.navigate(['/student/availability', this.resourceId]); }
  async logout(): Promise<void> { await this.authService.logout(); }
}
