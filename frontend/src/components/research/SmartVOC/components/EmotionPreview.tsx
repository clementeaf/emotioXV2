import React, { useState } from 'react';

import { EMOTION_SELECTOR_CONFIGS } from '../constants/emotionHierarchy';
import { DetailedEmotionSelector, EmotionHierarchySelector } from './EmotionHierarchySelector';

interface EmotionPreviewProps {
  type: string;
  className?: string;
}

/**
 * Componente de vista previa para mostrar diferentes tipos de selectores de emociones
 */
export const EmotionPreview: React.FC<EmotionPreviewProps> = ({
  type,
  className = ''
}) => {
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);

  const handleClusterSelect = (clusterId: string) => {
    setSelectedCluster(clusterId);
  };

  const handleEmotionSelect = (emotionId: string) => {
    setSelectedEmotions(prev => {
      if (prev.includes(emotionId)) {
        return prev.filter(id => id !== emotionId);
      } else if (prev.length < 3) {
        return [...prev, emotionId];
      }
      return prev;
    });
  };

  const renderPreview = () => {
    switch (type) {
      case 'hierarchy':
        return (
          <div className="p-6 bg-white rounded-lg border border-gray-200">
            <EmotionHierarchySelector
              selectedCluster={selectedCluster}
              onClusterSelect={handleClusterSelect}
            />
          </div>
        );

      case 'detailed':
        return (
          <div className="p-6 bg-white rounded-lg border border-gray-200">
            <DetailedEmotionSelector
              selectedEmotions={selectedEmotions}
              onEmotionSelect={handleEmotionSelect}
              maxSelections={3}
            />
          </div>
        );



      case 'quadrants':
        return (
          <div className="p-6 bg-white rounded-lg border border-gray-200">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                4 Estadios Emocionales
              </h3>
              <p className="text-sm text-neutral-600">
                Selecciona el cuadrante que mejor describe tu estado emocional
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {EMOTION_SELECTOR_CONFIGS.quadrants.quadrants.map((quadrant, idx) => (
                <button
                  key={idx}
                  className="p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors"
                  style={{ backgroundColor: quadrant.color + '20' }}
                >
                  <h4 className="font-semibold text-sm mb-2">{quadrant.name}</h4>
                  <p className="text-xs text-gray-600">
                    {quadrant.emotions.slice(0, 2).join(', ')}
                    {quadrant.emotions.length > 2 && '...'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-500">Tipo de selector no reconocido</p>
          </div>
        );
    }
  };

  return (
    <div className={className}>
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Vista Previa: {EMOTION_SELECTOR_CONFIGS[type as keyof typeof EMOTION_SELECTOR_CONFIGS]?.name || type}
        </h4>
        <p className="text-xs text-gray-500">
          {EMOTION_SELECTOR_CONFIGS[type as keyof typeof EMOTION_SELECTOR_CONFIGS]?.description || 'Descripción no disponible'}
        </p>
      </div>
      {renderPreview()}
    </div>
  );
};
