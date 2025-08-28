import React from 'react';
import { DetailedEmotionSelector, EmotionHierarchySelector } from './EmotionHierarchyComponents';
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

  // 🎯 GENERAR ELEMENTOS SEGÚN EL TIPO
  const elements = useStars
    ? Array.from({ length: max - min + 1 }, (_, i) => ({ id: min + i, symbol: '★' }))
    : emojis.map((emoji, idx) => ({ id: idx + 1, symbol: emoji }));

  // 🎯 LABELS PARA ESTRELLAS
  const displayStartLabel = useStars ? startLabel || '1 - Muy insatisfecho' : '';
  const displayEndLabel = useStars ? endLabel || '5 - Muy satisfecho' : '';

  // 🎯 LOGS DE DEBUG

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-row items-center justify-center gap-6">
        {elements.map((element) => (
          <button
            key={element.id}
            type="button"
            className={`transition ${useStars
              ? `text-3xl ${(value ?? 0) >= element.id ? 'text-yellow-500 scale-125' : 'text-gray-300 hover:text-yellow-400 hover:scale-110'}`
              : `text-3xl ${value === element.id ? 'scale-125' : 'opacity-80 hover:scale-110'}`
              }`}
            onClick={() => onChange?.(element.id)}
            aria-label={`Seleccionar ${element.id} ${useStars ? 'estrella' : 'emoji'}`}
          >
            {element.symbol}
          </button>
        ))}
      </div>
      {/* 🎯 MOSTRAR LABELS SOLO PARA ESTRELLAS */}
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
        className="w-full max-w-md min-h-[150px] min-w-[350px] border border-gray-300 rounded p-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
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

  return (
    <div className="flex flex-col items-center w-full gap-4">
      {choices.map((choice) => (
        <button
          key={choice.id}
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

export interface DetailedEmotionQuestionProps {
  selectedEmotions?: string[];
  onEmotionSelect?: (emotionId: string) => void;
  maxSelections?: number;
}

export const DetailedEmotionQuestion: React.FC<DetailedEmotionQuestionProps> = ({
  selectedEmotions = [],
  onEmotionSelect,
  maxSelections = 3,
}) => (
  <DetailedEmotionSelector
    selectedEmotions={selectedEmotions}
    onEmotionSelect={onEmotionSelect}
    maxSelections={maxSelections}
  />
);
