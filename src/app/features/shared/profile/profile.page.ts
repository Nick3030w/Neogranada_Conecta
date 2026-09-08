import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonToggle,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  homeOutline,
  logOutOutline,
  moonOutline,
  notificationsOffOutline,
  personOutline,
  starOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ImageError, ImageService } from '../../../core/services/image.service';
import {
  EditableProfileFields,
  FavoriteCategory,
  START_PAGE_OPTIONS,
  StartPageOption,
  UserProfile,
  resolveStartPage,
} from '../../../core/interfaces/user.interface';
import { CATALOG_CATEGORIES, CATEGORY_LABELS } from '../../../core/interfaces/resource.interface';

interface CategoryOption {
  value: FavoriteCategory;
  label: string;
}

/**
 * Pantalla de configuración del perfil, compartida por estudiantes y
 * administradores (`/student/profile` y `/admin/profile`).
 *
 * Dos modos de guardado, deliberadamente separados para que el comportamiento
 * sea predecible:
 *  - Datos personales (texto): se editan y se confirman con "GUARDAR".
 *  - Foto y preferencias: se aplican y persisten al instante.
 */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonIcon,
    IonSpinner,
    IonToggle,
    IonSelect,
    IonSelectOption,
  ],
})
export class ProfilePage implements OnInit, OnDestroy, ViewWillEnter {
  /** Input de archivo oculto: en Android abre cámara o galería */
  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  user: UserProfile | null = null;

  /** Guardando datos personales */
  loading = false;
  /** Procesando o guardando la foto */
  photoLoading = false;

  successMessage = '';
  errorMessage = '';

  // ── Preferencias (aplicación inmediata) ──
  notificationsMuted = false;
  darkMode = false;
  startPage = '';
  favoriteCategory: FavoriteCategory = '';

  startPageOptions: StartPageOption[] = [];
  readonly categoryOptions: CategoryOption[] = [
    { value: '', label: 'Sin preferencia' },
    ...CATALOG_CATEGORIES.map((id) => ({ value: id as FavoriteCategory, label: CATEGORY_LABELS[id] })),
  ];

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly imageService = inject(ImageService);

  private subs: Subscription[] = [];
  private messageTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    addIcons({
      logOutOutline,
      personOutline,
      cameraOutline,
      moonOutline,
      notificationsOffOutline,
      homeOutline,
      starOutline,
    });
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      academicProgram: ['', Validators.required],
      phone: ['', [Validators.pattern(/^[0-9+\s()-]{7,20}$/)]],
    });

    // El perfil llega (y se refresca) por el stream del servicio de sesión
    this.subs.push(this.authService.currentUser$.subscribe((user) => this.syncFromUser(user)));

    // El tema es responsabilidad de ThemeService: el toggle solo lo refleja
    this.subs.push(this.themeService.theme$.subscribe((theme) => (this.darkMode = theme === 'dark')));
  }

  ionViewWillEnter(): void {
    // Refresco al volver de la caché del router outlet
    this.syncFromUser(this.authService.currentUser);
    this.darkMode = this.themeService.isDark;
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.subs = [];
    if (this.messageTimer) clearTimeout(this.messageTimer);
  }

  // ── Accesores de plantilla ────────────────────────────────

  get isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  get photoUrl(): string {
    return this.user?.photoUrl ?? '';
  }

  /** Iniciales del nombre, usadas cuando no hay foto. */
  get initials(): string {
    const parts = (this.user?.fullName ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    const first = parts[0].charAt(0);
    const second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + second).toUpperCase();
  }

  get fullNameCtrl(): AbstractControl {
    return this.form.get('fullName')!;
  }

  get academicProgramCtrl(): AbstractControl {
    return this.form.get('academicProgram')!;
  }

  get phoneCtrl(): AbstractControl {
    return this.form.get('phone')!;
  }

  // ── Foto de perfil ────────────────────────────────────────

  openPhotoPicker(): void {
    if (this.photoLoading) return;
    this.clearMessages();
    this.photoInput?.nativeElement.click();
  }

  async onPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Permite volver a elegir el mismo archivo más adelante
    input.value = '';

    const uid = this.user?.uid;
    if (!file || !uid) return;

    this.photoLoading = true;
    this.clearMessages();
    try {
      const dataUrl = await this.imageService.toSquareDataUrl(file);
      await this.authService.updateProfile(uid, { photoUrl: dataUrl });
      this.flash('success', 'Foto de perfil actualizada.');
    } catch (error) {
      this.flash('error', this.photoErrorMessage(error));
    } finally {
      this.photoLoading = false;
    }
  }

  async removePhoto(): Promise<void> {
    const uid = this.user?.uid;
    if (!uid || this.photoLoading) return;

    this.photoLoading = true;
    this.clearMessages();
    try {
      await this.authService.updateProfile(uid, { photoUrl: '' });
      this.flash('success', 'Foto de perfil eliminada.');
    } catch {
      this.flash('error', 'No se pudo quitar la foto. Intenta de nuevo.');
    } finally {
      this.photoLoading = false;
    }
  }

  // ── Datos personales ──────────────────────────────────────

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.flash('error', 'Revisa los campos marcados antes de guardar.');
      return;
    }

    const uid = this.user?.uid;
    if (!uid) return;

    this.loading = true;
    this.clearMessages();
    try {
      await this.authService.updateProfile(uid, {
        fullName: (this.form.value.fullName ?? '').trim(),
        academicProgram: (this.form.value.academicProgram ?? '').trim(),
        phone: (this.form.value.phone ?? '').trim(),
      });
      this.form.markAsPristine();
      this.flash('success', 'Perfil actualizado correctamente.');
    } catch {
      this.flash('error', 'No se pudo actualizar el perfil. Intenta de nuevo.');
    } finally {
      this.loading = false;
    }
  }

  /** Devuelve los campos de texto a los valores guardados. */
  onDiscard(): void {
    this.clearMessages();
    this.patchFormFromUser(this.user);
    this.form.markAsPristine();
  }

  // ── Preferencias ──────────────────────────────────────────

  async toggleNotifications(event: CustomEvent): Promise<void> {
    const muted = !!(event.detail as { checked: boolean }).checked;
    this.notificationsMuted = muted;
    await this.savePreference(
      { notificationsMuted: muted },
      muted ? 'Notificaciones silenciadas.' : 'Notificaciones activadas.',
      () => (this.notificationsMuted = !muted),
    );
  }

  async toggleDarkMode(event: CustomEvent): Promise<void> {
    const enabled = !!(event.detail as { checked: boolean }).checked;
    this.darkMode = enabled;
    // ThemeService aplica el tema en vivo y lo persiste (local + perfil)
    await this.themeService.toggleDark(enabled);
    this.flash('success', enabled ? 'Modo oscuro activado.' : 'Modo claro activado.');
  }

  async onStartPageChange(event: CustomEvent): Promise<void> {
    const previous = this.startPage;
    const value = (event.detail as { value: string }).value;
    if (!value || value === previous) return;

    this.startPage = value;
    await this.savePreference(
      { startPage: value },
      'Pantalla de inicio actualizada.',
      () => (this.startPage = previous),
    );
  }

  async onFavoriteCategoryChange(event: CustomEvent): Promise<void> {
    const previous = this.favoriteCategory;
    const value = ((event.detail as { value: FavoriteCategory }).value ?? '') as FavoriteCategory;
    if (value === previous) return;

    this.favoriteCategory = value;
    await this.savePreference(
      { favoriteCategory: value },
      value ? `Categoría favorita: ${CATEGORY_LABELS[value]}.` : 'Se quitó la categoría favorita.',
      () => (this.favoriteCategory = previous),
    );
  }

  // ── Navegación ────────────────────────────────────────────

  goBack(): void {
    this.router.navigate([this.isAdmin ? '/admin/home' : '/student/home']);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  // ── Internos ──────────────────────────────────────────────

  private syncFromUser(user: UserProfile | null): void {
    this.user = user;
    if (!user) return;

    this.startPageOptions = START_PAGE_OPTIONS[user.role] ?? [];
    this.startPage = resolveStartPage(user.role, user.startPage);
    this.notificationsMuted = user.notificationsMuted ?? false;
    this.favoriteCategory = user.favoriteCategory ?? '';

    // No sobrescribe lo que el usuario esté escribiendo
    if (!this.form?.dirty) this.patchFormFromUser(user);
  }

  private patchFormFromUser(user: UserProfile | null): void {
    this.form?.patchValue(
      {
        fullName: user?.fullName ?? '',
        academicProgram: user?.academicProgram ?? '',
        phone: user?.phone ?? '',
      },
      { emitEvent: false },
    );
  }

  /** Persiste una preferencia y revierte el estado local si falla. */
  private async savePreference(
    data: Partial<EditableProfileFields>,
    okMessage: string,
    revert: () => void,
  ): Promise<void> {
    const uid = this.user?.uid;
    if (!uid) return;

    try {
      await this.authService.updateProfile(uid, data);
      this.flash('success', okMessage);
    } catch {
      revert();
      this.flash('error', 'No se pudo guardar la preferencia. Intenta de nuevo.');
    }
  }

  private photoErrorMessage(error: unknown): string {
    if (error instanceof ImageError) {
      switch (error.reason) {
        case 'TYPE':
          return 'El archivo seleccionado no es una imagen.';
        case 'SIZE':
          return 'La imagen es demasiado grande (máximo 10 MB).';
        case 'TOO_LARGE':
          return 'No fue posible comprimir la imagen. Prueba con otra foto.';
        default:
          return 'No se pudo leer la imagen. Prueba con otra foto.';
      }
    }
    return 'No se pudo guardar la foto. Intenta de nuevo.';
  }

  private flash(kind: 'success' | 'error', message: string): void {
    this.clearMessages();
    if (kind === 'success') this.successMessage = message;
    else this.errorMessage = message;

    this.messageTimer = setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 4000);
  }

  private clearMessages(): void {
    if (this.messageTimer) clearTimeout(this.messageTimer);
    this.successMessage = '';
    this.errorMessage = '';
  }
}
