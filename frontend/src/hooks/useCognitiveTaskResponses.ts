import React from 'react';
import { moduleResponsesAPI } from '@/api/config';
import { cognitiveTaskApi, cognitiveTaskKeys } from '@/api/domains/cognitive-task';
import { useQuery } from '@tanstack/react-query';

/**
 * Estructura de datos procesados para CognitiveTask
 */
export interface CognitiveTaskResponses {
  /**
   * Configuración de las preguntas del CognitiveTask
   */
  researchConfig: {
    questions: Array<{
      id: string;
      type: string;
      title: string;
      description?: string;
      required: boolean;
      showConditionally: boolean;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  } | null;
  
  /**
   * Respuestas agrupadas por questionKey
   */
  groupedResponses: Record<string, Array<{
    participantId: string;
    value: unknown;
    responseTime?: string;
    timestamp: string;
    metadata?: unknown;
  }>>;
  
  /**
   * Datos procesados por pregunta para visualización
   */
  processedData: Array<{
    questionId: string;
    questionKey: string;
    totalResponses: number;
    sentimentData?: unknown;
    choiceData?: unknown;
    rankingData?: unknown;
    linearScaleData?: unknown;
    ratingData?: unknown;
    preferenceTestData?: unknown;
    imageSelectionData?: unknown;
    navigationFlowData?: unknown;
    [key: string]: unknown;
  }>;
}

/**
 * Procesa las respuestas agrupadas por questionKey para CognitiveTask
 */
const processCognitiveTaskData = (
  groupedResponses: Record<string, Array<{
    participantId: string;
    value: unknown;
    responseTime?: string;
    timestamp: string;
    metadata?: unknown;
  }>>,
  researchConfig: { questions: Array<{ id: string; [key: string]: unknown }> } | null
): CognitiveTaskResponses['processedData'] => {
  if (!groupedResponses || Object.keys(groupedResponses).length === 0) {
    return [];
  }

  const processed: CognitiveTaskResponses['processedData'] = [];

  // Procesar cada questionKey
  // DEBUG: Log datos recibidos
  console.log('[useCognitiveTaskResponses] Procesando datos:', {
    groupedResponsesKeys: Object.keys(groupedResponses),
    researchConfigQuestions: researchConfig?.questions?.map((q: any) => ({ id: q.id, type: q.type })),
    totalResponses: Object.values(groupedResponses).reduce((acc: number, arr: any) => acc + (arr?.length || 0), 0)
  });

  Object.entries(groupedResponses).forEach(([questionKey, responses]) => {
    if (!responses || responses.length === 0) {
      return;
    }

    // Encontrar la pregunta correspondiente en la configuración
    // El questionKey del endpoint es: "cognitive_short_text", "cognitive_long_text", etc.
    // El question.type en la configuración es: "short_text", "long_text", etc. (sin prefijo)
    const question = researchConfig?.questions?.find((q: { id: string; type?: string; [key: string]: unknown }) => {
      const questionType = (q.type as string) || '';
      const normalizedType = questionType.replace(/^cognitive_/, ''); // Remover prefijo si existe
      const expectedQuestionKey = `cognitive_${normalizedType}`;
      
      // Comparar questionKey del endpoint con el esperado desde question.type
      if (questionKey === expectedQuestionKey) {
        console.log(`[useCognitiveTaskResponses] ✅ Match: questionKey ${questionKey} === expectedQuestionKey ${expectedQuestionKey} para pregunta ${q.id}`);
        return true;
      }
      
      // Comparar por questionId si el questionKey contiene el id
      if (questionKey.includes(q.id)) {
        console.log(`[useCognitiveTaskResponses] ✅ Match: questionKey ${questionKey} incluye questionId ${q.id}`);
        return true;
      }
      
      // Comparar si el questionKey contiene el tipo de pregunta
      if (normalizedType && questionKey.toLowerCase().includes(normalizedType.toLowerCase())) {
        console.log(`[useCognitiveTaskResponses] ✅ Match: questionKey ${questionKey} incluye tipo ${normalizedType} para pregunta ${q.id}`);
        return true;
      }
      
      return false;
    });

    // Usar el questionId de la pregunta encontrada, o el questionKey como fallback
    const questionId = question?.id || questionKey;
    
    // DEBUG: Log si no se encontró pregunta
    if (!question) {
      console.log(`[useCognitiveTaskResponses] ⚠️ No se encontró pregunta en config para questionKey: ${questionKey}`);
    }

    // Procesar respuestas según el tipo de pregunta
    const processedQuestion: {
      questionId: string;
      questionKey: string;
      totalResponses: number;
      rawResponses: Array<{
        participantId: string;
        value: unknown;
        responseTime?: string;
        timestamp: string;
        metadata?: unknown;
      }>;
      sentimentData?: unknown;
      choiceData?: unknown;
      rankingData?: unknown;
      linearScaleData?: unknown;
      ratingData?: unknown;
      preferenceTestData?: unknown;
      imageSelectionData?: unknown;
      navigationFlowData?: unknown;
    } = {
      questionId,
      questionKey,
      totalResponses: responses.length,
      rawResponses: responses,
      sentimentData: undefined,
      choiceData: undefined,
      rankingData: undefined,
      linearScaleData: undefined,
      ratingData: undefined,
      preferenceTestData: undefined,
      imageSelectionData: undefined,
      navigationFlowData: undefined
    };

    // Procesar según el tipo de pregunta
    if (questionKey.includes('short_text') || questionKey.includes('long_text')) {
      // Procesar para análisis de sentimiento
      processedQuestion.sentimentData = {
        responses: responses.map(r => ({
          text: String(r.value || ''),
          participantId: r.participantId,
          timestamp: r.timestamp
        })),
        totalResponses: responses.length
      };
    } else if (questionKey.includes('single_choice') || questionKey.includes('multiple_choice')) {
      // Procesar para visualización de opciones
      const choiceCounts: Record<string, number> = {};
      responses.forEach(r => {
        const value = String(r.value || '');
        choiceCounts[value] = (choiceCounts[value] || 0) + 1;
      });
      
      processedQuestion.choiceData = {
        choices: Object.entries(choiceCounts).map(([label, count]) => ({
          label,
          count,
          percentage: Math.round((count / responses.length) * 100)
        })),
        totalResponses: responses.length
      };
    } else if (questionKey.includes('linear_scale')) {
      // Procesar para escala lineal
      const values = responses
        .map(r => {
          const num = typeof r.value === 'number' ? r.value : parseFloat(String(r.value || 0));
          return isNaN(num) ? 0 : num;
        })
        .filter(v => v > 0);
      
      processedQuestion.linearScaleData = {
        values,
        average: values.length > 0 ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0,
        totalResponses: responses.length
      };
    } else if (questionKey.includes('ranking')) {
      // Procesar para ranking
      processedQuestion.rankingData = {
        responses: responses.map(r => ({
          participantId: r.participantId,
          ranking: r.value,
          timestamp: r.timestamp
        })),
        totalResponses: responses.length
      };
    } else if (questionKey.includes('preference_test')) {
      // Procesar para test de preferencia
      const preferenceCounts: Record<string, number> = {};
      responses.forEach(r => {
        const value = String(r.value || '');
        preferenceCounts[value] = (preferenceCounts[value] || 0) + 1;
      });
      
      processedQuestion.preferenceTestData = {
        preferences: Object.entries(preferenceCounts).map(([option, count]) => ({
          option,
          count,
          percentage: Math.round((count / responses.length) * 100)
        })),
        totalResponses: responses.length
      };
    } else if (questionKey.includes('navigation_flow')) {
      // Procesar para flujo de navegación
      processedQuestion.navigationFlowData = {
        responses: responses.map(r => ({
          participantId: r.participantId,
          data: r.value,
          timestamp: r.timestamp
        })),
        totalResponses: responses.length
      };
    }

    processed.push(processedQuestion);
  });

  return processed;
};

/**
 * Hook para obtener y procesar respuestas de CognitiveTask
 */
export const useCognitiveTaskResponses = (researchId: string | null) => {
  // DEBUG: Log cuando se llama el hook
  console.log('[useCognitiveTaskResponses] Hook llamado con researchId:', researchId);
  
  // Obtener respuestas del endpoint
  const responsesQuery = useQuery({
    queryKey: ['cognitiveTaskResponses', researchId],
    queryFn: async () => {
      if (!researchId) {
        throw new Error('Research ID es requerido');
      }

      console.log('[useCognitiveTaskResponses] 🔄 Fetching responses para researchId:', researchId);
      const response = await moduleResponsesAPI.getResponsesByResearch(researchId);
      console.log('[useCognitiveTaskResponses] ✅ Responses recibidas:', {
        hasData: !!response,
        dataKeys: response?.data ? Object.keys(response.data) : [],
        directKeys: response && !response.data ? Object.keys(response as any) : []
      });

      if (!response) {
        throw new Error('No se recibieron datos del servidor');
      }

      // La respuesta tiene estructura: { data: { questionKey: [...] } }
      return (response.data || response) as Record<string, Array<{
        participantId: string;
        value: unknown;
        responseTime?: string;
        timestamp: string;
        metadata?: unknown;
      }>>;
    },
    enabled: !!researchId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1
  });

  // Obtener configuración de CognitiveTask
  // Usar el mismo query key que useCognitiveTaskData para compartir datos y evitar peticiones duplicadas
  const configQuery = useQuery({
    queryKey: cognitiveTaskKeys.byResearch(researchId || ''),
    queryFn: async () => {
      if (!researchId) {
        return null;
      }

      try {
        const config = await cognitiveTaskApi.getByResearchId(researchId);
        return config;
      } catch (error) {
        // Si no existe configuración, retornar null
        if ((error as any)?.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!researchId,
    staleTime: 10 * 60 * 1000, // Cache más largo para configuración
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // No refetch si ya hay datos en cache
    retry: 1
  });

  // Procesar datos cuando ambos queries estén listos
  // Solo procesar cuando tengamos respuestas Y configuración (para mejor mapeo)
  const processedData = React.useMemo(() => {
    if (responsesQuery.data && configQuery.data) {
      console.log('[useCognitiveTaskResponses] Procesando con configuración disponible');
      return processCognitiveTaskData(responsesQuery.data, configQuery.data as { questions: Array<{ id: string; [key: string]: unknown }> });
    } else if (responsesQuery.data) {
      console.log('[useCognitiveTaskResponses] Procesando sin configuración (fallback)');
      return processCognitiveTaskData(responsesQuery.data, null);
    }
    return [];
  }, [responsesQuery.data, configQuery.data]);

  return {
    researchConfig: configQuery.data,
    groupedResponses: responsesQuery.data || {},
    processedData,
    isLoading: responsesQuery.isLoading || configQuery.isLoading,
    isError: responsesQuery.isError || configQuery.isError,
    error: responsesQuery.error || configQuery.error,
    refetch: () => {
      responsesQuery.refetch();
      configQuery.refetch();
    }
  };
};

