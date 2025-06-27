import React, { useEffect, useState } from 'react';
import { useModuleResponses } from '../../hooks/useModuleResponses';
import { useStepResponseManager } from '../../hooks/useStepResponseManager';
import { useParticipantStore } from '../../stores/participantStore';
import {
  DemographicResponses,
  EDUCATION_OPTIONS,
  GENDER_OPTIONS
} from '../../types/demographics';
import FormSubmitButton from '../common/FormSubmitButton';
import { DemographicQuestion } from './DemographicQuestion';
import { DemographicsFormProps } from './types';

// ✅ PASO 1: Añadir mapa de traducciones
const labelTranslations: Record<string, string> = {
  age: 'Edad',
  gender: 'Género',
  education: 'Nivel de Educación',
  educationLevel: 'Nivel de Educación',
  occupation: 'Ocupación',
  income: 'Ingresos',
  householdIncome: 'Ingresos del Hogar',
  location: 'Ubicación',
  ethnicity: 'Etnia',
  language: 'Idioma Principal',
  country: 'País',
  employmentStatus: 'Estado Laboral',
  dailyHoursOnline: 'Horas diarias en línea',
  technicalProficiency: 'Competencia Técnica',
};

export const DemographicsForm: React.FC<DemographicsFormProps> = ({
  config,
  initialValues = {},
  onSubmit,
  onCancel,
  stepId = 'demographic',
}) => {
  // Log para depuración: mostrar initialValues al montar o actualizar props
  console.log('[DemographicsForm] initialValues:', initialValues);

  const { researchId, participantId } = useParticipantStore();
  const { refetch: refetchModuleResponses } = useModuleResponses({
    researchId: researchId ?? undefined,
    participantId: participantId ?? undefined,
    autoFetch: false
  });

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

  // Sincronizar el estado del formulario con la respuesta guardada o los valores iniciales
  useEffect(() => {
    if (responseData && Object.keys(responseData).length > 0) {
      setFormFieldResponses(responseData);
    } else if (initialValues && Object.keys(initialValues).length > 0) {
      setFormFieldResponses(initialValues);
    } else {
      setFormFieldResponses({});
    }
  }, [responseData, initialValues]);

  // Determinar si hay datos existentes correctamente
  const hasExistingData = !!(responseData && Object.keys(responseData).length > 0) || !!useStepResponseManagerReturnedSpecificId;

  if (!config || !config.questions) {
    return (
      <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Error de Configuración</h2>
        <p className="text-gray-600">No se pudo cargar la configuración.</p>
      </div>
    );
  }

  const handleChange = (id: string, value: string | number | boolean | undefined) => {
    setFormFieldResponses(prev => {
      const newResponses = { ...prev, [id]: value };
      return newResponses;
    });
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

    if (!validateForm()) {
      return;
    }

    // Log para verificar el payload enviado al backend
    console.log('[DemographicsForm] Payload enviado al backend:', formFieldResponses);

    setIsSubmittingToServer(true);

    const { success } = await saveCurrentStepResponse(formFieldResponses);

    if (success) {
      await refetchModuleResponses();
      onSubmit(formFieldResponses);
    }
    setIsSubmittingToServer(false);
  };

  const handleSubmitClick = () => {
    // Crear un evento sintético para mantener la compatibilidad
    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(syntheticEvent);
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
    .filter(([, questionConfig]) => questionConfig.enabled)
    .sort(([, a], [, b]) => (a.order !== undefined && b.order !== undefined ? a.order - b.order : 0))
    .map(([key, questionConfigFromFile]) => {
      let finalOptions;

      if (key === 'gender') {
        finalOptions = GENDER_OPTIONS;
      } else if (key === 'educationLevel' || key === 'education') {
        finalOptions = EDUCATION_OPTIONS;
      } else {
        finalOptions = questionConfigFromFile.options;
      }

      return {
        key,
        config: {
          ...questionConfigFromFile,
          // ✅ PASO 2: Aplicar traducción al título
          title: labelTranslations[key] || questionConfigFromFile.title || key,
          id: questionConfigFromFile.id || key,
          options: finalOptions
        }
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
            <DemographicQuestion config={adaptedQuestionConfig} value={formFieldResponses[key] as string | number | boolean | undefined} onChange={handleChange} />
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
          <FormSubmitButton
            isSaving={isSaving || isSubmittingToServer}
            hasExistingData={hasExistingData}
            onClick={handleSubmitClick}
            disabled={isLoading}
            customCreateText="Guardar y continuar"
            customUpdateText="Actualizar y continuar"
          />
        </div>
      </form>
    </div>
  );
};
