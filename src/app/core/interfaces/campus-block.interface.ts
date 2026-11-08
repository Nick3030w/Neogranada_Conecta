export interface CampusBlock {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  resources?: string[];
}

/** Tipo visible de un espacio dentro de un bloque. */
export type BlockSpaceType =
  | 'Aula'
  | 'Laboratorio'
  | 'Biblioteca'
  | 'Sala de cómputo'
  | 'Instrumento musical'
  | 'Elemento deportivo'
  | 'Otro';

/** Espacio o recurso ubicado en un bloque del campus. */
export interface BlockSpace {
  name: string;
  type: BlockSpaceType;
  floor?: string;
  description?: string;
  /** Foto del espacio (ruta dentro de assets) */
  imageUrl?: string;
}

/** Información completa de un bloque del campus. */
export interface BlockInfo {
  id: string;
  name: string;
  /** Foto de portada del bloque (ruta dentro de assets) */
  coverImage?: string;
  /**
   * Indica si las aulas y laboratorios de este bloque provienen de fotos
   * reales y deben sincronizarse con la colección `resources` de Firestore.
   */
  syncWithFirestore: boolean;
  spaces: BlockSpace[];
}
