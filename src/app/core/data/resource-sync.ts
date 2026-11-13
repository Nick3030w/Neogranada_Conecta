import { BlockInfo, BlockSpaceType } from '../interfaces/campus-block.interface';
import { Resource, ResourceCategory } from '../interfaces/resource.interface';

/**
 * Tipos de espacio de BLOCKS_DATA que se guardan como recurso reservable.
 * Las salas de cómputo se reservan dentro de la categoría Laboratorios.
 */
const CATEGORY_BY_TYPE: Partial<Record<BlockSpaceType, ResourceCategory>> = {
  'Aula':                'aula',
  'Laboratorio':         'laboratorio',
  'Sala de cómputo':     'laboratorio',
  'Instrumento musical': 'instrumentos_musicales',
  'Elemento deportivo':  'elementos_deportivos',
};

/** Categorías de la colección `resources` que gestiona la sincronización. */
export const SYNCED_CATEGORIES: ResourceCategory[] = [
  ...new Set(Object.values(CATEGORY_BY_TYPE).filter((c): c is ResourceCategory => !!c)),
];

/**
 * Objetos portátiles. BLOCKS_DATA es su fuente de verdad en todo el campus y,
 * si cambian de bloque, se mueven conservando el mismo documento (las reservas
 * siguen apuntando al mismo recurso). Las aulas y laboratorios son fijos: solo
 * se gestionan dentro de los bloques con `syncWithFirestore: true`.
 */
const MOVABLE_CATEGORIES: ResourceCategory[] = ['instrumentos_musicales', 'elementos_deportivos'];

/** Recurso tal como está guardado en Firestore. */
export interface ExistingResource {
  id: string;
  name: string;
  category: string;
  location: string;
  description?: string;
  imageUrl?: string | null;
}

/** Campos que controla la sincronización en cada recurso. */
export type SyncedResourceFields =
  Pick<Resource, 'name' | 'description' | 'category' | 'location'> & { imageUrl: string | null };

/** Cambios a aplicar en Firestore para que coincida con BLOCKS_DATA. */
export interface ResourceSyncPlan {
  /** Recursos nuevos (se crean con estado `disponible`). */
  create: SyncedResourceFields[];
  /** Recursos existentes con cambios. Se conserva su id y su estado. */
  update: { id: string; changes: Omit<SyncedResourceFields, 'name'> }[];
  /** Ids de recursos que ya no existen en BLOCKS_DATA. */
  remove: string[];
}

/**
 * Calcula qué crear, actualizar (o mover de bloque) y eliminar para que la
 * colección `resources` coincida con los bloques sincronizados. No escribe
 * nada: el plan lo aplica `ResourceService.syncBlockSpaces()`.
 */
export function planResourceSync(blocks: BlockInfo[], existing: ExistingResource[]): ResourceSyncPlan {
  // 1. Estado deseado, con clave bloque + nombre
  const managedLocations = new Set<string>();
  const desired = new Map<string, SyncedResourceFields>();

  for (const block of blocks) {
    if (!block.syncWithFirestore) continue;
    managedLocations.add(block.name);

    for (const space of block.spaces) {
      const category = CATEGORY_BY_TYPE[space.type];
      if (!category) continue;
      desired.set(resourceKey(block.name, space.name), {
        name: space.name,
        description: space.description ?? '',
        category,
        location: block.name,
        imageUrl: space.imageUrl ?? null,
      });
    }
  }

  const plan: ResourceSyncPlan = { create: [], update: [], remove: [] };

  const updateIfChanged = (res: ExistingResource, target: SyncedResourceFields): void => {
    const changed =
      res.location !== target.location ||
      res.description !== target.description ||
      res.category !== target.category ||
      (res.imageUrl ?? null) !== target.imageUrl;
    if (!changed) return;
    plan.update.push({
      id: res.id,
      changes: {
        location: target.location,
        description: target.description,
        category: target.category,
        imageUrl: target.imageUrl,
      },
    });
  };

  // 2. Recursos que ya están en su bloque: se actualizan si cambió algo
  const unmatched: ExistingResource[] = [];
  for (const res of existing) {
    const key = resourceKey(res.location, res.name);
    const target = desired.get(key);
    if (target) {
      desired.delete(key);
      updateIfChanged(res, target);
    } else {
      unmatched.push(res);
    }
  }

  // 3. Objetos portátiles que cambiaron de bloque: se mueven (mismo documento).
  //    Lo demás se elimina si está dentro de lo que gestiona la sincronización.
  for (const res of unmatched) {
    const movable = MOVABLE_CATEGORIES.includes(res.category as ResourceCategory);
    const match = movable ? findByName(desired, res.category, res.name) : undefined;

    if (match) {
      const [key, target] = match;
      desired.delete(key);
      updateIfChanged(res, target);
    } else if (movable || managedLocations.has(res.location)) {
      plan.remove.push(res.id);
    }
  }

  // 4. Lo que todavía no existe se crea
  plan.create.push(...desired.values());
  return plan;
}

/** Clave única de un recurso: bloque + nombre (sin distinguir mayúsculas). */
function resourceKey(location: string, name: string): string {
  return `${normalize(location)}|${normalize(name)}`;
}

function normalize(text: string | undefined): string {
  return (text ?? '').trim().toLowerCase();
}

/** Busca un recurso deseado de la misma categoría y nombre, en cualquier bloque. */
function findByName(
  desired: Map<string, SyncedResourceFields>,
  category: string,
  name: string,
): [string, SyncedResourceFields] | undefined {
  const wanted = normalize(name);
  for (const entry of desired) {
    const [, target] = entry;
    if (target.category === category && normalize(target.name) === wanted) return entry;
  }
  return undefined;
}
