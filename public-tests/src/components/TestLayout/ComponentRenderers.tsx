 
// @ts-nocheck

import React from 'react';
import { useSaveModuleResponseMutation } from '../../hooks/useApiQueries';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useTestStore } from '../../stores/useTestStore';
import { processFilesWithUrls } from '../../utils/s3-url.utils';
import { DemographicForm } from './DemographicForm';
import { NavigationFlowTask } from './NavigationFlowTask';
import PreferenceTestTask from './PreferenceTestTask';
import { QuestionComponent } from './QuestionComponent';
import { RankingList } from './RankingList';
import { ScreenComponent } from './StepsComponents';
import { SmartVOCRenderers } from './ComponentRenderers/SmartVOCRenderers';

interface RendererArgs {
  contentConfiguration?: Record<string, unknown>;
  currentQuestionKey: string;
  quotaResult?: unknown;
  eyeTrackingConfig?: unknown;
  formData?: Record<string, unknown>;
  [key: string]: unknown;
}

const RENDERERS: Record<string, (args: RendererArgs) => React.ReactNode> = {
  screen: ({ contentConfiguration, currentQuestionKey, quotaResult, eyeTrackingConfig }) => {
    if (currentQuestionKey === 'thank_you_screen') {
      return (
        <ThankYouScreenComponent
          contentConfiguration={contentConfiguration || {}}
          currentQuestionKey={currentQuestionKey}
          quotaResult={quotaResult}
          eyeTrackingConfig={eyeTrackingConfig}
        />
      );
    }

    return (
      <ScreenComponent
        data={{
          questionKey: currentQuestionKey,
          contentConfiguration,
          title: String(contentConfiguration?.title || 'Bienvenido'),
          message: String(contentConfiguration?.message || 'Bienvenido'),
          startButtonText: String(contentConfiguration?.startButtonText || 'Continuar')
        }}
      />
    );
  },

  demographics: ({ contentConfiguration }) => (
    <DemographicForm
      demographicQuestions={contentConfiguration?.demographicQuestions as Record<string, unknown> || {}}
    />
  ),

  smartvoc: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Pregunta SmartVOC'),
        questionKey: currentQuestionKey,
        type: currentQuestionKey,
        config: contentConfiguration,
        choices: Array.isArray(contentConfiguration?.choices) ? contentConfiguration.choices : [],
        description: String(contentConfiguration?.description || '')
      }}
      currentStepKey={currentQuestionKey}
    />
  ),

  // 🎯 SMARTVOC RENDERERS - Importados desde archivo separado
  ...SmartVOCRenderers,

  cognitive: ({ contentConfiguration, currentQuestionKey, formData }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Pregunta Cognitive Task'),
        questionKey: currentQuestionKey,
        type: currentQuestionKey,
        config: contentConfiguration,
        choices: Array.isArray(contentConfiguration?.choices) ? contentConfiguration.choices : [],
        description: String(contentConfiguration?.description || '')
      }}
      currentStepKey={currentQuestionKey}
      initialFormData={formData}
    />
  ),

  cognitive_navigation_flow: ({ contentConfiguration, currentQuestionKey }) => {
    const filesWithUrls = Array.isArray(contentConfiguration?.files)
      ? processFilesWithUrls(contentConfiguration.files as Record<string, unknown>[])
      : [];

    return (
      <NavigationFlowTask
        stepConfig={{
          id: currentQuestionKey,
          type: 'cognitive_navigation_flow',
          title: String(contentConfiguration?.title || 'Flujo de Navegación'),
          description: String(contentConfiguration?.description || '¿En cuál de las siguientes pantallas encuentras el objetivo indicado?'),
          files: filesWithUrls
        }}
        currentQuestionKey={currentQuestionKey}
      />
    );
  },

  cognitive_preference_test: ({ contentConfiguration, currentQuestionKey }) => {
    const filesWithUrls = Array.isArray(contentConfiguration?.files)
      ? processFilesWithUrls(contentConfiguration.files as Record<string, unknown>[])
      : [];

    return (
      <PreferenceTestTask
        stepConfig={{
          id: currentQuestionKey,
          type: 'cognitive_preference_test',
          title: String(contentConfiguration?.title || 'Test de Preferencia'),
          description: String(contentConfiguration?.description || 'Selecciona tu preferencia'),
          files: filesWithUrls
        }}
        currentQuestionKey={currentQuestionKey}
      />
    );
  },

  cognitive_ranking: ({ contentConfiguration, currentQuestionKey, formData }) => {
    const rankingItems = Array.isArray(contentConfiguration?.choices)
      ? contentConfiguration.choices
          .map((choice: Record<string, unknown>) => String(choice.text || choice.id || ''))
          .filter(item => item)
      : [];

    return (
      <div className='flex flex-col items-center justify-center h-full gap-6'>
        <h2 className='text-2xl font-bold text-gray-800'>
          {String(contentConfiguration?.title || 'Ordenar por Preferencia')}
        </h2>
        <p className='text-gray-600 text-center max-w-2xl'>
          {String(contentConfiguration?.description || 'Arrastra los elementos para ordenarlos según tu preferencia')}
        </p>
        <div className='w-full max-w-2xl'>
          <RankingList
            items={rankingItems}
            onMoveUp={() => { }}
            onMoveDown={() => { }}
            isSaving={false}
            isApiLoading={false}
            dataLoading={false}
            currentQuestionKey={currentQuestionKey}
            initialFormData={formData}
          />
        </div>
      </div>
    );
  },

  cognitive_short_text: ({ contentConfiguration, currentQuestionKey, formData }) => {
    const questionConfig = {
      title: String(contentConfiguration?.title || 'Respuesta Corta'),
      questionKey: currentQuestionKey,
      type: 'cognitive_short_text',
      config: contentConfiguration,
      choices: [],
      description: String(contentConfiguration?.description || 'Escribe tu respuesta')
    };


    return (
      <QuestionComponent
        question={questionConfig}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },

  cognitive_long_text: ({ contentConfiguration, currentQuestionKey, formData }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Respuesta Larga'),
        questionKey: currentQuestionKey,
        type: 'text',
        config: contentConfiguration,
        choices: [],
        description: String(contentConfiguration?.description || 'Escribe tu respuesta detallada')
      }}
      currentStepKey={currentQuestionKey}
      initialFormData={formData}
    />
  ),

  cognitive_multiple_choice: ({ contentConfiguration, currentQuestionKey, formData }) => {

    const questionConfig = {
      title: String(contentConfiguration?.title || 'Selección Múltiple'),
      questionKey: currentQuestionKey,
      type: 'choice',
      config: { ...contentConfiguration, multiple: true },
      choices: Array.isArray(contentConfiguration?.choices) ? contentConfiguration.choices : [],
      description: String(contentConfiguration?.description || 'Selecciona todas las opciones que apliquen')
    };


    return (
      <QuestionComponent
        question={questionConfig}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },

  cognitive_single_choice: ({ contentConfiguration, currentQuestionKey, formData }) => {

    const questionConfig = {
      title: String(contentConfiguration?.title || 'Selección Única'),
      questionKey: currentQuestionKey,
      type: 'choice',
      config: { ...contentConfiguration, multiple: false },
      choices: Array.isArray(contentConfiguration?.choices) ? contentConfiguration.choices : [],
      description: String(contentConfiguration?.description || 'Selecciona una opción')
    };


    return (
      <QuestionComponent
        question={questionConfig}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },

  cognitive_linear_scale: ({ contentConfiguration, currentQuestionKey, formData }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Escala Lineal'),
        questionKey: currentQuestionKey,
        type: 'scale',
        config: contentConfiguration,
        choices: [],
        description: String(contentConfiguration?.description || 'Selecciona un valor en la escala')
      }}
      currentStepKey={currentQuestionKey}
      initialFormData={formData}
    />
  ),

  cognitive_rating: ({ contentConfiguration, currentQuestionKey, formData }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Calificación'),
        questionKey: currentQuestionKey,
        type: 'emoji',
        config: contentConfiguration,
        choices: [],
        description: String(contentConfiguration?.description || 'Califica usando las opciones')
      }}
      currentStepKey={currentQuestionKey}
      initialFormData={formData}
    />
  ),
};

export const UnknownStepComponent: React.FC<{ data: unknown }> = ({ data }) => (
  <div className='flex flex-col items-center justify-center h-full gap-10'>
    <h2 className='text-2xl font-bold'>Componente desconocido</h2>
    <p>No se pudo renderizar este tipo de componente</p>
    <pre className='text-sm text-gray-500'>{JSON.stringify(data, null, 2)}</pre>
  </div>
);

export const ThankYouScreenComponent: React.FC<{
  contentConfiguration: Record<string, unknown>;
  currentQuestionKey: string;
  quotaResult?: unknown;
  eyeTrackingConfig?: unknown;
}> = ({ contentConfiguration, currentQuestionKey, quotaResult, eyeTrackingConfig }) => {
  const { setFormData } = useFormDataStore();
  const { researchId, participantId } = useTestStore();
  const saveModuleResponseMutation = useSaveModuleResponseMutation();

  React.useEffect(() => {
    if (currentQuestionKey === 'thank_you_screen' && researchId && participantId) {
      setFormData(currentQuestionKey, {
        visited: true,
        timestamp: new Date().toISOString()
      });

      const sendToAPI = async () => {
        try {
          const timestamp = new Date().toISOString();
          let deviceInfo = null;
          if (eyeTrackingConfig?.parameterOptions?.saveDeviceInfo) {
            deviceInfo = {
              type: getDeviceType(),
              browser: getBrowserInfo(),
              os: getOSInfo(),
              screenSize: `${window.screen.width}x${window.screen.height}`
            };
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
          console.error('[ComponentRenderers] Error saving device info:', error);
        }
      };

      const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
        const width = window.screen.width;
        const height = window.screen.height;
        const ratio = width / height;

        if (width >= 1024) return 'desktop';
        if (width >= 768 && ratio > 1.2) return 'tablet';
        return 'mobile';
      };

      const getBrowserInfo = (): string => {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return 'Unknown';
      };

      const getOSInfo = (): string => {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Windows')) return 'Windows';
        if (userAgent.includes('Mac')) return 'macOS';
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) return 'Android';
        if (userAgent.includes('iOS')) return 'iOS';
        return 'Unknown';
      };

      const getLocationInfo = async (): Promise<{ country: string, city: string, ip: string }> => {
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          const ip = data.ip;
          const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
          const geoData = await geoResponse.json();

          return {
            country: geoData.country_name || 'Chile',
            city: geoData.city || 'Valparaíso',
            ip: ip
          };
        } catch {
          return {
            country: 'Chile',
            city: 'Valparaíso',
            ip: 'N/A'
          };
        }
      };

      sendToAPI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionKey, researchId, participantId, eyeTrackingConfig?.parameterOptions?.saveDeviceInfo, eyeTrackingConfig?.parameterOptions?.saveLocationInfo]);

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

export { RENDERERS };
