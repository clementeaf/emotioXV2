import React, { useEffect } from 'react';
import { useAvailableFormsQuery, useModuleResponsesQuery, useSaveModuleResponseMutation } from '../../hooks/useApiQueries';
import { useDebugSteps } from '../../hooks/useDebugSteps';
import { useEyeTrackingConfigQuery } from '../../hooks/useEyeTrackingConfigQuery';
import { useMobileStepVerification } from '../../hooks/useMobileStepVerification';
import { useMonitoringWebSocket } from '../../hooks/useMonitoringWebSocket';
import { useUserJourneyTracking } from '../../hooks/useUserJourneyTracking';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
import { MobileStepBlockedScreen } from '../common/MobileStepBlockedScreen';
import { ButtonSteps } from './ButtonSteps';
import { DemographicForm } from './DemographicForm';
import { NavigationFlowTask } from './NavigationFlowTask';
import PreferenceTestTask from './PreferenceTestTask';
import { EmojiRangeQuestion, ScaleRangeQuestion, SingleAndMultipleChoiceQuestion, VOCTextQuestion } from './QuestionesComponents';
import { RankingList } from './RankingList';
import { ScreenComponent } from './StepsComponents';
import { getCurrentStepData, getQuestionType } from './utils';

// 🎯 COMPONENTE WRAPPER PARA COMPATIBILIDAD
const QuestionComponent: React.FC<{
  question: {
    title: string;
    questionKey: string;
    type: string;
    config: any;
    choices: any[];
    description: string;
  };
  currentStepKey: string;
}> = ({ question, currentStepKey }) => {
  const { setFormData, getFormData } = useFormDataStore();

  // 🎯 INICIALIZAR VALOR CORRECTO DESDE EL INICIO
  const initialValue = question.type === 'choice' && question.config?.multiple ? [] : undefined;
  const [value, setValue] = React.useState<any>(initialValue);

  console.log('[QuestionComponent] 🎯 Inicialización:', {
    currentStepKey,
    questionType: question.type,
    isMultiple: question.config?.multiple,
    initialValue,
    initialValueType: typeof initialValue,
    isArray: Array.isArray(initialValue)
  });

  // Cargar valor guardado
  React.useEffect(() => {
    const savedData = getFormData(currentStepKey);
    console.log('[QuestionComponent] 🔍 Cargando datos guardados:', {
      currentStepKey,
      savedData,
      questionType: question.type,
      questionTitle: question.title,
      isMultiple: question.config?.multiple,
      configMultiple: question.config?.multiple,
      currentValue: value
    });

    if (savedData) {
      const savedValue = savedData.value || savedData.selectedValue;
      // 🎯 MANEJAR VALORES NULL/UNDEFINED PARA TEXTAREA
      if ((question.type === 'text' || question.type === 'cognitive_short_text' || question.type === 'cognitive_long_text') && (savedValue === null || savedValue === undefined)) {
        setValue('');
      } else {
        setValue(savedValue);
      }

      console.log('[QuestionComponent] ✅ Valor cargado desde savedData:', {
        currentStepKey,
        savedValue,
        questionType: question.type
      });
    } else {
      // 🎯 SOLO INICIALIZAR SI NO HAY DATOS GUARDADOS Y ES MÚLTIPLE
      if (question.type === 'choice' && question.config?.multiple && !Array.isArray(value)) {
        console.log('[QuestionComponent] 🎯 Forzando array vacío para selección múltiple:', {
          currentStepKey,
          questionType: question.type,
          configMultiple: question.config?.multiple,
          isMultiple: question.config?.multiple,
          currentValue: value
        });
        setValue([]); // Array vacío para selección múltiple
      } else {
        console.log('[QuestionComponent] ⚠️ No hay datos guardados para:', {
          currentStepKey,
          questionType: question.type,
          isMultiple: question.config?.multiple,
          currentValue: value
        });
      }
    }
  }, [currentStepKey, getFormData, question.type, question.config?.multiple, value]);

  const handleChange = (newValue: any) => {
    console.log('[QuestionComponent] 🔄 Cambio de valor:', {
      currentStepKey,
      newValue,
      questionType: question.type,
      questionTitle: question.title
    });

    setValue(newValue);
    setFormData(currentStepKey, { value: newValue });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <h2 className="text-2xl font-bold text-gray-800 text-center">
        {question.title}
      </h2>
      {question.description && (
        <p className="text-gray-600 text-center max-w-2xl">
          {question.description}
        </p>
      )}

      <div className="w-full max-w-2xl">
        {question.type === 'choice' && (
          <>
            {console.log('[QuestionComponent] 🎯 Renderizando choice para:', {
              questionType: question.type,
              questionTitle: question.title,
              currentStepKey,
              choices: question.choices,
              choicesLength: question.choices.length,
              value,
              multiple: question.config?.multiple,
              config: question.config
            })}
            <SingleAndMultipleChoiceQuestion
              choices={question.choices}
              value={value}
              onChange={handleChange}
              multiple={question.config?.multiple || false}
            />
          </>
        )}
        {question.type === 'scale' && (
          <ScaleRangeQuestion
            min={question.config?.min || 1}
            max={question.config?.max || 5}
            startLabel={question.config?.startLabel}
            endLabel={question.config?.endLabel}
            leftLabel={question.config?.leftLabel}
            rightLabel={question.config?.rightLabel}
            value={value}
            onChange={handleChange}
          />
        )}
        {question.type === 'emoji' && (
          <EmojiRangeQuestion
            emojis={question.config?.emojis}
            value={value}
            onChange={handleChange}
          />
        )}
        {question.type === 'text' && (
          <>
            {console.log('[QuestionComponent] 🧠 Renderizando textarea para:', {
              questionType: question.type,
              questionTitle: question.title,
              currentStepKey,
              value
            })}
            <VOCTextQuestion
              value={value}
              onChange={handleChange}
              placeholder={question.config?.placeholder}
            />
          </>
        )}
        {(question.type === 'cognitive_short_text' || question.type === 'cognitive_long_text') && (
          <>
            {console.log('[QuestionComponent] 🧠 Renderizando textarea para cognitive:', {
              questionType: question.type,
              questionTitle: question.title,
              currentStepKey,
              value
            })}
            <VOCTextQuestion
              value={value}
              onChange={handleChange}
              placeholder={question.config?.placeholder || 'Escribe tu respuesta aquí...'}
            />
          </>
        )}
      </div>
    </div>
  );
};

// 🎯 RENDERERS PARA DIFERENTES TIPOS DE COMPONENTES
const RENDERERS: Record<string, (args: any) => React.ReactNode> = {
  screen: ({ contentConfiguration, currentQuestionKey, quotaResult, eyeTrackingConfig }) => {
    // 🎯 COMPONENTE PARA thank_you_screen CON AUTO-GUARDADO
    if (currentQuestionKey === 'thank_you_screen') {
      return (
        <ThankYouScreenComponent
          contentConfiguration={contentConfiguration}
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

  demographics: ({ contentConfiguration, currentQuestionKey }) => (
    <DemographicForm
      demographicQuestions={contentConfiguration?.demographicQuestions || {} as Record<string, any>}
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

  smartvoc_csat: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Pregunta CSAT'),
        questionKey: currentQuestionKey,
        type: 'scale',
        config: {
          min: 1,
          max: 5,
          leftLabel: 'Muy insatisfecho',
          rightLabel: 'Muy satisfecho',
          startLabel: 'Muy insatisfecho',
          endLabel: 'Muy satisfecho'
        },
        choices: [],
        description: String(contentConfiguration?.description || '¿Qué tan satisfecho estás con nuestro servicio?')
      }}
      currentStepKey={currentQuestionKey}
    />
  ),

  smartvoc_ces: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Pregunta CES'),
        questionKey: currentQuestionKey,
        type: 'scale',
        config: {
          min: 1,
          max: 7,
          leftLabel: 'Muy fácil',
          rightLabel: 'Muy difícil',
          startLabel: 'Muy fácil',
          endLabel: 'Muy difícil'
        },
        choices: [],
        description: String(contentConfiguration?.description || '¿Qué tan fácil fue completar esta tarea?')
      }}
      currentStepKey={currentQuestionKey}
    />
  ),

  smartvoc_cv: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Pregunta CV'),
        questionKey: currentQuestionKey,
        type: 'scale',
        config: {
          min: 1,
          max: 5,
          leftLabel: 'Muy bajo',
          rightLabel: 'Muy alto',
          startLabel: 'Muy bajo',
          endLabel: 'Muy alto'
        },
        choices: [],
        description: String(contentConfiguration?.description || '¿Qué tan valioso consideras este servicio?')
      }}
      currentStepKey={currentQuestionKey}
    />
  ),

  smartvoc_nps: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Pregunta NPS'),
        questionKey: currentQuestionKey,
        type: 'scale',
        config: {
          min: 0,
          max: 10,
          leftLabel: 'No lo recomendaría',
          rightLabel: 'Lo recomendaría',
          startLabel: 'No lo recomendaría',
          endLabel: 'Lo recomendaría'
        },
        choices: [],
        description: String(contentConfiguration?.description || '¿Qué tan probable es que recomiendes nuestro servicio?')
      }}
      currentStepKey={currentQuestionKey}
    />
  ),

  smartvoc_nev: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Pregunta NEV'),
        questionKey: currentQuestionKey,
        type: 'emoji',
        config: {
          emojis: ['😡', '😕', '😐', '🙂', '😄']
        },
        choices: [],
        description: String(contentConfiguration?.description || '¿Cómo te sientes con nuestro servicio?')
      }}
      currentStepKey={currentQuestionKey}
    />
  ),

  smartvoc_voc: ({ contentConfiguration, currentQuestionKey }) => (
    <QuestionComponent
      question={{
        title: String(contentConfiguration?.title || 'Pregunta VOC'),
        questionKey: currentQuestionKey,
        type: 'text',
        config: {
          placeholder: 'Escribe tu opinión aquí...'
        },
        choices: [],
        description: String(contentConfiguration?.description || '¿Qué opinas sobre nuestro servicio?')
      }}
      currentStepKey={currentQuestionKey}
    />
  ),

  cognitive: ({ contentConfiguration, currentQuestionKey }) => (
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
    />
  ),

  cognitive_navigation_flow: ({ contentConfiguration, currentQuestionKey }) => {
    return (
      <NavigationFlowTask
        stepConfig={{
          id: currentQuestionKey,
          type: 'cognitive_navigation_flow',
          title: String(contentConfiguration?.title || 'Flujo de Navegación'),
          description: String(contentConfiguration?.description || '¿En cuál de las siguientes pantallas encuentras el objetivo indicado?'),
          files: Array.isArray(contentConfiguration?.files) ? contentConfiguration.files : []
        }}
        currentQuestionKey={currentQuestionKey}
      />
    );
  },

  cognitive_preference_test: ({ contentConfiguration, currentQuestionKey }) => {
    console.log('[TestLayoutRenderer] 🎯 Renderizando cognitive_preference_test:', {
      currentQuestionKey,
      contentConfiguration,
      files: contentConfiguration?.files,
      filesCount: Array.isArray(contentConfiguration?.files) ? contentConfiguration.files.length : 0
    });

    // 🎯 AGREGAR URLs A LAS IMÁGENES
    const filesWithUrls = Array.isArray(contentConfiguration?.files)
      ? contentConfiguration.files.map((file: any) => ({
        ...file,
        url: file.url || file.fileUrl || `https://emotiox-v2-dev-storage.s3.us-east-1.amazonaws.com/${file.s3Key || file.id}`,
        fileUrl: file.fileUrl || file.url || `https://emotiox-v2-dev-storage.s3.us-east-1.amazonaws.com/${file.s3Key || file.id}`
      }))
      : [];

    console.log('[TestLayoutRenderer] 🎯 Archivos con URLs:', filesWithUrls);
    console.log('[TestLayoutRenderer] 🎯 Archivos originales:', contentConfiguration?.files);

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

  cognitive_ranking: ({ contentConfiguration, currentQuestionKey }) => {
    console.log('[TestLayoutRenderer] 🎯 Renderizando cognitive_ranking:', {
      contentConfiguration,
      currentQuestionKey,
      hasTitle: !!contentConfiguration?.title,
      hasDescription: !!contentConfiguration?.description,
      choices: contentConfiguration?.choices,
      choicesLength: Array.isArray(contentConfiguration?.choices) ? contentConfiguration.choices.length : 0,
      items: contentConfiguration?.items,
      itemsLength: Array.isArray(contentConfiguration?.items) ? contentConfiguration.items.length : 0
    });

    // 🎯 EXTRAER TEXTO DE LAS CHOICES
    const rankingItems = Array.isArray(contentConfiguration?.choices)
      ? contentConfiguration.choices.map((choice: any) => choice.text || choice.id)
      : [];

    console.log('[TestLayoutRenderer] 🎯 Items para ranking:', rankingItems);

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
          />
        </div>
      </div>
    );
  },

  cognitive_short_text: ({ contentConfiguration, currentQuestionKey }) => {
    console.log('[TestLayoutRenderer] 🧠 Renderizando cognitive_short_text:', {
      contentConfiguration,
      currentQuestionKey,
      hasTitle: !!contentConfiguration?.title,
      hasDescription: !!contentConfiguration?.description
    });

    const questionConfig = {
      title: String(contentConfiguration?.title || 'Respuesta Corta'),
      questionKey: currentQuestionKey,
      type: 'cognitive_short_text', // ✅ CAMBIADO: Usar el tipo correcto
      config: contentConfiguration,
      choices: [],
      description: String(contentConfiguration?.description || 'Escribe tu respuesta')
    };

    console.log('[TestLayoutRenderer] 🧠 Configuración de pregunta:', questionConfig);

    return (
      <QuestionComponent
        question={questionConfig}
        currentStepKey={currentQuestionKey}
      />
    );
  },

  cognitive_long_text: ({ contentConfiguration, currentQuestionKey }) => (
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
    />
  ),

  cognitive_multiple_choice: ({ contentConfiguration, currentQuestionKey }) => {
    console.log('[TestLayoutRenderer] 🎯 Renderizando cognitive_multiple_choice:', {
      contentConfiguration,
      currentQuestionKey,
      hasTitle: !!contentConfiguration?.title,
      hasDescription: !!contentConfiguration?.description,
      choices: contentConfiguration?.choices,
      choicesLength: Array.isArray(contentConfiguration?.choices) ? contentConfiguration.choices.length : 0
    });

    const questionConfig = {
      title: String(contentConfiguration?.title || 'Selección Múltiple'),
      questionKey: currentQuestionKey,
      type: 'choice',
      config: { ...contentConfiguration, multiple: true },
      choices: Array.isArray(contentConfiguration?.choices) ? contentConfiguration.choices : [],
      description: String(contentConfiguration?.description || 'Selecciona todas las opciones que apliquen')
    };

    console.log('[TestLayoutRenderer] 🎯 Configuración de pregunta multiple_choice:', questionConfig);

    return (
      <QuestionComponent
        question={questionConfig}
        currentStepKey={currentQuestionKey}
      />
    );
  },

  cognitive_single_choice: ({ contentConfiguration, currentQuestionKey }) => {
    console.log('[TestLayoutRenderer] 🎯 Renderizando cognitive_single_choice:', {
      contentConfiguration,
      currentQuestionKey,
      hasTitle: !!contentConfiguration?.title,
      hasDescription: !!contentConfiguration?.description,
      choices: contentConfiguration?.choices,
      choicesLength: Array.isArray(contentConfiguration?.choices) ? contentConfiguration.choices.length : 0
    });

    const questionConfig = {
      title: String(contentConfiguration?.title || 'Selección Única'),
      questionKey: currentQuestionKey,
      type: 'choice',
      config: { ...contentConfiguration, multiple: false },
      choices: Array.isArray(contentConfiguration?.choices) ? contentConfiguration.choices : [],
      description: String(contentConfiguration?.description || 'Selecciona una opción')
    };

    console.log('[TestLayoutRenderer] 🎯 Configuración de pregunta single_choice:', questionConfig);

    return (
      <QuestionComponent
        question={questionConfig}
        currentStepKey={currentQuestionKey}
      />
    );
  },

  cognitive_linear_scale: ({ contentConfiguration, currentQuestionKey }) => (
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
    />
  ),

  cognitive_rating: ({ contentConfiguration, currentQuestionKey }) => (
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
    />
  ),
};

// 🎯 COMPONENTE PARA PASOS DESCONOCIDOS
const UnknownStepComponent: React.FC<{ data: unknown }> = ({ data }) => (
  <div className='flex flex-col items-center justify-center h-full gap-10'>
    <h2 className='text-2xl font-bold'>Componente desconocido</h2>
    <p>No se pudo renderizar este tipo de componente</p>
    <pre className='text-sm text-gray-500'>{JSON.stringify(data, null, 2)}</pre>
  </div>
);

const ThankYouScreenComponent: React.FC<{
  contentConfiguration: Record<string, unknown>;
  currentQuestionKey: string;
  quotaResult?: any; // 🎯 NUEVO: Prop para información de cuotas
  eyeTrackingConfig?: any; // 🎯 NUEVO: Prop para configuración de eye-tracking
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
          console.error('❌ ThankYouScreenComponent - Error enviando a module-responses:', error);
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
        } catch (error) {
          console.warn('No se pudo obtener información de ubicación:', error);
          return {
            country: 'Chile',
            city: 'Valparaíso',
            ip: 'N/A'
          };
        }
      };

      sendToAPI();
    }
  }, [currentQuestionKey, setFormData, researchId, participantId]);

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



  // 🎯 MOSTRAR LINK DE COMPLETADO SI EXISTE
  const hasCompleteLink = eyeTrackingConfig?.backlinks?.complete;

  return (
    <div className='flex flex-col items-center justify-center h-full w-full'>
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className='text-2xl font-bold mb-2'>
          {String(contentConfiguration?.title || 'Gracias por participar')}
        </h2>
        <p className='text-center text-gray-600 mb-6'>
          {String(contentConfiguration?.message || 'Agradecemos tus respuestas')}
        </p>

        {/* 🎯 LINK DE COMPLETADO */}
        {hasCompleteLink && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Información adicional
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Para más información sobre esta investigación, visita:
            </p>
            <a
              href={eyeTrackingConfig?.backlinks?.complete}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver información de la investigación
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

const TestLayoutRenderer: React.FC = () => {
  const { researchId, participantId } = useTestStore();
  const { currentQuestionKey, goToNextStep, updateBackendResponses } = useStepStore();
  const { setFormData, getFormData } = useFormDataStore();
  const quotaResult = useFormDataStore(state => state.quotaResult);

  // 🎯 HOOK WEBSOCKET PARA NOTIFICACIONES
  const { sendParticipantLogin, isConnected } = useMonitoringWebSocket();

  // 🎯 DEBUG HOOK PARA DIAGNOSTICAR PROBLEMAS
  useDebugSteps();

  // 🎯 VERIFICACIÓN MÓVIL EN STEPS
  const {
    isBlocked,
    deviceType,
    allowMobile,
    configFound,
    isLoading: isLoadingMobileCheck,
    error: mobileCheckError,
    shouldShowBlockScreen
  } = useMobileStepVerification(researchId);

  // 🎯 OBTENER CONFIGURACIÓN DE EYE-TRACKING
  const { data: eyeTrackingConfig } = useEyeTrackingConfigQuery(researchId || '');
  const shouldTrackUserJourney = eyeTrackingConfig?.parameterOptions?.saveUserJourney || false;

  // 🎯 TRACKING DE RECORRIDO NO INTRUSIVO
  const { trackStepVisit, isTracking: isJourneyTracking } = useUserJourneyTracking({
    enabled: shouldTrackUserJourney,
    researchId
  });

  // 🎯 QUERY DE FORMS - SIEMPRE EJECUTAR
  const { data: formsData, isLoading, error } = useAvailableFormsQuery(researchId || '');

  // 🎯 QUERY DE MODULE RESPONSES
  const { data: moduleResponses } = useModuleResponsesQuery(researchId || '', participantId || '');

  // 🎯 ENVIAR EVENTO DE LOGIN CUANDO EL PARTICIPANTE INICIA LA SESIÓN
  useEffect(() => {
    if (researchId && participantId && isConnected) {
      console.log('[TestLayoutRenderer] 🎯 Participante iniciando sesión:', {
        researchId,
        participantId,
        isConnected
      });

      // 🎯 ENVIAR EVENTO DE LOGIN PARA NOTIFICAR AL FRONTEND
      sendParticipantLogin(participantId, 'participant@test.com'); // Email por defecto para participantes existentes

      console.log('[TestLayoutRenderer] ✅ Evento PARTICIPANT_LOGIN enviado para participante existente');
    } else {
      console.log('[TestLayoutRenderer] ⏳ Esperando conexión WebSocket:', {
        researchId: !!researchId,
        participantId: !!participantId,
        isConnected
      });
    }
  }, [researchId, participantId, isConnected, sendParticipantLogin]);

  // 🎯 EFFECTS DESPUÉS DE TODOS LOS HOOKS
  useEffect(() => {
    if (moduleResponses?.responses && researchId && participantId) {
      console.log('[TestLayoutRenderer] 🎯 Procesando respuestas del backend:', moduleResponses.responses);

      const backendResponses = moduleResponses.responses.map((response: any) => {
        return {
          questionKey: response.questionKey,
          response: response.response || {}
        };
      });

      console.log('[TestLayoutRenderer] 🎯 Actualizando store de steps con:', backendResponses);
      updateBackendResponses(backendResponses);

      // 🎯 SINCRONIZAR CON FORM DATA STORE
      const { setFormData } = useFormDataStore.getState();
      backendResponses.forEach((backendResponse: any) => {
        if (backendResponse.questionKey && backendResponse.response) {
          // 🎯 EXTRAER VALOR DE LA RESPUESTA
          let value = null;
          if (backendResponse.response.value !== undefined) {
            value = backendResponse.response.value;
          } else if (backendResponse.response.selectedValue !== undefined) {
            value = backendResponse.response.selectedValue;
          } else if (backendResponse.response.response !== undefined) {
            value = backendResponse.response.response;
          } else if (backendResponse.response.age !== undefined) {
            // 🎯 CASO ESPECIAL PARA DEMOGRÁFICOS
            value = backendResponse.response.age;
          }

          // 🎯 GUARDAR EN FORM DATA STORE
          const formDataToSave = {
            value,
            selectedValue: value,
            response: backendResponse.response,
            timestamp: backendResponse.response.timestamp || new Date().toISOString()
          };

          // 🎯 PARA DEMOGRÁFICOS, GUARDAR TAMBIÉN EN EL FORMATO ESPERADO
          if (backendResponse.questionKey === 'demographics') {
            setFormData('demographics', {
              ...formDataToSave,
              age: value // 🎯 GUARDAR TAMBIÉN COMO age PARA COMPATIBILIDAD
            });
          } else {
            setFormData(backendResponse.questionKey, formDataToSave);
          }

          console.log('[TestLayoutRenderer] 🎯 Sincronizando respuesta:', {
            questionKey: backendResponse.questionKey,
            value,
            response: backendResponse.response,
            savedToFormData: backendResponse.questionKey === 'demographics' ? 'demographics' : backendResponse.questionKey
          });
        }
      });
    }
  }, [moduleResponses?.responses, researchId, participantId, updateBackendResponses]);

  // 🎯 TRACKING DE VISITA DE STEP
  useEffect(() => {
    if (currentQuestionKey && shouldTrackUserJourney) {
      trackStepVisit(currentQuestionKey, 'visit');
    }
  }, [currentQuestionKey, shouldTrackUserJourney, trackStepVisit]);

  // 🎯 INICIALIZAR STEPS CUANDO SE OBTIENEN LOS FORMS
  useEffect(() => {
    if (formsData?.steps && formsData.steps.length > 0) {
      console.log('[TestLayoutRenderer] 🎯 Inicializando steps:', {
        steps: formsData.steps,
        currentQuestionKey
      });

      const { setSteps } = useStepStore.getState();
      // Convertir strings a Step objects
      const stepObjects = formsData.steps.map(questionKey => ({
        questionKey,
        title: questionKey
      }));
      setSteps(stepObjects);
    }
  }, [formsData?.steps]);

  // 🎯 LÓGICA DE REDIRECCIÓN DESPUÉS DE HOOKS
  if (!researchId) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlResearchId = urlParams.get('researchId');
    const storedResearchId = localStorage.getItem('researchId');

    if (urlResearchId) {
      // Redirigir a login CON el researchId de la URL
      window.location.href = `/?researchId=${urlResearchId}`;
    } else if (storedResearchId) {
      // Redirigir a login CON el researchId del localStorage
      window.location.href = `/?researchId=${storedResearchId}`;
    } else {
      // Si no hay researchId en ningún lado, ir a error
      window.location.href = '/error-no-research-id';
    }
    return <div>Redirigiendo al login...</div>;
  }

  // 🚨 BLOQUEAR STEPS SI ES MÓVIL NO PERMITIDO
  if (shouldShowBlockScreen && (deviceType === 'mobile' || deviceType === 'tablet')) {
    return (
      <MobileStepBlockedScreen
        deviceType={deviceType as 'mobile' | 'tablet'}
        researchId={researchId}
        currentStep={currentQuestionKey}
      />
    );
  }

  // Mostrar loading mientras se verifica la configuración móvil
  if (isLoadingMobileCheck) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Verificando configuración...</p>
      </div>
    );
  }

  // Mostrar error si falla la verificación móvil
  if (mobileCheckError) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error de Verificación</h2>
          <p className="text-gray-600 mb-4">No se pudo verificar la configuración del dispositivo.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Log para debugging
  console.log('[TestLayoutRenderer] Estado de verificación móvil:', {
    currentQuestionKey,
    isBlocked,
    deviceType,
    allowMobile,
    configFound,
    shouldShowBlockScreen,
    researchId
  });

  if (isLoading) return <div className='flex flex-col items-center justify-center h-full'>Cargando...</div>;
  if (error) return <div className='flex flex-col items-center justify-center h-full'>Error: {error.message}</div>;
  if (!currentQuestionKey) {
    console.log('[TestLayoutRenderer] ❌ No hay currentQuestionKey:', { currentQuestionKey });
    return <div className='flex flex-col items-center justify-center h-full'>No se encontró información para este step</div>;
  }

  console.log('[TestLayoutRenderer] 🔍 Buscando step data:', {
    currentQuestionKey,
    formsData: formsData ? {
      steps: formsData.steps?.length,
      stepsConfiguration: formsData.stepsConfiguration?.length,
      hasSteps: !!formsData.steps,
      hasConfig: !!formsData.stepsConfiguration
    } : 'NO DATA'
  });

  const currentStepData = getCurrentStepData(formsData, currentQuestionKey);

  console.log('[TestLayoutRenderer] 📊 Step data encontrado:', {
    currentQuestionKey,
    currentStepData: currentStepData ? {
      questionKey: currentStepData.questionKey,
      hasContent: !!currentStepData.contentConfiguration,
      contentKeys: currentStepData.contentConfiguration ? Object.keys(currentStepData.contentConfiguration) : []
    } : 'NO STEP DATA'
  });

  if (!currentStepData) {
    console.log('[TestLayoutRenderer] ❌ No se encontró step data para:', currentQuestionKey);
    return <div>No se encontró información para este step</div>;
  }

  const { contentConfiguration } = currentStepData;
  const questionType = getQuestionType(currentQuestionKey);

  // 🎯 VERIFICAR SI HAY PREGUNTAS CONFIGURADAS PARA DEMOGRAPHICS
  const hasConfiguredQuestions = questionType === 'demographics' ?
    Object.values(contentConfiguration?.demographicQuestions || {}).some((q: any) => q?.enabled) :
    true;

  const renderedForm =
    RENDERERS[questionType]?.({ contentConfiguration, currentQuestionKey, quotaResult, eyeTrackingConfig }) ||
    <UnknownStepComponent
      data={{
        questionKey: currentQuestionKey,
        contentConfiguration,
        message: `No se encontró un componente específico para: ${currentQuestionKey}`
      }}
    />;

  const isWelcomeScreen = currentQuestionKey === 'welcome_screen';
  const isThankYouScreen = currentQuestionKey === 'thank_you_screen';
  const isConfigurationPending = questionType === 'demographics' && !hasConfiguredQuestions;

  const formData = getFormData(currentQuestionKey);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {renderedForm}
      </div>
      {/* 🎯 OCULTAR BOTÓN SI NO HAY CONFIGURACIÓN */}
      {!isWelcomeScreen && !isThankYouScreen && !isConfigurationPending && (
        <ButtonSteps
          currentQuestionKey={currentQuestionKey}
          formData={formData}
          isWelcomeScreen={isWelcomeScreen}
        />
      )}
    </div>
  );
};

export default TestLayoutRenderer;
