import React from 'react';
import { ALL_EMOTIONS } from '../utils/emotionConstants';
import { DetailedEmotionSelectorProps } from './types';
import { handleEmotionClick, getEmotionButtonClasses } from './utils';

/**
 * Componente para mostrar todas las emociones individuales organizadas por clusters
 */
export const DetailedEmotionSelector: React.FC<DetailedEmotionSelectorProps> = ({
  selectedEmotions = [],
  onEmotionSelect,
  maxSelections = 3,
  className = ''
}) => {
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
            const isDisabled = !isSelected && selectedEmotions.length >= maxSelections;

            return (
              <button
                key={emotion.id}
                onClick={() => handleEmotionClick(emotion.id, selectedEmotions, maxSelections, onEmotionSelect)}
                disabled={isDisabled}
                className={getEmotionButtonClasses(
                  isSelected,
                  isDisabled,
                  'p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200'
                )}
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
            const isDisabled = !isSelected && selectedEmotions.length >= maxSelections;

            return (
              <button
                key={emotion.id}
                onClick={() => handleEmotionClick(emotion.id, selectedEmotions, maxSelections, onEmotionSelect)}
                disabled={isDisabled}
                className={getEmotionButtonClasses(
                  isSelected,
                  isDisabled,
                  'p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200'
                )}
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
            const isDisabled = !isSelected && selectedEmotions.length >= maxSelections;

            return (
              <button
                key={emotion.id}
                onClick={() => handleEmotionClick(emotion.id, selectedEmotions, maxSelections, onEmotionSelect)}
                disabled={isDisabled}
                className={getEmotionButtonClasses(
                  isSelected,
                  isDisabled,
                  'p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200'
                )}
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
