import React, { useCallback, useEffect, useState } from 'react';
import { useSaveModuleResponseMutation } from '../../hooks/useApiQueries';
import { useEyeTrackingConfigQuery } from '../../hooks/useEyeTrackingConfigQuery';
import { useFormLoadingState } from '../../hooks/useFormLoadingState';
import { useUserJourneyTracking } from '../../hooks/useUserJourneyTracking';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
import { getDeviceInfo, getLocationInfo } from '../../utils/deviceUtils';
import { LoadingModal } from './LoadingModal';
import { EmotionHierarchyQuestion, ScaleRangeQuestion, SingleAndMultipleChoiceQuestion, VOCTextQuestion } from './QuestionesComponents';
import { QuestionComponentProps, ScreenStep } from './types';
import { QUESTION_TYPE_MAP } from './utils';

export const QuestionComponentOLD: React.FC<QuestionComponentProps> = ({
  question,
  currentStepKey
}) => {

  const questionType = question.type || QUESTION_TYPE_MAP[currentStepKey as keyof typeof QUESTION_TYPE_MAP] || 'pending';
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [textValue, setTextValue] = useState<string>('');

  const handleDataLoaded = useCallback((data: Record<string, unknown>) => {
    if (data.selectedValue && typeof data.selectedValue === 'string') {
      setSelectedValue(data.selectedValue);
    }
    if (data.textValue && typeof data.textValue === 'string') {
      setTextValue(data.textValue);
    }
  }, [setSelectedValue, setTextValue]);

  const {
    isLoading,
    hasLoadedData,
    formValues,
    saveToStore
  } = useFormLoadingState({
    questionKey: currentStepKey,
    onDataLoaded: handleDataLoaded
  });

  const saveToStoreWithValues = useCallback((data: Record<string, unknown>) => {
    saveToStore(data);
  }, [saveToStore]);

  useEffect(() => {
    setSelectedValue('');
    setTextValue('');
  }, [currentStepKey]);

  useEffect(() => {
    if (formValues && Object.keys(formValues).length > 0) {
      if (formValues.selectedValue && typeof formValues.selectedValue === 'string') {
        setSelectedValue(formValues.selectedValue);
      }
      if (formValues.textValue && typeof formValues.textValue === 'string') {
        setTextValue(formValues.textValue);
      }
    }
  }, [formValues]);

  if (isLoading) {
    return <LoadingModal />;
  }

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    saveToStoreWithValues({
      selectedValue: value,
      textValue: textValue
    });
  };

  const handleTextChange = (value: string) => {
    setTextValue(value);
    saveToStoreWithValues({
      selectedValue: selectedValue,
      textValue: value
    });
  };

  const renderQuestion = () => {
    switch (questionType) {
      case 'smartvoc_nev':
      case 'detailed':
      case 'emojis':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <p className="text-gray-600 mb-6">Esta pregunta SmartVOC se maneja en QuestionComponent.tsx</p>
            </div>
          </div>
        );
      case 'scale':
        return (
          <ScaleRangeQuestion
            min={(question.config?.min as number) || 1}
            max={(question.config?.max as number) || 5}
            leftLabel={(question.config?.startLabel as string) || 'Sí'}
            rightLabel={(question.config?.endLabel as string) || 'No'}
            value={selectedValue ? parseInt(selectedValue, 10) : undefined}
            onChange={(value) => handleValueChange(value.toString())}
          />
        );

      case 'hierarchy':
        return (
          <EmotionHierarchyQuestion
            selectedCluster={selectedValue}
            onClusterSelect={(clusterId) => handleValueChange(clusterId)}
          />
        );
      case 'text':
        return (
          <VOCTextQuestion
            value={textValue}
            onChange={handleTextChange}
            placeholder={(question.config?.placeholder as string) || 'Escribe tu respuesta aquí...'}
          />
        );
      case 'choice':
        return (
          <SingleAndMultipleChoiceQuestion
            choices={question.choices || []}
            value={selectedValue}
            onChange={(value) => {
              if (typeof value === 'string') {
                handleValueChange(value);
              } else if (Array.isArray(value) && value.length > 0) {
                handleValueChange(value[0]);
              }
            }}
            multiple={(question.config?.multiple as boolean) || false}
          />
        );
      case 'smartvoc':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <p className="text-gray-600 mb-6">Esta pregunta SmartVOC se maneja en QuestionComponent.tsx</p>
            </div>
          </div>
        );
      case 'demographics':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <p className="text-gray-600 mb-6">{question.description}</p>
              <div className="flex flex-col gap-4 w-full max-w-md">
                {question.choices?.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleValueChange(choice.id)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors text-left ${selectedValue === choice.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'cognitive_short_text':
      case 'cognitive_long_text':
      case 'cognitive_single_choice':
      case 'cognitive_multiple_choice':
      case 'cognitive_linear_scale':
      case 'cognitive_rating':
      case 'cognitive_ranking':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <p className="text-gray-600 mb-6">{question.description}</p>
              {question.config?.type === 'text' ? (
                <textarea
                  value={textValue}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={(question.config?.placeholder as string) || 'Escribe tu respuesta aquí...'}
                  className="w-full max-w-md p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              ) : question.config?.type === 'choice' ? (
                <div className="flex flex-col gap-3 w-full max-w-md">
                  {question.choices?.map((choice) => (
                    <button
                      key={choice.id}
                      onClick={() => handleValueChange(choice.id)}
                      className={`px-6 py-3 rounded-lg font-semibold transition-colors text-left ${selectedValue === choice.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {choice.text}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleValueChange(value.toString())}
                      className={`px-6 py-3 rounded-lg font-semibold transition-colors ${selectedValue === value.toString()
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'cognitive_navigation_flow':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <p className="text-gray-600 mb-6">{question.description}</p>
              <div className="bg-gray-100 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">Componente de navegación en desarrollo</p>
                <button
                  onClick={() => handleValueChange('completed')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Completar Navegación
                </button>
              </div>
            </div>
          </div>
        );
      case 'screen':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <p className="text-gray-600 mb-6">{question.description}</p>
              <button
                onClick={() => handleValueChange('viewed')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        );
      case 'pending':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-600 mb-6">{question.description}</p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">TIPO NO MANEJADO: "{questionType}"</h2>
              <p className="text-gray-600">
                El tipo de pregunta "{questionType}" aún no está implementado
              </p>
              <p className="text-sm text-gray-500 mt-2">QuestionKey: {currentStepKey}</p>
              <p className="text-sm text-red-500 mt-2">Tipo exacto: "{questionType}"</p>
            </div>
          </div>
        );
    }
  };


  const renderedContent = renderQuestion();


  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{question.title}</h2>
        <p className="text-gray-600 mb-4">{question.description}</p>
        {hasLoadedData && (
          <p className="text-sm text-green-600">✓ Tus respuestas han sido cargadas</p>
        )}
      </div>

      {renderedContent}
    </div>
  );
};

export const ScreenComponent: React.FC<{ data: ScreenStep; onContinue?: () => void }> = ({ data }) => {
  const { setFormData } = useFormDataStore();
  const { researchId, participantId } = useTestStore();
  const saveModuleResponseMutation = useSaveModuleResponseMutation();

  const { data: eyeTrackingConfig } = useEyeTrackingConfigQuery(researchId || '');
  const shouldTrackUserJourney = eyeTrackingConfig?.parameterOptions?.saveUserJourney || false;

  const { trackStepVisit } = useUserJourneyTracking({
    enabled: shouldTrackUserJourney,
    researchId
  });

  const handleContinue = async () => {
    const store = useStepStore.getState();
    const currentQuestionKey = store.currentQuestionKey;

    if (currentQuestionKey && researchId && participantId) {
      setFormData(currentQuestionKey, {
        visited: true,
        timestamp: new Date().toISOString()
      });

      if (shouldTrackUserJourney) {
        trackStepVisit(currentQuestionKey, 'visit');
      }

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
      } catch {}
    }

    store.goToNextStep();
  };

  useEffect(() => {
    const store = useStepStore.getState();
    const currentQuestionKey = store.currentQuestionKey;

    if (currentQuestionKey && shouldTrackUserJourney) {
      trackStepVisit(currentQuestionKey, 'visit');
    }
  }, [shouldTrackUserJourney, trackStepVisit]);

  return (
    <div className='flex flex-col items-center justify-center h-full w-full'>
      <h2 className='text-2xl font-bold mb-2'>{data.title || 'Pantalla'}</h2>
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

export const UnknownStepComponent: React.FC<{ data: unknown }> = ({ data }) => (
  <div className='flex flex-col items-center justify-center h-full gap-10'>
    <h2 className='text-2xl font-bold'>Componente desconocido</h2>
    <p>No se pudo renderizar este tipo de componente</p>
    <pre className='text-sm text-gray-500'>{JSON.stringify(data, null, 2)}</pre>
  </div>
);
