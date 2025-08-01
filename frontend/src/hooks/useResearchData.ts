import { smartVocFixedAPI } from '@/lib/smart-voc-api';
import { useQuery } from '@tanstack/react-query';
import { moduleResponseService } from '../services/moduleResponseService';
import { useResearchById } from './useResearchList';

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

interface CPVData {
  cpvValue: number;
  satisfaction: number;
  retention: number;
  impact: string;
  trend: string;
  csatPercentage: number;
  cesPercentage: number;
  cvValue: number;
  nevValue: number;
  npsValue: number;
  peakValue: number;
}

interface TrustFlowData {
  stage: string;
  nps: number;
  nev: number;
  timestamp: string;
}

interface SmartVOCResults {
  totalResponses: number;
  uniqueParticipants: number;
  npsScore: number;
  csatScores: number[];
  cesScores: number[];
  nevScores: number[];
  cvScores: number[];
  vocResponses: any[];
  smartVOCResponses: any[];
}

/**
 * Hook centralizado para obtener todos los datos de research
 * Evita llamadas duplicadas usando React Query con caching
 */
export const useResearchData = (researchId: string) => {
  // Query para datos básicos del research (reutiliza useResearchById)
  const researchQuery = useResearchById(researchId);

  // Query para datos de SmartVOC form
  const smartVOCFormQuery = useQuery({
    queryKey: ['smartVOCForm', researchId],
    queryFn: async () => {
      try {
        return await smartVocFixedAPI.getByResearchId(researchId);
      } catch (error) {
        console.warn('[useResearchData] Error obteniendo SmartVOC form, devolviendo null:', error);
        return null;
      }
    },
    enabled: !!researchId,
    staleTime: 10 * 60 * 1000, // 10 minutos (aumentado)
    gcTime: 30 * 60 * 1000, // 30 minutos (aumentado)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  // Query principal para datos agrupados
  const groupedResponsesQuery = useQuery<GroupedResponsesResponse>({
    queryKey: ['groupedResponses', researchId],
    queryFn: async () => {
      try {
        return await moduleResponseService.getResponsesGroupedByQuestion(researchId);
      } catch (error) {
        // Si hay un error, devolver respuesta vacía en lugar de fallar
        console.warn('[useResearchData] Error obteniendo respuestas agrupadas, devolviendo datos vacíos:', error);
        return {
          data: [],
          status: 404
        };
      }
    },
    enabled: !!researchId,
    staleTime: 10 * 60 * 1000, // 10 minutos (aumentado)
    gcTime: 30 * 60 * 1000, // 30 minutos (aumentado)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false, // No reintentar en caso de error
  });

  // Derivar SmartVOC data desde groupedResponses
  const smartVOCData = useQuery<SmartVOCResults>({
    queryKey: ['smartVOCData', researchId],
    queryFn: () => {
      if (!groupedResponsesQuery.data) throw new Error('No grouped data available');
      return processSmartVOCData(groupedResponsesQuery.data.data);
    },
    enabled: !!groupedResponsesQuery.data,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Derivar CPV data desde groupedResponses
  const cpvData = useQuery<CPVData>({
    queryKey: ['cpvData', researchId],
    queryFn: () => {
      if (!groupedResponsesQuery.data) throw new Error('No grouped data available');
      return processCPVData(groupedResponsesQuery.data.data);
    },
    enabled: !!groupedResponsesQuery.data,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Derivar TrustFlow data desde groupedResponses
  const trustFlowData = useQuery<TrustFlowData[]>({
    queryKey: ['trustFlowData', researchId],
    queryFn: () => {
      if (!groupedResponsesQuery.data) throw new Error('No grouped data available');
      return processTrustFlowData(groupedResponsesQuery.data.data);
    },
    enabled: !!groupedResponsesQuery.data,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    // Datos básicos del research (reutiliza useResearchById)
    researchData: researchQuery.data,
    isResearchLoading: researchQuery.isLoading,
    researchError: researchQuery.error,

    // Datos de SmartVOC form
    smartVOCFormData: smartVOCFormQuery.data,
    isSmartVOCFormLoading: smartVOCFormQuery.isLoading,
    smartVOCFormError: smartVOCFormQuery.error,

    // Datos principales
    groupedResponses: groupedResponsesQuery.data?.data || [],
    isLoading: groupedResponsesQuery.isLoading,
    error: groupedResponsesQuery.error,

    // Datos derivados
    smartVOCData: smartVOCData.data,
    cpvData: cpvData.data,
    trustFlowData: trustFlowData.data || [],

    // Estados de carga
    isSmartVOCLoading: smartVOCData.isLoading,
    isCPVLoading: cpvData.isLoading,
    isTrustFlowLoading: trustFlowData.isLoading,

    // Errores
    smartVOCError: smartVOCData.error,
    cpvError: cpvData.error,
    trustFlowError: trustFlowData.error,

    // Refetch functions
    refetch: groupedResponsesQuery.refetch,
    refetchResearch: researchQuery.refetch,
    refetchSmartVOCForm: smartVOCFormQuery.refetch,
  };
};

// Función para procesar datos SmartVOC desde grouped responses
function processSmartVOCData(groupedResponses: QuestionWithResponses[]): SmartVOCResults {
  const allSmartVOCResponses: any[] = [];
  const npsScores: number[] = [];
  const csatScores: number[] = [];
  const cesScores: number[] = [];
  const nevScores: number[] = [];
  const cvScores: number[] = [];
  const vocResponses: any[] = [];

  groupedResponses.forEach(questionGroup => {
    if (questionGroup.questionKey && questionGroup.questionKey.toLowerCase().includes('smartvoc')) {
      questionGroup.responses.forEach((response: any) => {
        const smartVOCResponse = {
          questionKey: questionGroup.questionKey,
          response: response.value,
          participantId: response.participantId,
          participantName: 'Participante',
          timestamp: response.timestamp || new Date().toISOString()
        };

        allSmartVOCResponses.push(smartVOCResponse);

        const responseValue = parseResponseValue(response.value);

        if (questionGroup.questionKey.toLowerCase().includes('nps')) {
          if (responseValue > 0) npsScores.push(responseValue);
        } else if (questionGroup.questionKey.toLowerCase().includes('csat')) {
          if (responseValue > 0) csatScores.push(responseValue);
        } else if (questionGroup.questionKey.toLowerCase().includes('ces')) {
          if (responseValue > 0) cesScores.push(responseValue);
        } else if (questionGroup.questionKey.toLowerCase().includes('nev')) {
          if (response.value && Array.isArray(response.value)) {
            const emotions = response.value;
            const positiveEmotions = ['Feliz', 'Satisfecho', 'Confiado', 'Valorado', 'Cuidado', 'Seguro', 'Enfocado', 'Indulgente', 'Estimulado', 'Exploratorio', 'Interesado', 'Enérgico'];
            const negativeEmotions = ['Descontento', 'Frustrado', 'Irritado', 'Decepción', 'Estresado', 'Infeliz', 'Desatendido', 'Apresurado'];

            const positiveCount = emotions.filter((emotion: string) => positiveEmotions.includes(emotion)).length;
            const negativeCount = emotions.filter((emotion: string) => negativeEmotions.includes(emotion)).length;

            const totalEmotions = emotions.length;
            if (totalEmotions > 0) {
              const nevScore = Math.round(((positiveCount - negativeCount) / totalEmotions) * 100);
              nevScores.push(nevScore);
            }
          }
        } else if (questionGroup.questionKey.toLowerCase().includes('cv')) {
          if (responseValue > 0) cvScores.push(responseValue);
        } else if (questionGroup.questionKey.toLowerCase().includes('voc')) {
          vocResponses.push({
            text: parseResponseText(response.value),
            participantId: response.participantId,
            participantName: 'Participante',
            timestamp: response.timestamp
          });
        }
      });
    }
  });

  const totalResponses = allSmartVOCResponses.length;
  const uniqueParticipants = new Set(allSmartVOCResponses.map(r => r.participantId)).size;

  const npsScore = npsScores.length > 0
    ? Math.round(((npsScores.filter(score => score >= 9).length - npsScores.filter(score => score <= 6).length) / npsScores.length) * 100)
    : 0;

  return {
    totalResponses,
    uniqueParticipants,
    npsScore,
    csatScores,
    cesScores,
    nevScores,
    cvScores,
    vocResponses,
    smartVOCResponses: allSmartVOCResponses
  };
}

// Función para procesar datos CPV desde grouped responses
function processCPVData(groupedResponses: QuestionWithResponses[]): CPVData {
  const csatScores: number[] = [];
  const cesScores: number[] = [];
  const npsScores: number[] = [];
  const nevScores: number[] = [];
  const cvScores: number[] = [];

  groupedResponses.forEach(questionGroup => {
    if (questionGroup.questionKey && questionGroup.questionKey.toLowerCase().includes('smartvoc')) {
      questionGroup.responses.forEach((response: any) => {
        const responseValue = parseResponseValue(response.value);
        if (!isNaN(responseValue) && responseValue > 0) {
          if (questionGroup.questionKey.toLowerCase().includes('csat')) {
            csatScores.push(responseValue);
          } else if (questionGroup.questionKey.toLowerCase().includes('ces')) {
            cesScores.push(responseValue);
          } else if (questionGroup.questionKey.toLowerCase().includes('nps')) {
            npsScores.push(responseValue);
          } else if (questionGroup.questionKey.toLowerCase().includes('cv')) {
            cvScores.push(responseValue);
          }
        }
      });
    }
  });

  const totalResponses = groupedResponses.reduce((acc, q) => acc + q.responses.length, 0);
  const cpvValue = csatScores.length > 0 ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10 : 0;
  const satisfaction = csatScores.length > 0 ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10 : 0;

  const csatPercentage = csatScores.length > 0 ? Math.round((csatScores.filter(score => score >= 4).length / csatScores.length) * 100) : 0;
  const cesPercentage = cesScores.length > 0 ? Math.round((cesScores.filter(score => score <= 2).length / cesScores.length) * 100) : 0;

  const promoters = npsScores.filter(score => score >= 9).length;
  const neutrals = npsScores.filter(score => score >= 7 && score <= 8).length;
  const retention = totalResponses > 0 ? Math.round(((promoters + neutrals) / totalResponses) * 100) : 0;

  const impact = totalResponses > 0 && promoters > (npsScores.length - promoters - neutrals) ? 'Alto' : totalResponses > 0 ? 'Medio' : 'Bajo';
  const trend = totalResponses > 0 && promoters > (npsScores.length - promoters - neutrals) ? 'Positiva' : totalResponses > 0 ? 'Neutral' : 'Negativa';

  const peakValue = Math.max(cpvValue, satisfaction, retention);

  return {
    cpvValue,
    satisfaction,
    retention,
    impact,
    trend,
    csatPercentage,
    cesPercentage,
    cvValue: cvScores.length > 0 ? Math.round((cvScores.reduce((a, b) => a + b, 0) / cvScores.length) * 10) / 10 : 0,
    nevValue: nevScores.length > 0 ? Math.round((nevScores.reduce((a, b) => a + b, 0) / nevScores.length) * 10) / 10 : 0,
    npsValue: npsScores.length > 0 ? Math.round(((promoters - (npsScores.length - promoters - neutrals)) / npsScores.length) * 100) : 0,
    peakValue
  };
}

// Función para procesar datos TrustFlow desde grouped responses
function processTrustFlowData(groupedResponses: QuestionWithResponses[]): TrustFlowData[] {
  const responsesByDate: { [key: string]: any[] } = {};

  groupedResponses.forEach(questionGroup => {
    questionGroup.responses.forEach((response: any) => {
      if (response.timestamp) {
        const dateKey = new Date(response.timestamp).toISOString().split('T')[0];
        if (!responsesByDate[dateKey]) {
          responsesByDate[dateKey] = [];
        }
        responsesByDate[dateKey].push({ ...response, questionKey: questionGroup.questionKey });
      }
    });
  });

  return Object.keys(responsesByDate).map(date => {
    const dateResponses = responsesByDate[date];

    const npsScores = dateResponses
      .filter(r => r.questionKey && r.questionKey.toLowerCase().includes('nps'))
      .map(r => parseResponseValue(r.value))
      .filter(score => !isNaN(score) && score > 0);

    const nevScores = dateResponses
      .filter(r => r.questionKey && r.questionKey.toLowerCase().includes('nev'))
      .map(r => {
        if (r.value && Array.isArray(r.value)) {
          const emotions = r.value;
          const positiveEmotions = ['Feliz', 'Satisfecho', 'Confiado', 'Valorado', 'Cuidado', 'Seguro', 'Enfocado', 'Indulgente', 'Estimulado', 'Exploratorio', 'Interesado', 'Enérgico'];
          const negativeEmotions = ['Descontento', 'Frustrado', 'Irritado', 'Decepción', 'Estresado', 'Infeliz', 'Desatendido', 'Apresurado'];

          const positiveCount = emotions.filter((emotion: string) => positiveEmotions.includes(emotion)).length;
          const negativeCount = emotions.filter((emotion: string) => negativeEmotions.includes(emotion)).length;

          const totalEmotions = emotions.length;
          if (totalEmotions > 0) {
            return Math.round(((positiveCount - negativeCount) / totalEmotions) * 100);
          }
        }
        return 0;
      })
      .filter(score => score !== 0);

    const avgNps = npsScores.length > 0 ? npsScores.reduce((a, b) => a + b, 0) / npsScores.length : 0;
    const avgNev = nevScores.length > 0 ? nevScores.reduce((a, b) => a + b, 0) / nevScores.length : 0;

    return {
      stage: new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      nps: Math.round(avgNps * 10) / 10,
      nev: Math.round(avgNev * 10) / 10,
      timestamp: date
    };
  }).sort((a, b) => new Date(a.stage).getTime() - new Date(b.stage).getTime());
}

// Funciones auxiliares
function parseResponseValue(response: any): number {
  if (typeof response === 'number') return response;
  if (typeof response === 'string') {
    const parsed = parseFloat(response);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (response && typeof response === 'object' && 'value' in response) {
    return parseResponseValue(response.value);
  }
  return 0;
}

function parseResponseText(response: any): string {
  if (typeof response === 'string') return response;
  if (response && typeof response === 'object' && 'value' in response) {
    return parseResponseText(response.value);
  }
  return JSON.stringify(response);
}
