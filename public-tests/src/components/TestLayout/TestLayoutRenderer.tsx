import React, { useCallback, useEffect } from 'react';
import { useParticipantData } from '../../hooks/useParticipantData';
import { useQuestionResponse } from '../../hooks/useQuestionResponse';
import { useParticipantStore } from '../../stores/participantStore';
import { useResponsesStore } from '../../stores/useResponsesStore';
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

  // NUEVO: Forzar el paso activo basándose en el contenido actual
  useEffect(() => {
    if (currentStepKey === 'welcome_screen' && sidebarSteps.length > 1) {
      // Si estamos en welcome_screen pero el contenido es demográficas, cambiar a demographics
      const demographicsStep = sidebarSteps.find(step => step.questionKey === 'demographics');
      if (demographicsStep) {
        setStep('demographics');
      }
    }
  }, [currentStepKey, sidebarSteps, setStep]);
  const { researchId, participantId } = useParticipantStore();
  const { sendResponse, getResponse, updateResponse } = useParticipantData(researchId, participantId);

  // ========================================
  // 🎯 MANEJO DE RESPUESTAS CON PERSISTENCIA LOCAL
  // ========================================
  const {
    response: currentResponse,
    hasResponse: hasCurrentResponse,
    hasBackendResponse, // NUEVO: Usar hasBackendResponse
    saveResponse,
    updateResponse: updateLocalResponse,
    deleteResponse,
    markAsBackendSent, // NUEVO: Método para marcar como enviado
    isLoading: isResponseLoading,
    error: responseError
  } = useQuestionResponse({
    questionKey: currentStepKey,
    stepType: 'module_response',
    stepTitle: currentStepKey,
    onResponseChange: (response) => {
      console.log(`[TestLayoutRenderer] Respuesta cambiada para ${currentStepKey}:`, response);
    }
  });

  // NUEVO: Obtener markAsBackendSent del store
  const { markAsBackendSent: markStoreAsBackendSent } = useResponsesStore();

  // ========================================
  // 🎯 MANEJO DE NAVEGACIÓN
  // ========================================
  const goToNextStep = useCallback(() => {
    console.log('[TestLayoutRenderer] goToNextStep llamado');
    console.log('[TestLayoutRenderer] currentStepKey:', currentStepKey);
    console.log('[TestLayoutRenderer] sidebarSteps:', sidebarSteps.map(s => s.questionKey));

    const currentIndex = sidebarSteps.findIndex(step => step.questionKey === currentStepKey);
    console.log('[TestLayoutRenderer] currentIndex:', currentIndex);

    if (currentIndex < sidebarSteps.length - 1) {
      const nextStep = sidebarSteps[currentIndex + 1];
      console.log('[TestLayoutRenderer] nextStep:', nextStep);
      setStep(nextStep.questionKey);
      console.log(`[TestLayoutRenderer] Navegando al siguiente paso: ${nextStep.questionKey}`);
    } else {
      console.log('[TestLayoutRenderer] No hay siguiente paso disponible');
    }
  }, [currentStepKey, sidebarSteps, setStep]);

  // ========================================
  // 🎯 MANEJO DE ENVÍO DE RESPUESTAS
  // ========================================
  const handleSaveResponse = useCallback(async (response: unknown): Promise<boolean> => {
    if (!currentStepKey) {
      console.error('[TestLayoutRenderer] ❌ No hay paso actual seleccionado');
      return false;
    }

    console.log(`[TestLayoutRenderer] 📤 Guardando respuesta para ${currentStepKey}:`, response);

    // Guardar localmente primero
    const localSuccess = await saveResponse(response);
    if (!localSuccess) {
      console.error('[TestLayoutRenderer] ❌ Error guardando localmente');
      return false;
    }

    // Enviar al backend
    const backendSuccess = await sendResponse(currentStepKey, response);
    if (!backendSuccess) {
      console.error('[TestLayoutRenderer] ❌ Error enviando al backend');
      return false;
    }

    // NUEVO: Marcar como enviado al backend
    markStoreAsBackendSent(currentStepKey);

    console.log(`[TestLayoutRenderer] ✅ Respuesta guardada exitosamente: ${currentStepKey}`);
    return true;
  }, [currentStepKey, saveResponse, sendResponse, markStoreAsBackendSent]);

  const handleUpdateResponse = useCallback(async (response: unknown): Promise<boolean> => {
    if (!currentStepKey) {
      console.error('[TestLayoutRenderer] ❌ No hay paso actual seleccionado');
      return false;
    }

    console.log(`[TestLayoutRenderer] 📤 Actualizando respuesta para ${currentStepKey}:`, response);

    // Actualizar localmente
    const localSuccess = await updateLocalResponse(response);
    if (!localSuccess) {
      console.error('[TestLayoutRenderer] ❌ Error actualizando localmente');
      return false;
    }

    // Enviar al backend
    const backendSuccess = await sendResponse(currentStepKey, response);
    if (!backendSuccess) {
      console.error('[TestLayoutRenderer] ❌ Error enviando al backend');
      return false;
    }

    // NUEVO: Marcar como enviado al backend
    markStoreAsBackendSent(currentStepKey);

    // Navegar al siguiente paso después de actualizar
    goToNextStep();

    console.log(`[TestLayoutRenderer] ✅ Respuesta actualizada exitosamente: ${currentStepKey}`);
    return true;
  }, [currentStepKey, updateLocalResponse, sendResponse, markStoreAsBackendSent, goToNextStep]);

  const handleDeleteResponse = useCallback(async (): Promise<boolean> => {
    if (!currentStepKey) {
      console.error('[TestLayoutRenderer] ❌ No hay paso actual seleccionado');
      return false;
    }

    console.log(`[TestLayoutRenderer] 🗑️ Eliminando respuesta para ${currentStepKey}`);

    const success = await deleteResponse();
    if (success) {
      console.log(`[TestLayoutRenderer] ✅ Respuesta eliminada exitosamente: ${currentStepKey}`);
    } else {
      console.error('[TestLayoutRenderer] ❌ Error eliminando respuesta');
    }

    return success;
  }, [currentStepKey, deleteResponse]);

  // ========================================
  // 🔍 VERIFICACIÓN DE RESPUESTAS PREVIAS
  // ========================================
  useEffect(() => {
    const checkPreviousResponse = async () => {
      if (!currentStepKey) return;

      try {
        const previousResponse = await getResponse(currentStepKey);

        if (previousResponse) {
          // setHasPreviousResponse(true); // This state is no longer managed by useQuestionResponse
          // setPreviousResponse(previousResponse as Record<string, unknown>); // This state is no longer managed by useQuestionResponse
        } else {
          // setHasPreviousResponse(false); // This state is no longer managed by useQuestionResponse
          // setPreviousResponse(undefined); // This state is no longer managed by useQuestionResponse

          // Fallback SOLO para demographics, NO para otras preguntas
          if (currentStepKey === 'demographics') {
            const fallbackResponse = await getResponse('demographics');
            if (fallbackResponse) {
              // setHasPreviousResponse(true); // This state is no longer managed by useQuestionResponse
              // setPreviousResponse(fallbackResponse as Record<string, unknown>); // This state is no longer managed by useQuestionResponse
            }
          }
        }
      } catch (error) {
        console.error(`[TestLayoutRenderer] ❌ Error verificando respuesta previa para ${currentStepKey}:`, error);
        // setHasPreviousResponse(false); // This state is no longer managed by useQuestionResponse
        // setPreviousResponse(undefined); // This state is no longer managed by useQuestionResponse
      }
    };

    checkPreviousResponse();
  }, [currentStepKey, getResponse]);

  // ========================================
  // 📝 OBTENCIÓN DE VALORES DEL FORMULARIO
  // ========================================
    const getFormValues = (): unknown => {
    const values: Record<string, unknown> = {};

    // Intentar obtener valores de un formulario tradicional
    const form = document.querySelector('form');
    if (form) {
      const formData = new FormData(form);
      for (const [key, value] of formData.entries()) {
        values[key] = value;
      }
    }

    // Si no hay valores del formulario, crear una respuesta básica
    if (Object.keys(values).length === 0) {
      return {
        submitted: true,
        timestamp: new Date().toISOString(),
        stepType: getStepType(currentStepData),
        stepTitle: currentStepKey
      };
    }

    return {
      ...values,
      submitted: true,
      timestamp: new Date().toISOString(),
      stepType: getStepType(currentStepData),
      stepTitle: currentStepKey
    };
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
      renderedForm = <DemographicForm questions={demographicQuestions} previousResponse={currentResponse as Record<string, unknown> | undefined} />;
      break;
    }
    case 'smart-voc': {
      renderedForm = (
        <QuestionComponent
          question={currentStepData as Question}
          currentStepKey={currentStepKey}
          previousResponse={currentResponse as Record<string, unknown> | undefined}
        />
      );
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
          previousResponse={currentResponse as Record<string, unknown> | undefined}
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
    // NUEVO: Usar hasBackendResponse para determinar el texto del botón
    return hasBackendResponse ? 'Actualizar y continuar' : 'Guardar y continuar';
  };

  // isButtonDisabled state is no longer managed by useQuestionResponse
  const isButtonDisabled = isResponseLoading; // Use isResponseLoading from useQuestionResponse

    const handleButtonClick = () => {
    if (hasBackendResponse) {
      handleUpdateResponse(getFormValues());
    } else {
      handleSaveResponse(getFormValues());
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
          {/* isSubmitting and isSuccess states are no longer managed by useQuestionResponse */}
          {/* {isSubmitting && ( */}
          {/*   <div className="flex items-center justify-center gap-2"> */}
          {/*     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> */}
          {/*     {getButtonText()} */}
          {/*   </div> */}
          {/* )} */}
          {/* {!isSubmitting && getButtonText()} */}
          {getButtonText()}
        </button>
      )}
    </div>
  );
};

export default TestLayoutRenderer;
