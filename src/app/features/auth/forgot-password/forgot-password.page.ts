import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonButton, IonInput, IonSpinner, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, arrowBackOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    IonContent, IonButton, IonInput, IonSpinner, IonIcon,
  ],
})
export class ForgotPasswordPage implements OnInit {
  form!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    addIcons({arrowBackOutline,checkmarkCircleOutline,mailOutline,alertCircleOutline});
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  get email() { return this.form.get('email')!; }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.authService.sendPasswordReset(this.email.value.trim());
      this.successMessage = 'Revisa tu correo institucional para restablecer tu contraseña.';
      this.form.reset();
    } catch (error) {
      this.errorMessage = AuthService.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }
}
