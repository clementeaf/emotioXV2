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

    // Agrupar respuestas por fecha para time series
    const responsesByDate: { [key: string]: any[] } = {};

    allResponses.forEach(response => {
      const dateKey = new Date(response.timestamp || new Date()).toISOString().split('T')[0];
      if (!responsesByDate[dateKey]) {
        responsesByDate[dateKey] = [];
      }
      responsesByDate[dateKey].push(response);
    });

    // Generar time series data para TrustRelationshipFlow
    const timeSeriesData = Object.keys(responsesByDate).map(date => {
      const dateResponses = responsesByDate[date];

      const dateNpsScores = dateResponses
        .filter(r => r.questionKey.toLowerCase().includes('nps'))
        .map(r => parseResponseValue(r.response))
        .filter(score => score > 0);

      const dateNevScores = dateResponses
        .filter(r => r.questionKey.toLowerCase().includes('nev'))
        .map(r => parseResponseValue(r.response))
        .filter(score => score > 0);

      const avgNps = dateNpsScores.length > 0 ? dateNpsScores.reduce((a, b) => a + b, 0) / dateNpsScores.length : 0;
      const avgNev = dateNevScores.length > 0 ? dateNevScores.reduce((a, b) => a + b, 0) / dateNevScores.length : 0;

      return {
        stage: new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        nps: avgNps,
        nev: avgNev,
        count: dateResponses.length
      };
    }).sort((a, b) => new Date(a.stage).getTime() - new Date(b.stage).getTime());

    return timeSeriesData;
  };

  return {
    data,
    isLoading,
    error,
    // Valores por defecto para evitar errores de renderizado
    defaultData: [
      {
        stage: '20 jul',
        nps: 75,
        nev: 45,
        count: 1
      },
      {
        stage: '21 jul',
        nps: 82,
        nev: 67,
        count: 2
      },
      {
        stage: '22 jul',
        nps: 91,
        nev: 76,
        count: 3
      },
      {
        stage: '23 jul',
        nps: 88,
        nev: 83,
        count: 4
      },
      {
        stage: '24 jul',
        nps: 95,
        nev: 89,
        count: 5
      }
    ]
  };
};
