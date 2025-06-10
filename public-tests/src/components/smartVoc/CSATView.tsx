import React, { useState, useEffect } from 'react';
import { useModuleResponses } from '../../hooks/useModuleResponses';
import { useResponseAPI } from '../../hooks/useResponseAPI';
import { useParticipantStore } from '../../stores/participantStore';
import { CSATViewProps } from '../../types/smart-voc.types';
import { formatQuestionText, formSpacing, getStandardButtonText } from '../../utils/formHelpers';

const CSATView: React.FC<CSATViewProps> = ({
  questionText,
  instructions,
  companyName,
  onNext,
  onStepComplete,
}) => {

  const satisfactionLevels = [
    { value: 1, label: 'Muy insatisfecho' },
    { value: 2, label: 'Insatisfecho' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Satisfecho' },
    { value: 5, label: 'Muy satisfecho' }
  ];

  const [csatValue, setCsatValue] = useState<number | null>(null);
  const [isSubmittingToServer, setIsSubmittingToServer] = useState(false);
  
  const researchId = useParticipantStore(state => state.researchId);
  const participantId = useParticipantStore(state => state.participantId);
  
  const { data: moduleResponsesArray, isLoading, error: moduleError } = useModuleResponses();
  const { saveOrUpdateResponse } = useResponseAPI({ researchId: researchId || '', participantId: participantId || '' });

  useEffect(() => {
    if (moduleResponsesArray && Array.isArray(moduleResponsesArray)) {
      const csatResponse = moduleResponsesArray.find((r: any) => r.stepType === 'smartvoc_csat');
      if (csatResponse && csatResponse.response !== null && csatResponse.response !== undefined) {
        setCsatValue(csatResponse.response);
      }
    }
  }, [moduleResponsesArray]);

  const hasExistingData = !!(csatValue !== null && csatValue !== undefined);

  const buttonText = getStandardButtonText({
    isSaving: false,
    isLoading: isSubmittingToServer,
    hasExistingData: hasExistingData,
    isNavigating: isSubmittingToServer,
    customCreateText: 'Guardar y continuar',
    customUpdateText: 'Actualizar y continuar'
  });

  const handleSelect = (selectedValue: number) => {
    setCsatValue(selectedValue);
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (csatValue === null) {
      return;
    }
    
    setIsSubmittingToServer(true);
    
    try {
      // Buscar si existe una respuesta previa de CSAT
      const existingCsatResponse = moduleResponsesArray && Array.isArray(moduleResponsesArray) 
        ? moduleResponsesArray.find((r: any) => r.stepType === 'smartvoc_csat')
        : null;
      
      const result = await saveOrUpdateResponse(
        'smartvoc_csat',
        'smartvoc_csat', 
        'Satisfacción del Cliente (CSAT)',
        csatValue,
        existingCsatResponse?.id
      );
      
      if (result) {
        if (onNext) {
          onNext(csatValue);
        } else if (onStepComplete) {
          onStepComplete({ 
            success: true, 
            data: csatValue, 
            value: csatValue 
          });
        }
      }
    } catch (error) {
      console.error('Error guardando CSAT:', error);
    } finally {
      setIsSubmittingToServer(false);
    }
  };

  if (isLoading && !moduleResponsesArray) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
        <div className="text-center text-neutral-500">Cargando respuestas previas...</div>
      </div>
    );
  }

  const formattedQuestionText = formatQuestionText(questionText, companyName);
  const isButtonDisabled = isLoading || isSubmittingToServer || csatValue === null;

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

        {moduleError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">Error: {moduleError}</p>
          </div>
        )}

        <div className={`flex flex-col sm:flex-row justify-center ${formSpacing.scaleGap} ${formSpacing.section} w-full`}>
          {satisfactionLevels.map((level) => {
            const isSelected = csatValue === level.value;
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