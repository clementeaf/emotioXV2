import React from 'react';

// 🎯 USAR LA MISMA ESTRUCTURA QUE FRONTEND - CLUSTERS ORGANIZADOS EN ESPAÑOL
const EMOTION_CLUSTERS = [
  {
    id: 'advocacy',
    name: 'Advocacy',
    color: '#86efac', // Light Green
    emotions: ['Feliz', 'Satisfecho']
  },
  {
    id: 'recommendation', 
    name: 'Recommendation',
    color: '#22c55e', // Medium Green
    emotions: ['Confiado', 'Valorado', 'Cuidado', 'Seguro', 'Enfocado']
  },
  {
    id: 'attention',
    name: 'Attention', 
    color: '#16a34a', // Dark Green
    emotions: ['Indulgente', 'Estimulado', 'Exploratorio', 'Interesado', 'Enérgico']
  },
  {
    id: 'destroying',
    name: 'Destroying',
    color: '#ef4444', // Red
    emotions: ['Frustrado', 'Irritado', 'Decepción', 'Estresado', 'Infeliz', 'Desatendido', 'Apresurado', 'Descontento']
  }
];

interface DetailedEmotionSelectorProps {
  selectedEmotions: string[];
  onEmotionSelect: (emotionId: string) => void;
  maxSelections?: number;
  className?: string;
}

/**
 * Selector de emociones detalladas organizado por clusters como en frontend
 */
export const DetailedEmotionSelector: React.FC<DetailedEmotionSelectorProps> = ({
  selectedEmotions = [],
  onEmotionSelect,
  maxSelections,
  className = ''
}) => {
  const getEmotionBackgroundColor = (clusterId: string) => {
    switch (clusterId) {
      case 'advocacy':
        return 'bg-green-200 border-green-300 hover:bg-green-300';
      case 'recommendation':
        return 'bg-green-300 border-green-400 hover:bg-green-400';
      case 'attention':
        return 'bg-green-400 border-green-500 hover:bg-green-500';
      case 'destroying':
        return 'bg-red-200 border-red-300 hover:bg-red-300';
      default:
        return 'bg-gray-100 border-gray-300 hover:bg-gray-200';
    }
  };

  const handleEmotionClick = (emotionId: string) => {
    if (selectedEmotions.includes(emotionId)) {
      onEmotionSelect(emotionId);
    } else if (maxSelections === undefined || selectedEmotions.length < maxSelections) {
      onEmotionSelect(emotionId);
    }
  };

  return (
    <div className={`w-full space-y-3 ${className}`}>
      {/* Fila 1: Advocacy (2 emociones) - Verde claro */}
      <div className="grid grid-cols-2 gap-2">
        {EMOTION_CLUSTERS[0].emotions.map((emotion) => {
          const emotionId = emotion.toLowerCase().replace(/\s+/g, '_').replace(/[áéíóú]/g, (match) => {
            const accents: { [key: string]: string } = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
            return accents[match] || match;
          });
          const isSelected = selectedEmotions.includes(emotionId);
          const isDisabled = maxSelections !== undefined && !isSelected && selectedEmotions.length >= maxSelections;

          return (
            <button
              key={emotionId}
              onClick={() => handleEmotionClick(emotionId)}
              disabled={isDisabled}
              className={`
                ${getEmotionBackgroundColor('advocacy')}
                ${isSelected 
                  ? 'ring-4 ring-blue-500 ring-offset-2 bg-blue-500 text-white border-blue-600' 
                  : 'hover:shadow-md'
                }
                relative
                ${isDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer'
                }
                px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 text-center break-words min-h-[40px] flex items-center justify-center
              `}
              title={emotion}
            >
              {emotion}
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Fila 2: Recommendation (5 emociones) - Verde medio */}
      <div className="grid grid-cols-5 gap-2">
        {EMOTION_CLUSTERS[1].emotions.map((emotion) => {
          const emotionId = emotion.toLowerCase().replace(/\s+/g, '_').replace(/[áéíóú]/g, (match) => {
            const accents: { [key: string]: string } = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
            return accents[match] || match;
          });
          const isSelected = selectedEmotions.includes(emotionId);
          const isDisabled = maxSelections !== undefined && !isSelected && selectedEmotions.length >= maxSelections;

          return (
            <button
              key={emotionId}
              onClick={() => handleEmotionClick(emotionId)}
              disabled={isDisabled}
              className={`
                ${getEmotionBackgroundColor('recommendation')}
                ${isSelected 
                  ? 'ring-4 ring-blue-500 ring-offset-2 bg-blue-500 text-white border-blue-600' 
                  : 'hover:shadow-md'
                }
                ${isDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer'
                }
                px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 text-center break-words min-h-[40px] flex items-center justify-center relative
              `}
              title={emotion}
            >
              {emotion}
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Fila 3: Attention (5 emociones) - Verde oscuro */}
      <div className="grid grid-cols-5 gap-2">
        {EMOTION_CLUSTERS[2].emotions.map((emotion) => {
          const emotionId = emotion.toLowerCase().replace(/\s+/g, '_').replace(/[áéíóú]/g, (match) => {
            const accents: { [key: string]: string } = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
            return accents[match] || match;
          });
          const isSelected = selectedEmotions.includes(emotionId);
          const isDisabled = maxSelections !== undefined && !isSelected && selectedEmotions.length >= maxSelections;

          return (
            <button
              key={emotionId}
              onClick={() => handleEmotionClick(emotionId)}
              disabled={isDisabled}
              className={`
                ${getEmotionBackgroundColor('attention')}
                ${isSelected 
                  ? 'ring-4 ring-blue-500 ring-offset-2 bg-blue-500 text-white border-blue-600' 
                  : 'hover:shadow-md'
                }
                relative
                ${isDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer'
                }
                px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 text-center break-words min-h-[40px] flex items-center justify-center relative
              `}
              title={emotion}
            >
              {emotion}
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Fila 4: Destroying (6 emociones) - Rojo claro */}
      <div className="grid grid-cols-6 gap-2">
        {EMOTION_CLUSTERS[3].emotions.slice(0, 6).map((emotion) => {
          const emotionId = emotion.toLowerCase().replace(/\s+/g, '_').replace(/[áéíóú]/g, (match) => {
            const accents: { [key: string]: string } = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
            return accents[match] || match;
          });
          const isSelected = selectedEmotions.includes(emotionId);
          const isDisabled = maxSelections !== undefined && !isSelected && selectedEmotions.length >= maxSelections;

          return (
            <button
              key={emotionId}
              onClick={() => handleEmotionClick(emotionId)}
              disabled={isDisabled}
              className={`
                ${getEmotionBackgroundColor('destroying')}
                ${isSelected 
                  ? 'ring-4 ring-blue-500 ring-offset-2 bg-blue-500 text-white border-blue-600' 
                  : 'hover:shadow-md'
                }
                relative
                ${isDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer'
                }
                px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 text-center break-words min-h-[40px] flex items-center justify-center
              `}
              title={emotion}
            >
              {emotion}
            </button>
          );
        })}
      </div>

      {/* Fila 5: Destroying restantes (2 emociones) - Rojo claro */}
      <div className="grid grid-cols-2 gap-2">
        {EMOTION_CLUSTERS[3].emotions.slice(6, 8).map((emotion) => {
          const emotionId = emotion.toLowerCase().replace(/\s+/g, '_').replace(/[áéíóú]/g, (match) => {
            const accents: { [key: string]: string } = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
            return accents[match] || match;
          });
          const isSelected = selectedEmotions.includes(emotionId);
          const isDisabled = maxSelections !== undefined && !isSelected && selectedEmotions.length >= maxSelections;

          return (
            <button
              key={emotionId}
              onClick={() => handleEmotionClick(emotionId)}
              disabled={isDisabled}
              className={`
                ${getEmotionBackgroundColor('destroying')}
                ${isSelected 
                  ? 'ring-4 ring-blue-500 ring-offset-2 bg-blue-500 text-white border-blue-600' 
                  : 'hover:shadow-md'
                }
                relative
                ${isDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer'
                }
                px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 text-center break-words min-h-[40px] flex items-center justify-center
              `}
              title={emotion}
            >
              {emotion}
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};