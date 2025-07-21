import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getApiUrl } from '../config/endpoints';

export interface QuotaVerificationResponse {
  isExceeded: boolean;
  currentCount: number;
  limit: number;
  researchId: string;
}

export interface QuotaVerificationParams {
  researchId: string;
  participantId: string;
}

/**
 * Hook para verificar si el usuario excede la cuota de participantes
 * NOTA: La verificación de cuota se ejecuta automáticamente en el backend
 * cuando se guarda thank_you_screen. Este hook es para consultar el estado.
 */
export const useQuotaVerification = (
  params: QuotaVerificationParams,
  options?: UseQueryOptions<QuotaVerificationResponse, Error>
) => {
  return useQuery<QuotaVerificationResponse, Error>({
    queryKey: ['quotaVerification', params.researchId, params.participantId],
    queryFn: async () => {
      try {
        console.log('[useQuotaVerification] Verificando estado de cuota:', params);

        // 🎯 CONSULTAR EL ESTADO DE CUOTA DESDE EL BACKEND
        // El backend ya verificó la cuota automáticamente al guardar thank_you_screen
        const response = await fetch(
          `${getApiUrl('research')}/${params.researchId}/participants/${params.participantId}/quota-status`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          // Si el endpoint no existe, asumir que no excede la cuota
          console.log('[useQuotaVerification] Endpoint no disponible, asumiendo cuota no excedida');
          return {
            isExceeded: false,
            currentCount: 0,
            limit: 999,
            researchId: params.researchId
          };
        }

        const data = await response.json();
        console.log('[useQuotaVerification] Respuesta de cuota:', data);

        return data;
      } catch (error) {
        console.error('[useQuotaVerification] Error:', error);
        // En caso de error, asumir que no excede la cuota
        return {
          isExceeded: false,
          currentCount: 0,
          limit: 999,
          researchId: params.researchId
        };
      }
    },
    enabled: !!params.researchId && !!params.participantId,
    staleTime: 1000 * 60 * 1, // 1 minuto
    gcTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000,
    ...options,
  });
};
