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
import { BlockSpaceType } from '../interfaces/campus-block.interface';
import { BLOCKS_LIST } from '../data/campus-blocks.data';

/** Tipos de espacio de un bloque que se sincronizan como recurso reservable. */
const SYNCED_SPACE_CATEGORIES: Partial<Record<BlockSpaceType, ResourceCategory>> = {
  'Aula': 'aula',
  'Laboratorio': 'laboratorio',
};

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
   * Siembra los recursos que NO se derivan de las fotos de los bloques
   * (Bloque D, instrumentos y elementos deportivos) si la colección está vacía.
   * Las aulas y laboratorios de los bloques con fotos los crea `syncBlockSpaces()`.
   */
  async seedIfEmpty(): Promise<void> {
    const snap = await getDocs(collection(this.db, this.COL));
    if (!snap.empty) return;

    const seeds: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>[] = [
      // ── Bloque A — Facultad de Ingeniería ─────────────────────
      { name: 'Piano Digital',              description: 'Piano digital Yamaha para préstamo',         category: 'instrumentos_musicales', status: 'disponible', location: 'Bloque A' },
      { name: 'Guitarra Acústica',          description: 'Guitarra acústica para préstamo',            category: 'instrumentos_musicales', status: 'disponible', location: 'Bloque A' },
      { name: 'Guitarra Eléctrica',         description: 'Guitarra eléctrica para préstamo',           category: 'instrumentos_musicales', status: 'disponible', location: 'Bloque A' },
      { name: 'Batería',                    description: 'Batería acústica para préstamo',             category: 'instrumentos_musicales', status: 'disponible', location: 'Bloque A' },
      // ── Bloque D — Facultad de Medicina ──────────────────────
      { name: 'Aula especial IV-A',         description: 'Aula especial piso IV',                      category: 'aula',                   status: 'disponible', location: 'Bloque D' },
      { name: 'Aula especial IV-B',         description: 'Aula especial piso IV',                      category: 'aula',                   status: 'disponible', location: 'Bloque D' },
      { name: 'Aula especial IX-A (D)',     description: 'Aula especial piso IX',                      category: 'aula',                   status: 'disponible', location: 'Bloque D' },
      { name: 'Aula especial IX-B (D)',     description: 'Aula especial piso IX',                      category: 'aula',                   status: 'disponible', location: 'Bloque D' },
      { name: 'Aula especial X-A (D)',      description: 'Aula especial piso X',                       category: 'aula',                   status: 'disponible', location: 'Bloque D' },
      { name: 'Aula especial X-B (D)',      description: 'Aula especial piso X',                       category: 'aula',                   status: 'disponible', location: 'Bloque D' },
      { name: 'Laboratorio de Testeo I-II', description: 'Laboratorio de testeo',                      category: 'laboratorio',            status: 'disponible', location: 'Bloque D' },
      { name: 'Balones de fútbol',          description: 'Kit de balones de fútbol para préstamo',     category: 'elementos_deportivos',   status: 'disponible', location: 'Bloque D' },
      { name: 'Balones de rugby',           description: 'Balones de rugby para préstamo',             category: 'elementos_deportivos',   status: 'disponible', location: 'Bloque D' },
      { name: 'Redes y mallas',             description: 'Redes deportivas para préstamo',             category: 'elementos_deportivos',   status: 'disponible', location: 'Bloque D' },
      { name: 'Raquetas de tenis',          description: 'Set de raquetas de tenis para préstamo',     category: 'elementos_deportivos',   status: 'disponible', location: 'Bloque D' },
      { name: 'Raquetas de ping pong',      description: 'Set de raquetas de ping pong para préstamo', category: 'elementos_deportivos',   status: 'disponible', location: 'Bloque D' },
      // ── Bloque E — Facultad de Ciencias Básicas ───────────────
      { name: 'Violín',                     description: 'Violín para préstamo estudiantil',           category: 'instrumentos_musicales', status: 'disponible', location: 'Bloque E' },
      { name: 'Balones de baloncesto',      description: 'Balones de baloncesto para préstamo',        category: 'elementos_deportivos',   status: 'disponible', location: 'Bloque E' },
      { name: 'Balones de voleibol',        description: 'Balones de voleibol para préstamo',          category: 'elementos_deportivos',   status: 'disponible', location: 'Bloque E' },
    ];

    for (const seed of seeds) {
      await this.create(seed);
    }
  }

  /**
   * Sincroniza las aulas y laboratorios de los bloques con fotos
   * (`syncWithFirestore: true` en BLOCKS_DATA) con la colección `resources`:
   * - crea los que faltan (estado `disponible`),
   * - elimina los de esos bloques que ya no existen en las fotos,
   * - actualiza descripción e imagen de los que se mantienen (conserva su
   *   `id` y su `status`, para no afectar reservas ni la gestión del admin).
   *
   * Es idempotente: si todo coincide no escribe nada. Solo el admin tiene
   * permisos de escritura sobre `resources`.
   */
  async syncBlockSpaces(): Promise<void> {
    type Desired = Pick<Resource, 'name' | 'description' | 'category' | 'location'> & { imageUrl: string | null };

    const managedLocations = new Set<string>();
    const desired = new Map<string, Desired>();

    for (const block of BLOCKS_LIST) {
      if (!block.syncWithFirestore) continue;
      managedLocations.add(block.name);

      for (const space of block.spaces) {
        const category = SYNCED_SPACE_CATEGORIES[space.type];
        if (!category) continue;
        desired.set(this.spaceKey(block.name, space.name), {
          name: space.name,
          description: space.description ?? '',
          category,
          location: block.name,
          imageUrl: space.imageUrl ?? null,
        });
      }
    }

    const syncedCategories = [...new Set(Object.values(SYNCED_SPACE_CATEGORIES))];
    const snap = await getDocs(
      query(collection(this.db, this.COL), where('category', 'in', syncedCategories)),
    );

    const batch = writeBatch(this.db);
    let pendingWrites = 0;

    for (const d of snap.docs) {
      const data = d.data();
      const location = data['location'] as string;
      if (!managedLocations.has(location)) continue;

      const key = this.spaceKey(location, data['name'] as string);
      const target = desired.get(key);

      if (!target) {
        batch.delete(d.ref);
        pendingWrites++;
        continue;
      }

      desired.delete(key);
      const changed =
        data['description'] !== target.description ||
        data['category'] !== target.category ||
        (data['imageUrl'] ?? null) !== target.imageUrl;

      if (changed) {
        batch.update(d.ref, {
          description: target.description,
          category: target.category,
          imageUrl: target.imageUrl,
          updatedAt: serverTimestamp(),
        });
        pendingWrites++;
      }
    }

    for (const target of desired.values()) {
      batch.set(doc(collection(this.db, this.COL)), {
        ...target,
        status: 'disponible',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      pendingWrites++;
    }

    if (pendingWrites > 0) {
      await batch.commit();
    }
  }

  /** Clave única de un espacio: bloque + nombre (sin distinguir mayúsculas). */
  private spaceKey(location: string, name: string): string {
    return `${location}|${name}`.trim().toLowerCase();
  }
}
