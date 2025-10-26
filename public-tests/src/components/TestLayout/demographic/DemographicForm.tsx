import React from 'react';
// import { useDisqualificationRedirect } from '../../../hooks/useDisqualificationRedirect'; // Removed
// import { useEyeTrackingConfigQuery } from '../../../hooks/useEyeTrackingConfigQuery'; // Removed
// import { useOptimizedMonitoringWebSocket } from '../../../hooks/useOptimizedMonitoringWebSocket'; // Removed
// import { useDemographicValidation } from '../../../hooks/useDemographicValidation'; // Removed
// import { useDemographicSave } from '../../../hooks/useDemographicSave'; // Removed
// import { useDemographicData } from '../../../hooks/useDemographicData'; // Removed
import { useTestStore } from '../../../stores/useTestStore';
import { useParticipantStore } from '../../../stores/useParticipantStore';
import { DemographicFormUI } from './DemographicFormUI';

interface DemographicFormProps {
  demographicQuestions: Record<string, unknown>;
  currentQuestionKey?: string;
  onSubmit?: (data: Record<string, string>) => void;
}

export const DemographicForm: React.FC<DemographicFormProps> = ({
  demographicQuestions,
  currentQuestionKey = 'demographics',
  onSubmit
}) => {
  const { researchId } = useTestStore();
  // TODO: Implementar hooks eliminados o usar alternativas
  const eyeTrackingConfig = null; // Temporal: null hasta implementar hook
  const redirectToDisqualification = () => {
    // Temporal: implementación básica
    console.log('redirectToDisqualification not implemented yet');
  };
  const sendParticipantDisqualified = () => {
    // Temporal: implementación básica
    console.log('sendParticipantDisqualified not implemented yet');
  };

  const validateCurrentData = () => {
    // Temporal: implementación básica
    console.log('validateCurrentData not implemented yet');
    return true;
  };
  const isLoading = false; // Temporal: false hasta implementar hook
  const saveDemographicsToBackend = async () => {
    // Temporal: implementación básica
    console.log('saveDemographicsToBackend not implemented yet');
  };
  const formValues = {}; // Temporal: objeto vacío hasta implementar hook
  const hasLoadedData = false; // Temporal: false hasta implementar hook
  const handleInputChange = (field: string, value: any) => {
    // Temporal: implementación básica
    console.log('handleInputChange not implemented yet:', field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Implementar validación y guardado cuando los hooks estén disponibles
    console.log('DemographicForm - handleSubmit not fully implemented yet');
    
    if (onSubmit) {
      onSubmit(formValues);
    }
  };

  const questionsToShow = demographicQuestions; // Temporal: usar solo demographicQuestions hasta implementar hook

  const questions = Object.entries(questionsToShow)
    .filter(([, questionData]) => (questionData as { enabled?: boolean })?.enabled)
    .map(([key, questionData]) => {
      const questionDataAny = questionData as { 
        enabled?: boolean;
        type?: string; 
        required?: boolean; 
        title?: string;
        options?: string[];
        disqualifyingAges?: string[];
        disqualifyingCountries?: string[];
        disqualifyingGenders?: string[];
        disqualifyingEducation?: string[];
        disqualifyingIncomes?: string[];
        disqualifyingEmploymentStatuses?: string[];
        disqualifyingHours?: string[];
        disqualifyingProficiencies?: string[];
      };

      const disqualifyingOptions = questionDataAny?.disqualifyingAges ||
        questionDataAny?.disqualifyingCountries ||
        questionDataAny?.disqualifyingGenders ||
        questionDataAny?.disqualifyingEducation ||
        questionDataAny?.disqualifyingIncomes ||
        questionDataAny?.disqualifyingEmploymentStatuses ||
        questionDataAny?.disqualifyingHours ||
        questionDataAny?.disqualifyingProficiencies || [];

      const allOptions = questionDataAny?.options || [];

      const sortedOptions = key === 'age'
        ? allOptions.sort((a: string, b: string) => {
          const getMinAge = (range: string) => {
            if (range.includes('+')) {
              return parseInt(range.replace('+', ''));
            }
            return parseInt(range.split('-')[0]);
          };
          return getMinAge(a) - getMinAge(b);
        })
        : allOptions;

      return {
        key,
        enabled: questionDataAny?.enabled || false,
        required: questionDataAny?.required || false,
        options: sortedOptions,
        disqualifyingOptions
      };
    });

  return (
    <DemographicFormUI
      questions={questions}
      formValues={formValues}
      hasLoadedData={hasLoadedData}
      isLoading={isLoading}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
    />
  );
};
