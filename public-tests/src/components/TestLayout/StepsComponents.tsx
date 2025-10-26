import React, { useEffect } from 'react';
import { useSaveModuleResponseMutation } from '../../hooks/useApiQueries';
// import { useEyeTrackingConfigQuery } from '../../hooks/useEyeTrackingConfigQuery'; // Removed
// import { useUserJourneyTracking } from '../../hooks/useUserJourneyTracking'; // Removed
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
import { getDeviceInfo, getLocationInfo } from '../../utils/deviceUtils';
import { ScreenStep } from './types';

export const ScreenComponent: React.FC<{ data: ScreenStep; onContinue?: () => void }> = ({ data }) => {
  const { setFormData } = useFormDataStore();
  const { researchId, participantId } = useTestStore();
  const saveModuleResponseMutation = useSaveModuleResponseMutation();

  // TODO: Implementar useEyeTrackingConfigQuery o usar alternativa
  const eyeTrackingConfig = null; // Temporal: null hasta implementar hook
  const shouldTrackUserJourney = false; // Temporal: false hasta implementar hook

  // TODO: Implementar useUserJourneyTracking o usar alternativa
  const trackStepVisit = React.useCallback(() => {
    // Temporal: implementación básica
    console.log('trackStepVisit not implemented yet');
  }, []);

  const handleContinue = async () => {
    const store = useStepStore.getState();
    const currentQuestionKey = store.currentQuestionKey;

    if (currentQuestionKey && researchId && participantId) {
      setFormData(currentQuestionKey, {
        visited: true,
        timestamp: new Date().toISOString()
      });

      if (shouldTrackUserJourney) {
        trackStepVisit(); // Temporal: sin parámetros hasta implementar hook
      }

      try {
        const timestamp = new Date().toISOString();

        let deviceInfo = null;
        // TODO: Implementar cuando eyeTrackingConfig esté disponible
        // Temporal: deshabilitado hasta implementar hook
        const shouldSaveDeviceInfo = false;
        if (shouldSaveDeviceInfo) {
          deviceInfo = getDeviceInfo();
        }

        let location = null;
        // Temporal: deshabilitado hasta implementar hook
        const shouldSaveLocationInfo = false;
        if (shouldSaveLocationInfo) {
          location = await getLocationInfo();
        }

        const createData = {
          researchId: researchId,
          participantId: participantId,
          questionKey: currentQuestionKey,
          responses: [{
            questionKey: currentQuestionKey,
            response: { visited: true },
            timestamp,
            createdAt: timestamp,
            updatedAt: undefined,
            ...(deviceInfo ? { deviceInfo } : {}),
            ...(location ? { location } : {})
          }],
          metadata: {}
        };

        await saveModuleResponseMutation.mutateAsync(createData);
      } catch {
        // Error handled silently
      }
    }

    store.goToNextStep();
  };

  useEffect(() => {
    const store = useStepStore.getState();
    const currentQuestionKey = store.currentQuestionKey;

    if (currentQuestionKey && shouldTrackUserJourney) {
      trackStepVisit(); // Temporal: sin parámetros hasta implementar hook
    }
  }, [shouldTrackUserJourney, trackStepVisit]);

  return (
    <div className='flex flex-col items-center justify-center h-auto w-auto'>
      <h2 className='text-2xl font-bold mb-2'>{data.title || ''}</h2>
      <p>{data.message || ''}</p>
      {data.startButtonText && (
        <button
          className='mt-8 font-semibold py-2 px-6 rounded transition w-full max-w-lg bg-blue-600 hover:bg-blue-700 text-white'
          style={{ minHeight: 48 }}
          onClick={handleContinue}
        >
          {data.startButtonText}
        </button>
      )}
    </div>
  );
};
