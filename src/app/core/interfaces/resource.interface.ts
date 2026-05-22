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

export interface Resource {
  id: string;
  name: string;
  description: string;
  category: ResourceCategory;
  status: ResourceStatus;
  imageUrl?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}
