import { moduleResponsesAPI } from '@/lib/api';
import { useEffect, useState } from 'react';

interface SmartVOCResponse {
  questionKey: string;
  questionText: string;
  response: any;
  timestamp: string;
  duration?: number;
  participantId: string;
  participantName: string;
}

interface SmartVOCMetrics {
  totalResponses: number;
  uniqueParticipants: number;
  averageScore: number;
  promoters: number;
  detractors: number;
  neutrals: number;
  npsScore: number;
  responseDistribution: Record<string, number>;
  timeSeriesData: Array<{
    date: string;
    score: number;
    count: number;
  }>;
}

export const useSmartVOCResponses = (researchId: string) => {
  const [responses, setResponses] = useState<SmartVOCResponse[]>([]);
  const [metrics, setMetrics] = useState<SmartVOCMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSmartVOCResponses = async () => {
      if (!researchId) {
        console.log('[useSmartVOCResponses] ⚠️ No researchId provided');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('[useSmartVOCResponses] 🔍 Fetching SmartVOC responses for research:', researchId);

        // Obtener todas las respuestas del research usando moduleResponsesAPI
        const response = await moduleResponsesAPI.getResponsesByResearch(researchId);

        if (!response.success) {
          console.error('[useSmartVOCResponses] ❌ API error:', response.error || response.message);
          throw new Error(`Error al obtener respuestas del research: ${response.error || response.message || 'Unknown error'}`);
        }

        console.log('[useSmartVOCResponses] 📊 Raw module responses:', response.data?.length || 0, 'participants');

        // Extraer y filtrar respuestas SmartVOC
        const smartVOCResponses: SmartVOCResponse[] = [];

        if (response.data && Array.isArray(response.data)) {
          response.data.forEach((participantResponse: any) => {
            if (participantResponse.responses && Array.isArray(participantResponse.responses)) {
              participantResponse.responses.forEach((response: any) => {
                // Filtrar respuestas que contengan 'smartvoc' en questionKey
                if (response.questionKey && response.questionKey.toLowerCase().includes('smartvoc')) {
                  smartVOCResponses.push({
                    questionKey: response.questionKey,
                    questionText: response.questionText || response.questionKey,
                    response: response.response,
                    timestamp: response.timestamp,
                    duration: response.duration || 0,
                    participantId: participantResponse.participantId,
                    participantName: participantResponse.participantName || 'Participante'
                  });
                }
              });
            }
          });
        }

        console.log('[useSmartVOCResponses] 🎯 SmartVOC responses found:', smartVOCResponses.length);

        setResponses(smartVOCResponses);

        // Calcular métricas
        const calculatedMetrics = calculateSmartVOCMetrics(smartVOCResponses);
        setMetrics(calculatedMetrics);

        console.log('[useSmartVOCResponses] 📈 Metrics calculated:', {
          totalResponses: calculatedMetrics.totalResponses,
          uniqueParticipants: calculatedMetrics.uniqueParticipants,
          npsScore: calculatedMetrics.npsScore,
          averageScore: calculatedMetrics.averageScore
        });

      } catch (error: any) {
        console.error('[useSmartVOCResponses] ❌ Error:', error.message);
        setError(error.message || 'Error al cargar respuestas SmartVOC');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSmartVOCResponses();
  }, [researchId]);

  const calculateSmartVOCMetrics = (responses: SmartVOCResponse[]): SmartVOCMetrics => {
    if (responses.length === 0) {
      return {
        totalResponses: 0,
        uniqueParticipants: 0,
        averageScore: 0,
        promoters: 0,
        detractors: 0,
        neutrals: 0,
        npsScore: 0,
        responseDistribution: {},
        timeSeriesData: []
      };
    }

    // Contar participantes únicos
    const uniqueParticipants = new Set(responses.map(r => r.participantId)).size;

    // Procesar respuestas NPS (escala 0-10)
    const npsResponses = responses.filter(r =>
      r.questionKey.toLowerCase().includes('nps') ||
      r.questionKey.toLowerCase().includes('promoter')
    );

    let promoters = 0;
    let detractors = 0;
    let neutrals = 0;
    let totalScore = 0;
    let validScores = 0;

    npsResponses.forEach(response => {
      const score = parseFloat(response.response);
      if (!isNaN(score) && score >= 0 && score <= 10) {
        totalScore += score;
        validScores++;

        if (score >= 9) {
          promoters++;
        } else if (score <= 6) {
          detractors++;
        } else {
          neutrals++;
        }
      }
    });

    const averageScore = validScores > 0 ? totalScore / validScores : 0;
    const npsScore = validScores > 0 ? ((promoters - detractors) / validScores) * 100 : 0;

    // Distribución de respuestas por pregunta
    const responseDistribution: Record<string, number> = {};
    responses.forEach(response => {
      const key = response.questionKey;
      responseDistribution[key] = (responseDistribution[key] || 0) + 1;
    });

    // Datos de series temporales (agrupados por día)
    const timeSeriesData = responses.reduce((acc: any[], response) => {
      const date = new Date(response.timestamp).toISOString().split('T')[0];
      const existingDate = acc.find(item => item.date === date);

      if (existingDate) {
        existingDate.count++;
        const score = parseFloat(response.response);
        if (!isNaN(score)) {
          existingDate.score = (existingDate.score + score) / 2; // Promedio
        }
      } else {
        const score = parseFloat(response.response);
        acc.push({
          date,
          score: isNaN(score) ? 0 : score,
          count: 1
        });
      }

      return acc;
    }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      totalResponses: responses.length,
      uniqueParticipants,
      averageScore,
      promoters,
      detractors,
      neutrals,
      npsScore,
      responseDistribution,
      timeSeriesData
    };
  };

  return {
    responses,
    metrics,
    isLoading,
    error
  };
};
