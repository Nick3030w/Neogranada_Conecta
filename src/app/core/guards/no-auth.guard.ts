import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { from, of } from 'rxjs';

/** Redirige al home si ya hay sesión activa (evita volver al login) */
export const noAuthGuard: CanActivateFn = () => {
  const auth      = inject(Auth);
  const firestore = inject(Firestore);
  const router    = inject(Router);

  return authState(auth).pipe(
    // Espera a que Firebase resuelva el estado inicial antes de decidir
    filter(user => user !== undefined),
    take(1),
    switchMap((user) => {
      if (!user) return of(true);
      // Leer rol desde Firestore para redirigir correctamente
      return from(getDoc(doc(firestore, 'users', user.uid))).pipe(
        map((snap) => {
          const role  = snap.exists() ? snap.data()['role'] : null;
          const route = role === 'admin' ? '/admin/home' : '/student/home';
          router.navigate([route], { replaceUrl: true });
          return false;
        })
      );
    })
  );
};
