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

export function useStepResponseManager<TResponseData = unknown>({
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

    if (Array.isArray(allModuleResponses)) {
      const specificResponse = allModuleResponses.find(
        (r: unknown) => {
          if (typeof r === 'object' && r !== null && ('stepId' in r || 'stepType' in r)) {
            const obj = r as { stepId?: string; stepType?: string };
            return obj.stepId === stepId || obj.stepType === stepType;
          }
          return false;
        }
      );

      if (specificResponse && typeof specificResponse === 'object' && specificResponse !== null && 'response' in specificResponse) {
        setResponseData((specificResponse as { response?: TResponseData }).response ?? initialData);
        setResponseSpecificId((specificResponse as { id?: string }).id || null);
      } else {
        setResponseData(initialData);
        setResponseSpecificId(null);
      }
    } else {
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
      let result: unknown;
      const effectiveStepName = stepName || stepId;

      if (responseSpecificId) {
        result = await updateResponse(responseSpecificId, dataToSave);
      } else {
        result = await saveResponse(stepId, stepType, effectiveStepName, dataToSave);
      }

      if (apiSaveUpdateError) {
        console.error(`[useStepResponseManager - ${stepId}] Error desde useResponseAPI:`, apiSaveUpdateError);
        setError(apiSaveUpdateError);
        return { success: false };
      }

      if (result && typeof result === 'object' && result !== null && 'id' in result && !responseSpecificId) {
        setResponseSpecificId((result as { id?: string }).id ?? null);
      }

      return { success: true, id: (result && typeof result === 'object' && result !== null && 'id' in result ? (result as { id?: string }).id ?? responseSpecificId : responseSpecificId) };

    } catch (e: unknown) {
      console.error(`[useStepResponseManager - ${stepId}] Excepción al guardar/actualizar:`, e);
      const errorMsg = (e && typeof e === 'object' && 'message' in e) ? (e as { message?: string }).message : "Excepción desconocida al guardar la respuesta.";
      setError(errorMsg as string);
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