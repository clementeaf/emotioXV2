import { useState, useEffect, useMemo } from 'react';
import { ApiClient, APIStatus } from '../lib/api'; // Ajusta la ruta si es necesario
import { useParticipantStore } from '../stores/participantStore'; // Para obtener IDs si no se pasan

// Define una interfaz para el valor de retorno del hook
interface UseModuleResponsesReturn {
  data: any | null; // Tipo de 'data.data' de apiClient.getModuleResponses
  documentId: string | null; // El ID del documento de respuestas general
  isLoading: boolean;
  error: string | null;
  fetchResponses: (researchId: string, participantId: string) => void; // Función para re-disparar la carga
}

interface UseModuleResponsesProps {
  researchId?: string;
  participantId?: string;
  autoFetch?: boolean; // Para controlar si se llama automáticamente al montar/cambiar IDs
}

export const useModuleResponses = (props?: UseModuleResponsesProps): UseModuleResponsesReturn => {
  const { researchId: initialResearchId, participantId: initialParticipantId, autoFetch = true } = props || {};

  const researchIdFromStore = useParticipantStore(state => state.researchId);
  const participantIdFromStore = useParticipantStore(state => state.participantId);

  const [data, setData] = useState<any | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const apiClient = useMemo(() => new ApiClient(), []);

  const fetchData = async (currentResearchId: string, currentParticipantId: string) => {
    if (!currentResearchId || !currentParticipantId) {
      setError("Research ID o Participant ID no proporcionados para cargar respuestas.");
      setData(null);
      setDocumentId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setData(null);
    setDocumentId(null);

    try {
      const apiResponse = await apiClient.getModuleResponses(currentResearchId, currentParticipantId);

      if (apiResponse.data?.data && !apiResponse.error) {
        setData(apiResponse.data.data.responses || []);
        setDocumentId(apiResponse.data.data.id || null);
      } else {
        setData(null);
        setDocumentId(null);
        if (apiResponse.apiStatus === APIStatus.NOT_FOUND) {
          setError(null);
        } else {
          setError(apiResponse.message || 'Error cargando las respuestas del módulo.');
          console.error('[useModuleResponses] Error fetching responses:', apiResponse.message);
        }
      }
    } catch (e: any) {
      console.error('[useModuleResponses] Exception fetching responses:', e);
      setError(e.message || 'Excepción desconocida al cargar respuestas.');
      setData(null);
      setDocumentId(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const finalResearchId = initialResearchId || researchIdFromStore;
    const finalParticipantId = initialParticipantId || participantIdFromStore;

    if (autoFetch && finalResearchId && finalParticipantId) {
      fetchData(finalResearchId, finalParticipantId);
    } else if (autoFetch) {
      // Si autoFetch es true pero faltan IDs, resetea el estado o indica que no se puede cargar.
      setData(null);
      setDocumentId(null);
      setError(null); // O un mensaje específico
      setIsLoading(false);
    }
    // No incluir fetchData en las dependencias para evitar re-creación constante si no se usa useCallback
    // La re-ejecución se controla por el cambio en los IDs y autoFetch.
  }, [initialResearchId, initialParticipantId, researchIdFromStore, participantIdFromStore, autoFetch, apiClient]); // apiClient es estable por useMemo

  // Función para permitir la recarga manual si es necesario
  const fetchResponses = (rId: string, pId: string) => {
    fetchData(rId, pId);
  };

  return { data, documentId, isLoading, error, fetchResponses };
}; 