import { BlockInfo } from '../interfaces/campus-block.interface';

/** Carpeta base de las fotos de los espacios de cada bloque. */
const IMG = 'assets/images/bloques';

/** Carpeta de las fotos de portada de los bloques. */
const COVERS = 'assets/images/portadas';

/**
 * Datos de los bloques del campus. Fuente única para la pantalla de mapa,
 * el detalle de bloque y la sincronización de recursos en Firestore.
 *
 * En los bloques con `syncWithFirestore: true`, las aulas, laboratorios,
 * salas de cómputo, instrumentos y elementos deportivos se sincronizan con
 * la colección `resources` (ver `planResourceSync()` en resource-sync.ts).
 */
export const BLOCKS_DATA: Record<string, BlockInfo> = {
  A: {
    id: 'A',
    name: 'Bloque A',
    coverImage: `${COVERS}/bloque-a.jpeg`,
    syncWithFirestore: true,
    spaces: [
      { name: 'Aula A101', type: 'Aula', floor: '1', description: 'Aula de clases, piso 1', imageUrl: `${IMG}/bloque_a/1.jpeg` },
      { name: 'Aula A102', type: 'Aula', floor: '1', description: 'Aula de clases, piso 1', imageUrl: `${IMG}/bloque_a/2.jpeg` },
    ],
  },
  B: {
    id: 'B',
    name: 'Bloque B',
    coverImage: `${COVERS}/bloque-b.jpeg`,
    syncWithFirestore: true,
    spaces: [
      { name: 'Aula Especial P101', type: 'Aula', floor: '1', description: 'Aula especial, piso 1', imageUrl: `${IMG}/bloque_b/4.jpeg` },
      { name: 'Aula Especial P201', type: 'Aula', floor: '2', description: 'Aula especial, piso 2', imageUrl: `${IMG}/bloque_b/1.jpeg` },
      { name: 'Aula Especial P202', type: 'Aula', floor: '2', description: 'Aula especial, piso 2', imageUrl: `${IMG}/bloque_b/2.jpeg` },
      { name: 'Aula Especial P203', type: 'Aula', floor: '2', description: 'Aula especial, piso 2', imageUrl: `${IMG}/bloque_b/3.jpeg` },
    ],
  },
  C: {
    id: 'C',
    name: 'Bloque C',
    coverImage: `${COVERS}/bloque-c.jpeg`,
    syncWithFirestore: true,
    spaces: [
      { name: 'Aula Especial P301', type: 'Aula',            floor: '3', description: 'Aula especial, piso 3', imageUrl: `${IMG}/bloque_c/4.jpeg` },
      { name: 'Aula Especial P302', type: 'Aula',            floor: '3', description: 'Aula especial, piso 3', imageUrl: `${IMG}/bloque_c/3.jpeg` },
      { name: 'Aula Especial P303', type: 'Aula',            floor: '3', description: 'Aula especial, piso 3', imageUrl: `${IMG}/bloque_c/2.jpeg` },
      { name: 'Aula Especial P304', type: 'Aula',            floor: '3', description: 'Aula especial, piso 3', imageUrl: `${IMG}/bloque_c/1.jpeg` },
      { name: 'Sala de Sistemas 1', type: 'Sala de cómputo', description: 'Sala de cómputo', imageUrl: `${IMG}/bloque_c/5.jpeg` },
      { name: 'Sala de Sistemas 2', type: 'Sala de cómputo', description: 'Sala de cómputo', imageUrl: `${IMG}/bloque_c/6.jpeg` },
      { name: 'Sala de Sistemas 3', type: 'Sala de cómputo', description: 'Sala de cómputo', imageUrl: `${IMG}/bloque_c/8.jpeg` },
      { name: 'Sala de Sistemas 4', type: 'Sala de cómputo', description: 'Sala de cómputo', imageUrl: `${IMG}/bloque_c/7.jpeg` },
      { name: 'Sala de Sistemas 5', type: 'Sala de cómputo', description: 'Sala de cómputo', imageUrl: `${IMG}/bloque_c/9.jpeg` },
    ],
  },
  D: {
    id: 'D',
    name: 'Bloque D',
    coverImage: `${COVERS}/bloque-d.jpeg`,
    // Pendiente de definir: sus espacios no se sincronizan y conservan los nombres del seed original.
    syncWithFirestore: false,
    spaces: [
      { name: 'Aula especial IV-A',         type: 'Aula',        description: 'Aula especial piso IV' },
      { name: 'Aula especial IV-B',         type: 'Aula',        description: 'Aula especial piso IV' },
      { name: 'Aula especial IX-A',         type: 'Aula',        description: 'Aula especial piso IX' },
      { name: 'Aula especial IX-B',         type: 'Aula',        description: 'Aula especial piso IX' },
      { name: 'Aula especial X-A',          type: 'Aula',        description: 'Aula especial piso X'  },
      { name: 'Aula especial X-B',          type: 'Aula',        description: 'Aula especial piso X'  },
      { name: 'Laboratorio de Testeo I-II', type: 'Laboratorio', description: 'Laboratorio de testeo' },
    ],
  },
  E: {
    id: 'E',
    name: 'Bloque E',
    coverImage: `${COVERS}/bloque-e.jpeg`,
    syncWithFirestore: true,
    spaces: [
      { name: 'Aula Especial E101', type: 'Aula', floor: '1', description: 'Aula especial, piso 1', imageUrl: `${IMG}/bloque_e/1.jpeg` },
      { name: 'Aula Especial E102', type: 'Aula', floor: '1', description: 'Aula especial, piso 1', imageUrl: `${IMG}/bloque_e/2.jpeg` },
    ],
  },
  F: {
    id: 'F',
    name: 'Bloque F',
    coverImage: `${COVERS}/bloque-f.jpeg`,
    syncWithFirestore: true,
    spaces: [
      { name: 'Laboratorio Calidad de Aguas',                 type: 'Laboratorio', description: 'Laboratorio de análisis de calidad de aguas', imageUrl: `${IMG}/bloque_f/1.jpeg` },
      { name: 'Laboratorio Física Mecánica',                  type: 'Laboratorio', description: 'Laboratorio de física',                       imageUrl: `${IMG}/bloque_f/2.jpeg` },
      { name: 'Laboratorio Física Calor y Ondas',             type: 'Laboratorio', description: 'Laboratorio de física',                       imageUrl: `${IMG}/bloque_f/3.jpeg` },
      { name: 'Laboratorio Física Electricidad y Magnetismo', type: 'Laboratorio', description: 'Laboratorio de física',                       imageUrl: `${IMG}/bloque_f/4.jpeg` },
      { name: 'Laboratorio Física Óptica y Acústica',         type: 'Laboratorio', description: 'Laboratorio de física',                       imageUrl: `${IMG}/bloque_f/4.jpeg` },
      { name: 'Laboratorio de Hidráulica',                    type: 'Laboratorio', description: 'Laboratorio de hidráulica',                   imageUrl: `${IMG}/bloque_f/5.jpeg` },
    ],
  },
  BIENESTAR: {
    id: 'BIENESTAR',
    name: 'Bienestar',
    coverImage: `${COVERS}/bienestar.jpeg`,
    syncWithFirestore: true,
    spaces: [
      // Elementos deportivos
      { name: 'Balones de fútbol',     type: 'Elemento deportivo',  description: 'Kit de balones de fútbol para préstamo',     imageUrl: `${IMG}/bienestar/balon-futbol.webp` },
      { name: 'Balones de baloncesto', type: 'Elemento deportivo',  description: 'Balones de baloncesto para préstamo',        imageUrl: `${IMG}/bienestar/balon-baloncesto.jpeg` },
      { name: 'Balones de voleibol',   type: 'Elemento deportivo',  description: 'Balones de voleibol para préstamo',          imageUrl: `${IMG}/bienestar/balon-voleibol.webp` },
      { name: 'Balones de rugby',      type: 'Elemento deportivo',  description: 'Balones de rugby para préstamo',             imageUrl: `${IMG}/bienestar/balon-rugby.jpeg` },
      { name: 'Raquetas de tenis',     type: 'Elemento deportivo',  description: 'Set de raquetas de tenis para préstamo',     imageUrl: `${IMG}/bienestar/raquetas-tenis.webp` },
      { name: 'Raquetas de ping pong', type: 'Elemento deportivo',  description: 'Set de raquetas de ping pong para préstamo', imageUrl: `${IMG}/bienestar/raquetas-ping-pong.webp` },
      { name: 'Redes y mallas',        type: 'Elemento deportivo',  description: 'Redes deportivas para préstamo',             imageUrl: `${IMG}/bienestar/redes-mallas.jpeg` },
      // Instrumentos musicales
      { name: 'Piano Digital',         type: 'Instrumento musical', description: 'Piano digital Yamaha para préstamo',         imageUrl: `${IMG}/bienestar/piano.jpeg` },
      { name: 'Guitarra Acústica',     type: 'Instrumento musical', description: 'Guitarra acústica para préstamo',            imageUrl: `${IMG}/bienestar/guitarra-acustica.webp` },
      { name: 'Guitarra Eléctrica',    type: 'Instrumento musical', description: 'Guitarra eléctrica para préstamo',           imageUrl: `${IMG}/bienestar/guitarra-electrica.jpeg` },
      { name: 'Batería',               type: 'Instrumento musical', description: 'Batería acústica para préstamo',             imageUrl: `${IMG}/bienestar/bateria.webp` },
      { name: 'Violín',                type: 'Instrumento musical', description: 'Violín para préstamo estudiantil',           imageUrl: `${IMG}/bienestar/violin.webp` },
    ],
  },
  CAPILLA: {
    id: 'CAPILLA',
    name: 'Capilla',
    coverImage: `${COVERS}/capilla.jpeg`,
    // Sin espacios reservables por ahora: no hay nada que sincronizar.
    syncWithFirestore: false,
    spaces: [],
  },
};

/** Lista ordenada de bloques (A → F, Bienestar y Capilla al final). */
export const BLOCKS_LIST: BlockInfo[] = Object.values(BLOCKS_DATA);
