import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { filter, map, take } from 'rxjs/operators';

/** Protege rutas que requieren autenticación */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    // Espera hasta que Firebase haya resuelto el estado inicial
    // (authState emite undefined mientras inicializa, luego User | null)
    filter(user => user !== undefined),
    take(1),
    map(user => {
      if (user) return true;
      router.navigate(['/auth/login'], { replaceUrl: true });
      return false;
    })
  );
};
