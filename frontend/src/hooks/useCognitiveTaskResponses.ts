import React from 'react';
import { moduleResponsesAPI } from '@/api/config';
import { useCognitiveTaskData } from '@/api/domains/cognitive-task';
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
        return true;
      }
      
      // Comparar por questionId si el questionKey contiene el id
      if (questionKey.includes(q.id)) {
        return true;
      }
      
      // Comparar si el questionKey contiene el tipo de pregunta
      if (normalizedType && questionKey.toLowerCase().includes(normalizedType.toLowerCase())) {
        return true;
      }
      
      return false;
    });

    // Usar el questionId de la pregunta encontrada, o el questionKey como fallback
    const questionId = question?.id || questionKey;

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
  // Obtener respuestas del endpoint
  // Usar el mismo query key que otros hooks para compartir cache
  const responsesQuery = useQuery({
    queryKey: ['moduleResponses', 'research', researchId],
    queryFn: async () => {
      if (!researchId) {
        throw new Error('Research ID es requerido');
      }

      const response = await moduleResponsesAPI.getResponsesByResearch(researchId);

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
  // Usar useCognitiveTaskData directamente para compartir el cache y evitar peticiones duplicadas
  const { data: configData, isLoading: isConfigLoading, error: configError } = useCognitiveTaskData(researchId);

  // Procesar datos cuando ambos queries estén listos
  // Solo procesar cuando tengamos respuestas Y configuración (para mejor mapeo)
  const processedData = React.useMemo(() => {
    if (responsesQuery.data && configData) {
      return processCognitiveTaskData(responsesQuery.data, configData as { questions: Array<{ id: string; [key: string]: unknown }> });
    } else if (responsesQuery.data) {
      return processCognitiveTaskData(responsesQuery.data, null);
    }
    return [];
  }, [responsesQuery.data, configData]);

  return {
    researchConfig: configData,
    groupedResponses: responsesQuery.data || {},
    processedData,
    isLoading: responsesQuery.isLoading || isConfigLoading,
    isError: responsesQuery.isError || (configError !== null && configError !== undefined),
    error: responsesQuery.error || configError,
    refetch: () => {
      responsesQuery.refetch();
    }
  };
};

