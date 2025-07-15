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

const TestLayoutRenderer: React.FC<TestLayoutRendererProps> = ({
  data,
  isLoading,
  error,
  sidebarSteps = []
}) => {
  // ========================================
  // 🎯 ESTADOS Y HOOKS
  // ========================================
  const currentStepKey = useStepStore(state => state.currentStepKey);
  const setStep = useStepStore(state => state.setStep);
  const { researchId, participantId } = useParticipantStore();
  const { sendResponse, getResponse, updateResponse } = useParticipantData();

  // Estados locales
  const [hasPreviousResponse, setHasPreviousResponse] = useState(false);
  const [previousResponse, setPreviousResponse] = useState<Record<string, unknown> | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

    // ========================================
  // 🔍 VERIFICACIÓN DE RESPUESTAS PREVIAS
  // ========================================
  useEffect(() => {
    console.log('[TestLayoutRenderer] 🔍 useEffect ejecutado para currentStepKey:', currentStepKey);

    const checkPreviousResponse = async () => {
      if (!currentStepKey) return;

      try {
        const previousResponse = await getResponse(currentStepKey);

        if (previousResponse) {
          console.log('[TestLayoutRenderer] ✅ Respuesta previa encontrada para:', currentStepKey);
          setHasPreviousResponse(true);
          setPreviousResponse(previousResponse as Record<string, unknown>);
        } else {
          console.log('[TestLayoutRenderer] ❌ No hay respuesta previa para:', currentStepKey);
          setHasPreviousResponse(false);
          setPreviousResponse(undefined);

          // Fallback SOLO para demographics, NO para otras preguntas
          if (currentStepKey === 'demographics') {
            const fallbackResponse = await getResponse('demographics');
            if (fallbackResponse) {
              console.log('[TestLayoutRenderer] ✅ Fallback demographics encontrado');
              setHasPreviousResponse(true);
              setPreviousResponse(fallbackResponse as Record<string, unknown>);
            }
          }
        }
      } catch (error) {
        console.error(`[TestLayoutRenderer] ❌ Error verificando respuesta previa para ${currentStepKey}:`, error);
        setHasPreviousResponse(false);
        setPreviousResponse(undefined);
      }
    };

    checkPreviousResponse();
  }, [currentStepKey, getResponse]);

  // ========================================
  // 🚀 NAVEGACIÓN
  // ========================================
  const goToNextStep = () => {
    if (!sidebarSteps || sidebarSteps.length === 0 || !currentStepKey) return;

    const currentIndex = sidebarSteps.findIndex(step => step.questionKey === currentStepKey);
    if (currentIndex >= 0 && currentIndex < sidebarSteps.length - 1) {
      const nextStepKey = sidebarSteps[currentIndex + 1].questionKey;
      if (typeof nextStepKey === 'string') {
        setStep(nextStepKey);
      }
    }
  };

  // ========================================
  // 📝 OBTENCIÓN DE VALORES DEL FORMULARIO
  // ========================================
  const getFormValues = (): unknown => {
    console.log('[TestLayoutRenderer] 🔍 getFormValues llamado');

    const formData = new FormData(document.querySelector('form') as HTMLFormElement);
    const values: Record<string, unknown> = {};

    if (formData) {
      for (const [key, value] of formData.entries()) {
        values[key] = value;
      }
    }

    console.log('[TestLayoutRenderer] 📋 Valores del formulario:', values);

    if (Object.keys(values).length === 0) {
      const emptyResponse = {
        submitted: true,
        timestamp: new Date().toISOString(),
        stepType: getStepType(currentStepData),
        stepTitle: currentStepKey
      };
      console.log('[TestLayoutRenderer] 📤 Respuesta vacía:', emptyResponse);
      return emptyResponse;
    }

    const response = {
      ...values,
      submitted: true,
      timestamp: new Date().toISOString(),
      stepType: getStepType(currentStepData),
      stepTitle: currentStepKey
    };

    console.log('[TestLayoutRenderer] 📤 Respuesta con valores:', response);
    return response;
  };

  // ========================================
  // 💾 MANEJO DE RESPUESTAS
  // ========================================
  const handleSubmitResponse = async (response?: unknown) => {
    console.log('[TestLayoutRenderer] 🔍 handleSubmitResponse llamado para:', currentStepKey);

    if (!researchId || !participantId) {
      console.error('[TestLayoutRenderer] ❌ Faltan researchId o participantId para guardar respuesta');
      toast.error('Error: Faltan datos de investigación o participante');
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      const responseData = response || getFormValues();
      console.log('[TestLayoutRenderer] 📤 Enviando respuesta:', responseData);

      const sentResponse = await sendResponse(currentStepKey, responseData);

      if (sentResponse) {
        console.log('[TestLayoutRenderer] ✅ Respuesta enviada exitosamente');
        toast.success('Respuesta guardada exitosamente');
        setIsSuccess(true);

        setTimeout(() => {
          setIsSuccess(false);
          goToNextStep();
        }, 1000);
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
    console.log('[TestLayoutRenderer] 🔍 handleUpdateResponse llamado para:', currentStepKey);

    if (!researchId || !participantId) {
      console.error('[TestLayoutRenderer] ❌ Faltan researchId o participantId para actualizar respuesta');
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      console.log('[TestLayoutRenderer] 📤 Actualizando respuesta:', newResponse);

      const updatedResponse = await updateResponse(currentStepKey, newResponse);

      if (updatedResponse) {
        console.log('[TestLayoutRenderer] ✅ Respuesta actualizada exitosamente');
        toast.success('Respuesta actualizada exitosamente');
        setIsSuccess(true);

        setTimeout(() => {
          setIsSuccess(false);
          goToNextStep();
        }, 1000);
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

  // ========================================
  // 🚨 VALIDACIONES INICIALES
  // ========================================
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState />;
  if (!currentStepKey) return <NoStepSelected />;

  const currentStepData = findStepByQuestionKey(data, currentStepKey);
  if (!currentStepData) return <NoStepData />;

  // ========================================
  // 🎨 RENDERIZADO DE COMPONENTES
  // ========================================
  const stepType = getStepType(currentStepData);
  let renderedForm: React.ReactNode = null;

  switch (stepType) {
    case 'demographics': {
      const { demographicQuestions } = currentStepData as { demographicQuestions: DemographicQuestion[] };
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

  // ========================================
  // 🎛️ CONFIGURACIÓN DEL BOTÓN
  // ========================================
  const showGlobalButton = stepType !== 'screen';

  const getButtonText = () => {
    if (isSubmitting) return 'Guardando...';
    if (isSuccess) return 'Pasando a la siguiente pregunta...';
    return hasPreviousResponse ? 'Actualizar y continuar' : 'Guardar y continuar';
  };

  const isButtonDisabled = isSubmitting || isSuccess;

  const handleButtonClick = () => {
    console.log('[TestLayoutRenderer] 🔍 handleButtonClick ejecutado, hasPreviousResponse:', hasPreviousResponse);

    if (hasPreviousResponse) {
      handleUpdateResponse(getFormValues());
    } else {
      handleSubmitResponse();
    }
  };

  // ========================================
  // 🎯 RENDERIZADO FINAL
  // ========================================
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
          onClick={handleButtonClick}
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
