import { moduleResponsesAPI } from '@/config/api';
import { useEffect, useState } from 'react';

interface TrustFlowData {
  stage: string;
  nps: number;
  nev: number;
  timestamp: string;
}

export const useTrustFlowData = (researchId: string) => {
  const [data, setData] = useState<TrustFlowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrustFlowData = async () => {
      if (!researchId) {
        setIsLoading(false);
        return;
      }

      try {
        console.log(`[useTrustFlowData] 🔍 Obteniendo datos Trust Flow para research: ${researchId}`);

        // Usar el endpoint de SmartVOC que ya tenemos funcionando
        const response = await moduleResponsesAPI.getResponsesByResearch(researchId);

        if (response.data) {
          // Procesar los datos de SmartVOC para obtener datos de Trust Flow
          const smartVOCResponses = response.data;

          // Agrupar respuestas por fecha
          const responsesByDate: { [key: string]: any[] } = {};

          smartVOCResponses.forEach((participant: any) => {
            if (participant.responses && Array.isArray(participant.responses)) {
              participant.responses.forEach((response: any) => {
                if (response.timestamp) {
                  const dateKey = new Date(response.timestamp).toISOString().split('T')[0];
                  if (!responsesByDate[dateKey]) {
                    responsesByDate[dateKey] = [];
                  }
                  responsesByDate[dateKey].push(response);
                }
              });
            }
          });

          // Generar datos de Trust Flow por fecha
          const trustFlowData: TrustFlowData[] = Object.keys(responsesByDate).map(date => {
            const dateResponses = responsesByDate[date];

            // Extraer scores de NPS y NEV para esta fecha
            const npsScores = dateResponses
              .filter(r => r.questionKey && r.questionKey.toLowerCase().includes('nps'))
              .map(r => parseFloat(r.response))
              .filter(score => !isNaN(score) && score > 0);

            const nevScores = dateResponses
              .filter(r => r.questionKey && r.questionKey.toLowerCase().includes('nev'))
              .map(r => {
                // Procesar NEV como array de emociones
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

            // Calcular promedios
            const avgNps = npsScores.length > 0 ? npsScores.reduce((a, b) => a + b, 0) / npsScores.length : 0;
            const avgNev = nevScores.length > 0 ? nevScores.reduce((a, b) => a + b, 0) / nevScores.length : 0;

            return {
              stage: new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
              nps: Math.round(avgNps * 10) / 10,
              nev: Math.round(avgNev * 10) / 10,
              timestamp: date
            };
          }).sort((a, b) => new Date(a.stage).getTime() - new Date(b.stage).getTime());

          console.log(`[useTrustFlowData] ✅ Datos Trust Flow procesados:`, trustFlowData);
          setData(trustFlowData);
        } else {
          console.warn(`[useTrustFlowData] ⚠️ No se recibieron datos`);
          setError('No se recibieron datos del servidor');
        }
      } catch (err: any) {
        console.error(`[useTrustFlowData] ❌ Error obteniendo datos Trust Flow:`, err);
        setError(err.message || 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrustFlowData();
  }, [researchId]);

  return {
    data,
    isLoading,
    error,
    // Valores por defecto para evitar errores de renderizado
    defaultData: []
  };
};
