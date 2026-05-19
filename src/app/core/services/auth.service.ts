import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserProfile, UserRole } from '../interfaces/user.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$: Observable<UserProfile | null> = this.currentUserSubject.asObservable();

  constructor() {
    // Escucha cambios de sesión y carga el perfil desde Firestore
    onAuthStateChanged(this.auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const profile = await this.loadUserProfile(firebaseUser.uid);
        this.currentUserSubject.next(profile);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  /** Devuelve el perfil actual en memoria (sincrónico) */
  get currentUser(): UserProfile | null {
    return this.currentUserSubject.getValue();
  }

  /** Registra un nuevo estudiante (rol asignado automáticamente como 'student') */
  async register(data: {
    fullName: string;
    email: string;
    studentCode: string;
    academicProgram: string;
    password: string;
  }): Promise<void> {
    // Sin restricción de dominio: se acepta cualquier correo válido

    const credential = await createUserWithEmailAndPassword(
      this.auth,
      data.email,
      data.password
    );

    const profile: UserProfile = {
      uid: credential.user.uid,
      fullName: data.fullName,
      email: data.email,
      studentCode: data.studentCode,
      academicProgram: data.academicProgram,
      role: 'student', // Siempre student en registro público
      createdAt: new Date(),
      updatedAt: new Date(),
      notificationsMuted: false,
      darkMode: false,
    };

    await setDoc(doc(this.firestore, 'users', credential.user.uid), {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    this.currentUserSubject.next(profile);
    await this.router.navigate(['/student/home'], { replaceUrl: true });
  }

  /** Inicia sesión y redirige según el rol almacenado en Firestore */
  async login(email: string, password: string): Promise<void> {
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    const profile = await this.loadUserProfile(credential.user.uid);

    if (!profile || !['student', 'admin'].includes(profile.role)) {
      await signOut(this.auth);
      throw new Error('NO_VALID_ROLE');
    }

    this.currentUserSubject.next(profile);

    const route = profile.role === 'admin' ? '/admin/home' : '/student/home';
    await this.router.navigate([route], { replaceUrl: true });
  }

  /** Cierra sesión y redirige al login */
  async logout(): Promise<void> {
    await signOut(this.auth);
    this.currentUserSubject.next(null);
    await this.router.navigate(['/auth/login'], { replaceUrl: true });
  }

  /** Envía correo de recuperación de contraseña */
  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  /** Actualiza datos editables del perfil */
  async updateProfile(uid: string, data: Partial<Pick<UserProfile, 'fullName' | 'academicProgram' | 'notificationsMuted' | 'darkMode' | 'fcmToken'>>): Promise<void> {
    const ref = doc(this.firestore, 'users', uid);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });

    const current = this.currentUserSubject.getValue();
    if (current) {
      this.currentUserSubject.next({ ...current, ...data });
    }
  }

  /** Carga el perfil del usuario desde Firestore */
  private async loadUserProfile(uid: string): Promise<UserProfile | null> {
    const ref = doc(this.firestore, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...data,
      uid,
      createdAt: data['createdAt']?.toDate?.() ?? new Date(),
      updatedAt: data['updatedAt']?.toDate?.() ?? new Date(),
    } as UserProfile;
  }

  /** Valida que el correo sea institucional */
  private validateInstitutionalEmail(email: string): void {
    if (!email.toLowerCase().endsWith('@unimilitar.edu.co')) {
      throw new Error('INVALID_INSTITUTIONAL_EMAIL');
    }
  }

  /** Traduce errores de Firebase a mensajes amigables */
  static getErrorMessage(error: unknown): string {
    const code = (error as { code?: string; message?: string })?.code
      ?? (error as { message?: string })?.message
      ?? '';

    const messages: Record<string, string> = {
      'auth/email-already-in-use':    'Este correo ya está registrado. Intenta iniciar sesión.',
      'auth/invalid-email':           'El correo ingresado no es válido.',
      'auth/weak-password':           'La contraseña debe tener al menos 6 caracteres.',
      'auth/user-not-found':          'No encontramos una cuenta con ese correo.',
      'auth/wrong-password':          'Correo o contraseña incorrectos. Verifica tus datos.',
      'auth/invalid-credential':      'Correo o contraseña incorrectos. Verifica tus datos.',
      'auth/too-many-requests':       'Demasiados intentos fallidos. Intenta más tarde.',
      'auth/network-request-failed':  'Sin conexión a internet. Verifica tu red.',
      'INVALID_INSTITUTIONAL_EMAIL':  'Solo se permiten correos institucionales (@unimilitar.edu.co).',
      'NO_VALID_ROLE':                'No se pudo determinar el rol de tu cuenta. Contacta al administrador.',
    };

    return messages[code] ?? 'Ocurrió un error inesperado. Intenta de nuevo.';
  }
}
