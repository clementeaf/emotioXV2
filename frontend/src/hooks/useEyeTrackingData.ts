import { eyeTrackingFixedAPI } from '@/lib/eye-tracking-api';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook centralizado para obtener datos de eye-tracking
 * Evita llamadas duplicadas usando React Query con caching
 * Maneja tanto configuración de build como de recruit
 */
export const useEyeTrackingData = (researchId: string, options?: {
  enabled?: boolean;
  type?: 'build' | 'recruit' | 'both';
}) => {
  const type = options?.type || 'both';

  // Query para configuración de build
  const buildQuery = useQuery({
    queryKey: ['eyeTracking', 'build', researchId],
    queryFn: async () => {
      if (!researchId) return null;
      try {
        const response = await eyeTrackingFixedAPI.getByResearchId(researchId).send();
        return response;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.message?.includes('not found')) {
          return null;
        }
        throw error;
      }
    },
    enabled: (type === 'build' || type === 'both') && options?.enabled !== false && !!researchId,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Query para configuración de recruit
  const recruitQuery = useQuery({
    queryKey: ['eyeTracking', 'recruit', researchId],
    queryFn: async () => {
      if (!researchId) return null;
      try {
        const response = await eyeTrackingFixedAPI.getRecruitConfig(researchId).send();
        return response;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.message?.includes('not found')) {
          return null;
        }
        throw error;
      }
    },
    enabled: (type === 'recruit' || type === 'both') && options?.enabled !== false && !!researchId,
    staleTime: 5 * 60 * 1000, // 5 minutos - datos que no cambian frecuentemente
    gcTime: 30 * 60 * 1000, // 30 minutos - mantener en cache más tiempo
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false, // No reintentar en caso de error
  });

  return {
    // Datos combinados
    data: type === 'both' ? {
      build: buildQuery.data,
      recruit: recruitQuery.data
    } : type === 'build' ? buildQuery.data : recruitQuery.data,

    // Estados de carga
    isLoading: buildQuery.isLoading || recruitQuery.isLoading,
    isLoadingBuild: buildQuery.isLoading,
    isLoadingRecruit: recruitQuery.isLoading,

    // Estados de error
    error: buildQuery.error || recruitQuery.error,
    errorBuild: buildQuery.error,
    errorRecruit: recruitQuery.error,

    // Métodos de refetch
    refetch: () => {
      buildQuery.refetch();
      recruitQuery.refetch();
    },
    refetchBuild: buildQuery.refetch,
    refetchRecruit: recruitQuery.refetch,
  };
};
