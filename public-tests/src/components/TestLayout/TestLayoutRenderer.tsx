import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useParticipantData } from '../../hooks/useParticipantData';
import { useParticipantStore } from '../../stores/participantStore';
import { useStepStore } from '../../stores/useStepStore';
import { ErrorState, LoadingState, NoStepData, NoStepSelected } from './CommonStates';
import { DemographicForm } from './DemographicForm';
import { QuestionComponent, ScreenComponent, UnknownStepComponent } from './StepsComponents';
import { DemographicQuestion, Question, ScreenStep, TestLayoutRendererProps } from './types';
import { findStepByQuestionKey, getStepType } from './utils';

const TestLayoutRenderer: React.FC<TestLayoutRendererProps> = ({ data, isLoading, error, sidebarSteps = [] }) => {

  const currentStepKey = useStepStore(state => state.currentStepKey);
  const setStep = useStepStore(state => state.setStep);
  const { researchId, participantId } = useParticipantStore();
  const { sendResponse, getResponse, updateResponse, deleteAllResponses, metadata } = useParticipantData();
  const [hasPreviousResponse, setHasPreviousResponse] = useState(false);
  const [previousResponse, setPreviousResponse] = useState<Record<string, unknown> | undefined>(undefined);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const checkPreviousResponse = async () => {
      if (!currentStepKey) return;

      try {
        // Obtener la respuesta usando el currentStepKey específico
        const previousResponse = await getResponse(currentStepKey);

        if (previousResponse) {
          setHasPreviousResponse(true);
          setPreviousResponse(previousResponse as Record<string, unknown>);
          console.log(`[TestLayoutRenderer] ✅ Respuesta para ${currentStepKey} encontrada:`, previousResponse);
        } else {
          setHasPreviousResponse(false);
          setPreviousResponse(undefined);
          console.log(`[TestLayoutRenderer] No hay respuesta previa para ${currentStepKey}`);
        }
      } catch (error) {
        console.error(`[TestLayoutRenderer] Error verificando respuesta previa para ${currentStepKey}:`, error);
        setHasPreviousResponse(false);
        setPreviousResponse(undefined);
      }
    };

    checkPreviousResponse();
  }, [currentStepKey, getResponse]);

  const goToNextStep = () => {
    if (!sidebarSteps || sidebarSteps.length === 0 || !currentStepKey) return;

    const currentIndex = sidebarSteps.findIndex(step => step.questionKey === currentStepKey);
    if (currentIndex >= 0 && currentIndex < sidebarSteps.length - 1) {
      const nextStepKey = sidebarSteps[currentIndex + 1].questionKey;
      if (typeof nextStepKey === 'string') {
        console.log('[TestLayoutRenderer] Avanzando de', currentStepKey, 'a', nextStepKey);
        setStep(nextStepKey);
      }
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState />;
  }

  const currentStepData = findStepByQuestionKey(data, currentStepKey);

  if (!currentStepKey) {
    return <NoStepSelected />;
  }
  if (!currentStepData) {
    return <NoStepData />;
  }

  const stepType = getStepType(currentStepData);
  let renderedForm: React.ReactNode = null;

  const getFormValues = (): unknown => {
    const formData = new FormData(document.querySelector('form') as HTMLFormElement);
    const values: Record<string, unknown> = {};

    if (formData) {
      for (const [key, value] of formData.entries()) {
        values[key] = value;
      }
    }

    if (Object.keys(values).length === 0) {
      return {
        submitted: true,
        timestamp: new Date().toISOString(),
        stepType: stepType,
        stepTitle: currentStepKey
      };
    }

    return {
      ...values,
      submitted: true,
      timestamp: new Date().toISOString(),
      stepType: stepType,
      stepTitle: currentStepKey
    };
  };

  const handleSubmitResponse = async (response?: unknown) => {
    if (!researchId || !participantId) {
      console.error('[TestLayoutRenderer] ❌ Faltan researchId o participantId para guardar respuesta');
      toast.error('Error: Faltan datos de investigación o participante');
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      const responseData = response || getFormValues();

      const sentResponse = await sendResponse(currentStepKey, responseData);

      if (sentResponse) {
        console.log('[TestLayoutRenderer] ✅ Respuesta enviada exitosamente:', sentResponse);

        toast.success('Respuesta guardada exitosamente');

        setIsSuccess(true);

        setTimeout(() => {
          setIsSuccess(false);
          goToNextStep();
          console.log('[TestLayoutRenderer] Pasando a la siguiente pregunta...');
        }, 1500);

        const receivedResponse = await getResponse(currentStepKey);
        if (receivedResponse) {
          console.log('[TestLayoutRenderer] ✅ Respuesta recibida de vuelta:', receivedResponse);
        }
      } else {
        console.error('[TestLayoutRenderer] ❌ Error enviando respuesta');
        toast.error('Error al enviar respuesta');
      }
    } catch (error) {
      console.error('[TestLayoutRenderer] ❌ Error:', error);
      toast.error('Error al enviar respuesta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateResponse = async (newResponse: unknown) => {
    if (!researchId || !participantId) {
      console.error('[TestLayoutRenderer] ❌ Faltan researchId o participantId para actualizar respuesta');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedResponse = await updateResponse(currentStepKey, newResponse);

      if (updatedResponse) {
        toast.success('Respuesta actualizada exitosamente');
      } else {
        console.error('[TestLayoutRenderer] ❌ Error actualizando respuesta');
        toast.error('Error al actualizar respuesta');
      }
    } catch (error) {
      console.error('[TestLayoutRenderer] ❌ Error:', error);
      toast.error('Error al actualizar respuesta');
    } finally {
      setIsSubmitting(false);
    }
  };

  switch (stepType) {
    case 'demographics': {
      const { demographicQuestions } = currentStepData as { demographicQuestions: DemographicQuestion[] };
      console.log('[TestLayoutRenderer] Renderizando demographics con previousResponse:', previousResponse);
      renderedForm = <DemographicForm questions={demographicQuestions} previousResponse={previousResponse} />;
      break;
    }
    case 'screen': {
      renderedForm = (
        <ScreenComponent
          data={currentStepData as ScreenStep}
          onContinue={goToNextStep}
        />
      );
      break;
    }
    case 'question': {
      renderedForm = (
        <QuestionComponent
          question={currentStepData as Question}
          currentStepKey={currentStepKey}
          previousResponse={previousResponse}
        />
      );
      break;
    }
    default:
      renderedForm = <UnknownStepComponent data={currentStepData} />;
  }

  const showGlobalButton = stepType !== 'screen';

  const getButtonText = () => {
    if (isSubmitting) {
      return 'Guardando...';
    }
    if (isSuccess) {
      return 'Pasando a la siguiente pregunta...';
    }
    return hasPreviousResponse ? 'Actualizar y continuar' : 'Guardar y continuar';
  };

  const isButtonDisabled = isSubmitting || isSuccess;

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full">
      {renderedForm}
      {showGlobalButton && (
        <button
          type="button"
          disabled={isButtonDisabled}
          className={`mt-8 font-semibold py-2 px-6 rounded transition w-full max-w-lg ${
            isButtonDisabled
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          onClick={() => {
            if (hasPreviousResponse) {
              handleUpdateResponse(getFormValues());
            } else {
              handleSubmitResponse();
            }
          }}
        >
          {isSubmitting && (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {getButtonText()}
            </div>
          )}
          {!isSubmitting && getButtonText()}
        </button>
      )}
    </div>
  );
};

export default TestLayoutRenderer;
