import type { EmotionCluster, EmotionOption } from '../emotion';

/**
 * Clusters emocionales según la jerarquía de valor emocional
 * Basado en BeyondPhilosophy.com - Versión en español
 */
export const EMOTION_CLUSTERS: EmotionCluster[] = [
  {
    id: 'destroying',
    name: 'Destroying',
    color: '#ef4444', // Red
    value: 1,
    emotions: [
      'Frustrado',
      'Irritado',
      'Decepción',
      'Estresado',
      'Infeliz',
      'Desatendido',
      'Apresurado'
    ],
    description: 'Estados emocionales destructivos que generan valor negativo'
  },
  {
    id: 'attention',
    name: 'Attention',
    color: '#16a34a', // Dark Green
    value: 2,
    emotions: [
      'Indulgente',
      'Reconocido',
      'Espíritu',
      'Foco',
      'Informativo',
      'Comprendido',
      'Sin problemas',
      'Energético',
      'Exploratorio'
    ],
    description: 'Estados que captan la atención de forma positiva'
  },
  {
    id: 'recommendation',
    name: 'Recommendation',
    color: '#22c55e', // Green
    value: 3,
    emotions: [
      'Cuidado',
      'Confianza',
      'Seguro',
      'Satisfecho',
      'Complacido'
    ],
    description: 'Estados que generan recomendación'
  },
  {
    id: 'advocacy',
    name: 'Advocacy',
    color: '#15803d', // Dark Green
    value: 4,
    emotions: [
      'Feliz',
      'Valorado',
      'Importancia',
      'Apreciación'
    ],
    description: 'Estados de máximo valor emocional que generan advocacy'
  }
];

/**
 * Lista completa de emociones con sus propiedades
 * Basado en la imagen con 22 emociones en español
 */
export const ALL_EMOTIONS: EmotionOption[] = [
  // Primera fila - Advocacy y Recommendation (Verde Claro)
  { id: 'feliz', name: 'Feliz', cluster: 'advocacy', value: 4, color: '#86efac' },
  { id: 'valorado', name: 'Valorado', cluster: 'advocacy', value: 4, color: '#86efac' },
  { id: 'importancia', name: 'Importancia', cluster: 'advocacy', value: 4, color: '#86efac' },
  { id: 'apreciacion', name: 'Apreciación', cluster: 'advocacy', value: 4, color: '#86efac' },
  { id: 'cuidado', name: 'Cuidado', cluster: 'recommendation', value: 3, color: '#bbf7d0' },
  { id: 'confianza', name: 'Confianza', cluster: 'recommendation', value: 3, color: '#bbf7d0' },
  { id: 'seguro', name: 'Seguro', cluster: 'recommendation', value: 3, color: '#bbf7d0' },

  // Segunda fila - Recommendation y Attention (Verde Medio)
  { id: 'satisfecho', name: 'Satisfecho', cluster: 'recommendation', value: 3, color: '#bbf7d0' },
  { id: 'complacido', name: 'Complacido', cluster: 'recommendation', value: 3, color: '#bbf7d0' },
  { id: 'indulgente', name: 'Indulgente', cluster: 'attention', value: 2, color: '#dcfce7' },
  { id: 'reconocido', name: 'Reconocido', cluster: 'attention', value: 2, color: '#dcfce7' },
  { id: 'espiritu', name: 'Espíritu', cluster: 'attention', value: 2, color: '#dcfce7' },
  { id: 'foco', name: 'Foco', cluster: 'attention', value: 2, color: '#dcfce7' },

  // Tercera fila - Attention y Destroying (Amarillo y Rojo)
  { id: 'informativo', name: 'Informativo', cluster: 'attention', value: 2, color: '#dcfce7' },
  { id: 'comprendido', name: 'Comprendido', cluster: 'attention', value: 2, color: '#dcfce7' },
  { id: 'sin-problemas', name: 'Sin problemas', cluster: 'attention', value: 2, color: '#dcfce7' },
  { id: 'energetico', name: 'Energético', cluster: 'attention', value: 2, color: '#dcfce7' },
  { id: 'exploratorio', name: 'Exploratorio', cluster: 'attention', value: 2, color: '#dcfce7' },
  { id: 'frustrado', name: 'Frustrado', cluster: 'destroying', value: 1, color: '#fecaca' },
  { id: 'irritado', name: 'Irritado', cluster: 'destroying', value: 1, color: '#fecaca' },

  // Cuarta fila - Destroying (Rojo)
  { id: 'decepcion', name: 'Decepción', cluster: 'destroying', value: 1, color: '#fecaca' },
  { id: 'estresado', name: 'Estresado', cluster: 'destroying', value: 1, color: '#fecaca' }
];