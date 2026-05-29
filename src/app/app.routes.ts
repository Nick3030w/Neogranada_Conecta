import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Redirige raíz al login
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },

  // --- Autenticación (sin sesión) ---
  {
    path: 'auth',
    canActivate: [noAuthGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.page').then((m) => m.LoginPage),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.page').then((m) => m.RegisterPage),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.page').then(
            (m) => m.ForgotPasswordPage
          ),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // --- Área Estudiante ---
  {
    path: 'student',
    canActivate: [authGuard, roleGuard('student')],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/student/home/home.page').then((m) => m.StudentHomePage),
      },
      {
        path: 'catalog',
        loadComponent: () =>
          import('./features/student/catalog/catalog.page').then((m) => m.CatalogPage),
      },
      {
        path: 'availability/:resourceId',
        loadComponent: () =>
          import('./features/student/availability/availability.page').then(
            (m) => m.AvailabilityPage
          ),
      },
      {
        path: 'booking/:resourceId',
        loadComponent: () =>
          import('./features/student/booking/booking.page').then((m) => m.BookingPage),
      },
      {
        path: 'confirmation/:bookingId',
        loadComponent: () =>
          import('./features/student/confirmation/confirmation.page').then(
            (m) => m.ConfirmationPage
          ),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/student/calendar/calendar.page').then((m) => m.StudentCalendarPage),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/shared/notifications/notifications.page').then(
            (m) => m.NotificationsPage
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/shared/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/shared/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'tutorial',
        loadComponent: () =>
          import('./features/student/tutorial/tutorial.page').then((m) => m.TutorialPage),
      },
      {
        path: 'library',
        loadComponent: () =>
          import('./features/student/library/library.page').then((m) => m.LibraryPage),
      },
      {
        path: 'databases',
        loadComponent: () =>
          import('./features/student/databases/databases.page').then((m) => m.DatabasesPage),
      },
      {
        path: 'map',
        loadComponent: () =>
          import('./features/student/map/map.page').then((m) => m.MapPage),
      },
      {
        path: 'block/:blockId',
        loadComponent: () =>
          import('./features/student/block-detail/block-detail.page').then((m) => m.BlockDetailPage),
      },
      {
        path: 'chat/:bookingId',
        loadComponent: () =>
          import('./features/shared/chat/chat.page').then((m) => m.ChatPage),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },

  // --- Área Administrador ---
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('admin')],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/admin/home/home.page').then((m) => m.AdminHomePage),
      },
      {
        path: 'confirmation',
        loadComponent: () =>
          import('./features/admin/confirmation/confirmation.page').then(
            (m) => m.AdminConfirmationPage
          ),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/admin/calendar/calendar.page').then((m) => m.AdminCalendarPage),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/shared/notifications/notifications.page').then(
            (m) => m.NotificationsPage
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/shared/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/shared/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'chat/:bookingId',
        loadComponent: () =>
          import('./features/shared/chat/chat.page').then((m) => m.ChatPage),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'auth/login' },
];
