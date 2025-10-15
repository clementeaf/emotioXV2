import React from 'react';
import { EmotionHierarchySelector } from './emotion';
import { DetailedEmotionSelector } from './emotion/DetailedEmotionSelector';
import { ScaleRangeQuestionProps, SingleAndMultipleChoiceQuestionProps } from './types';

export function ScaleRangeQuestion({
  min = 1,
  max = 5,
  leftLabel = 'Sí',
  rightLabel = 'No',
  startLabel,
  endLabel,
  value,
  onChange,
}: ScaleRangeQuestionProps) {
  const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  // 🎯 USAR STARTLABEL/ENDLABEL SI ESTÁN DISPONIBLES
  const displayStartLabel = startLabel || leftLabel;
  const displayEndLabel = endLabel || rightLabel;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-row items-center justify-center gap-6">
        {range.map((num) => (
          <button
            key={num}
            type="button"
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg font-semibold transition ${value === num
              ? 'bg-blue-600 text-white border-blue-700'
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            onClick={() => onChange?.(num)}
            aria-label={`Seleccionar ${num}`}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="flex flex-row items-center justify-between w-full max-w-md mt-2">
        <span className="text-xs text-gray-500">{displayStartLabel}</span>
        <span className="text-xs text-gray-500">{displayEndLabel}</span>
      </div>
    </div>
  );
}

// Nuevo componente para selector de emojis
export interface EmojiRangeQuestionProps {
  emojis?: string[];
  value?: number;
  onChange?: (value: number) => void;
  type?: 'stars' | 'emojis';
  min?: number;
  max?: number;
  startLabel?: string;
  endLabel?: string;
}

export const EmojiRangeQuestion: React.FC<EmojiRangeQuestionProps> = ({
  emojis = ['😡', '😕', '😐', '🙂', '😄'],
  value,
  onChange,
  type = 'emojis',
  min = 1,
  max = 5,
  startLabel,
  endLabel,
}) => {
  // 🎯 DETERMINAR SI USAR ESTRELLAS O EMOJIS
  const useStars = type === 'stars';
  
  // 🎯 ESTADO PARA MANEJAR HOVER EN ESTRELLAS
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const elements = useStars
    ? Array.from({ length: max - min + 1 }, (_, i) => ({ id: min + i, symbol: '★' }))
    : emojis.map((emoji, idx) => ({ id: idx + 1, symbol: emoji }));

  const displayStartLabel = useStars ? startLabel || '1 - Muy insatisfecho' : '';
  const displayEndLabel = useStars ? endLabel || '5 - Muy satisfecho' : '';

  // 🎯 FUNCIÓN PARA DETERMINAR SI UNA ESTRELLA DEBE ESTAR ILUMINADA
  const isStarActive = (elementId: number) => {
    if (useStars) {
      // Durante hover, mostrar progresión hasta la estrella hovereada
      const currentValue = hoverValue !== null ? hoverValue : (value ?? 0);
      return currentValue >= elementId;
    }
    return value === elementId;
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-row items-center justify-center gap-6">
        {elements.map((element) => (
          <button
            key={element.id}
            type="button"
            className={`transition ${useStars
              ? `text-3xl ${isStarActive(element.id) ? 'text-yellow-500 scale-125' : 'text-gray-300 hover:text-yellow-400 hover:scale-110'}`
              : `text-3xl ${value === element.id ? 'scale-125' : 'opacity-80 hover:scale-110'}`
              }`}
            onClick={() => onChange?.(element.id)}
            onMouseEnter={() => useStars && setHoverValue(element.id)}
            onMouseLeave={() => useStars && setHoverValue(null)}
            aria-label={`Seleccionar ${element.id} ${useStars ? 'estrella' : 'emoji'}`}
          >
            {element.symbol}
          </button>
        ))}
      </div>
      {useStars && (displayStartLabel || displayEndLabel) && (
        <div className="flex flex-row items-center justify-between w-full max-w-md mt-2">
          <span className="text-xs text-gray-500">{displayStartLabel}</span>
          <span className="text-xs text-gray-500">{displayEndLabel}</span>
        </div>
      )}
    </div>
  );
};

// Nuevo componente para respuestas abiertas tipo texto
export interface VOCTextQuestionProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export const VOCTextQuestion: React.FC<VOCTextQuestionProps> = ({
  value,
  onChange,
  placeholder = 'Escribe tu respuesta aquí...',
}) => {

  return (
    <div className="w-full flex flex-col items-center">
      <textarea
        className="w-full max-w-md min-h-[150px] min-w-[350px] border border-gray-300 rounded p-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        value={value || ''}
        onChange={e => {
          onChange?.(e.target.value);
        }}
        placeholder={placeholder}
        data-testid="cognitive-short-text-textarea"
      />
    </div>
  );
};

export const SingleAndMultipleChoiceQuestion: React.FC<SingleAndMultipleChoiceQuestionProps> = ({
  choices,
  value,
  onChange,
  multiple = false,
}) => {

  // 🎯 FORZAR VALOR CORRECTO PARA MÚLTIPLE
  const currentValue = multiple && !Array.isArray(value) ? [] : value;


  const isSelected = (id: string) => {
    const selected = multiple && Array.isArray(currentValue)
      ? currentValue.includes(id)
      : currentValue === id;


    return selected;
  };

  const handleClick = (id: string) => {

    if (multiple) {
      // 🎯 FORZAR COMPORTAMIENTO MÚLTIPLE
      const currentArray = Array.isArray(currentValue) ? currentValue : [];

      if (currentArray.includes(id)) {
        const newValue = currentArray.filter((v) => v !== id);
        onChange(newValue);
      } else {
        const newValue = [...currentArray, id];
        onChange(newValue);
      }
    } else {
      onChange(id);
    }
  };

  // 🔍 VERIFICAR SI HAY CHOICES
  if (!choices || choices.length === 0) {
    return (
      <div className="flex flex-col items-center w-full gap-4">
        <div className="w-full max-w-md border border-red-300 rounded py-4 px-4 bg-red-50">
          <p className="text-red-600 text-center">
            ⚠️ No hay opciones disponibles para esta pregunta
          </p>
          <p className="text-sm text-red-500 text-center mt-2">
            Debug: choices = {JSON.stringify(choices)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full gap-4">
      {choices.map((choice, index) => (
        <button
          key={`${choice.id}-${index}-${choice.text}`}
          type="button"
          className={`w-full max-w-md border rounded py-2 px-4 text-base transition text-left ${isSelected(choice.id)
            ? 'bg-blue-600 text-white border-blue-700'
            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
          onClick={() => handleClick(choice.id)}
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
};

// Nuevos componentes para jerarquía de emociones
export interface EmotionHierarchyQuestionProps {
  selectedCluster?: string;
  onClusterSelect?: (clusterId: string) => void;
}

export const EmotionHierarchyQuestion: React.FC<EmotionHierarchyQuestionProps> = ({
  selectedCluster,
  onClusterSelect,
}) => (
  <EmotionHierarchySelector
    selectedCluster={selectedCluster}
    onClusterSelect={onClusterSelect}
  />
);

// 🎯 WRAPPER ELIMINADO - USAR COMPONENTE DIRECTO
// DetailedEmotionQuestion era solo un wrapper innecesario
// Usar directamente DetailedEmotionSelector desde:
// ./emotion/DetailedEmotionSelector

// 🎯 NUEVO COMPONENTE: ESCALA LINEAL CON BARRA DESLIZANTE
export interface LinearScaleSliderProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  startLabel?: string;
  endLabel?: string;
  disabled?: boolean;
}

export const LinearScaleSlider: React.FC<LinearScaleSliderProps> = ({
  value = 0,
  onChange,
  min = 0,
  max = 10,
  startLabel = 'Strongly disagree',
  endLabel = 'Strongly agree',
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const sliderRef = React.useRef<HTMLDivElement>(null);

  // 🎯 CALCULAR PORCENTAJE DEL VALOR ACTUAL
  const percentage = ((value - min) / (max - min)) * 100;

  // 🎯 MANEJAR CLICK EN LA BARRA
  const handleSliderClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const sliderWidth = rect.width;
    const newValue = Math.round((clickX / sliderWidth) * (max - min) + min);
    const clampedValue = Math.max(min, Math.min(max, newValue));
    
    onChange?.(clampedValue);
  };

  // 🎯 MANEJAR ARRASTRE
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    setIsDragging(true);
    handleSliderClick(event);
  };

  const handleMouseMove = React.useCallback((event: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const sliderWidth = rect.width;
    const newValue = Math.round((clickX / sliderWidth) * (max - min) + min);
    const clampedValue = Math.max(min, Math.min(max, newValue));
    
    onChange?.(clampedValue);
  }, [isDragging, min, max, onChange]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 🎯 EFECTOS PARA ARRASTRE
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove]);

  return (
    <div className="flex flex-col items-center w-full max-w-2xl px-4">
      {/* 🎯 BARRA DESLIZANTE */}
      <div className="relative w-full h-8 mb-4">
        <div
          ref={sliderRef}
          className={`relative w-full h-2 bg-gray-200 rounded-full cursor-pointer transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'
          }`}
          onClick={handleSliderClick}
          onMouseDown={handleMouseDown}
        >
          {/* 🎯 BARRA DE PROGRESO */}
          <div
            className="absolute top-0 left-0 h-full bg-green-500 rounded-full transition-all duration-200"
            style={{ width: `${percentage}%` }}
          />
          
          {/* 🎯 INDICADOR DEL VALOR */}
          <div
            className={`absolute top-1/2 w-6 h-6 bg-white border-2 border-green-500 rounded-full transition-all duration-200 shadow-lg ${
              disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
            }`}
            style={{ 
              left: `${Math.max(0, Math.min(100, percentage))}%`, 
              transform: `translateX(-50%) translateY(-50%)` 
            }}
          >
            {/* 🎯 ÍCONO DE CHECK */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 🎯 ETIQUETAS DE EXTREMOS */}
      <div className="flex justify-between w-full text-sm text-gray-600">
        <span className="text-left">{startLabel}</span>
        <span className="text-right">{endLabel}</span>
      </div>

      {/* 🎯 VALOR ACTUAL */}
      <div className="mt-2 text-lg font-semibold text-green-600">
        {value}
      </div>
    </div>
  );
};
