import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from '@angular/fire/firestore';
import { StudentContact } from '../interfaces/chat.interface';

/** Cuántos estudiantes se traen al construir el directorio en memoria */
const DIRECTORY_LIMIT = 500;
/** Vida útil de la caché del directorio (ms). Pasado esto, se recarga */
const DIRECTORY_TTL_MS = 60_000;
/** Máximo de resultados devueltos al buscador */
const MAX_RESULTS = 30;
/** Mínimo de caracteres para que la búsqueda se dispare */
export const MIN_SEARCH_LENGTH = 2;

/**
 * Consultas sobre el directorio de usuarios.
 *
 * Firestore no ofrece búsqueda por subcadena, así que el directorio de
 * estudiantes se trae una vez por sesión y se filtra en memoria. Eso permite
 * buscar por cualquier parte del nombre e ignorar acentos y mayúsculas, algo
 * que una consulta por prefijo no lograría.
 *
 * Si el término parece un código y no aparece en la caché (por ejemplo, un
 * estudiante fuera del tope de DIRECTORY_LIMIT), se hace una consulta directa
 * por prefijo de código como respaldo.
 *
 * Para un padrón mucho mayor, el camino sería indexar un campo normalizado
 * (`fullNameSearch`) y consultar por prefijo, o mover la búsqueda a Cloud
 * Functions / Algolia.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly db = inject(Firestore);

  private directory?: StudentContact[];
  private directoryLoad?: Promise<StudentContact[]>;
  /** Momento en que se cargó la caché, para caducarla y ver registros nuevos */
  private directoryLoadedAt = 0;

  /**
   * Busca estudiantes por nombre (cualquier parte) o código estudiantil.
   * @param term Texto escrito por el usuario
   * @param excludeUid uid a excluir de los resultados (normalmente uno mismo)
   */
  async searchStudents(term: string, excludeUid?: string): Promise<StudentContact[]> {
    const needle = this.normalize(term);
    if (needle.length < MIN_SEARCH_LENGTH) return [];

    const directory = await this.loadDirectory();
    let results = directory.filter(
      (s) =>
        s.uid !== excludeUid &&
        (this.normalize(s.fullName).includes(needle) || s.studentCode.toLowerCase().includes(needle)),
    );

    // Respaldo: código exacto/por prefijo para estudiantes fuera de la caché
    const rawCode = term.trim();
    if (results.length === 0 && /^\d{3,}$/.test(rawCode)) {
      results = (await this.searchByCodePrefix(rawCode)).filter((s) => s.uid !== excludeUid);
    }

    return results
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'))
      .slice(0, MAX_RESULTS);
  }

  /** Lee un estudiante concreto por uid. */
  async getStudent(uid: string): Promise<StudentContact | null> {
    if (!uid) return null;
    const snap = await getDoc(doc(this.db, 'users', uid));
    if (!snap.exists()) return null;

    const data = snap.data();
    if (data['role'] !== 'student') return null;
    return this.toContact(snap.id, data);
  }

  /**
   * Fuerza a recargar el directorio en la próxima búsqueda.
   * Útil tras registrar usuarios nuevos.
   */
  invalidateDirectory(): void {
    this.directory = undefined;
    this.directoryLoad = undefined;
    this.directoryLoadedAt = 0;
  }

  // ── Internos ──────────────────────────────────────────────

  /**
   * Trae y memoriza el directorio de estudiantes. La caché caduca a los
   * DIRECTORY_TTL_MS para que los estudiantes registrados durante la sesión
   * aparezcan en la búsqueda sin obligar a recargar la app, sin dejar de
   * evitar una consulta por cada tecla.
   */
  private loadDirectory(): Promise<StudentContact[]> {
    const fresh = Date.now() - this.directoryLoadedAt < DIRECTORY_TTL_MS;
    if (this.directory && fresh) return Promise.resolve(this.directory);
    if (this.directoryLoad) return this.directoryLoad;

    // Solo igualdad + limit: no requiere índice compuesto en Firestore
    this.directoryLoad = getDocs(
      query(collection(this.db, 'users'), where('role', '==', 'student'), limit(DIRECTORY_LIMIT)),
    )
      .then((snap) => {
        this.directory = snap.docs.map((d) => this.toContact(d.id, d.data()));
        this.directoryLoadedAt = Date.now();
        return this.directory;
      })
      .catch((error) => {
        // No memoriza el fallo: la próxima búsqueda reintenta
        this.directoryLoad = undefined;
        throw error;
      });

    return this.directoryLoad;
  }

  /** Consulta por prefijo de código. Rango sobre un solo campo: sin índice compuesto. */
  private async searchByCodePrefix(code: string): Promise<StudentContact[]> {
    const snap = await getDocs(
      query(
        collection(this.db, 'users'),
        orderBy('studentCode'),
        where('studentCode', '>=', code),
        where('studentCode', '<=', `${code}\uf8ff`),
        limit(MAX_RESULTS),
      ),
    );

    return snap.docs
      .filter((d) => d.data()['role'] === 'student')
      .map((d) => this.toContact(d.id, d.data()));
  }

  private toContact(uid: string, data: Record<string, unknown>): StudentContact {
    return {
      uid,
      fullName: (data['fullName'] as string) ?? '',
      studentCode: (data['studentCode'] as string) ?? '',
      academicProgram: (data['academicProgram'] as string) ?? '',
      photoUrl: (data['photoUrl'] as string) ?? '',
    };
  }

  /** Minúsculas y sin acentos, para que "perez" encuentre "Pérez". */
  private normalize(value: string): string {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
