export type ResourceCategory =
  | 'laboratorio'
  | 'aula'
  | 'biblioteca'
  | 'elementos_deportivos'
  | 'base_datos'
  | 'instrumentos_musicales'
  | 'material_ludico'
  | 'botiquin';

export type ResourceStatus = 'disponible' | 'no_disponible';

/**
 * Categorías que tienen flujo completo de reserva con selector de recurso
 * específico y verificación de conflictos de horario.
 * Biblioteca y base_datos son solo informativas.
 */
export const BOOKABLE_CATEGORIES: ResourceCategory[] = [
  'laboratorio',
  'aula',
  'elementos_deportivos',
  'instrumentos_musicales',
];

export function isBookableCategory(category: string): boolean {
  return BOOKABLE_CATEGORIES.includes(category as ResourceCategory);
}

/** Nombre visible de cada categoría. Fuente única para catálogo y preferencias. */
export const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  aula: 'Aulas',
  elementos_deportivos: 'Elementos deportivos',
  laboratorio: 'Laboratorios',
  biblioteca: 'Biblioteca',
  base_datos: 'Base de datos',
  instrumentos_musicales: 'Instrumentos',
  material_ludico: 'Material lúdico',
  botiquin: 'Botiquín',
};

/** Categorías que el estudiante puede explorar, en el orden en que aparecen. */
export const CATALOG_CATEGORIES: ResourceCategory[] = [
  'aula',
  'elementos_deportivos',
  'laboratorio',
  'biblioteca',
  'base_datos',
  'instrumentos_musicales',
];

export interface Resource {
  id: string;
  name: string;
  description: string;
  category: ResourceCategory;
  status: ResourceStatus;
  imageUrl?: string;
  /** Bloque del campus donde se encuentra el recurso, ej: "Bloque A" */
  location: string;
  createdAt: Date;
  updatedAt: Date;
}
