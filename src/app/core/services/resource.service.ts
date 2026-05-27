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

    const seeds: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>[] = [
      { name: 'Laboratorio de Química',        description: 'Prácticas de química orgánica e inorgánica.',          category: 'laboratorio',            status: 'disponible' },
      { name: 'Laboratorio de Física',         description: 'Instrumentos de medición y experimentos de física.',   category: 'laboratorio',            status: 'disponible' },
      { name: 'Aula 101',                      description: 'Aula con capacidad para 40 estudiantes.',              category: 'aula',                   status: 'disponible' },
      { name: 'Aula 202',                      description: 'Aula con videobeam y tablero inteligente.',            category: 'aula',                   status: 'disponible' },
      { name: 'Sala de Biblioteca',            description: 'Sala de estudio con acceso a bases de datos.',         category: 'biblioteca',             status: 'disponible' },
      { name: 'Cancha Múltiple',               description: 'Cancha para fútbol, baloncesto y voleibol.',           category: 'elementos_deportivos',   status: 'disponible' },
      { name: 'Balones y Redes',               description: 'Kit de elementos deportivos para préstamo.',           category: 'elementos_deportivos',   status: 'disponible' },
      { name: 'Base de Datos Oracle',          description: 'Acceso a instancia Oracle para prácticas académicas.', category: 'base_datos',             status: 'disponible' },
      { name: 'Piano Digital',                 description: 'Piano digital Yamaha para práctica musical.',          category: 'instrumentos_musicales', status: 'disponible' },
      { name: 'Guitarra Acústica',             description: 'Guitarra acústica para préstamo estudiantil.',         category: 'instrumentos_musicales', status: 'disponible' },
      { name: 'Kit de Juegos de Mesa',         description: 'Ajedrez, dominó y otros juegos de mesa.',             category: 'material_ludico',        status: 'disponible' },
      { name: 'Botiquín de Primeros Auxilios', description: 'Botiquín completo para actividades académicas.',       category: 'botiquin',               status: 'disponible' },
    ];

    for (const seed of seeds) {
      await this.create(seed);
    }
  }
}
