import React, { useState, useEffect } from 'react';
import { 
  DemographicResponses,
  GENDER_OPTIONS,
  EDUCATION_OPTIONS
} from '../../types/demographics';
import { DemographicQuestion } from './DemographicQuestion';
import { useStepResponseManager } from '../../hooks/useStepResponseManager';
import { DemographicsFormProps } from './types';

export const DemographicsForm: React.FC<DemographicsFormProps> = ({
  config,
  initialValues = {},
  onSubmit,
  onCancel,
  stepId = 'demographic',
}) => {

  const [formFieldResponses, setFormFieldResponses] = useState<DemographicResponses>(initialValues);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingToServer, setIsSubmittingToServer] = useState(false);

  const {
    responseData,
    isLoading,
    isSaving,
    error: stepResponseError,
    saveCurrentStepResponse,
    responseSpecificId: useStepResponseManagerReturnedSpecificId
  } = useStepResponseManager<DemographicResponses>({
    stepId: stepId,
    stepType: 'demographic',
    stepName: config?.title || 'Preguntas Demográficas',
    initialData: initialValues,
  });

  useEffect(() => {
    if (responseData) {
      setFormFieldResponses(responseData);
    }
  }, [responseData]);

  let buttonText = 'Guardar y continuar';
  if (isSubmittingToServer) {
    buttonText = 'Pasando al siguiente módulo...';
  } else if (isSaving) {
    buttonText = 'Guardando...';
  } else if (useStepResponseManagerReturnedSpecificId) {
    buttonText = 'Actualizar y continuar';
  }

  if (!config || !config.questions) {
    return (
      <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Error de Configuración</h2>
        <p className="text-gray-600">No se pudo cargar la configuración.</p>
      </div>
    );
  }

  const handleChange = (id: string, value: any) => {
    setFormFieldResponses(prev => ({ ...prev, [id]: value }));
    if (value && formErrors[id]) {
      setFormErrors(prev => { const updated = { ...prev }; delete updated[id]; return updated; });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!config || !config.questions) return false;
    Object.entries(config.questions).forEach(([key, questionConfig]) => {
      if (questionConfig.enabled && questionConfig.required && !formFieldResponses[key]) {
        errors[key] = `El campo ${questionConfig.title || key} es obligatorio.`;
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmittingToServer(true);
    const { success } = await saveCurrentStepResponse(formFieldResponses);
    
    if (success) {
      onSubmit(formFieldResponses); 
    } else {
      console.error("[DemographicsForm] Falló saveCurrentStepResponse. Error debería estar en stepResponseError.");
    }
    setIsSubmittingToServer(false);
  };

  if (isLoading && !responseData) {
    return (
      <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{config?.title || 'Preguntas Demográficas'}</h2>
        <p className="text-gray-600">Cargando respuestas previas...</p>
      </div>
    );
  }
  
  const enabledQuestions = Object.entries(config.questions)
    .filter(([_, questionConfig]) => questionConfig.enabled)
    .sort(([_, a], [__, b]) => (a.order !== undefined && b.order !== undefined ? a.order - b.order : 0))
    .map(([key, questionConfigFromFile]) => {
      let finalOptions = questionConfigFromFile.options;
      if (!finalOptions || finalOptions.length === 0) {
        if (key === 'gender') finalOptions = GENDER_OPTIONS;
        if (key === 'educationLevel' || key === 'education') finalOptions = EDUCATION_OPTIONS;
      }
      return {
        key, 
        config: { ...questionConfigFromFile, id: questionConfigFromFile.id || key, options: finalOptions }
      };
    });

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">{config?.title || 'Preguntas Demográficas'}</h2>
      {config?.description && (
        <p className="text-gray-600 text-center mb-6">{config.description}</p>
      )}
      {stepResponseError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="text-sm">Error: {stepResponseError}</p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {enabledQuestions.map(({ key, config: adaptedQuestionConfig }) => (
          <div key={key} className={formErrors[key] ? 'has-error' : ''}>
            <DemographicQuestion config={adaptedQuestionConfig} value={formFieldResponses[key]} onChange={handleChange} />
            {formErrors[key] && <p className="text-red-500 text-xs mt-1">{formErrors[key]}</p>}
          </div>
        ))}
        <div className="flex justify-between mt-8">
          {onCancel && (
            <button type="button" onClick={onCancel} disabled={isSaving || isLoading || isSubmittingToServer}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50">
              Cancelar
            </button>
          )}
          <button type="submit" disabled={isSaving || isLoading || isSubmittingToServer} 
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
            {buttonText}
          </button>
        </div>
      </form>
    </div>
  );
}; 