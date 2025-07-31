import { useQuery } from '@tanstack/react-query';
import { API_HTTP_ENDPOINT } from '../api/endpoints';

interface Research {
  id: string;
  name: string;
  technique: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook centralizado para obtener la lista de research
 * Evita llamadas duplicadas usando React Query con caching
 */
export const useResearchList = () => {
  return useQuery<Research[]>({
    queryKey: ['research', 'all'],
    queryFn: async () => {
      console.log('[useResearchList] 🚀 Iniciando fetch de research/all');

      const response = await fetch(`${API_HTTP_ENDPOINT}/research/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[useResearchList] 📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Error al obtener las investigaciones: ${response.status}`);
      }

      const data = await response.json();
      console.log('[useResearchList] 📊 Raw response data:', data);

      const researchData = data?.data || data;
      console.log('[useResearchList] 🔍 Processed research data:', researchData);

      // Verificar que cada item tenga un ID válido antes de agregarlo
      const filteredData = Array.isArray(researchData)
        ? researchData.filter(item => item && item.id)
        : [];

      console.log('[useResearchList] ✅ Final filtered data:', filteredData);
      return filteredData;
    },
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

/**
 * Hook para obtener un research específico por ID
 */
export const useResearchById = (researchId: string) => {
  return useQuery<Research>({
    queryKey: ['research', researchId],
    queryFn: async () => {
      const response = await fetch(`${API_HTTP_ENDPOINT}/research/${researchId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error al obtener la investigación: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data;
    },
    enabled: !!researchId,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};
