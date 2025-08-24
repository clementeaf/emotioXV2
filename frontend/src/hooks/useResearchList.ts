import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../config/api';

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
 * Usa apiClient centralizado con autenticación automática
 */
export const useResearchList = () => {
  return useQuery<Research[]>({
    queryKey: ['research', 'list'],
    queryFn: async () => {
      const response = await apiClient.get('research', 'getAll');
      
      // Normalizar respuesta del backend
      const researchData = response?.data || response;
      
      // Filtrar datos válidos
      const filteredData = Array.isArray(researchData)
        ? researchData.filter(item => item && item.id)
        : [];

      return filteredData;
    },
    enabled: typeof window !== 'undefined',
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

/**
 * Hook para obtener un research específico por ID
 * Usa apiClient centralizado con autenticación automática
 */
export const useResearchById = (researchId: string) => {
  return useQuery<Research>({
    queryKey: ['research', 'detail', researchId],
    queryFn: async () => {
      if (!researchId || researchId === 'new') {
        return null;
      }

      const response = await apiClient.get('research', 'getById', { id: researchId });
      return response?.data || response;
    },
    enabled: !!researchId && researchId !== 'new' && typeof window !== 'undefined',
    staleTime: 60 * 1000, // 60 segundos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: (failureCount, error) => {
      // No reintentar si es 404
      if ((error as any)?.statusCode === 404) {
        return false;
      }
      return failureCount < 1;
    }
  });
};
