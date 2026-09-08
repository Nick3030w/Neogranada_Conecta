import { ResourceCategory } from './resource.interface';

export type UserRole = 'student' | 'admin';

/** Categoría preferida del estudiante. Cadena vacía = sin preferencia. */
export type FavoriteCategory = ResourceCategory | '';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  studentCode: string;
  academicProgram: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;

  // ── Personalización ────────────────────────────────────────
  /**
   * Foto de perfil almacenada como data URL (JPEG cuadrado ~256px).
   * Se guarda dentro del documento del usuario para no depender de
   * Firebase Storage. Cadena vacía / undefined = sin foto.
   */
  photoUrl?: string;
  /** Teléfono de contacto (opcional) */
  phone?: string;

  // ── Preferencias de cuenta ─────────────────────────────────
  notificationsMuted?: boolean;
  darkMode?: boolean;
  /** Ruta a la que entra el usuario justo después de iniciar sesión */
  startPage?: string;
  /** Categoría que el catálogo destaca y ordena primero (solo estudiantes) */
  favoriteCategory?: FavoriteCategory;
  fcmToken?: string;
}

/**
 * Campos que el propio usuario puede modificar desde la pantalla de perfil.
 * Se usa para tipar `AuthService.updateProfile` y evitar escrituras
 * accidentales sobre campos sensibles (uid, email, role, studentCode).
 */
export type EditableProfileFields = Pick<
  UserProfile,
  | 'fullName'
  | 'academicProgram'
  | 'phone'
  | 'photoUrl'
  | 'notificationsMuted'
  | 'darkMode'
  | 'startPage'
  | 'favoriteCategory'
  | 'fcmToken'
>;

export interface StartPageOption {
  value: string;
  label: string;
}

/**
 * Pantallas válidas como destino inicial por rol.
 * Actúa además como lista blanca: cualquier valor fuera de aquí se ignora
 * para que una preferencia corrupta no rompa la navegación ni burle los guards.
 */
export const START_PAGE_OPTIONS: Record<UserRole, StartPageOption[]> = {
  student: [
    { value: '/student/home', label: 'Inicio' },
    { value: '/student/catalog', label: 'Catálogo' },
    { value: '/student/calendar', label: 'Calendario' },
    { value: '/student/map', label: 'Mapa' },
    { value: '/student/chats', label: 'Chats' },
  ],
  admin: [
    { value: '/admin/home', label: 'Inicio' },
    { value: '/admin/confirmation', label: 'Confirmación' },
    { value: '/admin/calendar', label: 'Calendario' },
    { value: '/admin/chats', label: 'Chats' },
  ],
};

export const DEFAULT_START_PAGE: Record<UserRole, string> = {
  student: '/student/home',
  admin: '/admin/home',
};

/** Devuelve la ruta inicial preferida del usuario, o la de por defecto si no es válida. */
export function resolveStartPage(role: UserRole, startPage?: string): string {
  const isAllowed = START_PAGE_OPTIONS[role]?.some((o) => o.value === startPage);
  return isAllowed ? (startPage as string) : DEFAULT_START_PAGE[role];
}
