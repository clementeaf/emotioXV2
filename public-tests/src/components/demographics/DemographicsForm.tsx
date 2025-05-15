import React, { useState, useEffect } from 'react';
import { 
  DemographicsSection, 
  DemographicResponses,
} from '../../types/demographics';
import { DemographicQuestion } from './DemographicQuestion';
import { useParticipantStore } from '../../stores/participantStore';
import { useResponseAPI } from '../../hooks/useResponseAPI';
import { useModuleResponses } from '../../hooks/useModuleResponses';

interface DemographicsFormProps {
  config?: DemographicsSection;
  initialValues?: DemographicResponses;
  onSubmit: (responses: DemographicResponses) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  stepId?: string;
}

export const DemographicsForm: React.FC<DemographicsFormProps> = ({
  config,
  initialValues = {},
  onSubmit,
  onCancel,
  isLoading = false,
  stepId = 'demographics_step',
}) => {

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const researchIdFromStore = useParticipantStore(state => state.researchId);
  const participantIdFromStore = useParticipantStore(state => state.participantId);

  const {
    saveResponse,
    updateResponse,
    isLoading: isApiSavingLoading,
    error: apiHookError,
  } = useResponseAPI({ 
    researchId: researchIdFromStore as string,
    participantId: participantIdFromStore as string
  });

  console.log('StepId:', stepId);

  const {
    data: allModuleResponses,
    documentId: responsesDocumentId,
    isLoading: isModuleResponsesLoading,
    error: moduleResponsesError,
  } = useModuleResponses({
    researchId: researchIdFromStore || undefined,
    participantId: participantIdFromStore || undefined
  });

  console.log('[DemographicsForm] allModuleResponses:', allModuleResponses);

  const credentialsReady = !!(researchIdFromStore && participantIdFromStore);
  const [responses, setResponses] = useState<DemographicResponses>(initialValues);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isNavigating, setIsNavigating] = useState(false);
  const [demographicModuleResponseId, setDemographicModuleResponseId] = useState<string | null>(null);

  useEffect(() => {
    if (isModuleResponsesLoading) return;

    if (moduleResponsesError) {
      console.error("[DemographicsForm] Error cargando respuestas de módulos:", moduleResponsesError);
      setApiError("Error al cargar respuestas previas.");
      setResponses(initialValues);
      setDemographicModuleResponseId(null);
      return;
    }

    if (allModuleResponses) {
      const specificDemographicResponse = allModuleResponses.find(
        (r: any) => r.stepId === stepId || r.stepType === 'demographic'
      );

      if (specificDemographicResponse && specificDemographicResponse.response) {
        console.log('[DemographicsForm] Respuestas demográficas existentes encontradas:', specificDemographicResponse.response);
        setResponses(specificDemographicResponse.response);
        setDemographicModuleResponseId(specificDemographicResponse.id || null);
      } else {
        console.info('[DemographicsForm] No se encontraron respuestas demográficas existentes para este paso.');
        setResponses(initialValues);
        setDemographicModuleResponseId(null);
      }
    } else {
      console.info('[DemographicsForm] No hay array de moduleResponses (podría ser 404 o primera carga).');
      setResponses(initialValues);
      setDemographicModuleResponseId(null);
    }
  }, [allModuleResponses, isModuleResponsesLoading, moduleResponsesError, stepId, initialValues]);

  let buttonText = 'Continuar';
  if (isNavigating) {
    buttonText = 'Pasando al siguiente módulo...';
  } else if (isSaving || isApiSavingLoading) {
      buttonText = 'Guardando...';
  } else if (demographicModuleResponseId) {
      buttonText = 'Actualizar y continuar';
  } else {
      buttonText = 'Guardar y continuar';
  }

  if (!config || !config.questions) {
    console.warn('[DemographicsForm] Configuración no válida o faltante.');
    return (
      <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Error de Configuración</h2>
        <p className="text-gray-600">No se pudo cargar la configuración.</p>
      </div>
    );
  }

  const handleChange = (id: string, value: any) => {
    setResponses(prev => ({ ...prev, [id]: value }));
    if (value && formErrors[id]) {
      setFormErrors(prev => { const updated = { ...prev }; delete updated[id]; return updated; });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!config || !config.questions) return false;
    Object.entries(config.questions).forEach(([key, questionConfig]) => {
      if (questionConfig.enabled && questionConfig.required && !responses[key]) {
        errors[key] = `El campo ${questionConfig.title || key} es obligatorio.`;
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveToServer = async (responseData: DemographicResponses): Promise<boolean> => {
    if (!researchIdFromStore || !participantIdFromStore) {
        console.error("Faltan researchId o participantId para guardar/actualizar.");
        setApiError("Faltan researchId o participantId.");
        return false;
    }

    setIsSaving(true);
    setApiError(null);
    try {
      const stepType = "demographic";
      const stepName = config?.title || "Preguntas Demográficas";

      let resultFromHook: any = null;

      if (demographicModuleResponseId) {
        resultFromHook = await updateResponse(
          demographicModuleResponseId,
          responseData
        );
      } else {
        resultFromHook = await saveResponse(
          stepId,
          stepType,
          stepName,
          responseData
        );
      }
      
      if (apiHookError) {
        console.error(`[DemographicsForm] Error desde useResponseAPI ${demographicModuleResponseId ? 'actualizando' : 'guardando'} datos:`, apiHookError);
        setApiError(apiHookError || `Error ${demographicModuleResponseId ? 'actualizando' : 'guardando'} datos.`);
        return false;
      }
      
      if (!demographicModuleResponseId && resultFromHook && resultFromHook.id) {
        setDemographicModuleResponseId(resultFromHook.id);
      }
      return true;
    } catch (error) {
      console.error(`[DemographicsForm] Excepción ${demographicModuleResponseId ? 'actualizando' : 'guardando'} datos:`, error);
      setApiError(error instanceof Error ? error.message : "Error desconocido.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const serverSaveSuccess = await saveToServer(responses);
    
    if (serverSaveSuccess) {
      setIsNavigating(true);
      setTimeout(() => {
        onSubmit(responses);
        setIsNavigating(false);
      }, 500);
    } else {
      if (!apiError && !apiHookError) {
        setApiError("No se pudo completar el formulario.");
      }
    }
  };

  if (isModuleResponsesLoading && !allModuleResponses) {
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
    .map(([key, questionConfigFromFile]) => ({
      key, 
      config: { 
        ...questionConfigFromFile, 
        id: questionConfigFromFile.id || key
      } 
    }));

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">{config?.title || 'Preguntas Demográficas'}</h2>
      {config?.description && (
        <p className="text-gray-600 text-center mb-6">{config.description}</p>
      )}
      {(apiError || moduleResponsesError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="text-sm">Error: {apiError || moduleResponsesError}</p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {enabledQuestions.map(({ key, config: adaptedQuestionConfig }) => (
          <div key={key} className={formErrors[key] ? 'has-error' : ''}>
            <DemographicQuestion config={adaptedQuestionConfig} value={responses[key]} onChange={handleChange} />
            {formErrors[key] && <p className="text-red-500 text-xs mt-1">{formErrors[key]}</p>}
          </div>
        ))}
        <div className="flex justify-between mt-8">
          {onCancel && (
            <button type="button" onClick={onCancel} disabled={isSaving || isApiSavingLoading || isModuleResponsesLoading || isNavigating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50">
              Cancelar
            </button>
          )}
          <button type="submit" disabled={isSaving || isApiSavingLoading || isModuleResponsesLoading || !credentialsReady || isNavigating} 
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
            {buttonText}
          </button>
        </div>
      </form>
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-50 text-xs text-gray-500 border rounded">
          <p>Debug Info (DemographicsForm):</p>
          <p>isLoading(Responses): {isModuleResponsesLoading ? 'Sí' : 'No'}</p>
          <p>moduleResponsesError: {moduleResponsesError || 'No'}</p>
          <p>allModuleResponses count: {allModuleResponses?.length ?? 'N/A'}</p>
          <p>responsesDocumentId: {responsesDocumentId || 'N/A'}</p>
          <p>demographicModuleResponseId (para PUT): {demographicModuleResponseId || 'N/A (hará POST)'}</p>
          <p>isSaving(API): {isApiSavingLoading ? 'Sí' : 'No'}</p>
          <p>apiHookError(Save/Update): {apiHookError || 'No'}</p>
          <p>apiError(Form): {apiError || 'No'}</p>
          <div>Datos actuales en Formulario (estado 'responses'): <pre>{JSON.stringify(responses, null, 2)}</pre></div>
        </div>
      )}
    </div>
  );
}; 