import { useState, useEffect, useCallback } from 'react';
import { useParticipantStore } from '../stores/participantStore';
import { useModuleResponses } from './useModuleResponses';
import { useResponseAPI } from './useResponseAPI';

// Definir y exportar las interfaces aquí mismo
export interface UseStepResponseManagerProps<TResponseData> {
  stepId: string;
  stepType: string;
  stepName?: string;
  initialData?: TResponseData | null;
  researchId?: string;
  participantId?: string;
}

export interface UseStepResponseManagerReturn<TResponseData> {
  responseData: TResponseData | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  responseSpecificId: string | null; 
  saveCurrentStepResponse: (dataToSave: TResponseData) => Promise<{ success: boolean; id?: string | null }>;
}

export function useStepResponseManager<TResponseData = any>({
  stepId,
  stepType,
  stepName,
  initialData = null,
  researchId: propResearchId,
  participantId: propParticipantId,
}: UseStepResponseManagerProps<TResponseData>): UseStepResponseManagerReturn<TResponseData> {
  
  const researchIdFromStore = useParticipantStore(state => state.researchId);
  const participantIdFromStore = useParticipantStore(state => state.participantId);

  const researchId = propResearchId || researchIdFromStore;
  const participantId = propParticipantId || participantIdFromStore;

  const [responseData, setResponseData] = useState<TResponseData | null>(initialData);
  const [responseSpecificId, setResponseSpecificId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { 
    data: allModuleResponses, 
    isLoading: isLoadingAllResponses, 
    error: errorLoadingAllResponses 
  } = useModuleResponses({
    researchId: researchId || undefined,
    participantId: participantId || undefined,
    autoFetch: !!(researchId && participantId)
  });

  const { 
    saveResponse, 
    updateResponse, 
    isLoading: isApiSaving, 
    error: apiSaveUpdateError 
  } = useResponseAPI({
    researchId: researchId as string, 
    participantId: participantId as string,
  });

  useEffect(() => {
    setError(null); 

    if (isLoadingAllResponses) {
      return;
    }

    if (errorLoadingAllResponses) {
      console.error(`[useStepResponseManager - ${stepId}] Error cargando todas las respuestas:`, errorLoadingAllResponses);
      setError(`Error al cargar respuestas previas: ${errorLoadingAllResponses}`);
      setResponseData(initialData);
      setResponseSpecificId(null);
      return;
    }

    if (allModuleResponses) {
      const specificResponse = allModuleResponses.find(
        (r: any) => r.stepId === stepId || r.stepType === stepType 
      );

      if (specificResponse && specificResponse.response) {
        console.log(`[useStepResponseManager - ${stepId}] Respuesta existente encontrada:`, specificResponse);
        setResponseData(specificResponse.response as TResponseData);
        setResponseSpecificId(specificResponse.id || null);
      } else {
        console.log(`[useStepResponseManager - ${stepId}] No se encontró respuesta existente.`);
        setResponseData(initialData);
        setResponseSpecificId(null);
      }
    } else {
      console.log(`[useStepResponseManager - ${stepId}] No hay array allModuleResponses.`);
      setResponseData(initialData);
      setResponseSpecificId(null);
    }
  }, [
    allModuleResponses, 
    isLoadingAllResponses, 
    errorLoadingAllResponses, 
    stepId, 
    stepType, 
    initialData
  ]);
  
  const saveCurrentStepResponse = useCallback(async (dataToSave: TResponseData): Promise<{ success: boolean; id?: string | null }> => {
    if (!researchId || !participantId) {
      const msg = "Research ID o Participant ID no disponibles para guardar respuesta.";
      console.error(`[useStepResponseManager - ${stepId}] ${msg}`);
      setError(msg);
      return { success: false };
    }

    setError(null); 
    
    try {
      let result: any;
      const effectiveStepName = stepName || stepId;

      if (responseSpecificId) { 
        console.log(`[useStepResponseManager - ${stepId}] Actualizando respuesta (ID: ${responseSpecificId}):`, dataToSave);
        result = await updateResponse(responseSpecificId, dataToSave);
      } else { 
        console.log(`[useStepResponseManager - ${stepId}] Creando nueva respuesta:`, dataToSave);
        result = await saveResponse(stepId, stepType, effectiveStepName, dataToSave);
      }

      if (apiSaveUpdateError) { 
        console.error(`[useStepResponseManager - ${stepId}] Error desde useResponseAPI:`, apiSaveUpdateError);
        setError(apiSaveUpdateError);
        return { success: false };
      }

      if (result && result.id && !responseSpecificId) { 
        setResponseSpecificId(result.id);
      }
      
      console.log(`[useStepResponseManager - ${stepId}] Respuesta guardada/actualizada. Resultado API:`, result);
      return { success: true, id: result?.id || responseSpecificId };

    } catch (e: any) {
      console.error(`[useStepResponseManager - ${stepId}] Excepción al guardar/actualizar:`, e);
      setError(e.message || "Excepción desconocida al guardar la respuesta.");
      return { success: false };
    }
  }, [
    researchId, 
    participantId, 
    stepId, 
    stepType, 
    stepName, 
    responseSpecificId, 
    saveResponse, 
    updateResponse,
    apiSaveUpdateError 
  ]);

  return {
    responseData,
    isLoading: isLoadingAllResponses, 
    isSaving: isApiSaving,          
    error,                           
    responseSpecificId,
    saveCurrentStepResponse,
  };
} 