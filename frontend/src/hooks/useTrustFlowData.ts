import { moduleResponsesAPI } from '@/config/api';
import { useEffect, useState } from 'react';

import { TrustFlowData } from '@/components/research/SmartVOCResults/types';

export const useTrustFlowData = (researchId: string) => {
  const [data, setData] = useState<TrustFlowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrustFlowData = async () => {
      if (!researchId) {
        setError('Research ID es requerido');
        setIsLoading(false);
        return;
      }

      try {
        console.log(`[useTrustFlowData] 🔍 Obteniendo datos Trust Flow para research: ${researchId}`);

        // Intentar endpoint específico primero
        try {
          const response = await moduleResponsesAPI.getTrustFlowResults(researchId);

          if (response.data && response.data.timeSeriesData) {
            console.log(`[useTrustFlowData] ✅ Datos Trust Flow recibidos del endpoint específico`);
            setData(response.data.timeSeriesData);
            return;
          }
        } catch (specificError: any) {
          console.warn(`[useTrustFlowData] ⚠️ Endpoint específico falló, usando fallback:`, specificError);
        }

        // Fallback: usar endpoint general y procesar
        const response = await moduleResponsesAPI.getResponsesByResearch(researchId);

        if (response.data) {
          console.log(`[useTrustFlowData] ✅ Procesando datos Trust Flow desde endpoint general`);

          const trustFlowData = processTrustFlowDataFromResponses(response.data);
          setData(trustFlowData);
        } else {
          setError('No se recibieron datos del servidor');
        }
      } catch (err: any) {
        console.error('[useTrustFlowData] ❌ Error:', err);

        let errorMessage = 'Error al obtener datos Trust Flow';

        if (err.statusCode === 404) {
          errorMessage = 'Endpoint Trust Flow no disponible';
        } else if (err.statusCode === 500) {
          errorMessage = 'Error interno del servidor';
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrustFlowData();
  }, [researchId]);

  // Función para procesar datos Trust Flow desde respuestas generales
  const processTrustFlowDataFromResponses = (responses: any[]): TrustFlowData[] => {
    if (!responses || responses.length === 0) {
      return [];
    }

    const allResponses: any[] = [];

    const parseResponseValue = (response: any): number => {
      if (typeof response === 'number') return response;
      if (typeof response === 'object' && response.value !== undefined) {
        return typeof response.value === 'number' ? response.value : parseFloat(response.value) || 0;
      }
      if (typeof response === 'string') {
        const parsed = parseFloat(response);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    // Procesar cada participante
    responses.forEach(participant => {
      if (participant.responses && Array.isArray(participant.responses)) {
        participant.responses.forEach((response: any) => {
          // Filtrar solo respuestas SmartVOC NPS y NEV
          if (response.questionKey &&
            (response.questionKey.toLowerCase().includes('smartvoc_nps') ||
              response.questionKey.toLowerCase().includes('smartvoc_nev'))) {

            const smartVOCResponse = {
              ...response,
              participantId: participant.participantId,
              participantName: participant.name || 'Participante',
              timestamp: response.timestamp || new Date().toISOString()
            };

            allResponses.push(smartVOCResponse);
          }
        });
      }
    });

    // Agrupar respuestas por hora para time series (como en la imagen)
    const responsesByHour: { [key: string]: any[] } = {};

    allResponses.forEach(response => {
      const date = new Date(response.timestamp || new Date());
      const hourKey = date.getHours().toString().padStart(2, '0');
      if (!responsesByHour[hourKey]) {
        responsesByHour[hourKey] = [];
      }
      responsesByHour[hourKey].push(response);
    });

    // Generar time series data para TrustRelationshipFlow
    const timeSeriesData = Object.keys(responsesByHour).map(hour => {
      const hourResponses = responsesByHour[hour];

      // Calcular NPS: % Promotores (9-10) - % Detractores (0-6)
      const npsScores = hourResponses
        .filter(r => r.questionKey.toLowerCase().includes('nps'))
        .map(r => parseResponseValue(r.response))
        .filter(score => score >= 0 && score <= 10);

      let npsValue = 0;
      if (npsScores.length > 0) {
        const promoters = npsScores.filter(score => score >= 9).length;
        const detractors = npsScores.filter(score => score >= 0 && score <= 6).length;
        const promotersPercentage = (promoters / npsScores.length) * 100;
        const detractorsPercentage = (detractors / npsScores.length) * 100;
        npsValue = Math.round((promotersPercentage - detractorsPercentage) * 100) / 100;
      }

      // Calcular NEV: % Emociones positivas - % Emociones negativas
      const nevScores = hourResponses
        .filter(r => r.questionKey.toLowerCase().includes('nev'))
        .map(r => parseResponseValue(r.response))
        .filter(score => score > 0);

      let nevValue = 0;
      if (nevScores.length > 0) {
        // Emociones positivas: valores altos (4-5 en escala 1-5, o 7-10 en escala 1-10)
        const maxScore = Math.max(...nevScores);
        const isScale1to5 = maxScore <= 5;

        let positiveEmotions, negativeEmotions;

        if (isScale1to5) {
          positiveEmotions = nevScores.filter(score => score >= 4).length;
          negativeEmotions = nevScores.filter(score => score <= 2).length;
        } else {
          positiveEmotions = nevScores.filter(score => score >= 7).length;
          negativeEmotions = nevScores.filter(score => score <= 3).length;
        }

        const positivePercentage = (positiveEmotions / nevScores.length) * 100;
        const negativePercentage = (negativeEmotions / nevScores.length) * 100;
        nevValue = Math.round((positivePercentage - negativePercentage) * 100) / 100;
      }

      // Convertir a "Numbers of responses" (escalar a miles)
      const totalResponses = hourResponses.length;
      const responsesInK = Math.round((totalResponses / 1000) * 100) / 100; // Convertir a miles

      return {
        stage: hour, // Hora como "00", "03", "06", etc.
        nps: npsValue,
        nev: nevValue,
        count: responsesInK // "Numbers of responses" en miles
      };
    }).sort((a, b) => parseInt(a.stage) - parseInt(b.stage));

    return timeSeriesData;
  };

  return {
    data,
    isLoading,
    error,
    // Valores por defecto para evitar errores de renderizado
    defaultData: [
      {
        stage: '00',
        nps: 74.62,
        nev: 56.47,
        count: 9.2 // 9.2k responses
      },
      {
        stage: '03',
        nps: 78.5,
        nev: 62.3,
        count: 10.8 // 10.8k responses
      },
      {
        stage: '06',
        nps: 82.1,
        nev: 68.7,
        count: 11.5 // 11.5k responses
      },
      {
        stage: '09',
        nps: 79.8,
        nev: 65.2,
        count: 10.2 // 10.2k responses
      },
      {
        stage: '23',
        nps: 76.3,
        nev: 58.9,
        count: 8.7 // 8.7k responses
      }
    ]
  };
};
