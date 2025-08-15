import { useQuery } from '@tanstack/react-query';
import { API_HTTP_ENDPOINT } from '../api/endpoints';
import { apiDeduplicator } from '../lib/api-dedupe';

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
      if (typeof window === 'undefined') {
        throw new Error('Cannot access localStorage on server');
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_HTTP_ENDPOINT}/research/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error al obtener las investigaciones: ${response.status}`);
      }

      const data = await response.json();

      const researchData = data?.data || data;

      // Verificar que cada item tenga un ID válido antes de agregarlo
      const filteredData = Array.isArray(researchData)
        ? researchData.filter(item => item && item.id)
        : [];

      return filteredData;
    },
    enabled: typeof window !== 'undefined', // Solo ejecutar en el cliente
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
      // Verificar que estamos en el cliente
      if (typeof window === 'undefined') {
        throw new Error('Cannot access localStorage on server');
      }

      // Verificar token antes de hacer la llamada
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[useResearchById] No hay token disponible, saltando request');
        throw new Error('No authentication token available');
      }

      // Usar deduplicador para prevenir llamadas simultáneas
      return apiDeduplicator.dedupe(`research-${researchId}`, async () => {
        const response = await fetch(`${API_HTTP_ENDPOINT}/research/${researchId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          // Si es 404, es normal para research nuevo
          if (response.status === 404) {
            console.info(`[useResearchById] 📭 Research ${researchId} no encontrado (normal para research nuevo)`);
            return null;
          }
          console.error(`[useResearchById] ❌ Error ${response.status} para research ${researchId}`);
          throw new Error(`Error al obtener la investigación: ${response.status}`);
        }

        const data = await response.json();
        return data.data || data;
      });
    },
    enabled: !!researchId && typeof window !== 'undefined' && !!localStorage.getItem('token'), // Solo hacer la query si hay token y estamos en cliente
    staleTime: 60 * 1000, // Aumentar a 60 segundos para reducir refetches
    gcTime: 10 * 60 * 1000, // Aumentar a 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: (failureCount, error) => {
      // No reintentar si es 404 o no hay token
      if (error?.message?.includes('404') || error?.message?.includes('No authentication token')) {
        return false;
      }
      // Solo reintentar 1 vez para otros errores
      return failureCount < 1;
    }
  });
};
