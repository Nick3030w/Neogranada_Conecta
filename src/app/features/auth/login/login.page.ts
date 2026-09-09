import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonInput, IonSpinner, IonIcon,
  IonInputPasswordToggle, IonCheckbox,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline, lockClosedOutline, eyeOutline,
  eyeOffOutline, alertCircleOutline, peopleOutline, caretDown, shieldOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { CredentialsService } from '../../../core/services/credentials.service';

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
    IonInputPasswordToggle, IonCheckbox,
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
    private authService: AuthService,
    private credentialsService: CredentialsService
  ) {
    addIcons({peopleOutline,caretDown,shieldOutline,mailOutline,lockClosedOutline,alertCircleOutline,eyeOutline,eyeOffOutline});
  }

  async ngOnInit(): Promise<void> {
    this.form = this.fb.group({
      email:        ['', [Validators.required, Validators.email]],
      password:     ['', [Validators.required, Validators.minLength(6)]],
      rememberMe:   [false],
    });

    // Si hay credenciales guardadas de forma segura, se precargan
    const saved = await this.credentialsService.load();
    if (saved) {
      this.form.patchValue({
        email: saved.email,
        password: saved.password,
        rememberMe: true,
      });
    }
  }

  get email()      { return this.form.get('email')!; }
  get password()   { return this.form.get('password')!; }
  get rememberMe() { return this.form.get('rememberMe')!; }

  async onLogin(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    const email = this.email.value.trim();
    const password = this.password.value;

    try {
      await this.authService.login(email, password);

      // Guarda o borra las credenciales cifradas según la elección del usuario
      if (this.rememberMe.value) {
        await this.credentialsService.save(email, password);
      } else {
        await this.credentialsService.clear();
      }
    } catch (error) {
      this.errorMessage = AuthService.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }
}
