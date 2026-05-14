import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../interfaces/user.interface';

/** Fábrica de guard por rol */
export function roleGuard(requiredRole: UserRole): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.currentUser;

    if (!user) {
      router.navigate(['/auth/login'], { replaceUrl: true });
      return false;
    }

    if (user.role !== requiredRole) {
      const home = user.role === 'admin' ? '/admin/home' : '/student/home';
      router.navigate([home], { replaceUrl: true });
      return false;
    }

    return true;
  };
}
