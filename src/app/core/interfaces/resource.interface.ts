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
