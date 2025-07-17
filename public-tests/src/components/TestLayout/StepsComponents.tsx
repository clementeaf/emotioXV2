import React, { useCallback, useEffect, useState } from 'react';
import { useSaveModuleResponseMutation } from '../../hooks/useApiQueries';
import { useFormLoadingState } from '../../hooks/useFormLoadingState';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
import { LoadingModal } from './LoadingModal';
import { EmojiRangeQuestion, ScaleRangeQuestion, SingleAndMultipleChoiceQuestion, VOCTextQuestion } from './QuestionesComponents';
import { QuestionComponentProps, ScreenStep } from './types';
import { QUESTION_TYPE_MAP } from './utils';

// 🎯 INTERFAZ PARA RESPUESTAS DEL BACKEND
interface BackendResponse {
  questionKey: string;
  response: {
    selectedValue?: string;
    textValue?: string;
    [key: string]: unknown;
  };
}

export const QuestionComponent: React.FC<QuestionComponentProps> = ({
  question,
  currentStepKey
}) => {
  const questionType = QUESTION_TYPE_MAP[currentStepKey as keyof typeof QUESTION_TYPE_MAP] || 'pending';
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [textValue, setTextValue] = useState<string>('');

  // 🎯 USAR EL NUEVO HOOK DE LOADING STATE
  const {
    isLoading,
    hasLoadedData,
    formValues,
    handleInputChange,
    saveToStore
  } = useFormLoadingState({
    questionKey: currentStepKey,
    onDataLoaded: (data) => {
      // Cargar valores específicos cuando se cargan los datos
      if (data.selectedValue && typeof data.selectedValue === 'string') {
        setSelectedValue(data.selectedValue);
      }
      if (data.textValue && typeof data.textValue === 'string') {
        setTextValue(data.textValue);
      }
    }
  });

  // 🎯 FUNCIÓN PARA GUARDAR EN EL STORE (ESTABILIZADA CON USECALLBACK)
  const saveToStoreWithValues = useCallback((data: Record<string, unknown>) => {
    saveToStore(data);
  }, [saveToStore]);

  // 🎯 INICIALIZAR VALORES DESDE EL STORE Y BACKEND
  useEffect(() => {
    if (formValues) {
      if (formValues.selectedValue && typeof formValues.selectedValue === 'string') {
        setSelectedValue(formValues.selectedValue);
      }
      if (formValues.textValue && typeof formValues.textValue === 'string') {
        setTextValue(formValues.textValue);
      }
    }
  }, [formValues]);

  // 🎯 MODAL DE CARGA
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
      case 'emoji':
        return (
          <EmojiRangeQuestion
            emojis={(question.config?.emojis as string[]) || ['😡', '😕', '😐', '🙂', '😄']}
            value={selectedValue ? parseInt(selectedValue, 10) : undefined}
            onChange={(value) => handleValueChange(value.toString())}
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
              <h2 className="text-2xl font-bold mb-4">{question.title}</h2>
              <p className="text-gray-600 mb-6">{question.description}</p>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleValueChange(value.toString())}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      selectedValue === value.toString()
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Componente en desarrollo</h2>
              <p className="text-gray-600">
                El tipo de pregunta "{questionType}" aún no está implementado
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{question.title}</h2>
        <p className="text-gray-600 mb-4">{question.description}</p>
        {hasLoadedData && (
          <p className="text-sm text-green-600">✓ Tus respuestas han sido cargadas</p>
        )}
      </div>
      {renderQuestion()}
    </div>
  );
};

export const ScreenComponent: React.FC<{ data: ScreenStep; onContinue?: () => void }> = ({ data }) => {
  const { setFormData } = useFormDataStore();
  const { researchId, participantId } = useTestStore();
  const saveModuleResponseMutation = useSaveModuleResponseMutation();

  const handleContinue = async () => {
    const store = useStepStore.getState();
    const currentQuestionKey = store.currentQuestionKey;

    if (currentQuestionKey && researchId && participantId) {
      // 🎯 GUARDAR EN FORMDATA
      setFormData(currentQuestionKey, {
        visited: true,
        timestamp: new Date().toISOString()
      });

      try {
        const timestamp = new Date().toISOString();
        const createData = {
          researchId: researchId,
          participantId: participantId,
          questionKey: currentQuestionKey,
          responses: [{
            questionKey: currentQuestionKey,
            response: { visited: true },
            timestamp,
            createdAt: timestamp,
            updatedAt: undefined
          }],
          metadata: {}
        };

        await saveModuleResponseMutation.mutateAsync(createData);
      } catch (error) {
        console.error('❌ ScreenComponent - Error enviando a module-responses:', error);
      }
    }

    // Navegar al siguiente step
    store.goToNextStep();
  };

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
