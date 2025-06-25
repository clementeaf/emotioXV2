import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../hooks/useStepResponseManager';
import { MappedStepComponentProps } from '../../types/flow.types';
import { SmartVOCQuestion } from '../../types/smart-voc.types';
import { formatQuestionText, formSpacing } from '../../utils/formHelpers';
import { StarRating } from './StarRating';

const CSATView: React.FC<MappedStepComponentProps> = ({
  stepConfig,
  onStepComplete,
}) => {
  // Convertir stepConfig a SmartVOCQuestion
  const question = stepConfig as SmartVOCQuestion;

  console.log('[CSATView] 🔍 Props recibidas:', { stepConfig, question });

  if (!question || !question.config) {
    return <div>Cargando configuración...</div>;
  }

  const questionText = question.title || 'Valora tu satisfacción';
  const instructions = question.instructions || question.config.instructions || '';
  const companyName = question.config.companyName || '';
  const useStars = question.config.type === 'stars';

  const satisfactionLevels = [
    { value: 1, label: 'Muy insatisfecho' },
    { value: 2, label: 'Insatisfecho' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Satisfecho' },
    { value: 5, label: 'Muy satisfecho' }
  ];

  const {
    responseData,
    saveCurrentStepResponse,
    isSaving,
    isLoading,
    error,
    hasExistingData
  } = useStepResponseManager<number>({
    stepId: question.id || '',
    stepType: question.type || 'CSAT',
    initialData: null
  });

  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  useEffect(() => {
    if (responseData !== null && typeof responseData === 'number') {
      setSelectedValue(responseData);
    }
  }, [responseData]);

  const buttonText = hasExistingData ? "Actualizar y continuar" : "Guardar y continuar";

  const handleSelect = (selectedValue: number) => {
    setSelectedValue(selectedValue);
  };

  const handleSave = async () => {
    if (selectedValue === null) {
      alert('Por favor, selecciona una opción.');
      return;
    }

    const result = await saveCurrentStepResponse(selectedValue);
    if (result.success) {
      onStepComplete && onStepComplete({
        success: true,
        data: selectedValue,
        value: selectedValue
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
        <div className="text-center text-neutral-500">Cargando...</div>
      </div>
    );
  }

  const formattedQuestionText = formatQuestionText(questionText, companyName);
  const isButtonDisabled = isSaving || selectedValue === null;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
      <div className="max-w-2xl w-full flex flex-col items-center">

        <h2 className={`text-xl font-medium text-center text-neutral-800 ${formSpacing.field}`}>
          {formattedQuestionText}
        </h2>

        {instructions && (
          <p className={`text-sm text-center text-neutral-600 ${formSpacing.section}`}>
            {instructions}
          </p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">Error: {error}</p>
          </div>
        )}

        <div className={`flex justify-center ${formSpacing.section} w-full`}>
          {useStars ? (
            <StarRating
              count={5}
              value={selectedValue || 0}
              onChange={handleSelect}
              disabled={isSaving}
            />
          ) : (
            <div className={`flex flex-col sm:flex-row justify-center ${formSpacing.scaleGap} w-full`}>
              {satisfactionLevels.map((level) => {
                const isSelected = selectedValue === level.value;
                return (
                  <button
                    key={level.value}
                    onClick={() => handleSelect(level.value)}
                    className={`px-4 py-3 rounded-md border flex flex-col items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                    } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isSaving}
                  >
                    <span className="font-medium">{level.value}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSave}
            disabled={isButtonDisabled}
            className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Guardando...' : buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CSATView;
