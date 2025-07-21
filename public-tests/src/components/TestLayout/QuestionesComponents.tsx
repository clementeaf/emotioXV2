import React from 'react';
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
}

export const EmojiRangeQuestion: React.FC<EmojiRangeQuestionProps> = ({
  emojis = ['😡', '😕', '😐', '🙂', '😄'],
  value,
  onChange,
}) => (
  <div className="flex flex-col items-center w-full">
    <div className="flex flex-row items-center justify-center gap-6">
      {emojis.map((emoji, idx) => (
        <button
          key={emoji}
          type="button"
          className={`text-3xl transition ${value === idx + 1 ? 'scale-125' : 'opacity-80 hover:scale-110'
            }`}
          onClick={() => onChange?.(idx + 1)}
          aria-label={`Seleccionar ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  </div>
);

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
  console.log('[VOCTextQuestion] 🧠 Renderizando textarea:', {
    value,
    placeholder,
    hasOnChange: !!onChange
  });

  return (
    <div className="w-full flex flex-col items-center">
      <textarea
        className="w-full max-w-md min-h-[150px] min-w-[350px] border border-gray-300 rounded p-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={value || ''}
        onChange={e => {
          console.log('[VOCTextQuestion] 🔄 Cambio en textarea:', e.target.value);
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
  console.log('[SingleAndMultipleChoiceQuestion] 🎯 Renderizando opciones:', {
    choices,
    choicesLength: choices.length,
    value,
    multiple
  });

  const isSelected = (id: string) =>
    multiple && Array.isArray(value)
      ? value.includes(id)
      : value === id;

  const handleClick = (id: string) => {
    console.log('[SingleAndMultipleChoiceQuestion] 🔄 Click en opción:', {
      id,
      currentValue: value,
      multiple
    });

    if (multiple && Array.isArray(value)) {
      if (value.includes(id)) {
        onChange(value.filter((v) => v !== id));
      } else {
        onChange([...value, id]);
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
