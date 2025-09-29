import { moduleResponsesAPI } from '@/api/config';
import { useEffect, useState } from 'react';

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

export const useCPVData = (researchId: string) => {
  const [data, setData] = useState<CPVData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCPVData = async () => {
      if (!researchId) {
        setIsLoading(false);
        return;
      }

      try {

        // Usar el endpoint de SmartVOC que ya tenemos funcionando
        const response = await moduleResponsesAPI.getResponsesByResearch(researchId);

        if (response) {
          // Procesar los datos de SmartVOC para obtener métricas CPV
          const smartVOCResponses = response;

          // Extraer scores de CSAT, CES, NPS, NEV, CV
          const csatScores: number[] = [];
          const cesScores: number[] = [];
          const npsScores: number[] = [];
          const nevScores: number[] = [];
          const cvScores: number[] = [];

          smartVOCResponses.forEach((participant: any) => {
            if (participant.responses && Array.isArray(participant.responses)) {
              participant.responses.forEach((response: any) => {
                if (response.questionKey && response.response) {
                  const responseValue = parseFloat(response.response);
                  if (!isNaN(responseValue) && responseValue > 0) {
                    if (response.questionKey.toLowerCase().includes('csat')) {
                      csatScores.push(responseValue);
                    } else if (response.questionKey.toLowerCase().includes('ces')) {
                      cesScores.push(responseValue);
                    } else if (response.questionKey.toLowerCase().includes('nps')) {
                      npsScores.push(responseValue);
                    } else if (response.questionKey.toLowerCase().includes('nev')) {
                      nevScores.push(responseValue);
                    } else if (response.questionKey.toLowerCase().includes('cv')) {
                      cvScores.push(responseValue);
                    }
                  }
                }
              });
            }
          });

          // Calcular métricas CPV
          const totalResponses = smartVOCResponses.length;
          const cpvValue = csatScores.length > 0 ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10 : 0;
          const satisfaction = csatScores.length > 0 ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10 : 0;

          // Calcular porcentajes
          const csatPercentage = csatScores.length > 0 ? Math.round((csatScores.filter(score => score >= 4).length / csatScores.length) * 100) : 0;
          const cesPercentage = cesScores.length > 0 ? Math.round((cesScores.filter(score => score <= 2).length / cesScores.length) * 100) : 0;

          // Calcular retención basada en NPS
          const promoters = npsScores.filter(score => score >= 9).length;
          const neutrals = npsScores.filter(score => score >= 7 && score <= 8).length;
          const retention = totalResponses > 0 ? Math.round(((promoters + neutrals) / totalResponses) * 100) : 0;

          // Determinar impacto y tendencia
          const impact = totalResponses > 0 && promoters > (npsScores.length - promoters - neutrals) ? 'Alto' : totalResponses > 0 ? 'Medio' : 'Bajo';
          const trend = totalResponses > 0 && promoters > (npsScores.length - promoters - neutrals) ? 'Positiva' : totalResponses > 0 ? 'Neutral' : 'Negativa';

          // Calcular valores pico
          const peakValue = Math.max(cpvValue, satisfaction, retention);

          const cpvData: CPVData = {
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

          setData(cpvData);
        } else {
          setError('No se recibieron datos del servidor');
        }
      } catch (err: any) {
        setError(err.message || 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCPVData();
  }, [researchId]);

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
      csatPercentage: 0,
      cesPercentage: 0,
      cvValue: 0,
      nevValue: 0,
      npsValue: 0,
      peakValue: 0
    }
  };
};
