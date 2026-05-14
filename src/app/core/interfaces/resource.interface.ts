export type ResourceCategory =
  | 'laboratorio'
  | 'aula'
  | 'material_ludico'
  | 'elementos_deportivos'
  | 'botiquin'
  | 'base_datos';

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
