import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonIcon, IonButton, IonInput, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, logOutOutline, personOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfile } from '../../../core/interfaces/user.interface';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonIcon, IonButton, IonInput, IonSpinner],
})
export class ProfilePage implements OnInit {
  form!: FormGroup;
  user: UserProfile | null = null;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    addIcons({ arrowBackOutline, logOutOutline, personOutline });
  }

  ngOnInit(): void {
    this.user = this.authService.currentUser;
    this.form = this.fb.group({
      fullName:        [this.user?.fullName ?? '',        [Validators.required, Validators.minLength(3)]],
      academicProgram: [this.user?.academicProgram ?? '', Validators.required],
    });
  }

  get initials(): string {
    return (this.user?.fullName ?? 'U').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
    try {
      await this.authService.updateProfile(this.user!.uid, {
        fullName: this.form.value.fullName.trim(),
        academicProgram: this.form.value.academicProgram.trim(),
      });
      this.successMessage = 'Perfil actualizado correctamente.';
    } catch {
      this.errorMessage = 'No se pudo actualizar el perfil. Intenta de nuevo.';
    } finally {
      this.loading = false;
    }
  }

  goBack(): void {
    const role = this.authService.currentUser?.role;
    this.router.navigate([role === 'admin' ? '/admin/home' : '/student/home']);
  }

  async logout(): Promise<void> { await this.authService.logout(); }
}
