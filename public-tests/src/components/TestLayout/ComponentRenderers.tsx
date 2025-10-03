 
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

// 🎯 TIPOS PARA RENDERERS
interface RendererArgs {
  contentConfiguration?: Record<string, unknown>;
  currentQuestionKey: string;
  quotaResult?: unknown;
  eyeTrackingConfig?: unknown;
  formData?: Record<string, unknown>;
  [key: string]: unknown; // Para permitir propiedades adicionales
}

// 🎯 RENDERERS PARA DIFERENTES TIPOS DE COMPONENTES  
const RENDERERS: Record<string, (args: RendererArgs) => React.ReactNode> = {
  screen: ({ contentConfiguration, currentQuestionKey, quotaResult, eyeTrackingConfig }) => {
    // 🎯 COMPONENTE PARA thank_you_screen CON AUTO-GUARDADO
    if (currentQuestionKey === 'thank_you_screen') {
      return (
        <ThankYouScreenComponent
          contentConfiguration={contentConfiguration || {}}
          currentQuestionKey={currentQuestionKey}
          quotaResult={quotaResult} // 🎯 NUEVO: Pasar información de cuotas
          eyeTrackingConfig={eyeTrackingConfig} // 🎯 NUEVO: Pasar configuración
        />
      );
    }

    // Para welcome_screen, usar ScreenComponent con botón
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

  smartvoc_csat: ({ contentConfiguration, currentQuestionKey, formData }) => {
    console.log('[ComponentRenderers] 🎯 smartvoc_csat renderer called:', {
      currentQuestionKey,
      contentConfiguration: contentConfiguration ? 'exists' : 'missing',
      configKeys: contentConfiguration ? Object.keys(contentConfiguration) : []
    });

    // 🎯 DETERMINAR EL TIPO DE VISUALIZACIÓN DESDE LA CONFIGURACIÓN
    const displayType = contentConfiguration?.type || 'stars';


    // 🎯 CONFIGURACIÓN BASE PARA CSAT
    const baseConfig = {
      min: 1,
      max: 5,
      leftLabel: 'Muy insatisfecho',
      rightLabel: 'Muy satisfecho',
      startLabel: 'Muy insatisfecho',
      endLabel: 'Muy satisfecho'
    };

    // 🎯 CONFIGURACIÓN ESPECÍFICA SEGÚN EL TIPO DE VISUALIZACIÓN
    const config = {
      ...baseConfig,
      type: displayType, // Agregar el tipo de visualización
      ...(displayType === 'stars' && {
        leftLabel: '1 - Muy insatisfecho',
        rightLabel: '5 - Muy satisfecho',
        startLabel: '1 - Muy insatisfecho',
        endLabel: '5 - Muy satisfecho'
      }),
      ...(displayType === 'numbers' && {
        leftLabel: '1',
        rightLabel: '5',
        startLabel: '1 - Muy insatisfecho',
        endLabel: '5 - Muy satisfecho'
      })
    };

    return (
      <QuestionComponent
        question={{
          title: String(contentConfiguration?.title || 'CSAT'),
          questionKey: currentQuestionKey,
          type: displayType === 'stars' ? 'emoji' : 'scale',
          config: {
            ...config,
            instructions: contentConfiguration?.instructions
          },
          choices: [],
          description: String(contentConfiguration?.description || '')
        }}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },

  smartvoc_ces: ({ contentConfiguration, currentQuestionKey, formData }) => {
    // 🎯 USAR CONFIGURACIÓN DEL BACKEND
    const scaleRange = (contentConfiguration?.scaleRange as { start: number; end: number }) || { start: 1, end: 5 };
    const startLabel = String(contentConfiguration?.startLabel || 'Muy fácil');
    const endLabel = String(contentConfiguration?.endLabel || 'Muy difícil');

    return (
      <QuestionComponent
        question={{
          title: String(contentConfiguration?.title || 'CES'),
          questionKey: currentQuestionKey,
          type: 'scale',
          config: {
            min: scaleRange.start,
            max: scaleRange.end,
            leftLabel: startLabel,
            rightLabel: endLabel,
            startLabel: startLabel,
            endLabel: endLabel,
            instructions: contentConfiguration?.instructions
          },
          choices: [],
          description: String(contentConfiguration?.description || '')
        }}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },

  smartvoc_cv: ({ contentConfiguration, currentQuestionKey, formData }) => {
    // 🎯 DETERMINAR ESCALA DINÁMICAMENTE
    const scaleRange = (contentConfiguration?.scaleRange as { start: number; end: number }) || { start: 1, end: 5 };
    const maxValue = scaleRange.end;

    // 🎯 CONFIGURAR LABELS SEGÚN ESCALA
    // Usar etiquetas personalizadas si están definidas, sino usar valores por defecto
    const customStartLabel = String(contentConfiguration?.startLabel || '');
    const customEndLabel = String(contentConfiguration?.endLabel || '');

    let leftLabel = customStartLabel || 'No en absoluto';
    let rightLabel = customEndLabel || 'Totalmente';
    let startLabel = customStartLabel || 'No en absoluto';
    let endLabel = customEndLabel || 'Totalmente';

    // Si no hay etiquetas personalizadas, agregar números según la escala
    if (!customStartLabel && !customEndLabel) {
      if (maxValue === 5) {
        leftLabel = `1 - No en absoluto`;
        rightLabel = `5 - Totalmente`;
        startLabel = `1 - No en absoluto`;
        endLabel = `5 - Totalmente`;
      } else if (maxValue === 7) {
        leftLabel = `1 - No en absoluto`;
        rightLabel = `7 - Totalmente`;
        startLabel = `1 - No en absoluto`;
        endLabel = `7 - Totalmente`;
      } else {
        leftLabel = `1 - No en absoluto`;
        rightLabel = `10 - Totalmente`;
        startLabel = `1 - No en absoluto`;
        endLabel = `10 - Totalmente`;
      }
    }

    return (
      <QuestionComponent
        question={{
          title: String(contentConfiguration?.title || 'CV'),
          questionKey: currentQuestionKey,
          type: 'scale',
          config: {
            min: scaleRange.start,
            max: scaleRange.end,
            leftLabel,
            rightLabel,
            startLabel,
            endLabel,
            instructions: contentConfiguration?.instructions
          },
          choices: [],
          description: String(contentConfiguration?.description || '')
        }}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },

  smartvoc_nps: ({ contentConfiguration, currentQuestionKey, formData }) => {
    // 🎯 DETERMINAR ESCALA DINÁMICAMENTE
    const scaleRange = (contentConfiguration?.scaleRange as { start: number; end: number }) || { start: 0, end: 10 };
    const maxValue = scaleRange.end;

    // 🎯 CONFIGURAR LABELS SEGÚN ESCALA
    let leftLabel = 'No lo recomendaría';
    let rightLabel = 'Lo recomendaría';
    let startLabel = 'No lo recomendaría';
    let endLabel = 'Lo recomendaría';

    if (maxValue === 6) {
      leftLabel = '0 - No lo recomendaría';
      rightLabel = '6 - Lo recomendaría';
      startLabel = '0 - No lo recomendaría';
      endLabel = '6 - Lo recomendaría';
    } else {
      leftLabel = '0 - No lo recomendaría';
      rightLabel = '10 - Lo recomendaría';
      startLabel = '0 - No lo recomendaría';
      endLabel = '10 - Lo recomendaría';
    }

    return (
      <QuestionComponent
        question={{
          title: String(contentConfiguration?.title || 'NPS'),
          questionKey: currentQuestionKey,
          type: 'scale',
          config: {
            min: scaleRange.start,
            max: scaleRange.end,
            leftLabel,
            rightLabel,
            startLabel,
            endLabel,
            instructions: contentConfiguration?.instructions
          },
          choices: [],
          description: String(contentConfiguration?.description || '')
        }}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },

  smartvoc_nev: ({ contentConfiguration, currentQuestionKey, formData }) => {
    // 🎯 USAR EL TIPO DEL BACKEND
    const selectorType = String(contentConfiguration?.type || 'detailed');


    return (
      <QuestionComponent
        question={{
          title: String(contentConfiguration?.title || 'NEV'),
          questionKey: currentQuestionKey,
          type: selectorType,
          config: {
            // Configuración específica para detailed
            maxSelections: 3,
            emotions: ['feliz', 'satisfecho', 'confiado', 'valorado', 'cuidado', 'seguro', 'enfocado', 'indulgente', 'estimulado', 'exploratorio', 'interesado', 'energico', 'descontento', 'frustrado', 'irritado', 'decepcion', 'estresado', 'infeliz', 'desatendido', 'apresurado'],
            instructions: contentConfiguration?.instructions
          },
          choices: [],
          description: '' // 🎯 NO MOSTRAR DESCRIPCIÓN DUPLICADA
        }}
        currentStepKey={currentQuestionKey}
        initialFormData={formData}
      />
    );
  },

  smartvoc_voc: ({ contentConfiguration, currentQuestionKey, formData }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'VOC'),
        questionKey: currentQuestionKey,
        type: 'text',
        config: {
          placeholder: String(contentConfiguration?.placeholder || 'Escribe tu opinión aquí...'),
          instructions: contentConfiguration?.instructions
        },
        choices: [],
        description: String(contentConfiguration?.description || '')
      }}
      currentStepKey={currentQuestionKey}
      initialFormData={formData}
    />
  ),

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
    // 🎯 PROCESAR ARCHIVOS CON URLs DINÁMICAS (SIN HARDCODEAR STAGE)
    const filesWithUrls = Array.isArray(contentConfiguration?.files)
      ? processFilesWithUrls(contentConfiguration.files as Record<string, unknown>[])
      : [];

    console.log('🎯 NavigationFlow files with dynamic URLs:', filesWithUrls);

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
    // 🎯 PROCESAR ARCHIVOS CON URLs DINÁMICAS (SIN HARDCODEAR STAGE)
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

    // 🎯 EXTRAER TEXTO DE LAS CHOICES
    const rankingItems = Array.isArray(contentConfiguration?.choices)
      ? contentConfiguration.choices
          .map((choice: Record<string, unknown>) => String(choice.text || choice.id || ''))
          .filter(item => item)
      : [];

    console.log('[cognitive_ranking] 🎯 Renderer data:', {
      currentQuestionKey,
      formData,
      rankingItems,
      backendValue: formData?.selectedValue
    });

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
      type: 'cognitive_short_text', // ✅ CAMBIADO: Usar el tipo correcto
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

// 🎯 COMPONENTE PARA PASOS DESCONOCIDOS
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
  quotaResult?: unknown; // 🎯 NUEVO: Prop para información de cuotas
  eyeTrackingConfig?: unknown; // 🎯 NUEVO: Prop para configuración de eye-tracking
}> = ({ contentConfiguration, currentQuestionKey, quotaResult, eyeTrackingConfig }) => {
  const { setFormData } = useFormDataStore();
  const { researchId, participantId } = useTestStore();
  const saveModuleResponseMutation = useSaveModuleResponseMutation();

  // 🎯 AUTO-GUARDAR CUANDO SE VISITA THANK YOU SCREEN
  React.useEffect(() => {
    if (currentQuestionKey === 'thank_you_screen' && researchId && participantId) {
      // Guardar en formData
      setFormData(currentQuestionKey, {
        visited: true,
        timestamp: new Date().toISOString()
      });

      // 🎯 ENVIAR A MODULE-RESPONSES API
      const sendToAPI = async () => {
        try {
          const timestamp = new Date().toISOString();

          // Capturar información real del dispositivo SOLO si está habilitado
          let deviceInfo = null;
          if (eyeTrackingConfig?.parameterOptions?.saveDeviceInfo) {
            deviceInfo = {
              type: getDeviceType(),
              browser: getBrowserInfo(),
              os: getOSInfo(),
              screenSize: `${window.screen.width}x${window.screen.height}`
            };
          }

          // Capturar información de ubicación SOLO si está habilitado
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

      // Funciones helper para capturar datos reales
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
          // Intentar obtener IP real
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          const ip = data.ip;

          // Intentar obtener ubicación basada en IP
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

  // 🎯 VERIFICAR SI EL USUARIO FUE DESCALIFICADO
  const isDisqualified = eyeTrackingConfig?.backlinks?.disqualified &&
    window.location.search.includes('disqualified=true');

  // 🎯 VERIFICAR SI EXCEDE LA CUOTA DE PARTICIPANTES
  // NOTA: El backend ya verifica la cuota automáticamente al guardar thank_you_screen
  // y devuelve el resultado en la respuesta. Aquí verificamos si hay un parámetro de URL
  // que indique overquota (para compatibilidad)
  const isOverQuota = window.location.search.includes('overquota=true');

  // 🎯 MOSTRAR LINK DE DESCALIFICACIÓN SI APLICA
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

          {/* 🎯 LINK DE DESCALIFICACIÓN */}
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

  // 🎯 MOSTRAR LINK DE OVERQUOTA SI EXCEDE LA CUOTA
  if (isOverQuota && eyeTrackingConfig?.backlinks?.overquota) {
    // 🎯 NUEVO: Obtener información específica de cuotas si está disponible
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

          {/* 🎯 NUEVO: Mostrar información específica de cuotas si está disponible */}
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

          {/* 🎯 LINK DE OVERQUOTA */}
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

  // 🎯 RENDERIZAR THANK YOU SCREEN NORMAL
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

// Exportación al final para fast refresh
export { RENDERERS };
