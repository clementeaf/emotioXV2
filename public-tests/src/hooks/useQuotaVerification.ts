import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getApiUrl } from '../config/endpoints';

export interface QuotaVerificationResponse {
  isExceeded: boolean;
  currentCount: number;
  limit: number;
  researchId: string;
  // 🎯 NUEVO: Información específica de cuotas dinámicas
  demographicType?: string;
  demographicValue?: string;
  reason?: string;
}

export interface QuotaVerificationParams {
  researchId: string;
  participantId: string;
  // 🎯 NUEVO: Demográficos para validación dinámica
  demographics?: {
    age?: string;
    country?: string;
    gender?: string;
    educationLevel?: string;
    householdIncome?: string;
    employmentStatus?: string;
    dailyHoursOnline?: string;
    technicalProficiency?: string;
  };
}

/**
 * Hook para verificar si el usuario excede la cuota de participantes
 * 🎯 NUEVO: Soporta tanto el sistema actual como el nuevo sistema de cuotas dinámicas
 */
export const useQuotaVerification = (
  params: QuotaVerificationParams,
  options?: UseQueryOptions<QuotaVerificationResponse, Error>
) => {
  return useQuery<QuotaVerificationResponse, Error>({
    queryKey: ['quotaVerification', params.researchId, params.participantId, params.demographics],
    queryFn: async () => {
      try {
        console.log('[useQuotaVerification] Verificando estado de cuota:', params);

        // 🎯 NUEVO: Si hay demográficos, usar el nuevo sistema de cuotas dinámicas
        if (params.demographics) {
          console.log('[useQuotaVerification] 🎯 Usando sistema de cuotas dinámicas');

          const response = await fetch(
            `${getApiUrl('quota-validation')}/validate`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                researchId: params.researchId,
                demographics: params.demographics
              })
            }
          );

          if (!response.ok) {
            console.log('[useQuotaVerification] Endpoint de cuotas dinámicas no disponible, usando sistema actual');
            // Fallback al sistema actual
            return await checkLegacyQuota(params);
          }

          const data = await response.json();
          console.log('[useQuotaVerification] Respuesta de cuotas dinámicas:', data);

          // 🎯 CONVERTIR RESPUESTA DEL NUEVO SISTEMA AL FORMATO COMPATIBLE
          return {
            isExceeded: !data.isValid,
            currentCount: data.quotaInfo?.currentCount || 0,
            limit: data.quotaInfo?.maxQuota || 999,
            researchId: params.researchId,
            demographicType: data.quotaInfo?.demographicType,
            demographicValue: data.quotaInfo?.demographicValue,
            reason: data.reason
          };
        }

        // 🎯 SISTEMA ACTUAL: Consultar el estado de cuota desde el backend
        return await checkLegacyQuota(params);

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

/**
 * 🎯 FUNCIÓN AUXILIAR: Verificar cuota usando el sistema actual
 */
async function checkLegacyQuota(params: QuotaVerificationParams): Promise<QuotaVerificationResponse> {
  console.log('[useQuotaVerification] 🔄 Usando sistema actual de cuotas');

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
  console.log('[useQuotaVerification] Respuesta de cuota actual:', data);

  return data;
}
