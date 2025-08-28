import { useQuery } from '@tanstack/react-query';
import { API_HTTP_ENDPOINT } from '../config/endpoints';

export interface EyeTrackingConfig {
  id: string;
  researchId: string;
  linkConfig: {
    allowMobile: boolean;
    trackLocation: boolean;
    allowMultipleAttempts: boolean;
    showProgressBar: boolean; // 🎯 NUEVO
  };
  parameterOptions: {
    saveDeviceInfo: boolean;
    saveLocationInfo: boolean;
    saveResponseTimes: boolean;
    saveUserJourney: boolean;
  };
  participantLimit: {
    enabled: boolean;
    value: number;
  };
  demographicQuestions: Record<string, any>;
  backlinks: {
    complete: string;
    disqualified: string;
    overquota: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function useEyeTrackingConfigQuery(researchId: string) {
  return useQuery({
    queryKey: ['eyeTrackingConfig', researchId],
    queryFn: async (): Promise<EyeTrackingConfig | null> => {
      if (!researchId) {
        return null;
      }

      try {
        // 🎯 CORREGIR: Usar el endpoint correcto
        const response = await fetch(`${API_HTTP_ENDPOINT}/research/${researchId}/eye-tracking`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        return null;
      }
    },
    enabled: !!researchId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
}
