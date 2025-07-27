/**
 * Jerarquía de Valor Emocional - Basada en BeyondPhilosophy.com
 * Implementación de los 4 clusters emocionales para NEV (Net Emotional Value)
 */

export interface EmotionCluster {
  id: string;
  name: string;
  color: string;
  emotions: string[];
  description: string;
  value: number; // Valor numérico para el cluster
}

export interface EmotionOption {
  id: string;
  name: string;
  cluster: string;
  value: number;
  color: string;
}

/**
 * Clusters emocionales según la jerarquía de valor emocional
 */
export const EMOTION_CLUSTERS: EmotionCluster[] = [
  {
    id: 'destroying',
    name: 'Destroying',
    color: '#ef4444', // Red
    value: 1,
    emotions: [
      'Irritated',
      'Hurried', 
      'Neglected',
      'Unhappy',
      'Unsatisfied',
      'Stressed',
      'Disappointment',
      'Frustrated'
    ],
    description: 'Estados emocionales destructivos que generan valor negativo'
  },
  {
    id: 'attention',
    name: 'Attention',
    color: '#16a34a', // Dark Green
    value: 2,
    emotions: [
      'Interesting',
      'Energetic',
      'Stimulated',
      'Exploratory',
      'Indulgent'
    ],
    description: 'Emociones que capturan atención y engagement'
  },
  {
    id: 'recommendation',
    name: 'Recommendation',
    color: '#22c55e', // Medium Green
    value: 3,
    emotions: [
      'Trusting',
      'Valued',
      'Cared for',
      'Focused',
      'Safe'
    ],
    description: 'Estados que fomentan confianza y llevan a recomendaciones'
  },
  {
    id: 'advocacy',
    name: 'Advocacy',
    color: '#86efac', // Light Green
    value: 4,
    emotions: [
      'Happy',
      'Pleased'
    ],
    description: 'Estados más positivos que llevan a la defensa de la marca'
  }
];

/**
 * Todas las emociones individuales con sus valores y clusters
 */
export const ALL_EMOTIONS: EmotionOption[] = [
  // Destroying Cluster
  { id: 'irritated', name: 'Irritated', cluster: 'destroying', value: 1, color: '#ef4444' },
  { id: 'hurried', name: 'Hurried', cluster: 'destroying', value: 1, color: '#ef4444' },
  { id: 'neglected', name: 'Neglected', cluster: 'destroying', value: 1, color: '#ef4444' },
  { id: 'unhappy', name: 'Unhappy', cluster: 'destroying', value: 1, color: '#ef4444' },
  { id: 'unsatisfied', name: 'Unsatisfied', cluster: 'destroying', value: 1, color: '#ef4444' },
  { id: 'stressed', name: 'Stressed', cluster: 'destroying', value: 1, color: '#ef4444' },
  { id: 'disappointment', name: 'Disappointment', cluster: 'destroying', value: 1, color: '#ef4444' },
  { id: 'frustrated', name: 'Frustrated', cluster: 'destroying', value: 1, color: '#ef4444' },
  
  // Attention Cluster
  { id: 'interesting', name: 'Interesting', cluster: 'attention', value: 2, color: '#16a34a' },
  { id: 'energetic', name: 'Energetic', cluster: 'attention', value: 2, color: '#16a34a' },
  { id: 'stimulated', name: 'Stimulated', cluster: 'attention', value: 2, color: '#16a34a' },
  { id: 'exploratory', name: 'Exploratory', cluster: 'attention', value: 2, color: '#16a34a' },
  { id: 'indulgent', name: 'Indulgent', cluster: 'attention', value: 2, color: '#16a34a' },
  
  // Recommendation Cluster
  { id: 'trusting', name: 'Trusting', cluster: 'recommendation', value: 3, color: '#22c55e' },
  { id: 'valued', name: 'Valued', cluster: 'recommendation', value: 3, color: '#22c55e' },
  { id: 'cared_for', name: 'Cared for', cluster: 'recommendation', value: 3, color: '#22c55e' },
  { id: 'focused', name: 'Focused', cluster: 'recommendation', value: 3, color: '#22c55e' },
  { id: 'safe', name: 'Safe', cluster: 'recommendation', value: 3, color: '#22c55e' },
  
  // Advocacy Cluster
  { id: 'happy', name: 'Happy', cluster: 'advocacy', value: 4, color: '#86efac' },
  { id: 'pleased', name: 'Pleased', cluster: 'advocacy', value: 4, color: '#86efac' }
];

/**
 * Configuraciones de visualización para diferentes tipos de selector
 */
export const EMOTION_SELECTOR_CONFIGS = {
  // Configuración original de emojis (mantener compatibilidad)
  emojis: {
    type: 'emojis',
    name: 'Escala emocional completa',
    description: 'Selección simple con emojis básicos',
    emojis: ['😡', '😕', '😐', '🙂', '😄']
  },
  
  // Nueva configuración basada en la jerarquía
  hierarchy: {
    type: 'hierarchy',
    name: 'Jerarquía de Valor Emocional',
    description: '4 clusters emocionales según BeyondPhilosophy.com',
    clusters: EMOTION_CLUSTERS,
    emotions: ALL_EMOTIONS
  },
  
  // Configuración detallada con todas las emociones
  detailed: {
    type: 'detailed',
    name: 'Emociones Detalladas (20 estados)',
    description: 'Todas las emociones individuales organizadas por clusters',
    emotions: ALL_EMOTIONS,
    clusters: EMOTION_CLUSTERS
  },
  
  // Configuración de cuadrantes (mantener compatibilidad)
  quadrants: {
    type: 'quadrants',
    name: '4 Estadios emocionales',
    description: 'Selección por cuadrantes emocionales',
    quadrants: [
      { name: 'Destructivo', color: '#ef4444', emotions: ['Irritated', 'Frustrated', 'Unhappy'] },
      { name: 'Atención', color: '#16a34a', emotions: ['Interesting', 'Energetic', 'Stimulated'] },
      { name: 'Recomendación', color: '#22c55e', emotions: ['Trusting', 'Valued', 'Safe'] },
      { name: 'Defensa', color: '#86efac', emotions: ['Happy', 'Pleased'] }
    ]
  }
};

/**
 * Obtener emociones por cluster
 */
export const getEmotionsByCluster = (clusterId: string): EmotionOption[] => {
  return ALL_EMOTIONS.filter(emotion => emotion.cluster === clusterId);
};

/**
 * Obtener cluster por ID
 */
export const getClusterById = (clusterId: string): EmotionCluster | undefined => {
  return EMOTION_CLUSTERS.find(cluster => cluster.id === clusterId);
};

/**
 * Obtener emoción por ID
 */
export const getEmotionById = (emotionId: string): EmotionOption | undefined => {
  return ALL_EMOTIONS.find(emotion => emotion.id === emotionId);
}; 