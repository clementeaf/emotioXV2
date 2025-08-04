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

interface GroupedResponse {
  participantId: string;
  value: any;
  responseTime?: string;
  timestamp: string;
  metadata?: any;
}

interface GroupedResponsesData {
  [questionKey: string]: GroupedResponse[];
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
        const response = await moduleResponsesAPI.getResponsesByResearch(researchId);

        if (response.data) {
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

  const processDemographicsData = (groupedResponses: GroupedResponsesData): DemographicData => {
    if (!groupedResponses || Object.keys(groupedResponses).length === 0) {
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

    // Procesar datos demográficos de la nueva estructura
    const demographicsResponses = groupedResponses['demographics'] || [];
    
    demographicsResponses.forEach((response) => {
      const participantId = response.participantId;
      const demographicValue = response.value;

      // Contar participantes únicos
      const participantKey = `${participantId || 'unknown'}`;
      participantCounts[participantKey] = (participantCounts[participantKey] || 0) + 1;

      // Contar userIds únicos
      if (participantId) {
        userIdCounts[participantId] = (userIdCounts[participantId] || 0) + 1;
      }

      // Procesar datos demográficos
      if (demographicValue) {
        // Procesar país
        if (demographicValue.country) {
          const country = String(demographicValue.country);
          countryCounts[country] = (countryCounts[country] || 0) + 1;
        }

        // Procesar edad
        if (demographicValue.age) {
          const age = String(demographicValue.age);
          ageCounts[age] = (ageCounts[age] || 0) + 1;
        }

        // Procesar género
        if (demographicValue.gender) {
          const gender = String(demographicValue.gender);
          genderCounts[gender] = (genderCounts[gender] || 0) + 1;
        }

        // Procesar educación (si existe)
        if (demographicValue.education) {
          const education = String(demographicValue.education);
          educationCounts[education] = (educationCounts[education] || 0) + 1;
        }
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
