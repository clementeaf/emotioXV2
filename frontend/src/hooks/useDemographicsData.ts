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

    // Contadores para cada categoría
    const countryCounts: Record<string, number> = {};
    const ageCounts: Record<string, number> = {};
    const genderCounts: Record<string, number> = {};
    const educationCounts: Record<string, number> = {};
    const userIdCounts: Record<string, number> = {};
    const participantCounts: Record<string, number> = {};

    // Procesar cada participante
    responses.forEach(participant => {
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
    });

    // Convertir contadores a arrays con formato
    const countries = Object.entries(countryCounts).map(([label, count], index) => ({
      id: `country-${index + 1}`,
      label,
      count
    }));

    const ageRanges = Object.entries(ageCounts).map(([label, count], index) => ({
      id: `age-${index + 1}`,
      label,
      count
    }));

    const genders = Object.entries(genderCounts).map(([label, count], index) => ({
      id: `gender-${index + 1}`,
      label,
      count
    }));

    const educationLevels = Object.entries(educationCounts).map(([label, count], index) => ({
      id: `edu-${index + 1}`,
      label,
      count
    }));

    const userIds = Object.entries(userIdCounts).map(([label, count], index) => ({
      id: `user-${index + 1}`,
      label,
      count
    }));

    const participants = Object.entries(participantCounts).map(([label, count], index) => ({
      id: `part-${index + 1}`,
      label: `${new Date().toLocaleDateString('es-ES')}, ${label}`,
      count
    }));

    console.log('[useDemographicsData] 📊 Datos demográficos procesados:', {
      countries,
      ageRanges,
      genders,
      educationLevels,
      userIds,
      participants
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
