import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Resource, ResourceCategory, ResourceStatus } from '../interfaces/resource.interface';

/**
 * ResourceService
 * Gestiona la colección `resources` en Firestore.
 *
 * Estructura Firestore:
 *   resources/{resourceId}  →  Resource
 */
@Injectable({ providedIn: 'root' })
export class ResourceService {
  private firestore = inject(Firestore);
  private readonly COL = 'resources';

  // ── Lectura ──────────────────────────────────────────────────

  /** Todos los recursos en tiempo real */
  getAll(): Observable<Resource[]> {
    const ref = collection(this.firestore, this.COL);
    const q   = query(ref, orderBy('name'));
    return collectionData(q, { idField: 'id' }) as Observable<Resource[]>;
  }

  /** Recursos filtrados por categoría en tiempo real */
  getByCategory(category: ResourceCategory): Observable<Resource[]> {
    const ref = collection(this.firestore, this.COL);
    const q   = query(ref, where('category', '==', category), orderBy('name'));
    return collectionData(q, { idField: 'id' }) as Observable<Resource[]>;
  }

  /** Recursos disponibles filtrados por categoría en tiempo real */
  getAvailableByCategory(category: ResourceCategory): Observable<Resource[]> {
    const ref = collection(this.firestore, this.COL);
    const q   = query(
      ref,
      where('category', '==', category),
      where('status', '==', 'disponible'),
      orderBy('name'),
    );
    return collectionData(q, { idField: 'id' }) as Observable<Resource[]>;
  }

  /** Un recurso por ID en tiempo real */
  getById(id: string): Observable<Resource | null> {
    const ref = doc(this.firestore, this.COL, id);
    return (docData(ref, { idField: 'id' }) as Observable<Resource>).pipe(
      catchError(() => of(null)),
    );
  }

  /** Verifica si una categoría tiene al menos un recurso disponible */
  isCategoryAvailable(category: ResourceCategory): Observable<boolean> {
    return this.getAvailableByCategory(category).pipe(
      map(resources => resources.length > 0),
    );
  }

  // ── Escritura (uso admin) ────────────────────────────────────

  /** Crea un nuevo recurso */
  async create(data: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = collection(this.firestore, this.COL);
    const docRef = await addDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  /** Actualiza campos de un recurso */
  async update(id: string, data: Partial<Omit<Resource, 'id' | 'createdAt'>>): Promise<void> {
    const ref = doc(this.firestore, this.COL, id);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  }

  /** Cambia el estado de disponibilidad de un recurso */
  async setStatus(id: string, status: ResourceStatus): Promise<void> {
    await this.update(id, { status });
  }

  /** Elimina un recurso */
  async delete(id: string): Promise<void> {
    const ref = doc(this.firestore, this.COL, id);
    await deleteDoc(ref);
  }

  // ── Seed (datos iniciales) ───────────────────────────────────

  /**
   * Carga datos semilla en Firestore si la colección está vacía.
   * Llamar una sola vez desde el admin o desde un script de inicialización.
   */
  async seedIfEmpty(): Promise<void> {
    const ref  = collection(this.firestore, this.COL);
    const snap = await import('@angular/fire/firestore').then(({ getDocs }) => getDocs(ref));
    if (!snap.empty) return;

    const seeds: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>[] = [
      { name: 'Laboratorio de Química',       description: 'Equipado para prácticas de química orgánica e inorgánica.',  category: 'laboratorio',          status: 'disponible' },
      { name: 'Laboratorio de Física',        description: 'Instrumentos de medición y experimentos de física general.', category: 'laboratorio',          status: 'disponible' },
      { name: 'Aula 101',                     description: 'Aula con capacidad para 40 estudiantes.',                    category: 'aula',                 status: 'disponible' },
      { name: 'Aula 202',                     description: 'Aula con videobeam y tablero inteligente.',                  category: 'aula',                 status: 'disponible' },
      { name: 'Sala de Biblioteca',           description: 'Sala de estudio con acceso a bases de datos.',               category: 'biblioteca',           status: 'disponible' },
      { name: 'Cancha Múltiple',              description: 'Cancha para fútbol, baloncesto y voleibol.',                 category: 'elementos_deportivos', status: 'disponible' },
      { name: 'Balones y Redes',              description: 'Kit de elementos deportivos para préstamo.',                 category: 'elementos_deportivos', status: 'disponible' },
      { name: 'Base de Datos Oracle',         description: 'Acceso a instancia Oracle para prácticas académicas.',       category: 'base_datos',           status: 'disponible' },
      { name: 'Piano Digital',                description: 'Piano digital Yamaha para práctica musical.',                category: 'instrumentos_musicales', status: 'disponible' },
      { name: 'Guitarra Acústica',            description: 'Guitarra acústica para préstamo estudiantil.',               category: 'instrumentos_musicales', status: 'disponible' },
      { name: 'Kit de Juegos de Mesa',        description: 'Ajedrez, dominó y otros juegos de mesa.',                   category: 'material_ludico',      status: 'disponible' },
      { name: 'Botiquín de Primeros Auxilios',description: 'Botiquín completo para actividades académicas.',             category: 'botiquin',             status: 'disponible' },
    ];

    for (const seed of seeds) {
      await this.create(seed);
    }
  }
}
