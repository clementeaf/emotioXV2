import React, { useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
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
  // 🎯 ESTADOS BÁSICOS
  // ========================================
  const { currentStepKey, setStep } = useStepStore();
  const { saveResponse, getResponse, hasResponse } = useTestStore();

  // ========================================
  // 🎯 NAVEGACIÓN
  // ========================================
  const goToNextStep = useCallback(() => {
    const currentIndex = sidebarSteps.findIndex(step => step.questionKey === currentStepKey);

    if (currentIndex < sidebarSteps.length - 1) {
      const nextStep = sidebarSteps[currentIndex + 1];
      setStep(nextStep.questionKey);
      toast.success(`Navegando a: ${nextStep.label || nextStep.questionKey}`);
    } else {
      toast.success('¡Has completado todos los pasos!');
    }
  }, [currentStepKey, sidebarSteps, setStep]);

  // ========================================
  // 🎯 OBTENCIÓN DE VALORES DEL FORMULARIO
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

    // Para preguntas SmartVOC, obtener valores del estado del componente
    if (Object.keys(values).length === 0 && stepType === 'smart-voc') {
      const questionComponent = document.querySelector('[data-question-key]') as HTMLElement;
      if (questionComponent) {
        const questionKey = questionComponent.getAttribute('data-question-key');
        if (questionKey === currentStepKey) {
          const selectedValue = questionComponent.getAttribute('data-selected-value');
          const textValue = questionComponent.getAttribute('data-text-value');

          if (selectedValue) {
            values.selectedValue = selectedValue;
          }
          if (textValue) {
            values.textValue = textValue;
          }
        }
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
  // 🎯 GUARDADO DE RESPUESTAS
  // ========================================
  const handleSaveResponse = useCallback(async (response: unknown): Promise<boolean> => {
    if (!currentStepKey) {
      toast.error('No hay paso actual seleccionado');
      return false;
    }

    try {
      saveResponse(currentStepKey, response, getStepType(currentStepData), currentStepKey);
      toast.success(`Respuesta guardada: ${currentStepKey}`);
      goToNextStep();
      return true;
    } catch (error) {
      toast.error('Error guardando respuesta');
      return false;
    }
  }, [currentStepKey, saveResponse, goToNextStep]);

  const handleUpdateResponse = useCallback(async (response: unknown): Promise<boolean> => {
    if (!currentStepKey) {
      toast.error('No hay paso actual seleccionado');
      return false;
    }

    try {
      saveResponse(currentStepKey, response, getStepType(currentStepData), currentStepKey);
      toast.success(`Respuesta actualizada: ${currentStepKey}`);
      goToNextStep();
      return true;
    } catch (error) {
      toast.error('Error actualizando respuesta');
      return false;
    }
  }, [currentStepKey, saveResponse, goToNextStep]);

  // ========================================
  // 🔄 INICIALIZACIÓN
  // ========================================
  useEffect(() => {
    if (!currentStepKey && sidebarSteps.length > 0) {
      setStep(sidebarSteps[0].questionKey);
    }
  }, [currentStepKey, sidebarSteps, setStep]);

  // ========================================
  // 🚨 VALIDACIONES
  // ========================================
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState />;
  if (!currentStepKey) return <NoStepSelected />;

  const currentStepData = findStepByQuestionKey(data, currentStepKey);
  if (!currentStepData) return <NoStepData />;

  // ========================================
  // 🎨 RENDERIZADO
  // ========================================
  const stepType = getStepType(currentStepData);
  let renderedForm: React.ReactNode = null;

  switch (stepType) {
    case 'demographics': {
      const { demographicQuestions } = currentStepData as { demographicQuestions: DemographicQuestion[] };
      renderedForm = <DemographicForm questions={demographicQuestions} />;
      break;
    }
    case 'smart-voc': {
      renderedForm = (
        <QuestionComponent
          question={currentStepData as Question}
          currentStepKey={currentStepKey}
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
        />
      );
      break;
    }
    default:
      renderedForm = <UnknownStepComponent data={currentStepData} />;
  }

  // ========================================
  // 🎛️ BOTÓN GLOBAL
  // ========================================
  const showGlobalButton = stepType !== 'screen';
  const hasCurrentResponse = hasResponse(currentStepKey);

  const getButtonText = () => {
    if (hasCurrentResponse) return 'Actualizar y Continuar';
    return 'Guardar y Continuar';
  };

  const handleButtonClick = () => {
    const response = getFormValues();
    if (hasCurrentResponse) {
      handleUpdateResponse(response);
    } else {
      handleSaveResponse(response);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {renderedForm}
      </div>

      {showGlobalButton && (
        <div className="mt-6 p-4 border-t border-gray-200">
          <button
            onClick={handleButtonClick}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            {getButtonText()}
          </button>
        </div>
      )}
    </div>
  );
};

export default TestLayoutRenderer;
