import React from 'react';
import { useStandardizedForm } from '../../hooks/useStandardizedForm';
import { StandardizedFormProps } from '../../types/hooks.types';
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
  onNext,
  // Props estandarizadas que vienen del flujo
  stepId,
  stepType,
  stepName,
  savedResponse,
  savedResponseId,
  required
}) => {

  // 🔍 LOGGING CRÍTICO PARA DIAGNÓSTICO
  console.log('[EmotionSelectionView] 🔍 Props recibidas:', {
    questionText,
    instructions,
    companyName,
    config,
    stepId,
    stepType,
    stepName,
    savedResponse,
    savedResponseId,
    required
  });

  // Crear props estandarizadas
  const standardProps: StandardizedFormProps = {
    stepId: stepId || 'nev-default',
    stepType: stepType || 'smartvoc_nev',
    stepName: stepName || questionText,
    savedResponse,
    savedResponseId,
    required: required || false
  };

  console.log('[EmotionSelectionView] 🔍 Props para useStandardizedForm:', standardProps);

  const [state, actions] = useStandardizedForm<string | null>(standardProps, {
    initialValue: null,
    extractValueFromResponse: (response: unknown): string | null => {
      console.log('[EmotionSelectionView] extractValueFromResponse called with:', response, typeof response);

      // Si es string directo (emoji)
      if (typeof response === 'string') {
        console.log('[EmotionSelectionView] Direct string:', response);
        return response;
      }

      // Si es objeto con campo 'value'
      if (typeof response === 'object' && response !== null) {
        const obj = response as Record<string, unknown>;
        if ('value' in obj && typeof obj.value === 'string') {
          console.log('[EmotionSelectionView] Extracted from value field:', obj.value);
          return obj.value;
        }

        // Si es objeto con campo 'response'
        if ('response' in obj) {
          const innerResponse = obj.response;
          if (typeof innerResponse === 'string') {
            console.log('[EmotionSelectionView] Extracted from nested response:', innerResponse);
            return innerResponse;
          }
          if (typeof innerResponse === 'object' && innerResponse !== null && 'value' in (innerResponse as Record<string, unknown>)) {
            const nestedValue = (innerResponse as Record<string, unknown>).value;
            if (typeof nestedValue === 'string') {
              console.log('[EmotionSelectionView] Extracted from nested response.value:', nestedValue);
              return nestedValue;
            }
          }
        }
      }

      console.log('[EmotionSelectionView] Could not extract string from response:', response);
      return null;
    }
  });

  const { value: selectedEmoji, isSaving, isLoading, error, hasExistingData } = state;
  const { setValue, validateAndSave } = actions;

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

  const handleSelect = (emoji: string) => {
    setValue(emoji, true); // true = user interaction
  };

  const handleNextClick = async () => {
    if (selectedEmoji !== null) {
      const result = await validateAndSave();
      if (result.success && onNext) {
        onNext(selectedEmoji);
      }
    }
  };

  const formattedQuestionText = companyName
    ? questionText.replace(/\[company\]|\[empresa\]/gi, companyName)
    : questionText;

  // Log para depuración
  console.log('[EmotionSelectionView] Current selectedEmoji:', selectedEmoji);
  console.log('[EmotionSelectionView] hasExistingData:', hasExistingData);

  // Determinar el texto del botón basado en si hay datos existentes
  const getButtonText = () => {
    if (isSaving) return 'Guardando...';
    return hasExistingData ? 'Actualizar y continuar' : 'Guardar y continuar';
  };

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

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {emojis.map((item) => (
            <button
              key={item.label}
              onClick={() => handleSelect(item.emoji)}
              disabled={isLoading || isSaving}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-150 ease-in-out disabled:opacity-50 ${selectedEmoji === item.emoji
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
          disabled={selectedEmoji === null || isSaving}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
};

export default EmotionSelectionView;
