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
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Resource, ResourceCategory, ResourceStatus } from '../interfaces/resource.interface';

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

  async seedIfEmpty(): Promise<void> {
    const snap = await getDocs(collection(this.db, this.COL));
    if (!snap.empty) return;

    /**
     * Recursos derivados exactamente de BLOCKS_DATA en block-detail.page.ts.
     * Mapeo de tipos:
     *   'Aula'                → 'aula'
     *   'Laboratorio'         → 'laboratorio'
     *   'Instrumento musical' → 'instrumentos_musicales'
     *   'Elemento deportivo'  → 'elementos_deportivos'
     * (Sala de cómputo y Biblioteca son informativos, no se reservan)
     */
    const seeds: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>[] = [
      // ── Bloque A — Facultad de Ingeniería ─────────────────────
      { name: 'Aula 101',                                          description: 'Aula de clases general',                          category: 'aula',                   status: 'disponible', location: 'Bloque A' },
      { name: 'Aula 102',                                          description: 'Aula de clases general',                          category: 'aula',                   status: 'disponible', location: 'Bloque A' },
      { name: 'Piano Digital',                                     description: 'Piano digital Yamaha para préstamo',               category: 'instrumentos_musicales', status: 'disponible', location: 'Bloque A' },
      { name: 'Guitarra Acústica',                                 description: 'Guitarra acústica para préstamo',                  category: 'instrumentos_musicales', status: 'disponible', location: 'Bloque A' },
      // ── Bloque B — Facultad de Ciencias Económicas ────────────
      { name: 'Aula especial V-A',                                 description: 'Aula especial piso V',                            category: 'aula',                   status: 'disponible', location: 'Bloque B' },
      { name: 'Aula especial V-B',                                 description: 'Aula especial piso V',                            category: 'aula',                   status: 'disponible', location: 'Bloque B' },
      { name: 'Aula especial IX-A (B)',                            description: 'Aula especial piso IX',                           category: 'aula',                   status: 'disponible', location: 'Bloque B' },
      { name: 'Aula especial IX-B (B)',                            description: 'Aula especial piso IX',                           category: 'aula',                   status: 'disponible', location: 'Bloque B' },
      { name: 'Aula especial X-A (B)',                             description: 'Aula especial piso X',                            category: 'aula',                   status: 'disponible', location: 'Bloque B' },
      { name: 'Aula especial X-B (B)',                             description: 'Aula especial piso X',                            category: 'aula',                   status: 'disponible', location: 'Bloque B' },
      // ── Bloque C — Facultad de Derecho ────────────────────────
      { name: 'Aula especial IX-A (C)',                            description: 'Aula especial piso IX',                           category: 'aula',                   status: 'disponible', location: 'Bloque C' },
      { name: 'Aula especial IX-B (C)',                            description: 'Aula especial piso IX',                           category: 'aula',                   status: 'disponible', location: 'Bloque C' },
      { name: 'Aula especial X-A (C)',                             description: 'Aula especial piso X',                            category: 'aula',                   status: 'disponible', location: 'Bloque C' },
      { name: 'Aula especial X-B (C)',                             description: 'Aula especial piso X',                            category: 'aula',                   status: 'disponible', location: 'Bloque C' },
      // ── Bloque D — Facultad de Medicina ──────────────────────
      { name: 'Aula especial IV-A',                                description: 'Aula especial piso IV',                           category: 'aula',                   status: 'disponible', location: 'Bloque D' },
      { name: 'Aula especial IV-B',                                description: 'Aula especial piso IV',                           category: 'aula',                   status: 'disponible', location: 'Bloque D' },
      { name: 'Aula especial IX-A (D)',                            description: 'Aula especial piso IX',                           category: 'aula',                   status: 'disponible', location: 'Bloque D' },
      { name: 'Aula especial IX-B (D)',                            description: 'Aula especial piso IX',                           category: 'aula',                   status: 'disponible', location: 'Bloque D' },
      { name: 'Aula especial X-A (D)',                             description: 'Aula especial piso X',                            category: 'aula',                   status: 'disponible', location: 'Bloque D' },
      { name: 'Aula especial X-B (D)',                             description: 'Aula especial piso X',                            category: 'aula',                   status: 'disponible', location: 'Bloque D' },
      { name: 'Laboratorio de Testeo I-II',                        description: 'Laboratorio de testeo',                           category: 'laboratorio',            status: 'disponible', location: 'Bloque D' },
      { name: 'Balones de fútbol',                                 description: 'Kit de balones para préstamo',                    category: 'elementos_deportivos',   status: 'disponible', location: 'Bloque D' },
      { name: 'Redes y mallas',                                    description: 'Redes deportivas para préstamo',                  category: 'elementos_deportivos',   status: 'disponible', location: 'Bloque D' },
      // ── Bloque E — Facultad de Ciencias Básicas ───────────────
      { name: 'AE-XI',                                             description: 'Aula especial XI',                                category: 'aula',                   status: 'disponible', location: 'Bloque E' },
      { name: 'AE-XII',                                            description: 'Aula especial XII',                               category: 'aula',                   status: 'disponible', location: 'Bloque E' },
      { name: 'Violín',                                            description: 'Violín para préstamo estudiantil',                 category: 'instrumentos_musicales', status: 'disponible', location: 'Bloque E' },
      { name: 'Balones de baloncesto',                             description: 'Balones para préstamo',                           category: 'elementos_deportivos',   status: 'disponible', location: 'Bloque E' },
      // ── Bloque F — Facultad de Relaciones Internacionales ─────
      { name: 'Laboratorio de Agregados y Concretos',              description: 'Laboratorio de materiales',                       category: 'laboratorio',            status: 'disponible', location: 'Bloque F' },
      { name: 'Laboratorio de Pavimentos I',                       description: 'Laboratorio de pavimentos',                       category: 'laboratorio',            status: 'disponible', location: 'Bloque F' },
      { name: 'Laboratorio de Pavimentos II',                      description: 'Laboratorio de pavimentos',                       category: 'laboratorio',            status: 'disponible', location: 'Bloque F' },
      { name: 'Laboratorio de Topografía',                         description: 'Laboratorio de topografía',                       category: 'laboratorio',            status: 'disponible', location: 'Bloque F' },
      { name: 'Laboratorio de Suelos',                             description: 'Laboratorio de suelos',                           category: 'laboratorio',            status: 'disponible', location: 'Bloque F' },
      { name: 'Laboratorio de Electrónica I',                      description: 'Laboratorio de electrónica',                      category: 'laboratorio',            status: 'disponible', location: 'Bloque F' },
      { name: 'Laboratorio de Electrónica II',                     description: 'Laboratorio de electrónica',                      category: 'laboratorio',            status: 'disponible', location: 'Bloque F' },
      { name: 'Laboratorio de Fotogrametría y Fotointerpretación', description: 'Laboratorio de fotogrametría',                    category: 'laboratorio',            status: 'disponible', location: 'Bloque F' },
      { name: 'Laboratorio Calidad de Aguas',                      description: 'Laboratorio de aguas',                            category: 'laboratorio',            status: 'disponible', location: 'Bloque F' },
      { name: 'Laboratorio Física Mecánica',                       description: 'Laboratorio de física',                           category: 'laboratorio',            status: 'disponible', location: 'Bloque F' },
      { name: 'Laboratorio Calor y Ondas',                         description: 'Laboratorio de física',                           category: 'laboratorio',            status: 'disponible', location: 'Bloque F' },
      { name: 'Laboratorio de Hidráulica',                         description: 'Laboratorio de hidráulica',                       category: 'laboratorio',            status: 'disponible', location: 'Bloque F' },
      { name: 'Laboratorio Física Óptica y Acústica',              description: 'Laboratorio de física',                           category: 'laboratorio',            status: 'disponible', location: 'Bloque F' },
      { name: 'Laboratorio Física Electricidad y Magnetismo',      description: 'Laboratorio de física',                           category: 'laboratorio',            status: 'disponible', location: 'Bloque F' },
    ];

    for (const seed of seeds) {
      await this.create(seed);
    }
  }
}
