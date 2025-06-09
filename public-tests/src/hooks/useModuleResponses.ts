import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ApiClient, APIStatus } from '../lib/api'; // Ajusta la ruta si es necesario
import { useParticipantStore } from '../stores/participantStore'; // Para obtener IDs si no se pasan

// Define una interfaz para el valor de retorno del hook
interface UseModuleResponsesReturn {
  data: unknown | null; // Tipo de 'data.data' de apiClient.getModuleResponses
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

  const [data, setData] = useState<unknown | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const apiClient = useMemo(() => new ApiClient(), []);

  // Guardar los últimos IDs usados para evitar llamadas duplicadas
  const lastIdsRef = useRef<{ researchId?: string; participantId?: string }>({});

  const fetchData = useCallback(async (currentResearchId: string, currentParticipantId: string) => {
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

      // Manejar caso de NOT_FOUND o status 404
      if (apiResponse.apiStatus === APIStatus.NOT_FOUND || apiResponse.status === 404) {
        setData(null);
        setDocumentId(null);
        setError(null); // No es un error, simplemente no hay respuestas aún
        return;
      }

      if (
        apiResponse.data &&
        typeof apiResponse.data === 'object' &&
        apiResponse.data !== null &&
        'data' in apiResponse.data &&
        (apiResponse.data as { data?: unknown }).data &&
        !apiResponse.error
      ) {
        const innerData = (apiResponse.data as { data?: { responses?: unknown; id?: string } }).data;
        setData(innerData?.responses || []);
        setDocumentId(innerData?.id || null);
        setError(null);
      } else {
        setData(null);
        setDocumentId(null);
        // Solo establecer error si hay indicios de un error real
        if (apiResponse.error && apiResponse.message) {
          setError(apiResponse.message);
          console.error('[useModuleResponses] Error fetching responses:', apiResponse.message);
        } else {
          // Para casos donde simplemente no hay datos (participantes nuevos), no es un error
          setError(null);
        }
      }
    } catch (e) {
      console.error('[useModuleResponses] Exception fetching responses:', e);
      setError(e instanceof Error ? e.message : 'Excepción desconocida al cargar respuestas.');
      setData(null);
      setDocumentId(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    const finalResearchId = initialResearchId || researchIdFromStore;
    const finalParticipantId = initialParticipantId || participantIdFromStore;

    // Solo dispara la petición si ambos IDs existen y han cambiado
    if (
      autoFetch &&
      finalResearchId &&
      finalParticipantId &&
      (lastIdsRef.current.researchId !== finalResearchId || lastIdsRef.current.participantId !== finalParticipantId)
    ) {
      lastIdsRef.current = { researchId: finalResearchId, participantId: finalParticipantId };
      fetchData(finalResearchId, finalParticipantId);
    }
    // No resetea el estado si faltan IDs, así evita flashes de null
  }, [initialResearchId, initialParticipantId, researchIdFromStore, participantIdFromStore, autoFetch, apiClient, fetchData]);

  // Función para permitir la recarga manual si es necesario
  const fetchResponses = (rId: string, pId: string) => {
    fetchData(rId, pId);
  };

  return { data, documentId, isLoading, error, fetchResponses };
}; 