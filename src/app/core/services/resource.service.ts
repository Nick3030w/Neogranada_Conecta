import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Resource, ResourceCategory, ResourceStatus } from '../interfaces/resource.interface';
import { BLOCKS_LIST } from '../data/campus-blocks.data';
import { ExistingResource, SYNCED_CATEGORIES, planResourceSync } from '../data/resource-sync';

// Re-exportamos para que los componentes puedan importar desde el servicio si lo prefieren
export { BOOKABLE_CATEGORIES, isBookableCategory } from '../interfaces/resource.interface';

@Injectable({ providedIn: 'root' })
export class ResourceService {
  private readonly COL = 'resources';
  private readonly db: Firestore;

  constructor() {
    this.db = inject(Firestore);
  }

  // ── Lectura ───────────────────────────────────────────────────

  getAll(): Observable<Resource[]> {
    return new Observable(observer => {
      const unsub = onSnapshot(
        collection(this.db, this.COL),
        snap => observer.next(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() } as Resource))
            .sort((a, b) => a.name.localeCompare(b.name))
        ),
        err => observer.error(err),
      );
      return () => unsub();
    });
  }

  getByCategory(category: ResourceCategory): Observable<Resource[]> {
    return new Observable(observer => {
      const unsub = onSnapshot(
        query(collection(this.db, this.COL), where('category', '==', category)),
        snap => observer.next(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() } as Resource))
            .sort((a, b) => a.name.localeCompare(b.name))
        ),
        err => observer.error(err),
      );
      return () => unsub();
    });
  }

  getAvailableByCategory(category: ResourceCategory): Observable<Resource[]> {
    return new Observable(observer => {
      const unsub = onSnapshot(
        query(
          collection(this.db, this.COL),
          where('category', '==', category),
          where('status', '==', 'disponible'),
        ),
        snap => observer.next(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() } as Resource))
            .sort((a, b) => a.name.localeCompare(b.name))
        ),
        err => observer.error(err),
      );
      return () => unsub();
    });
  }

  getById(id: string): Observable<Resource | null> {
    return new Observable(observer => {
      const unsub = onSnapshot(
        doc(this.db, this.COL, id),
        snap => observer.next(snap.exists() ? ({ id: snap.id, ...snap.data() } as Resource) : null),
        err => observer.error(err),
      );
      return () => unsub();
    });
  }

  // ── Escritura ─────────────────────────────────────────────────

  async create(data: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(this.db, this.COL), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async update(id: string, data: Partial<Omit<Resource, 'id' | 'createdAt'>>): Promise<void> {
    await updateDoc(doc(this.db, this.COL, id), { ...data, updatedAt: serverTimestamp() });
  }

  async setStatus(id: string, status: ResourceStatus): Promise<void> {
    await this.update(id, { status });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.db, this.COL, id));
  }

  /**
   * Siembra el Bloque D (aún sin sincronizar con BLOCKS_DATA) si la colección
   * está vacía. El resto de recursos (aulas, laboratorios, instrumentos y
   * elementos deportivos) los crea `syncBlockSpaces()`.
   */
  async seedIfEmpty(): Promise<void> {
    const snap = await getDocs(collection(this.db, this.COL));
    if (!snap.empty) return;

    const seeds: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>[] = [
      // ── Bloque D ──────────────────────
      { name: 'Aula especial IV-A',         description: 'Aula especial piso IV', category: 'aula',        status: 'disponible', location: 'Bloque D' },
      { name: 'Aula especial IV-B',         description: 'Aula especial piso IV', category: 'aula',        status: 'disponible', location: 'Bloque D' },
      { name: 'Aula especial IX-A (D)',     description: 'Aula especial piso IX', category: 'aula',        status: 'disponible', location: 'Bloque D' },
      { name: 'Aula especial IX-B (D)',     description: 'Aula especial piso IX', category: 'aula',        status: 'disponible', location: 'Bloque D' },
      { name: 'Aula especial X-A (D)',      description: 'Aula especial piso X',  category: 'aula',        status: 'disponible', location: 'Bloque D' },
      { name: 'Aula especial X-B (D)',      description: 'Aula especial piso X',  category: 'aula',        status: 'disponible', location: 'Bloque D' },
      { name: 'Laboratorio de Testeo I-II', description: 'Laboratorio de testeo', category: 'laboratorio', status: 'disponible', location: 'Bloque D' },
    ];

    for (const seed of seeds) {
      await this.create(seed);
    }
  }

  /**
   * Sincroniza la colección `resources` con los bloques que tienen
   * `syncWithFirestore: true` en BLOCKS_DATA (ver `planResourceSync()`):
   * - crea lo que falta (estado `disponible`),
   * - mueve de bloque los instrumentos y elementos deportivos que cambiaron
   *   de lugar, conservando su `id` y su `status`,
   * - actualiza descripción e imagen de lo que se mantiene,
   * - elimina lo que ya no existe.
   *
   * Es idempotente: si todo coincide no escribe nada. Solo el admin tiene
   * permisos de escritura sobre `resources`.
   */
  async syncBlockSpaces(): Promise<void> {
    const snap = await getDocs(
      query(collection(this.db, this.COL), where('category', 'in', SYNCED_CATEGORIES)),
    );
    const existing = snap.docs.map(d => ({ id: d.id, ...d.data() } as ExistingResource));
    const plan = planResourceSync(BLOCKS_LIST, existing);

    if (plan.create.length === 0 && plan.update.length === 0 && plan.remove.length === 0) return;

    const batch = writeBatch(this.db);
    for (const id of plan.remove) {
      batch.delete(doc(this.db, this.COL, id));
    }
    for (const { id, changes } of plan.update) {
      batch.update(doc(this.db, this.COL, id), { ...changes, updatedAt: serverTimestamp() });
    }
    for (const data of plan.create) {
      batch.set(doc(collection(this.db, this.COL)), {
        ...data,
        status: 'disponible',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
}
