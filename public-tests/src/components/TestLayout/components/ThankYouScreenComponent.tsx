import React from 'react';
import { useSaveModuleResponseMutation } from '../../../hooks/useApiQueries';
import { useTestStore } from '../../../stores/useTestStore';
import { getDeviceInfo, getLocationInfo } from '../../../utils/deviceUtils';

interface ThankYouScreenComponentProps {
  contentConfiguration: Record<string, unknown>;
  currentQuestionKey: string;
  quotaResult?: any;
  eyeTrackingConfig?: any;
}

export const ThankYouScreenComponent: React.FC<ThankYouScreenComponentProps> = ({ 
  contentConfiguration, 
  currentQuestionKey, 
  quotaResult, 
  eyeTrackingConfig 
}) => {
  const { researchId, participantId } = useTestStore();
  const saveModuleResponseMutation = useSaveModuleResponseMutation();

  React.useEffect(() => {
    if (currentQuestionKey === 'thank_you_screen' && researchId && participantId) {
      const sendToAPI = async () => {
        try {
          const timestamp = new Date().toISOString();
          let deviceInfo = null;
          if (eyeTrackingConfig?.parameterOptions?.saveDeviceInfo) {
            deviceInfo = getDeviceInfo();
          }

          let location = null;
          if (eyeTrackingConfig?.parameterOptions?.saveLocationInfo) {
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
              ...(deviceInfo && { deviceInfo }),
              ...(location && { location })
            }],
            metadata: {}
          };

          await saveModuleResponseMutation.mutateAsync(createData);
        } catch (error) {
          console.error('[ThankYouScreenComponent] Error saving device info:', error);
        }
      };

      sendToAPI();
    }
  }, [currentQuestionKey, researchId, participantId, eyeTrackingConfig?.parameterOptions?.saveDeviceInfo, eyeTrackingConfig?.parameterOptions?.saveLocationInfo, saveModuleResponseMutation]);

  const isDisqualified = eyeTrackingConfig?.backlinks?.disqualified &&
    window.location.search.includes('disqualified=true');

  const isOverQuota = window.location.search.includes('overquota=true');

  if (isDisqualified && eyeTrackingConfig?.backlinks?.disqualified) {
    return (
      <div className='flex flex-col items-center justify-center h-full w-full'>
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No calificas para esta investigación
          </h2>
          <p className="text-gray-600 mb-6">
            Lamentamos informarte que no cumples con los criterios requeridos para participar en este estudio.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Información adicional
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Para más información sobre los criterios de participación, visita:
            </p>
            <a
              href={eyeTrackingConfig.backlinks.disqualified}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver criterios de participación
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (isOverQuota && eyeTrackingConfig?.backlinks?.overquota) {
    const quotaInfo = quotaResult;
    const hasSpecificQuotaInfo = quotaInfo && quotaInfo.demographicType && quotaInfo.demographicValue;

    return (
      <div className='flex flex-col items-center justify-center h-full w-full'>
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {hasSpecificQuotaInfo ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Cuota alcanzada para {quotaInfo.demographicType}
              </h2>
              <p className="text-gray-600 mb-4">
                Lamentamos informarte que ya se ha alcanzado el límite máximo de participantes
                para el criterio: <strong>{quotaInfo.demographicType}</strong> con valor <strong>{quotaInfo.demographicValue}</strong>.
              </p>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 mb-4">
                <p className="text-sm text-orange-800">
                  <strong>Límite configurado:</strong> {quotaInfo.quotaLimit} participantes
                </p>
                <p className="text-sm text-orange-800">
                  <strong>Participantes actuales:</strong> {quotaInfo.order}
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Cuota de participantes alcanzada
              </h2>
              <p className="text-gray-600 mb-6">
                Lamentamos informarte que ya se ha alcanzado el límite máximo de participantes para esta investigación.
              </p>
            </>
          )}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Información adicional
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Para más información sobre futuras investigaciones, visita:
            </p>
            <a
              href={eyeTrackingConfig.backlinks.overquota}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver futuras investigaciones
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center justify-center h-full gap-6 p-8'>
      <h2 className='text-2xl font-bold text-gray-800 text-center'>
        {String(contentConfiguration?.title || '¡Gracias por tu participación!')}
      </h2>
      {(contentConfiguration?.message as string) && (
        <p className='text-gray-600 text-center max-w-2xl'>
          {contentConfiguration.message as string}
        </p>
      )}
    </div>
  );
};
