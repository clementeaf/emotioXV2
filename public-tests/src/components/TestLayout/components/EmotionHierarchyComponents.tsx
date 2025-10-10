import React from 'react';
import { ALL_EMOTIONS } from '../utils/emotionConstants';

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

      {/* Primera fila - Advocacy y Recommendation (Verde Claro) */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-green-400"></div>
          <h4 className="font-semibold text-neutral-900">Emociones Positivas</h4>
          <span className="text-xs text-neutral-500">(7 emociones)</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {ALL_EMOTIONS.slice(0, 7).map((emotion) => {
            const isSelected = selectedEmotions.includes(emotion.id);

            return (
              <button
                key={emotion.id}
                onClick={() => handleEmotionClick(emotion.id)}
                disabled={!isSelected && selectedEmotions.length >= maxSelections}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-md'
                  : selectedEmotions.length >= maxSelections
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
                  }`}
                style={{ backgroundColor: isSelected ? undefined : emotion.color + '20' }}
              >
                {emotion.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Segunda fila - Attention (Verde Medio) + 1 Destroying (Rojo Claro) */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-green-600"></div>
          <h4 className="font-semibold text-neutral-900">Emociones de Atención</h4>
          <span className="text-xs text-neutral-500">(6 emociones)</span>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {ALL_EMOTIONS.slice(7, 13).map((emotion) => {
            const isSelected = selectedEmotions.includes(emotion.id);

            return (
              <button
                key={emotion.id}
                onClick={() => handleEmotionClick(emotion.id)}
                disabled={!isSelected && selectedEmotions.length >= maxSelections}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-md'
                  : selectedEmotions.length >= maxSelections
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
                  }`}
                style={{ backgroundColor: isSelected ? undefined : emotion.color + '20' }}
              >
                {emotion.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tercera fila - Destroying (Rojo Claro) */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-red-400"></div>
          <h4 className="font-semibold text-neutral-900">Emociones Negativas</h4>
          <span className="text-xs text-neutral-500">(7 emociones)</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {ALL_EMOTIONS.slice(13, 20).map((emotion) => {
            const isSelected = selectedEmotions.includes(emotion.id);

            return (
              <button
                key={emotion.id}
                onClick={() => handleEmotionClick(emotion.id)}
                disabled={!isSelected && selectedEmotions.length >= maxSelections}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-md'
                  : selectedEmotions.length >= maxSelections
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
                  }`}
                style={{ backgroundColor: isSelected ? undefined : emotion.color + '20' }}
              >
                {emotion.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

