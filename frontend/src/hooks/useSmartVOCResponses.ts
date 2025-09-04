import { moduleResponsesAPI } from '@/config/api';
import { useEffect, useState } from 'react';

interface SmartVOCResults {
  totalResponses: number;
  uniqueParticipants: number;
  npsScore: number;
  averageScore: number;
  promoters: number;
  detractors: number;
  neutrals: number;
  cpvValue: number;
  satisfaction: number;
  retention: number;
  impact: string;
  trend: string;
  timeSeriesData: Array<{
    date: string;
    score: number;
    nps: number;
    nev: number;
    count: number;
  }>;
  monthlyNPSData: Array<{
    month: string;
    promoters: number;
    neutrals: number;
    detractors: number;
    npsRatio: number;
  }>;
  smartVOCResponses: Array<any>;
  vocResponses: Array<{
    text: string;
    participantId: string;
    participantName: string;
    timestamp: string;
  }>;
  npsScores: number[];
  csatScores: number[];
  cesScores: number[];
  nevScores: number[];
  cvScores: number[];
  cvScore: number;
  cvPositive: number;
  cvNegative: number;
  cvNeutral: number;
}

export const useSmartVOCResponses = (researchId: string) => {
  const [data, setData] = useState<SmartVOCResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSmartVOCResults = async () => {
      if (!researchId) {
        setError('Research ID es requerido');
        setIsLoading(false);
        return;
      }

      try {

        // Usar el nuevo endpoint agrupado por pregunta (más eficiente)
        const response = await moduleResponsesAPI.getResponsesGroupedByQuestion(researchId);

        if (response) {

          // Procesar datos SmartVOC desde las respuestas
          const smartVOCData = processSmartVOCData(response);

          setData(smartVOCData);
        } else {
          setError('No se recibieron datos del servidor');
        }
      } catch (err: any) {

        // Mejorar mensajes de error
        let errorMessage = 'Error al obtener resultados SmartVOC';

        if (err.statusCode === 404) {
          errorMessage = 'Endpoint no encontrado - Backend no desplegado';
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

    fetchSmartVOCResults();
  }, [researchId]);

  // Función para procesar datos SmartVOC desde la nueva estructura agrupada por pregunta
  const processSmartVOCData = (groupedResponses: any[]): SmartVOCResults => {
    if (!groupedResponses || groupedResponses.length === 0) {
      return {
        totalResponses: 0,
        uniqueParticipants: 0,
        npsScore: 0,
        averageScore: 0,
        promoters: 0,
        detractors: 0,
        neutrals: 0,
        cpvValue: 0,
        satisfaction: 0,
        retention: 0,
        impact: 'Bajo',
        trend: 'Negativa',
        timeSeriesData: [],
        monthlyNPSData: [],
        smartVOCResponses: [],
        vocResponses: [],
        npsScores: [],
        csatScores: [],
        cesScores: [],
        nevScores: [],
        cvScores: [],
        cvScore: 0,
        cvPositive: 0,
        cvNegative: 0,
        cvNeutral: 0
      };
    }

    // Extraer todas las respuestas SmartVOC
    const allSmartVOCResponses: any[] = [];
    const npsScores: number[] = [];
    const csatScores: number[] = [];
    const cesScores: number[] = [];
    const nevScores: number[] = [];
    const cvScores: number[] = [];
    const vocResponses: any[] = [];

    // Función para parsear valores
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

    const parseResponseText = (response: any): string => {
      if (typeof response === 'string') return response;
      if (typeof response === 'object' && response.value !== undefined) {
        return String(response.value);
      }
      if (typeof response === 'object') {
        return JSON.stringify(response);
      }
      return String(response);
    };

    // Procesar cada pregunta agrupada
    groupedResponses.forEach(questionGroup => {
      if (questionGroup.questionKey && questionGroup.questionKey.toLowerCase().includes('smartvoc')) {
        // Procesar cada respuesta de esta pregunta
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

          // Categorizar por tipo de pregunta
          if (questionGroup.questionKey.toLowerCase().includes('nps')) {
            if (responseValue > 0) {
              npsScores.push(responseValue);
            }
          } else if (questionGroup.questionKey.toLowerCase().includes('csat')) {
            if (responseValue > 0) {
              csatScores.push(responseValue);
            }
          } else if (questionGroup.questionKey.toLowerCase().includes('ces')) {
            if (responseValue > 0) {
              cesScores.push(responseValue);
            }
          } else if (questionGroup.questionKey.toLowerCase().includes('nev')) {
            // 🎯 NEV ahora devuelve array de emociones, no valor numérico
            if (response.value && Array.isArray(response.value)) {
              // Contar emociones positivas vs negativas
              const emotions = response.value;
              const positiveEmotions = ['Feliz', 'Satisfecho', 'Confiado', 'Valorado', 'Cuidado', 'Seguro', 'Enfocado', 'Indulgente', 'Estimulado', 'Exploratorio', 'Interesado', 'Enérgico'];
              const negativeEmotions = ['Descontento', 'Frustrado', 'Irritado', 'Decepción', 'Estresado', 'Infeliz', 'Desatendido', 'Apresurado'];

              const positiveCount = emotions.filter((emotion: string) => positiveEmotions.includes(emotion)).length;
              const negativeCount = emotions.filter((emotion: string) => negativeEmotions.includes(emotion)).length;

              // Calcular score NEV: (positivas - negativas) / total * 100
              const totalEmotions = emotions.length;
              if (totalEmotions > 0) {
                const nevScore = Math.round(((positiveCount - negativeCount) / totalEmotions) * 100);
                nevScores.push(nevScore);
              }
            }
          } else if (questionGroup.questionKey.toLowerCase().includes('cv')) {
            if (responseValue > 0) {
              cvScores.push(responseValue);
            }
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

    // Calcular métricas
    const totalResponses = allSmartVOCResponses.length;
    const uniqueParticipants = new Set(allSmartVOCResponses.map(r => r.participantId)).size;

    // Calcular NPS - Manejar escalas 0-6 y 0-10 dinámicamente
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
    const npsScore = npsScores.length > 0 ? Math.round(((promoters - detractors) / npsScores.length) * 100) : 0;

    // Calcular CV - Manejar escalas 1-5, 1-7 y 1-10 dinámicamente
    const maxCvScore = cvScores.length > 0 ? Math.max(...cvScores) : 5;
    let cvPositive, cvNegative, cvNeutral;

    if (maxCvScore <= 5) {
      // Escala 1-5: 1-2 negativo, 3 neutral, 4-5 positivo
      cvPositive = cvScores.filter(score => score >= 4).length;
      cvNegative = cvScores.filter(score => score <= 2).length;
      cvNeutral = cvScores.filter(score => score === 3).length;
    } else if (maxCvScore <= 7) {
      // Escala 1-7: 1-3 negativo, 4 neutral, 5-7 positivo
      cvPositive = cvScores.filter(score => score >= 5).length;
      cvNegative = cvScores.filter(score => score <= 3).length;
      cvNeutral = cvScores.filter(score => score === 4).length;
    } else {
      // Escala 1-10: 1-4 negativo, 5-6 neutral, 7-10 positivo
      cvPositive = cvScores.filter(score => score >= 7).length;
      cvNegative = cvScores.filter(score => score <= 4).length;
      cvNeutral = cvScores.filter(score => score >= 5 && score <= 6).length;
    }
    const cvScore = cvScores.length > 0 ? Math.round(((cvPositive - cvNegative) / cvScores.length) * 100) : 0;

    // Calcular promedio de scores
    const allScores = [...csatScores, ...cesScores, ...nevScores, ...cvScores].filter(score => score > 0);
    const averageScore = allScores.length > 0 ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10 : 0;

    // Generar time series data
    const responsesByDate: { [key: string]: any[] } = {};
    allSmartVOCResponses.forEach(response => {
      const dateKey = new Date(response.timestamp || new Date()).toISOString().split('T')[0];
      if (!responsesByDate[dateKey]) {
        responsesByDate[dateKey] = [];
      }
      responsesByDate[dateKey].push(response);
    });

    const timeSeriesData = Object.keys(responsesByDate).map(date => {
      const dateResponses = responsesByDate[date];
      const dateNpsScores = dateResponses
        .filter(r => r.questionKey.toLowerCase().includes('nps'))
        .map(r => parseResponseValue(r.response))
        .filter(score => score > 0);

      const dateNevScores = dateResponses
        .filter(r => r.questionKey.toLowerCase().includes('nev'))
        .map(r => {
          // 🎯 Procesar NEV como array de emociones
          if (r.response && r.response.value && Array.isArray(r.response.value)) {
            const emotions = r.response.value;
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

      const avgNps = dateNpsScores.length > 0 ? dateNpsScores.reduce((a, b) => a + b, 0) / dateNpsScores.length : 0;
      const avgNev = dateNevScores.length > 0 ? dateNevScores.reduce((a, b) => a + b, 0) / dateNevScores.length : 0;

      return {
        date,
        score: averageScore,
        nps: avgNps,
        nev: avgNev,
        count: dateResponses.length
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Generar datos para CPVCard
    const cpvValue = csatScores.length > 0 ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10 : 0;

    // Generar datos para NPSQuestion
    const monthlyNPSData = timeSeriesData.map(item => ({
      month: new Date(item.date).toLocaleDateString('es-ES', { month: 'short' }),
      promoters: totalResponses > 0 ? Math.round((promoters / totalResponses) * item.count) : 0,
      neutrals: totalResponses > 0 ? Math.round((neutrals / totalResponses) * item.count) : 0,
      detractors: totalResponses > 0 ? Math.round((detractors / totalResponses) * item.count) : 0,
      npsRatio: npsScore
    }));

    return {
      totalResponses,
      uniqueParticipants,
      npsScore,
      averageScore,
      promoters,
      detractors,
      neutrals,
      cpvValue,
      satisfaction: csatScores.length > 0 ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10 : 0,
      retention: totalResponses > 0 ? Math.round(((promoters + neutrals) / totalResponses) * 100) : 0,
      impact: totalResponses > 0 && promoters > detractors ? 'Alto' : totalResponses > 0 ? 'Medio' : 'Bajo',
      trend: totalResponses > 0 && promoters > detractors ? 'Positiva' : totalResponses > 0 ? 'Neutral' : 'Negativa',
      timeSeriesData,
      monthlyNPSData,
      smartVOCResponses: allSmartVOCResponses,
      vocResponses,
      npsScores,
      csatScores,
      cesScores,
      nevScores,
      cvScores,
      cvScore,
      cvPositive,
      cvNegative,
      cvNeutral
    };
  };

  return {
    data,
    isLoading,
    error
  };
};
