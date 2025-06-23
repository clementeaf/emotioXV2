import React, { useState } from 'react';
import { BasicEmoji, EmotionSelectionViewComponentProps } from '../../types/smart-voc.types';

// =================================================================
// CONJUNTOS DE DATOS PARA CADA TIPO DE PREGUNTA NEV
// =================================================================

// 1. Para 'emojis' (Escala emocional completa - 7 niveles)
const emotionalScaleEmojis: BasicEmoji[] = [
  { emoji: '😡', label: 'Muy negativo' },
  { emoji: '😠', label: 'Negativo' },
  { emoji: '😞', label: 'Ligeramente negativo' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😊', label: 'Ligeramente positivo' },
  { emoji: '😄', label: 'Positivo' },
  { emoji: '😁', label: 'Muy positivo' },
];

// 2. Para 'emojis_detailed' (20 estados)
const detailedEmojis: BasicEmoji[] = [
  // Positivos
  { emoji: '😁', label: 'Extasiado' }, { emoji: '😄', label: 'Alegre' },
  { emoji: '😊', label: 'Contento' }, { emoji: '🙂', label: 'Satisfecho' },
  { emoji: '😌', label: 'Relajado' }, { emoji: '😍', label: 'Encantado' },
  { emoji: '🥳', label: 'Emocionado' }, { emoji: '🤩', label: 'Asombrado' },
  { emoji: '🤗', label: 'Agradecido' }, { emoji: '😎', label: 'Seguro' },
  // Negativos
  { emoji: '😠', label: 'Enojado' }, { emoji: '😡', label: 'Furioso' },
  { emoji: '😞', label: 'Triste' }, { emoji: '😥', label: 'Decepcionado' },
  { emoji: '😟', label: 'Preocupado' }, { emoji: '😬', label: 'Nervioso' },
  { emoji: '😕', label: 'Confuso' }, { emoji: '🤢', label: 'Asqueado' },
  { emoji: '😫', label: 'Frustrado' }, { emoji: '🥱', label: 'Aburrido' },
];

// 3. Para 'quadrants' (4 estadios)
const quadrantEmojis: BasicEmoji[] = [
    { emoji: '😄', label: 'Alta energía, Positivo' },
    { emoji: '😠', label: 'Alta energía, Negativo' },
    { emoji: '😌', label: 'Baja energía, Positivo' },
    { emoji: '😞', label: 'Baja energía, Negativo' },
];

const EmotionSelectionView: React.FC<EmotionSelectionViewComponentProps> = ({
  questionText,
  instructions,
  companyName,
  config,
  initialValue,
  onNext
}) => {
  // Determinar qué conjunto de emojis usar basándose en la configuración
  const getEmojiSet = () => {
    switch (config?.type) {
      case 'emojis_detailed':
        return detailedEmojis;
      case 'quadrants':
        return quadrantEmojis;
      case 'emojis':
      default:
        return emotionalScaleEmojis;
    }
  };

  const emojis = getEmojiSet();
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(initialValue || null);

  const handleSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
  };

  const handleNextClick = () => {
    if (selectedEmoji !== null) {
      onNext(selectedEmoji);
    }
  };

  const formattedQuestionText = companyName
    ? questionText.replace(/\[company\]|\[empresa\]/gi, companyName)
    : questionText;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
      <div className="max-w-xl w-full flex flex-col items-center">
        <h2 className="text-xl font-medium text-center text-neutral-800 mb-4">
          {formattedQuestionText}
        </h2>

        {instructions && (
          <p className="text-sm text-center text-neutral-600 mb-8">
            {instructions}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {emojis.map((item) => (
            <button
              key={item.label}
              onClick={() => handleSelect(item.emoji)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-150 ease-in-out ${selectedEmoji === item.emoji
                ? 'bg-indigo-100 scale-110 ring-2 ring-indigo-500'
                : 'hover:scale-110 hover:bg-neutral-100'
              }`}
            >
              <span className="text-4xl">{item.emoji}</span>
              <span className="text-xs text-neutral-600">{item.label}</span>
            </button>
          ))}
        </div>

        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-8 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleNextClick}
          disabled={selectedEmoji === null}
        >
          Guardar y continuar
        </button>
      </div>
    </div>
  );
};

export default EmotionSelectionView;
