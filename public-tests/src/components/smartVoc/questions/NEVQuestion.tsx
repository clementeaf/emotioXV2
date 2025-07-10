import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../../hooks/useStepResponseManager';
import { NEVQuestionComponentProps } from '../../../types/smart-voc.types';
import { getStandardButtonText } from '../../../utils/formHelpers';

const emojiOptions = [
  { value: 'negative', label: '😞', numValue: -1 },
  { value: 'neutral', label: '😐', numValue: 0 },
  { value: 'positive', label: '😊', numValue: 1 },
];

export const NEVQuestion: React.FC<NEVQuestionComponentProps> = ({ questionConfig, onSaveSuccess }) => {
  const { id: questionId, description, title: questionTitle } = questionConfig;

  const {
    responseData,
    saveCurrentStepResponse,
    isSaving,
    isLoading,
    error,
    hasExistingData
  } = useStepResponseManager({
    stepId: questionId,
    stepType: 'nev-question',
    stepName: questionTitle || 'Pregunta NEV',
    researchId: undefined,
    participantId: undefined,
  });

  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  useEffect(() => {
    let initialValue: number | null = null;
    if (typeof responseData === 'number') {
      initialValue = responseData;
    } else if (
      typeof responseData === 'string' && String(responseData).length >= 1
    ) {
      const found = emojiOptions.find(opt => opt.label === responseData || opt.label.trim() === String(responseData).trim());
      if (found) initialValue = found.numValue;
    } else if (
      typeof responseData === 'object' &&
      responseData !== null &&
      'value' in responseData &&
      typeof (responseData as any).value === 'number'
    ) {
      initialValue = (responseData as any).value;
    } else if (
      typeof responseData === 'object' &&
      responseData !== null &&
      Object.values(responseData).length === 1 &&
      typeof Object.values(responseData)[0] === 'number'
    ) {
      initialValue = Object.values(responseData)[0] as number;
    }
    setSelectedValue(initialValue);
  }, [responseData]);

  const handleSelect = (numValue: number) => {
    setSelectedValue(numValue);
  };

  const handleSave = async () => {
    if (selectedValue === null) {
      alert('Por favor, selecciona una opción.');
      return;
    }

    const result = await saveCurrentStepResponse(selectedValue);
    if (result.success) {
      onSaveSuccess && onSaveSuccess(questionId, selectedValue, result.id || null);
    }
  };

  const buttonText = getStandardButtonText({
    isSaving,
    isLoading,
    hasExistingData
  });

  // Usar el título de la pregunta configurado, con fallback a description
  const questionText = questionTitle || description || 'Indica tu nivel emocional';

  if (!questionText) {
    return <div className="text-red-600">Error: Falta el texto de la pregunta.</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Cargando pregunta...</div>;
  }

  return (
    <div className="space-y-4 flex flex-col items-center w-full">
      <h2 className="text-xl font-medium text-center text-neutral-800 mb-4">
        {questionText}
      </h2>
      <div className="flex justify-center gap-4 md:gap-6">
        {emojiOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.numValue)}
            className={`p-2 rounded-full transition-all duration-150 ease-in-out
              ${selectedValue === option.numValue
                ? 'bg-blue-100 ring-2 ring-blue-500 scale-110'
                : 'bg-gray-100 hover:bg-gray-200'
              }`}
            aria-label={`Seleccionar ${option.value}`}
            disabled={isSaving || isLoading}
          >
            <span className="text-3xl md:text-4xl">{option.label}</span>
          </button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-600 my-2 text-center">Error: {error}</p>
      )}
      <button
        className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleSave}
        disabled={isSaving || isLoading || selectedValue === null}
      >
        {buttonText}
      </button>
    </div>
  );
};
