import React from 'react';

/**
 * Interfaces para los componentes de jerarquía de emociones
 */
export interface EmotionCluster {
  id: string;
  name: string;
  color: string;
  emotions: string[];
  description: string;
  value: number;
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
 * Basado en BeyondPhilosophy.com
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
 * Componente para mostrar la jerarquía de valor emocional
 * Basado en la imagen de BeyondPhilosophy.com
 */
export interface EmotionHierarchySelectorProps {
  selectedCluster?: string;
  onClusterSelect?: (clusterId: string) => void;
  className?: string;
}

export const EmotionHierarchySelector: React.FC<EmotionHierarchySelectorProps> = ({
  selectedCluster,
  onClusterSelect,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Título y descripción */}
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Jerarquía de Valor Emocional
        </h3>
        <p className="text-sm text-neutral-600">
          Selecciona el cluster emocional que mejor describe tu experiencia
        </p>
      </div>

      {/* Pirámide de clusters */}
      <div className="flex flex-col items-center space-y-2">
        {/* Advocacy Cluster (Top) */}
        <div className="w-full max-w-md">
          <button
            onClick={() => onClusterSelect?.('advocacy')}
            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${selectedCluster === 'advocacy'
                ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                : 'border-green-200 bg-green-50 hover:border-green-300 hover:shadow-md'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h4 className="font-semibold text-green-800">Advocacy</h4>
                <p className="text-xs text-green-600 mt-1">Happy, Pleased</p>
                <p className="text-xs text-green-500 mt-1">Estados más positivos que llevan a la defensa de la marca</p>
              </div>
              <div className="w-4 h-4 rounded-full bg-green-400"></div>
            </div>
          </button>
        </div>

        {/* Recommendation Cluster */}
        <div className="w-full max-w-md">
          <button
            onClick={() => onClusterSelect?.('recommendation')}
            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${selectedCluster === 'recommendation'
                ? 'border-green-600 bg-green-50 shadow-lg scale-105'
                : 'border-green-300 bg-green-50 hover:border-green-400 hover:shadow-md'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h4 className="font-semibold text-green-700">Recommendation</h4>
                <p className="text-xs text-green-600 mt-1">Trusting, Valued, Cared for, Focused, Safe</p>
                <p className="text-xs text-green-500 mt-1">Estados que fomentan confianza y llevan a recomendaciones</p>
              </div>
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
            </div>
          </button>
        </div>

        {/* Attention Cluster */}
        <div className="w-full max-w-md">
          <button
            onClick={() => onClusterSelect?.('attention')}
            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${selectedCluster === 'attention'
                ? 'border-green-700 bg-green-50 shadow-lg scale-105'
                : 'border-green-400 bg-green-50 hover:border-green-500 hover:shadow-md'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h4 className="font-semibold text-green-600">Attention</h4>
                <p className="text-xs text-green-600 mt-1">Interesting, Energetic, Stimulated, Exploratory, Indulgent</p>
                <p className="text-xs text-green-500 mt-1">Emociones que capturan atención y engagement</p>
              </div>
              <div className="w-4 h-4 rounded-full bg-green-600"></div>
            </div>
          </button>
        </div>

        {/* Destroying Cluster (Bottom) */}
        <div className="w-full max-w-md">
          <button
            onClick={() => onClusterSelect?.('destroying')}
            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${selectedCluster === 'destroying'
                ? 'border-red-500 bg-red-50 shadow-lg scale-105'
                : 'border-red-200 bg-red-50 hover:border-red-300 hover:shadow-md'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h4 className="font-semibold text-red-800">Destroying</h4>
                <p className="text-xs text-red-600 mt-1">Irritated, Hurried, Neglected, Unhappy, Unsatisfied, Stressed, Disappointment, Frustrated</p>
                <p className="text-xs text-red-500 mt-1">Estados emocionales destructivos que generan valor negativo</p>
              </div>
              <div className="w-4 h-4 rounded-full bg-red-400"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">i</span>
            </div>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">¿Cómo funciona la jerarquía?</p>
            <p className="text-xs">
              Los clusters superiores generan mayor valor a largo plazo y llevan a la defensa de la marca.
              Los clusters inferiores pueden ser destructivos para la relación con el cliente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente para mostrar todas las emociones individuales organizadas por clusters
 */
export interface DetailedEmotionSelectorProps {
  selectedEmotions?: string[];
  onEmotionSelect?: (emotionId: string) => void;
  maxSelections?: number;
  className?: string;
}

export const DetailedEmotionSelector: React.FC<DetailedEmotionSelectorProps> = ({
  selectedEmotions = [],
  onEmotionSelect,
  maxSelections = 3,
  className = ''
}) => {
  const handleEmotionClick = (emotionId: string) => {
    if (!onEmotionSelect) return;

    if (selectedEmotions.includes(emotionId)) {
      // Deseleccionar
      onEmotionSelect(emotionId);
    } else if (selectedEmotions.length < maxSelections) {
      // Seleccionar
      onEmotionSelect(emotionId);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Emociones Detalladas
        </h3>
        <p className="text-sm text-neutral-600">
          Selecciona hasta {maxSelections} emociones que mejor describan tu experiencia
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          Seleccionadas: {selectedEmotions.length}/{maxSelections}
        </p>
      </div>

      {EMOTION_CLUSTERS.map((cluster) => (
        <div key={cluster.id} className="space-y-3">
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: cluster.color }}
            ></div>
            <h4 className="font-semibold text-neutral-900">{cluster.name}</h4>
            <span className="text-xs text-neutral-500">({cluster.emotions.length} emociones)</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {cluster.emotions.map((emotion) => {
              const emotionId = emotion.toLowerCase().replace(/\s+/g, '_');
              const isSelected = selectedEmotions.includes(emotionId);

              return (
                <button
                  key={emotionId}
                  onClick={() => handleEmotionClick(emotionId)}
                  disabled={!isSelected && selectedEmotions.length >= maxSelections}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-md'
                      : selectedEmotions.length >= maxSelections
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
                    }`}
                >
                  {emotion}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
