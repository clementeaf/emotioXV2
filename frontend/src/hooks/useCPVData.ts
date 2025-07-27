import { moduleResponsesAPI } from '@/config/api';
import { useEffect, useState } from 'react';

interface CPVData {
  cpvValue: number;
  satisfaction: number;
  retention: number;
  impact: string;
  trend: string;
}

export const useCPVData = (researchId: string) => {
  const [data, setData] = useState<CPVData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCPVData = async () => {
      if (!researchId) {
        setError('Research ID es requerido');
        setIsLoading(false);
        return;
      }

      try {
        console.log(`[useCPVData] 🔍 Obteniendo datos CPV para research: ${researchId}`);

        // Intentar endpoint específico primero
        try {
          const response = await moduleResponsesAPI.getCPVResults(researchId);

          if (response.data) {
            console.log(`[useCPVData] ✅ Datos CPV recibidos del endpoint específico`);
            setData(response.data);
            return;
          }
        } catch (specificError: any) {
          console.warn(`[useCPVData] ⚠️ Endpoint específico falló, usando fallback:`, specificError);
        }

        // Fallback: usar endpoint general y procesar
        const response = await moduleResponsesAPI.getResponsesByResearch(researchId);

        if (response.data) {
          console.log(`[useCPVData] ✅ Procesando datos CPV desde endpoint general`);

          const cpvData = processCPVDataFromResponses(response.data);
          setData(cpvData);
        } else {
          setError('No se recibieron datos del servidor');
        }
      } catch (err: any) {
        console.error('[useCPVData] ❌ Error:', err);

        let errorMessage = 'Error al obtener datos CPV';

        if (err.statusCode === 404) {
          errorMessage = 'Endpoint CPV no disponible';
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

    fetchCPVData();
  }, [researchId]);

  // Función para procesar datos CPV desde respuestas generales
  const processCPVDataFromResponses = (responses: any[]): CPVData => {
    if (!responses || responses.length === 0) {
      return {
        cpvValue: 0,
        satisfaction: 0,
        retention: 0,
        impact: 'Bajo',
        trend: 'Negativa'
      };
    }

    const csatScores: number[] = [];
    const npsScores: number[] = [];

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
          if (response.questionKey && response.questionKey.toLowerCase().includes('smartvoc')) {
            const responseValue = parseResponseValue(response.response);

            if (response.questionKey.toLowerCase().includes('csat')) {
              if (responseValue > 0) {
                csatScores.push(responseValue);
              }
            } else if (response.questionKey.toLowerCase().includes('nps')) {
              if (responseValue > 0) {
                npsScores.push(responseValue);
              }
            }
          }
        });
      }
    });

    // Calcular métricas CPV
    const cpvValue = csatScores.length > 0 ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10 : 0;
    const satisfaction = csatScores.length > 0 ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10 : 0;

    // Calcular retención desde NPS - Manejar escalas 0-6 y 0-10 dinámicamente
    const maxNpsScore = npsScores.length > 0 ? Math.max(...npsScores) : 10;
    const isScale0to6 = maxNpsScore <= 6;
    
    let promoters, detractors, neutrals;
    
    if (isScale0to6) {
      // Escala 0-6: 0-2 detractores, 3 neutral, 4-6 promotores
      promoters = npsScores.filter(score => score >= 4).length;
      detractors = npsScores.filter(score => score <= 2).length;
      neutrals = npsScores.filter(score => score === 3).length;
    } else {
      // Escala 0-10: 0-6 detractores, 7-8 neutral, 9-10 promotores
      promoters = npsScores.filter(score => score >= 9).length;
      detractors = npsScores.filter(score => score <= 6).length;
      neutrals = npsScores.filter(score => score >= 7 && score <= 8).length;
    }
    const totalNPS = npsScores.length;
    const retention = totalNPS > 0 ? Math.round(((promoters + neutrals) / totalNPS) * 100) : 0;

    // Determinar impacto y tendencia
    const impact = totalNPS > 0 && promoters > detractors ? 'Alto' : totalNPS > 0 ? 'Medio' : 'Bajo';
    const trend = totalNPS > 0 && promoters > detractors ? 'Positiva' : totalNPS > 0 ? 'Neutral' : 'Negativa';

    return {
      cpvValue,
      satisfaction,
      retention,
      impact,
      trend
    };
  };

  return {
    data,
    isLoading,
    error,
    // Valores por defecto para evitar errores de renderizado
    defaultData: {
      cpvValue: 0,
      satisfaction: 0,
      retention: 0,
      impact: 'Bajo',
      trend: 'Negativa'
    }
  };
};
