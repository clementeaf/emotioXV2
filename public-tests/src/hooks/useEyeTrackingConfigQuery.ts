import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getApiUrl } from '../config/endpoints.js';

interface EyeTrackingConfig {
  id: string;
  researchId: string;
  linkConfig?: {
    allowMobile?: boolean;
    allowMobileDevices?: boolean;
  };
  allowMobile?: boolean;
  allowMobileDevices?: boolean;
  participantLimit?: {
    value: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook para obtener la configuración de eye-tracking de una investigación
 * Incluye configuración de dispositivos móviles
 */
export const useEyeTrackingConfigQuery = (
  researchId: string,
  options?: UseQueryOptions<EyeTrackingConfig, Error>
) => {
  return useQuery<EyeTrackingConfig, Error>({
    queryKey: ['eyeTrackingConfig', researchId],
    queryFn: async () => {
      try {
        const response = await fetch(`${getApiUrl('eye-tracking')}/${researchId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[useEyeTrackingConfigQuery] Configuración obtenida:', data);

        return data;
      } catch (error) {
        console.error('[useEyeTrackingConfigQuery] Error:', error);
        throw error;
      }
    },
    enabled: !!researchId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000,
    ...options,
  });
};
