import { useEffect } from 'react';
import { useSaveModuleResponseMutation } from '../../../hooks/useApiQueries';
import { getDeviceInfo, getLocationInfo } from '../../../utils/deviceUtils';
import { UseThankYouScreenProps } from './ThankYouScreenTypes';

/**
 * Hook para manejar la lógica de API del ThankYouScreen
 */
export const useThankYouScreen = ({
  currentQuestionKey,
  researchId,
  participantId,
  eyeTrackingConfig
}: UseThankYouScreenProps) => {
  const saveModuleResponseMutation = useSaveModuleResponseMutation();

  useEffect(() => {
    if (currentQuestionKey === 'thank_you_screen' && researchId && participantId) {
      const sendToAPI = async () => {
        try {
          const timestamp = new Date().toISOString();
          
          // Obtener información del dispositivo
          let deviceInfo = null;
          if (eyeTrackingConfig?.parameterOptions?.saveDeviceInfo) {
            deviceInfo = getDeviceInfo();
          }

          // Obtener información de ubicación
          let location = null;
          if (eyeTrackingConfig?.parameterOptions?.saveLocationInfo) {
            location = await getLocationInfo();
          }

          const createData = {
            researchId,
            participantId,
            questionKey: currentQuestionKey,
            responses: [{
              questionKey: currentQuestionKey,
              response: { visited: true },
              timestamp,
              createdAt: timestamp,
              updatedAt: undefined,
              ...(deviceInfo && { deviceInfo }),
              ...(location && { location })
            }],
            metadata: {}
          };

          await saveModuleResponseMutation.mutateAsync(createData);
        } catch (error) {
          console.error('[useThankYouScreen] Error saving device info:', error);
        }
      };

      sendToAPI();
    }
  }, [
    currentQuestionKey, 
    researchId, 
    participantId, 
    eyeTrackingConfig?.parameterOptions?.saveDeviceInfo, 
    eyeTrackingConfig?.parameterOptions?.saveLocationInfo, 
    saveModuleResponseMutation
  ]);

  return {
    saveModuleResponseMutation
  };
};
