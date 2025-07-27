import { moduleResponsesAPI } from '@/config/api';
import { useEffect, useState } from 'react';

interface CPVData {
  cpvValue: number;
  satisfaction: number;
  retention: number;
  impact: string;
  trend: string;
  csatPercentage: number; // % de registros 4 y 5
  cesPercentage: number;  // % OF POSITIVE RESULTS - % OF NEGATIVE RESULTS
  cvValue: number;        // Cognitive Value: % OF POSITIVE RESULTS - % OF NEGATIVE RESULTS
  nevValue: number;       // Net Emotional Value: % Emociones positivas - % Emociones negativas
  peakValue?: number;     // Valor pico para el gráfico
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
        trend: 'Negativa',
        csatPercentage: 0,
        cesPercentage: 0,
        cvValue: 0,
        nevValue: 0,
        peakValue: 0
      };
    }

    const csatScores: number[] = [];
    const cesScores: number[] = [];
    const cvScores: number[] = [];
    const nevScores: number[] = [];
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
            } else if (response.questionKey.toLowerCase().includes('ces')) {
              if (responseValue > 0) {
                cesScores.push(responseValue);
              }
            } else if (response.questionKey.toLowerCase().includes('cv')) {
              if (responseValue > 0) {
                cvScores.push(responseValue);
              }
            } else if (response.questionKey.toLowerCase().includes('nev')) {
              if (responseValue > 0) {
                nevScores.push(responseValue);
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

    // Calcular CSAT: % de registros 4 y 5 (escala 1-5)
    const csatHighScores = csatScores.filter(score => score >= 4 && score <= 5).length;
    const csatPercentage = csatScores.length > 0 ? Math.round((csatHighScores / csatScores.length) * 100) : 0;

    // Calcular CES: % OF POSITIVE RESULTS - % OF NEGATIVE RESULTS
    const cesPositiveScores = cesScores.filter(score => score >= 4 && score <= 5).length;
    const cesNegativeScores = cesScores.filter(score => score >= 1 && score <= 2).length;
    const cesPositivePercentage = cesScores.length > 0 ? Math.round((cesPositiveScores / cesScores.length) * 100) : 0;
    const cesNegativePercentage = cesScores.length > 0 ? Math.round((cesNegativeScores / cesScores.length) * 100) : 0;
    const cesPercentage = cesPositivePercentage - cesNegativePercentage; // Ecuación CES

    // Calcular CV (Cognitive Value): % OF POSITIVE RESULTS - % OF NEGATIVE RESULTS
    const cvPositiveScores = cvScores.filter(score => score >= 4 && score <= 5).length;
    const cvNegativeScores = cvScores.filter(score => score >= 1 && score <= 2).length;
    const cvPositivePercentage = cvScores.length > 0 ? Math.round((cvPositiveScores / cvScores.length) * 100) : 0;
    const cvNegativePercentage = cvScores.length > 0 ? Math.round((cvNegativeScores / cvScores.length) * 100) : 0;
    const cvValue = cvPositivePercentage - cvNegativePercentage; // Ecuación CV

    // Calcular NEV (Net Emotional Value): % Emociones positivas - % Emociones negativas
    const nevPositiveScores = nevScores.filter(score => score >= 4 && score <= 5).length;
    const nevNegativeScores = nevScores.filter(score => score >= 1 && score <= 2).length;
    const nevPositivePercentage = nevScores.length > 0 ? Math.round((nevPositiveScores / nevScores.length) * 100) : 0;
    const nevNegativePercentage = nevScores.length > 0 ? Math.round((nevNegativeScores / nevScores.length) * 100) : 0;
    const nevValue = nevPositivePercentage - nevNegativePercentage; // Ecuación NEV

    // Calcular CPV usando la ecuación: CPV = CSAT / CES
    let cpvValue = 0;
    if (cesPercentage > 0) {
      cpvValue = csatPercentage / cesPercentage;
    }

    // Calcular satisfacción promedio (para compatibilidad)
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

    // Calcular valor pico para el gráfico (usar el valor más alto entre CPV y CSAT)
    const peakValue = Math.max(cpvValue * 10, csatPercentage); // Multiplicar CPV por 10 para escalar

    return {
      cpvValue,
      satisfaction,
      retention,
      impact,
      trend,
      csatPercentage,
      cesPercentage,
      cvValue,
      nevValue,
      peakValue
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
      trend: 'Negativa',
      csatPercentage: 0, // % de registros 4 y 5 - se calculará con datos reales
      cesPercentage: 0,  // % OF POSITIVE RESULTS - % OF NEGATIVE RESULTS - se calculará con datos reales
      cvValue: 0,        // Cognitive Value - se calculará con datos reales
      nevValue: 0,       // Net Emotional Value - se calculará con datos reales
      peakValue: 0 // Valor pico - se calculará con datos reales
    }
  };
};
