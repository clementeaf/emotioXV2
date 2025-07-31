import { useQuery } from '@tanstack/react-query';
import { moduleResponseService } from '../services/moduleResponseService';

interface QuestionResponse {
  participantId: string;
  value: any;
  timestamp: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

interface QuestionWithResponses {
  questionKey: string;
  responses: QuestionResponse[];
}

interface GroupedResponsesResponse {
  data: QuestionWithResponses[];
  status: number;
}

/**
 * Hook personalizado para obtener respuestas agrupadas por pregunta
 * Esta estructura es más eficiente para análisis estadísticos de múltiples participantes
 */
export const useGroupedResponses = (researchId: string) => {
  return useQuery<GroupedResponsesResponse>({
    queryKey: ['groupedResponses', researchId],
    queryFn: () => moduleResponseService.getResponsesGroupedByQuestion(researchId),
    enabled: !!researchId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

/**
 * Hook para obtener respuestas de una pregunta específica
 */
export const useQuestionResponses = (researchId: string, questionKey: string) => {
  const { data, isLoading, error } = useGroupedResponses(researchId);

  const questionData = data?.data.find(q => q.questionKey === questionKey);

  return {
    data: questionData,
    isLoading,
    error,
    responses: questionData?.responses || [],
    responseCount: questionData?.responses.length || 0
  };
};

/**
 * Hook para obtener estadísticas básicas de una pregunta
 */
export const useQuestionStats = (researchId: string, questionKey: string) => {
  const { responses, isLoading, error } = useQuestionResponses(researchId, questionKey);

  const stats = {
    totalResponses: responses.length,
    uniqueParticipants: new Set(responses.map(r => r.participantId)).size,
    completionRate: 0,
    averageValue: 0,
    valueDistribution: {} as Record<string, number>
  };

  if (responses.length > 0) {
    // Calcular distribución de valores
    responses.forEach(response => {
      const value = String(response.value);
      stats.valueDistribution[value] = (stats.valueDistribution[value] || 0) + 1;
    });

    // Calcular promedio para valores numéricos
    const numericValues = responses
      .map(r => r.value)
      .filter(v => typeof v === 'number') as number[];

    if (numericValues.length > 0) {
      stats.averageValue = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
    }
  }

  return {
    stats,
    isLoading,
    error,
    responses
  };
};
