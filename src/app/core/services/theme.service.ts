import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Temas disponibles en la aplicación.
 * 'light' conserva el diseño institucional original (chrome azul + paneles blancos).
 * 'dark'  oscurece paneles y superficies manteniendo el dorado y azul UMNG.
 *
 * La estructura permite agregar más temas en el futuro sin cambiar el resto de la app:
 * basta con añadir la clave aquí, la clase `.theme-<clave>` en variables.scss y
 * la entrada correspondiente en THEME_META.
 */
export type AppTheme = 'light' | 'dark';

export interface ThemeMeta {
  id: AppTheme;
  label: string;
  /** Nombre del ícono de Ionicons asociado (para selectores futuros) */
  icon: string;
}

export const THEME_META: ThemeMeta[] = [
  { id: 'light', label: 'Claro', icon: 'sunny-outline' },
  { id: 'dark', label: 'Oscuro', icon: 'moon-outline' },
];

const STORAGE_KEY = 'nc_theme';
const THEME_CLASS_PREFIX = 'theme-';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private authService = inject(AuthService);

  private readonly _theme$ = new BehaviorSubject<AppTheme>(this.readStoredTheme());
  /** Tema activo como stream reactivo */
  readonly theme$: Observable<AppTheme> = this._theme$.asObservable();

  private initialized = false;

  /** Tema activo actual (sincrónico) */
  get theme(): AppTheme {
    return this._theme$.getValue();
  }

  /** Todos los temas disponibles (para construir selectores) */
  get available(): ThemeMeta[] {
    return THEME_META;
  }

  /**
   * Inicializa el servicio: aplica el tema almacenado de inmediato (evita parpadeo)
   * y luego se sincroniza con la preferencia del perfil de usuario cuando cargue.
   * Debe llamarse una sola vez al arrancar la app.
   */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // Aplica al instante lo que haya en localStorage
    this.applyToDom(this.theme);

    // Sincroniza con el perfil del usuario cuando Firebase resuelva la sesión
    this.authService.currentUser$.subscribe((user) => {
      if (!user) return;
      const preferred: AppTheme = user.darkMode ? 'dark' : 'light';
      if (preferred !== this.theme) {
        this.set(preferred, { persistRemote: false });
      }
    });
  }

  /** Cambia el tema activo, lo aplica al DOM y lo persiste. */
  async set(theme: AppTheme, opts: { persistRemote?: boolean } = {}): Promise<void> {
    const { persistRemote = true } = opts;

    this._theme$.next(theme);
    this.applyToDom(theme);
    localStorage.setItem(STORAGE_KEY, theme);

    if (persistRemote) {
      const user = this.authService.currentUser;
      if (user) {
        try {
          await this.authService.updateProfile(user.uid, { darkMode: theme === 'dark' });
        } catch {
          /* La persistencia local ya se realizó; ignoramos fallos remotos puntuales */
        }
      }
    }
  }

  /** Alterna entre claro y oscuro. Útil para un toggle simple. */
  async toggleDark(enabled: boolean): Promise<void> {
    await this.set(enabled ? 'dark' : 'light');
  }

  /** true si el tema activo es oscuro. */
  get isDark(): boolean {
    return this.theme === 'dark';
  }

  // ── Internos ──────────────────────────────────────────────

  /** Aplica la clase `.theme-<id>` al <body>, removiendo las demás. */
  private applyToDom(theme: AppTheme): void {
    const body = document.body;
    THEME_META.forEach((t) => body.classList.remove(`${THEME_CLASS_PREFIX}${t.id}`));
    body.classList.add(`${THEME_CLASS_PREFIX}${theme}`);
  }

  /** Lee el tema guardado en localStorage o cae al claro (o preferencia del sistema). */
  private readStoredTheme(): AppTheme {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;

    // Sin preferencia guardada: respeta la del sistema operativo
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
}
