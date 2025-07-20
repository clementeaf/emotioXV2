import { moduleResponsesAPI } from '@/config/api';
import { useEffect, useState } from 'react';

interface DemographicData {
  countries: Array<{ id: string; label: string; count: number }>;
  ageRanges: Array<{ id: string; label: string; count: number }>;
  genders: Array<{ id: string; label: string; count: number }>;
  educationLevels: Array<{ id: string; label: string; count: number }>;
  userIds: Array<{ id: string; label: string; count: number }>;
  participants: Array<{ id: string; label: string; count: number }>;
}

export const useDemographicsData = (researchId: string) => {
  const [data, setData] = useState<DemographicData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDemographicsData = async () => {
      if (!researchId) {
        setError('Research ID es requerido');
        setIsLoading(false);
        return;
      }

      try {
        console.log(`[useDemographicsData] 🔍 Obteniendo datos demográficos para research: ${researchId}`);

        const response = await moduleResponsesAPI.getResponsesByResearch(researchId);

        if (response.data) {
          console.log(`[useDemographicsData] ✅ Datos recibidos:`, response.data);

          // Debug: Buscar respuestas demográficas específicamente
          response.data.forEach((participant: any, index: number) => {
            console.log(`[useDemographicsData] 🔍 Procesando participante ${index + 1}:`, participant.participantId);

            if (participant.responses) {
              participant.responses.forEach((response: any) => {
                if (response.questionKey === 'demographics') {
                  console.log(`[useDemographicsData] 📊 Encontrada respuesta demográfica:`, response.response);
                }
              });
            }
          });

          const demographicsData = processDemographicsData(response.data);
          setData(demographicsData);
        } else {
          console.warn(`[useDemographicsData] ⚠️ Respuesta sin datos:`, response);
          setError('No se recibieron datos del servidor');
        }
      } catch (err: any) {
        console.error('[useDemographicsData] ❌ Error:', err);
        setError('Error al obtener datos demográficos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDemographicsData();
  }, [researchId]);

  const processDemographicsData = (responses: any[]): DemographicData => {
    if (!responses || responses.length === 0) {
      return {
        countries: [],
        ageRanges: [],
        genders: [],
        educationLevels: [],
        userIds: [],
        participants: []
      };
    }

    console.log(`[useDemographicsData] 🔍 Procesando ${responses.length} participantes`);

    // Contadores para cada categoría
    const countryCounts: Record<string, number> = {};
    const ageCounts: Record<string, number> = {};
    const genderCounts: Record<string, number> = {};
    const educationCounts: Record<string, number> = {};
    const userIdCounts: Record<string, number> = {};
    const participantCounts: Record<string, number> = {};

    // Procesar cada participante
    responses.forEach((participant, index) => {
      // Contar participantes únicos
      const participantKey = `${participant.participantId || 'unknown'}`;
      participantCounts[participantKey] = (participantCounts[participantKey] || 0) + 1;

      // Contar userIds únicos
      if (participant.participantId) {
        userIdCounts[participant.participantId] = (userIdCounts[participant.participantId] || 0) + 1;
      }

      // Extraer datos demográficos de las respuestas
      if (participant.responses && Array.isArray(participant.responses)) {
        participant.responses.forEach((response: any) => {
          const questionKey = response.questionKey?.toLowerCase() || '';

          // Procesar datos demográficos
          if (questionKey === 'demographics') {
            const demographicData = response.response;

            if (demographicData) {
              // Procesar país
              if (demographicData.country) {
                const country = String(demographicData.country);
                countryCounts[country] = (countryCounts[country] || 0) + 1;
              }

              // Procesar edad
              if (demographicData.age) {
                const age = String(demographicData.age);
                ageCounts[age] = (ageCounts[age] || 0) + 1;
              }

              // Procesar género
              if (demographicData.gender) {
                const gender = String(demographicData.gender);
                genderCounts[gender] = (genderCounts[gender] || 0) + 1;
              }

              // Procesar educación (si existe)
              if (demographicData.education) {
                const education = String(demographicData.education);
                educationCounts[education] = (educationCounts[education] || 0) + 1;
              }
            }
          }
        });
      }

      // Log de progreso cada 5 participantes
      if ((index + 1) % 5 === 0) {
        console.log(`[useDemographicsData] 📊 Procesados ${index + 1}/${responses.length} participantes`);
      }
    });

    // Convertir contadores a arrays con formato y ordenar por count
    const countries = Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a) // Ordenar por count descendente
      .map(([label, count], index) => ({
        id: `country-${index + 1}`,
        label,
        count
      }));

    const ageRanges = Object.entries(ageCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([label, count], index) => ({
        id: `age-${index + 1}`,
        label,
        count
      }));

    const genders = Object.entries(genderCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([label, count], index) => ({
        id: `gender-${index + 1}`,
        label,
        count
      }));

    const educationLevels = Object.entries(educationCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([label, count], index) => ({
        id: `edu-${index + 1}`,
        label,
        count
      }));

    // Limitar User IDs a los primeros 20 para evitar UI sobrecargada
    const userIds = Object.entries(userIdCounts)
      .slice(0, 20) // Máximo 20 User IDs
      .map(([label, count], index) => ({
        id: `user-${index + 1}`,
        label: label.length > 20 ? `${label.substring(0, 20)}...` : label,
        count
      }));

    const participants = Object.entries(participantCounts)
      .slice(0, 20) // Máximo 20 participantes
      .map(([label, count], index) => ({
        id: `part-${index + 1}`,
        label: `${new Date().toLocaleDateString('es-ES')}, ${label.length > 15 ? `${label.substring(0, 15)}...` : label}`,
        count
      }));

    console.log('[useDemographicsData] 📊 Datos demográficos procesados:', {
      totalParticipants: responses.length,
      countries: countries.length,
      ageRanges: ageRanges.length,
      genders: genders.length,
      educationLevels: educationLevels.length,
      userIds: userIds.length,
      participants: participants.length
    });

    return {
      countries,
      ageRanges,
      genders,
      educationLevels,
      userIds,
      participants
    };
  };

  return { data, isLoading, error };
};
