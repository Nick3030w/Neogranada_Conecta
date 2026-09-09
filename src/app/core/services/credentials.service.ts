import { Injectable } from '@angular/core';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

/** Clave única bajo la cual se guardan las credenciales recordadas */
const CREDENTIALS_KEY = 'remembered_login';

export interface StoredCredentials {
  email: string;
  password: string;
}

/**
 * Maneja el almacenamiento seguro (cifrado) del correo y la contraseña
 * del estudiante para la opción "Recordar mis datos".
 *
 * En iOS los datos se guardan en el Keychain del sistema y en Android
 * se cifran con una clave del Android Keystore (AES-GCM), por lo que
 * nunca quedan en texto plano en el dispositivo.
 */
@Injectable({ providedIn: 'root' })
export class CredentialsService {
  /** Guarda (o sobrescribe) el correo y la contraseña de forma cifrada */
  async save(email: string, password: string): Promise<void> {
    await SecureStorage.set(CREDENTIALS_KEY, { email, password });
  }

  /** Recupera las credenciales guardadas, o null si no existen o están corruptas */
  async load(): Promise<StoredCredentials | null> {
    try {
      const data = await SecureStorage.get(CREDENTIALS_KEY);
      if (!data || typeof data !== 'object') return null;

      const { email, password } = data as Record<string, unknown>;
      if (typeof email !== 'string' || typeof password !== 'string') return null;

      return { email, password };
    } catch {
      // Datos corruptos, inaccesibles o inexistentes: se ignoran de forma segura
      return null;
    }
  }

  /** Elimina las credenciales guardadas del almacenamiento seguro */
  async clear(): Promise<void> {
    try {
      await SecureStorage.remove(CREDENTIALS_KEY);
    } catch {
      // No-op si no existían credenciales guardadas
    }
  }
}
