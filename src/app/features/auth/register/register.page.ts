import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  Validators, AbstractControl, ValidationErrors,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonButton, IonInput, IonSpinner,
  IonIcon, IonSelect, IonSelectOption, IonInputPasswordToggle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, mailOutline, cardOutline,
  schoolOutline, lockClosedOutline, arrowBackOutline, alertCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

/** Validador personalizado: contraseña segura */
function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (!value) return null;
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasLength = value.length >= 8;

  if (!hasLength) return { weakPassword: 'Mínimo 8 caracteres.' };
  if (!hasUpper) return { weakPassword: 'Debe incluir al menos una mayúscula.' };
  if (!hasLower) return { weakPassword: 'Debe incluir al menos una minúscula.' };
  if (!hasNumber) return { weakPassword: 'Debe incluir al menos un número.' };
  return null;
}

/** Validador: confirmación de contraseña */
function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent, IonButton, IonInput, IonSpinner,
    IonIcon, IonSelect, IonSelectOption, IonInputPasswordToggle,
  ],
})
export class RegisterPage implements OnInit {
  form!: FormGroup;
  loading = false;
  errorMessage = '';

  readonly programs = [
    'Ingeniería Industrial',
    'Ingeniería Mecatrónica',
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    addIcons({arrowBackOutline,personOutline,mailOutline,cardOutline,schoolOutline,lockClosedOutline,alertCircleOutline,});
  }

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        fullName:        ['', [Validators.required, Validators.minLength(3)]],
        email:           ['', [Validators.required, Validators.email]],
        studentCode:     ['', [Validators.required, Validators.pattern(/^\d{6,10}$/)]],
        academicProgram: ['', Validators.required],
        password:        ['', [Validators.required, strongPasswordValidator]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordMatchValidator }
    );
  }

  get fullName()        { return this.form.get('fullName')!; }
  get email()           { return this.form.get('email')!; }
  get studentCode()     { return this.form.get('studentCode')!; }
  get academicProgram() { return this.form.get('academicProgram')!; }
  get password()        { return this.form.get('password')!; }
  get confirmPassword() { return this.form.get('confirmPassword')!; }

  async onRegister(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.authService.register({
        fullName:        this.fullName.value.trim(),
        email:           this.email.value.trim(),
        studentCode:     this.studentCode.value.trim(),
        academicProgram: this.academicProgram.value,
        password:        this.password.value,
      });
    } catch (error) {
      this.errorMessage = AuthService.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }
}
