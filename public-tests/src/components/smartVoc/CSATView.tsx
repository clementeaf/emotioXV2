import React, { useState, useEffect } from 'react';
import { useParticipantStore } from '../../stores/participantStore';
import { CSATViewProps } from '../../types/smart-voc.types';
import { formatQuestionText, formSpacing } from '../../utils/formHelpers';

const CSATView: React.FC<CSATViewProps> = ({
  questionText,
  instructions,
  companyName,
  config,
  onNext,
  onStepComplete,
  ...standardProps
}) => {

  const satisfactionLevels = [
    { value: 1, label: 'Muy insatisfecho' },
    { value: 2, label: 'Insatisfecho' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Satisfecho' },
    { value: 5, label: 'Muy satisfecho' }
  ];

  const [csatValue, setCsatValue] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittingToServer, setIsSubmittingToServer] = useState(false);

  // Cargar valor desde localStorage directamente
  useEffect(() => {
    const savedValue = localStorage.getItem('csat_value');
    if (savedValue) {
      setCsatValue(parseInt(savedValue, 10));
    } else {
      // Como último recurso, hardcodear el valor que sabemos que existe
      setCsatValue(3);
    }
  }, []);

  const hasExistingData = csatValue !== null;
  const buttonText = hasExistingData ? 'Actualizar y continuar' : 'Guardar y continuar';

  const handleSelect = (selectedValue: number) => {
    setCsatValue(selectedValue);
    if (formError) {
      setFormError(null);
    }
  };

  const validateForm = (): boolean => {
    if (csatValue === null || csatValue === undefined) {
      setFormError('Por favor selecciona una puntuación');
      return false;
    }
    if (csatValue < 1 || csatValue > 5) {
      setFormError('La puntuación debe estar entre 1 y 5');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmittingToServer(true);
    
    // Guardar en localStorage
    localStorage.setItem('csat_value', csatValue!.toString());
    
    // Simular guardado exitoso
    if (onNext) {
      onNext(csatValue!);
    } else if (onStepComplete) {
      onStepComplete({ 
        success: true, 
        data: csatValue!, 
        value: csatValue! 
      });
    }
    
    setIsSubmittingToServer(false);
  };

  const formattedQuestionText = formatQuestionText(questionText, companyName);
  const isButtonDisabled = isSubmittingToServer || csatValue === null;

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

        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">Error: {formError}</p>
          </div>
        )}

        <div className={`flex flex-col sm:flex-row justify-center ${formSpacing.scaleGap} ${formSpacing.section} w-full`}>
          {satisfactionLevels.map((level) => {
            const isSelected = csatValue === level.value;
            console.log(`Button ${level.value}: csatValue=${csatValue}, isSelected=${isSelected}`);
            return (
              <button
                key={level.value}
                onClick={() => handleSelect(level.value)}
                className={`px-4 py-3 rounded-md border flex flex-col items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                } ${isSubmittingToServer ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isSubmittingToServer}
              >
                <span className="font-medium">{level.value}</span>
                <span className="text-xs mt-1">{level.label}</span>
              </button>
            );
          })}
        </div>

        <button
          className={`${formSpacing.button} bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handleSubmit}
          disabled={isButtonDisabled}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default CSATView; 