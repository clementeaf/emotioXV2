import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getApiUrl } from '../config/endpoints';

export interface EyeTrackingConfig {
  id: string;
  researchId: string;
  linkConfig?: {
    allowMobile?: boolean;
    allowMobileDevices?: boolean;
    trackLocation?: boolean;  // ✅ AGREGADO: Configuración de tracking de ubicación
  };
  allowMobile?: boolean;
  allowMobileDevices?: boolean;
  trackLocation?: boolean;  // ✅ AGREGADO: Configuración de tracking de ubicación
  participantLimit?: {
    value: number;
  };
  createdAt: string;
  updatedAt: string;
  parameterOptions?: {
    saveDeviceInfo?: boolean;
    saveLocationInfo?: boolean;
    saveResponseTimes?: boolean; // 🎯 NUEVA PROPIEDAD
    saveUserJourney?: boolean;
  };
  // 🎯 AGREGADO: Backlinks para redirección
  backlinks?: {
    complete?: string;
    disqualified?: string;
    overquota?: string;
  };
  // 🎯 AGREGADO: Preguntas demográficas con criterios descalificatorios
  demographicQuestions?: {
    age?: {
      enabled: boolean;
      required: boolean;
      options: string[];
      disqualifyingAges?: string[];
    };
    country?: {
      enabled: boolean;
      required: boolean;
      options: string[];
      disqualifyingCountries?: string[];
    };
    gender?: {
      enabled: boolean;
      required: boolean;
      options: string[];
      disqualifyingGenders?: string[];
    };
    educationLevel?: {
      enabled: boolean;
      required: boolean;
      options: string[];
      disqualifyingEducation?: string[];
    };
    householdIncome?: {
      enabled: boolean;
      required: boolean;
      options: string[];
      disqualifyingIncomes?: string[];
    };
    employmentStatus?: {
      enabled: boolean;
      required: boolean;
      options: string[];
      disqualifyingEmploymentStatuses?: string[];
    };
    dailyHoursOnline?: {
      enabled: boolean;
      required: boolean;
      options: string[];
      disqualifyingHours?: string[];
    };
    technicalProficiency?: {
      enabled: boolean;
      required: boolean;
      options: string[];
      disqualifyingProficiencies?: string[];
    };
  };
}

/**
 * Hook para obtener la configuración de eye-tracking de una investigación
 * Incluye configuración de dispositivos móviles y tracking de ubicación
 */
export const useEyeTrackingConfigQuery = (
  researchId: string,
  options?: UseQueryOptions<EyeTrackingConfig, Error>
) => {
  return useQuery<EyeTrackingConfig, Error>({
    queryKey: ['eyeTrackingConfig', researchId],
    queryFn: async () => {
      try {
        // 🎯 CORREGIR: El endpoint espera /research/{researchId}/eye-tracking
        const response = await fetch(`${getApiUrl('research')}/${researchId}/eye-tracking`, {
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
