import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { getApiUrl } from '../config/endpoints';

export interface DemographicQuotaValidationParams {
  researchId: string;
  demographics: {
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

export interface DemographicQuotaValidationResult {
  isValid: boolean;
  reason?: string;
  quotaInfo?: {
    demographicType: string;
    demographicValue: string;
    currentCount: number;
    maxQuota: number;
  };
}

/**
 * Hook para validar cuotas de demográficos en tiempo real
 * 🎯 NUEVO: Se ejecuta cuando el participante responde preguntas demográficas
 */
export const useDemographicQuotaValidation = (
  options?: UseMutationOptions<DemographicQuotaValidationResult, Error, DemographicQuotaValidationParams>
) => {
  return useMutation<DemographicQuotaValidationResult, Error, DemographicQuotaValidationParams>({
    mutationFn: async (params) => {
      try {
        console.log('[useDemographicQuotaValidation] 🎯 Validando cuotas de demográficos:', params);

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
          console.log('[useDemographicQuotaValidation] Endpoint no disponible, permitiendo acceso');
          // Si el endpoint no está disponible, permitir acceso
          return {
            isValid: true
          };
        }

        const data = await response.json();
        console.log('[useDemographicQuotaValidation] Respuesta de validación:', data);

        return data;
      } catch (error) {
        console.error('[useDemographicQuotaValidation] Error:', error);
        // En caso de error, permitir acceso
        return {
          isValid: true
        };
      }
    },
    ...options,
  });
};
