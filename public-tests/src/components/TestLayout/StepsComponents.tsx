import React, { useCallback, useEffect, useState } from 'react';
import { useSaveModuleResponseMutation } from '../../hooks/useApiQueries';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
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

  // 🎯 USAR EL STORE PARA GUARDAR RESPUESTAS
  const { setFormData, getFormData } = useFormDataStore();
  const formData = getFormData(currentStepKey);

  // 🎯 FUNCIÓN PARA GUARDAR EN EL STORE (ESTABILIZADA CON USECALLBACK)
  const saveToStore = useCallback((data: Record<string, unknown>) => {
    setFormData(currentStepKey, data);
  }, [currentStepKey, setFormData]);

  // 🎯 INICIALIZAR VALORES DESDE EL STORE Y BACKEND
  useEffect(() => {
    if (formData) {
      if (formData.selectedValue && typeof formData.selectedValue === 'string') {
        setSelectedValue(formData.selectedValue);
      }
      if (formData.textValue && typeof formData.textValue === 'string') {
        setTextValue(formData.textValue);
      }
    }
  }, [formData]);

  useEffect(() => {
    // Buscar respuesta del backend para este step usando el store
    const store = useStepStore.getState();
    const backendResponse = store.backendResponses.find(
      (r: BackendResponse) => r.questionKey === currentStepKey
    );

    if (backendResponse?.response) {

      // Cargar valores desde la respuesta del backend
      if (backendResponse.response.selectedValue && typeof backendResponse.response.selectedValue === 'string') {
        setSelectedValue(backendResponse.response.selectedValue);
        saveToStore({ selectedValue: backendResponse.response.selectedValue });
      }
      if (backendResponse.response.textValue && typeof backendResponse.response.textValue === 'string') {
        setTextValue(backendResponse.response.textValue);
        saveToStore({ textValue: backendResponse.response.textValue });
      }
    }
  }, [currentStepKey, saveToStore]);

  const QuestionWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
      className='flex flex-col items-center justify-center h-full gap-10'
      data-question-key={currentStepKey}
      data-selected-value={selectedValue}
      data-text-value={textValue}
    >
      <div className='mb-2 text-center'>
        <h3 className='text-lg font-semibold mb-2'>
          {question.title || question.questionKey || 'Pregunta'}
        </h3>
      </div>
      {children}
    </div>
  );

  if (!questionType) {
    return (
      <div className='flex flex-col items-center justify-center h-full gap-4'>
        <div className='text-center'>
          <h3 className='text-lg font-semibold text-red-600 mb-2'>Tipo de pregunta no reconocido</h3>
          <p className='text-sm text-gray-600'>No se pudo determinar el tipo de pregunta para: {currentStepKey}</p>
        </div>
      </div>
    );
  }

  switch (questionType) {
    case 'scale':
      return (
        <QuestionWrapper>
          <ScaleRangeQuestion
            min={
              (question.config?.min as number) ||
              ((question.config?.scaleRange as { start?: number })?.start as number) ||
              1
            }
            max={
              (question.config?.max as number) ||
              ((question.config?.scaleRange as { end?: number })?.end as number) ||
              10
            }
            leftLabel={question.config?.startLabel as string}
            rightLabel={question.config?.endLabel as string}
            value={selectedValue ? parseInt(selectedValue, 10) : undefined}
            onChange={(value) => {
              const stringValue = String(value);
              setSelectedValue(stringValue);
              saveToStore({ selectedValue: stringValue });
            }}
          />
        </QuestionWrapper>
      );

    case 'emoji':
      return (
        <QuestionWrapper>
          <EmojiRangeQuestion
            value={selectedValue ? parseInt(selectedValue, 10) : undefined}
            onChange={(value) => {
              const stringValue = String(value);
              setSelectedValue(stringValue);
              saveToStore({ selectedValue: stringValue });
            }}
          />
        </QuestionWrapper>
      );

    case 'text':
      return (
        <QuestionWrapper>
          <VOCTextQuestion
            value={textValue}
            onChange={(value) => {
              setTextValue(value);
              saveToStore({ textValue: value });
            }}
            placeholder={question.config?.placeholder as string}
          />
        </QuestionWrapper>
      );

    case 'choice':
      return (
        <QuestionWrapper>
          <SingleAndMultipleChoiceQuestion
            choices={question.choices || []}
            value={selectedValue}
            onChange={(value) => {
              if (typeof value === 'string') {
                setSelectedValue(value);
                saveToStore({ selectedValue: value });
              } else if (Array.isArray(value) && value.length > 0) {
                const stringValue = String(value[0]);
                setSelectedValue(stringValue);
                saveToStore({ selectedValue: stringValue });
              }
            }}
            multiple={question.config?.multiple as boolean}
          />
        </QuestionWrapper>
      );

    case 'smartvoc':
      return (
        <QuestionWrapper>
          <div className='text-center'>
            <h3 className='text-lg font-semibold text-blue-600 mb-2'>
              {question.title || 'Pregunta SmartVOC'}
            </h3>
            <div className='bg-gray-50 p-4 rounded-lg'>
              <div className='mt-4 space-y-2'>
                {[1, 2, 3, 4, 5].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      const value = String(option);
                      setSelectedValue(value);
                      saveToStore({ selectedValue: value });
                    }}
                    className={`w-full p-3 rounded border transition-colors ${
                      selectedValue === String(option)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Opción {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </QuestionWrapper>
      );

    case 'pending':
      return (
        <QuestionWrapper>
          <div className='text-center'>
            <h3 className='text-lg font-semibold text-yellow-600 mb-2'>Componente en desarrollo</h3>
            <p className='text-sm text-gray-600'>El componente para {currentStepKey} está pendiente de implementación</p>
          </div>
        </QuestionWrapper>
      );

    default:
      return (
        <QuestionWrapper>
          <div className='text-center'>
            <h3 className='text-lg font-semibold text-red-600 mb-2'>Componente no implementado</h3>
            <p className='text-sm text-gray-600'>No existe implementación para el tipo: {questionType}</p>
          </div>
        </QuestionWrapper>
      );
  }
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
