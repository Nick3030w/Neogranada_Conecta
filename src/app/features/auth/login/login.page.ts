import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonInput, IonSpinner, IonIcon,
  IonInputPasswordToggle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline, lockClosedOutline, eyeOutline,
  eyeOffOutline, alertCircleOutline, peopleOutline, caretDown, shieldOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent, IonInput, IonSpinner, IonIcon,
    IonInputPasswordToggle,
  ],
})
export class LoginPage implements OnInit {
  form!: FormGroup;
  loading = false;
  errorMessage = '';

  // ── Selector de rol (solo visual) ────────────────────────────
  selectedRole     = 'Estudiante';
  showRoleDropdown = false;

  toggleRoleDropdown(): void {
    this.showRoleDropdown = !this.showRoleDropdown;
  }

  selectRole(role: string): void {
    this.selectedRole     = role;
    this.showRoleDropdown = false;
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    addIcons({peopleOutline,caretDown,shieldOutline,mailOutline,lockClosedOutline,alertCircleOutline,eyeOutline,eyeOffOutline});
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get email()    { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

  async onLogin(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    try {
      await this.authService.login(
        this.email.value.trim(),
        this.password.value
      );
    } catch (error) {
      this.errorMessage = AuthService.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }
}
