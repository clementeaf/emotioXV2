import { useCallback } from 'react';
import { ModuleResponseData } from 'src/components/TestLayout/types';
import { ApiClient } from '../lib/api';
import { useParticipantStore } from '../stores/participantStore';

export const useModuleResponse = () => {
  const { researchId, participantId } = useParticipantStore();

  const sendResponse = useCallback(async (questionKey: string, response: unknown): Promise<ModuleResponseData | null> => {
    // Validaciones obligatorias
    if (!researchId) {
      console.error('[useModuleResponse] ❌ researchId es requerido');
      return null;
    }

    if (!participantId) {
      console.error('[useModuleResponse] ❌ participantId es requerido');
      return null;
    }

    if (!questionKey) {
      console.error('[useModuleResponse] ❌ questionKey es requerido');
      return null;
    }

    const responseData: ModuleResponseData = {
      participantId,
      researchId,
      questionKey,
      response
    };

    try {
      const apiClient = new ApiClient();
      const result = await apiClient.saveModuleResponse({
        researchId,
        participantId,
        stepType: 'module_response',
        stepTitle: questionKey,
        questionKey,
        response,
        metadata: {}
      });

      if (result.error) {
        console.error('[useModuleResponse] ❌ Error enviando respuesta:', result.message);
        return null;
      }

      console.log('[useModuleResponse] ✅ Respuesta enviada exitosamente:', {
        participantId,
        researchId,
        questionKey,
        responseId: result.data?.id
      });

      // Retornar la respuesta enviada
      return responseData;
    } catch (error) {
      console.error('[useModuleResponse] 💥 Exception:', error);
      return null;
    }
  }, [researchId, participantId]);

  const getResponse = useCallback(async (questionKey: string): Promise<ModuleResponseData | null> => {
    if (!researchId || !participantId) {
      console.error('[useModuleResponse] ❌ Faltan researchId o participantId para obtener respuesta');
      return null;
    }

    try {
      const apiClient = new ApiClient();

      // Obtener todas las respuestas del participante
      const result = await apiClient.getModuleResponses(researchId, participantId);

      if (result.error || !result.data) {
        console.error('[useModuleResponse] ❌ Error obteniendo respuestas:', result.message);
        return null;
      }

      // Buscar la respuesta específica por questionKey
      const responses = (result.data as any)?.responses || [];
      const foundResponse = responses.find((r: any) => r.questionKey === questionKey);

      if (foundResponse) {
        const responseData: ModuleResponseData = {
          participantId,
          researchId,
          questionKey,
          response: foundResponse.response
        };

        console.log('[useModuleResponse] ✅ Respuesta encontrada:', {
          participantId,
          researchId,
          questionKey,
          responseId: foundResponse.id
        });

        return responseData;
      } else {
        console.log('[useModuleResponse] 🔍 Respuesta no encontrada para questionKey:', questionKey);
        return null;
      }
    } catch (error) {
      console.error('[useModuleResponse] 💥 Error obteniendo respuesta:', error);
      return null;
    }
  }, [researchId, participantId]);

  const updateResponse = useCallback(async (questionKey: string, newResponse: unknown): Promise<ModuleResponseData | null> => {
    if (!researchId || !participantId) {
      console.error('[useModuleResponse] ❌ Faltan researchId o participantId para actualizar respuesta');
      return null;
    }

    try {
      const apiClient = new ApiClient();
      const result = await apiClient.saveModuleResponse({
        researchId,
        participantId,
        stepType: 'module_response',
        stepTitle: questionKey,
        questionKey,
        response: newResponse,
        metadata: {}
      });

      if (result.error) {
        console.error('[useModuleResponse] ❌ Error actualizando respuesta:', result.message);
        return null;
      }

      const updatedResponseData: ModuleResponseData = {
        participantId,
        researchId,
        questionKey,
        response: newResponse
      };

      console.log('[useModuleResponse] ✅ Respuesta actualizada exitosamente:', {
        participantId,
        researchId,
        questionKey,
        responseId: result.data?.id
      });

      return updatedResponseData;
    } catch (error) {
      console.error('[useModuleResponse] 💥 Error actualizando respuesta:', error);
      return null;
    }
  }, [researchId, participantId]);

  const deleteAllResponses = useCallback(async (): Promise<boolean> => {
    if (!researchId || !participantId) {
      console.error('[useModuleResponse] ❌ Faltan researchId o participantId para eliminar respuestas');
      return false;
    }

    try {
      const apiClient = new ApiClient();
      const result = await apiClient.deleteAllResponses(researchId, participantId);

      if (result.error) {
        console.error('[useModuleResponse] ❌ Error eliminando respuestas:', result.message);
        return false;
      }

      console.log('[useModuleResponse] ✅ Todas las respuestas eliminadas exitosamente:', {
        participantId,
        researchId,
        status: result.status
      });

      return true;
    } catch (error) {
      console.error('[useModuleResponse] 💥 Error eliminando respuestas:', error);
      return false;
    }
  }, [researchId, participantId]);

  return {
    sendResponse,
    getResponse,
    updateResponse,
    deleteAllResponses,
    researchId,
    participantId
  };
};
