import React, { useState, useEffect } from 'react';
import { 
  DemographicsSection, 
  DemographicResponses,
  DEFAULT_DEMOGRAPHICS_CONFIG
} from '../../types/demographics';
import { DemographicQuestion } from './DemographicQuestion';
import { demographicsService } from '../../services/demographics.service';
import { useParticipantStore } from '../../stores/participantStore';
import { useResponseAPI } from '../../hooks/useResponseAPI';

interface DemographicsFormProps {
  config?: DemographicsSection;
  initialValues?: DemographicResponses;
  onSubmit: (responses: DemographicResponses) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  stepId?: string;
}

export const DemographicsForm: React.FC<DemographicsFormProps> = ({
  config = DEFAULT_DEMOGRAPHICS_CONFIG,
  initialValues = {},
  onSubmit,
  onCancel,
  isLoading = false,
  stepId = 'demographics_step',
}) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataExisted, setDataExisted] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [demographicModuleResponseId, setDemographicModuleResponseId] = useState<string | null>(null);
  const researchIdFromStore = useParticipantStore(state => state.researchId);
  const participantIdFromStore = useParticipantStore(state => state.participantId);
  // const tokenForDemographicsService = useParticipantStore(state => state.token); // <--- MODIFICACIÓN: Comentado o eliminado

  const {
    saveResponse,
    updateResponse,
    isLoading: isApiLoading,
    error: apiHookError,
  } = useResponseAPI({ 
    researchId: researchIdFromStore as string,
    participantId: participantIdFromStore as string
  });

  // <--- MODIFICACIÓN: credentialsReady ya no depende del token aquí directamente
  const credentialsReady = !!(researchIdFromStore && participantIdFromStore);
  const [responses, setResponses] = useState<DemographicResponses>(initialValues);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchExistingResponses = async () => {
      // <--- MODIFICACIÓN: El chequeo de token aquí ya no es necesario
      if (!researchIdFromStore || !participantIdFromStore) {
        console.warn('[DemographicsForm] fetchExistingResponses llamado sin researchId o participantId. Saliendo.');
        setDataExisted(false);
        setDocumentId(null);
        setDemographicModuleResponseId(null);
        setDataLoading(false);
        return;
      }
      setDataLoading(true);
      try {
        console.log(`[DemographicsForm] Obteniendo respuestas guardadas para research: ${researchIdFromStore}, participant: ${participantIdFromStore}`);
        const result = await demographicsService.getDemographicResponses(
          researchIdFromStore as string,
          participantIdFromStore as string
          // tokenForDemographicsService as string // <--- MODIFICACIÓN: Argumento token eliminado
        );

        const actualResponses = result.data?.responses;
        const fetchedDocumentId = result.data?.documentId ?? null;
        const fetchedDemographicModuleResponseId = result.data?.demographicModuleResponseId ?? null;

        if (result.error) {
          console.error('[DemographicsForm] Error obteniendo datos del backend:', result.message);
          setDataExisted(false);
          setDocumentId(null);
          setDemographicModuleResponseId(null);
          console.log('[DemographicsForm] Datos NO obtenidos del backend (error en servicio).');
        } else if (actualResponses && Object.keys(actualResponses).length > 0) {
          console.log('[DemographicsForm] Datos OBTENIDOS del backend. ID Documento:', fetchedDocumentId, "ID Modulo Demo:", fetchedDemographicModuleResponseId);
          console.log('[DemographicsForm] Respuestas demográficas obtenidas:', actualResponses);
          setDataExisted(true);
          setDocumentId(fetchedDocumentId);
          setDemographicModuleResponseId(fetchedDemographicModuleResponseId);
          setResponses(actualResponses);
        } else {
          console.log('[DemographicsForm] Datos NO obtenidos del backend (sin datos previos o estructura vacía). ID Documento (si existe):', fetchedDocumentId);
          setDataExisted(false);
          setDocumentId(fetchedDocumentId);
          setDemographicModuleResponseId(null);
          setResponses(initialValues);
        }
      } catch (error) {
        console.error('[DemographicsForm] Excepción al obtener datos:', error);
        setDataExisted(false);
        setDocumentId(null);
        setDemographicModuleResponseId(null);
        console.log('[DemographicsForm] Datos NO obtenidos del backend (excepción en fetch).');
      } finally {
        setDataLoading(false);
      }
    };

    if (credentialsReady) {
      console.log('[DemographicsForm] Credenciales listas. Intentando fetchExistingResponses.');
      fetchExistingResponses();
    } else {
      if (!dataLoading) { 
        console.log('[DemographicsForm] Credenciales no listas (y no estamos en dataLoading). Asumiendo no datos existentes.');
        setDataExisted(false);
        setDocumentId(null);
        setDemographicModuleResponseId(null);
      }
    }
    // <--- MODIFICACIÓN: tokenForDemographicsService eliminado de las dependencias
  }, [credentialsReady, initialValues, researchIdFromStore, participantIdFromStore]);

  useEffect(() => {
    const updatedResponses: DemographicResponses = {};
    Object.entries(config.questions).forEach(([key, questionConfig]) => {
      if (questionConfig.enabled && responses[key] !== undefined) {
        updatedResponses[key] = responses[key];
      }
    });
    setResponses(updatedResponses);
  }, [config]);

  const handleChange = (id: string, value: any) => {
    setResponses(prev => ({ ...prev, [id]: value }));
    if (value && formErrors[id]) {
      setFormErrors(prev => { const updated = { ...prev }; delete updated[id]; return updated; });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
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
        console.error("Faltan researchId o participantId para guardar/actualizar con useResponseAPI.");
        setApiError("Faltan researchId o participantId.");
        return false;
    }

    setIsSaving(true);
    setApiError(null);
    try {
      const stepType = "demographic";
      const stepName = config.title || "Preguntas Demográficas";

      let resultFromHook: any = null;

      if (dataExisted && demographicModuleResponseId) {
        console.log(`[DemographicsForm] Actualizando (PUT) datos via useResponseAPI. ModuleResponse ID: ${demographicModuleResponseId}`);
        resultFromHook = await updateResponse(
          demographicModuleResponseId,
          stepId,
          stepType,
          stepName,
          responseData
        );
      } else if (dataExisted && !demographicModuleResponseId) {
        console.warn(`[DemographicsForm] Datos existían (documentId: ${documentId}) pero no demographicModuleResponseId. Intentando POST.`);
        resultFromHook = await saveResponse(
          stepId,
          stepType,
          stepName,
          responseData
        );
      } else {
        console.log(`[DemographicsForm] Creando (POST) datos via useResponseAPI.`);
        resultFromHook = await saveResponse(
          stepId,
          stepType,
          stepName,
          responseData
        );
      }
      
      if (apiHookError) {
        console.error(`[DemographicsForm] Error desde useResponseAPI ${dataExisted ? 'actualizando' : 'guardando'} datos:`, apiHookError);
        setApiError(apiHookError || `Error ${dataExisted ? 'actualizando' : 'guardando'} datos.`);
        return false;
      }
      
      console.log(`[DemographicsForm] Datos ${dataExisted ? 'actualizados' : 'guardados'} correctamente via useResponseAPI. Respuesta del hook:`, resultFromHook);
      
      if (!dataExisted && resultFromHook && resultFromHook.id) {
        console.log("[DemographicsForm] POST exitoso. Nuevo documentId se obtendrá en la siguiente carga si es necesario.");
        setDataExisted(true);
      }
      return true;
    } catch (error) {
      console.error(`[DemographicsForm] Excepción ${dataExisted ? 'actualizando' : 'guardando'} datos con useResponseAPI:`, error);
      setApiError(error instanceof Error ? error.message : "Error desconocido durante la operación con useResponseAPI.");
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
      console.log('[DemographicsForm] Datos enviados al servidor via useResponseAPI. Navegación onSubmit() COMENTADA.');
    } else {
      if (!apiError && !apiHookError) {
        setApiError("No se pudo completar el formulario debido a un error desconocido.");
      }
    }
  };

  if (!config.enabled) return null;

  if (dataLoading) {
    return (
      <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{config.title}</h2>
        <p className="text-gray-600">Cargando datos del servidor...</p>
      </div>
    );
  }
  
  const enabledQuestions = Object.entries(config.questions)
    .filter(([_, questionConfig]) => questionConfig.enabled)
    .sort(([_, a], [__, b]) => (a.order !== undefined && b.order !== undefined ? a.order - b.order : 0))
    .map(([key, questionConfig]) => ({ key, config: questionConfig }));

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">{config.title}</h2>
      {config.description && (
        <p className="text-gray-600 text-center mb-6">{config.description}</p>
      )}
      {(apiError || apiHookError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="text-sm">Error: {apiError || apiHookError}</p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {enabledQuestions.map(({ key, config: questionConfig }) => (
          <div key={key} className={formErrors[key] ? 'has-error' : ''}>
            <DemographicQuestion config={questionConfig} value={responses[key]} onChange={handleChange} />
            {formErrors[key] && <p className="text-red-500 text-xs mt-1">{formErrors[key]}</p>}
          </div>
        ))}
        <div className="flex justify-between mt-8">
          {onCancel && (
            <button type="button" onClick={onCancel} disabled={isSaving || isLoading || isApiLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50">
              Cancelar
            </button>
          )}
          <button type="submit" disabled={isSaving || isLoading || isApiLoading || !credentialsReady} 
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
            {(isSaving || isApiLoading) ? 'Guardando...' : 'Continuar'}
          </button>
        </div>
      </form>
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-50 text-xs text-gray-500 border rounded">
          <p className="font-semibold">Estado de la API (Debug):</p>
          <p>Estado API Form: {apiError ? 'Error Form' : (isSaving ? 'Guardando Form' : (dataLoading ? 'Cargando Datos' : 'Ok Form'))}</p>
          <p>Estado API Hook: {apiHookError ? `Error Hook: ${apiHookError}` : (isApiLoading ? 'Hook Ocupado' : 'Hook Ok')}</p>
          <p>Método a usar: {dataExisted ? 'PUT (actualizar)' : 'POST (crear)'}</p>
          <p>Datos cargados del Backend: {dataExisted ? 'Sí' : 'No (o eran vacíos)'}</p> 
          <p>ID Documento Backend: {documentId || 'No disponible / No cargado'}</p> 
          <p>ID Módulo Demográfico: {demographicModuleResponseId || 'No disponible / No cargado'}</p>
          <p>Research ID: {researchIdFromStore || 'No disponible'}</p>
          <p>Participant ID: {participantIdFromStore || 'No disponible'}</p>
          <p>Token (para demographicsService): {/* tokenForDemographicsService ? 'Sí' : 'No' */}</p>
          <p>Credenciales listas: {credentialsReady ? 'Sí' : 'No'}</p>
          <div>Datos actuales en Formulario: <pre>{JSON.stringify(responses, null, 2)}</pre></div>
        </div>
      )}
    </div>
  );
}; 