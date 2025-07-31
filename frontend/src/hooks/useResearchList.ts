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
      const response = await fetch(`${API_HTTP_ENDPOINT}/research/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error al obtener las investigaciones: ${response.status}`);
      }

      const data = await response.json();
      const researchData = data?.data || data;

      // Verificar que cada item tenga un ID válido antes de agregarlo
      return Array.isArray(researchData)
        ? researchData.filter(item => item && item.id)
        : [];
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
