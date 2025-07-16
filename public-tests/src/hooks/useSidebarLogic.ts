import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CustomStep, SidebarStep, UseSidebarLogicProps, UseSidebarLogicReturn } from '../components/TestLayout/types';
import { StepConfiguration } from '../lib/types';
import { useTestStore } from '../stores/useTestStore';
import { useAvailableFormsQuery } from './useApiQueries';
import { useDeleteState } from './useDeleteState';

export const useSidebarLogic = ({
  researchId,
  onStepsReady,
  onDeleteAllResponses
}: UseSidebarLogicProps): UseSidebarLogicReturn => {
  const { hasResponse } = useTestStore();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuestionKey, setSelectedQuestionKey] = useState<string>('');
  const stepsNotifiedRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const {
    data: formsData,
    isLoading,
    error,
    refetch: refetchForms
  } = useAvailableFormsQuery(researchId || '');

  // DELETE STATE
  const {
    isDeleting,
    buttonText: deleteButtonText,
    isButtonDisabled: isDeleteDisabled,
    handleDelete
  } = useDeleteState({
    showToasts: false
  });

  // STEPS DESDE API
  const steps = useMemo(() => {
    if (formsData?.stepsConfiguration && formsData.stepsConfiguration.length > 0) {
      return formsData.stepsConfiguration.map((stepConfig: StepConfiguration, index: number) => {
        // Generar título específico según el questionKey
        let title = '';

        switch (stepConfig.questionKey) {
          case 'demographics':
            title = 'Peguntas demográficas';
            break;
          case 'welcome_screen':
            title = 'Bienvenido';
            break;
          case 'thank_you_screen':
            title = 'Gracias por participar';
            break;
          case 'smartvoc_csat':
            title = 'Pregunta CSAT';
            break;
          default:
            title = String(stepConfig.contentConfiguration?.title || `Paso ${index + 1}`);
        }

        return {
          title: title,
          questionKey: stepConfig.questionKey
        };
      });
    }
    return [];
  }, [formsData?.stepsConfiguration]);

  const totalSteps = steps.length;

  // INICIALIZACIÓN DEL PASO ACTIVO
  const initializeActiveStep = useCallback(() => {
    if (steps.length > 0 && !selectedQuestionKey && !hasInitializedRef.current) {
      // Verificar si hay respuestas locales
      const hasAnyResponses = steps.some((step: CustomStep) => {
        return hasResponse(step.questionKey);
      });

      if (hasAnyResponses) {
        // Si hay respuestas, comenzar por el primer paso que no tenga respuesta
        const firstUnansweredStep = steps.find((step: CustomStep) => {
          return !hasResponse(step.questionKey);
        });

        if (firstUnansweredStep) {
          setSelectedQuestionKey(firstUnansweredStep.questionKey);
        } else {
          setSelectedQuestionKey(steps[0].questionKey);
        }
      } else {
        setSelectedQuestionKey(steps[0].questionKey);
      }

      hasInitializedRef.current = true;
    }
  }, [steps, selectedQuestionKey, hasResponse]);

  // ========================================
  // 🎯 EFECTOS (OPTIMIZADOS)
  // ========================================
  useEffect(() => {
    if (steps.length > 0 && onStepsReady && !stepsNotifiedRef.current) {
      stepsNotifiedRef.current = true;
      // Convertir CustomStep a SidebarStep para mantener compatibilidad
      const sidebarSteps: SidebarStep[] = steps.map(step => ({
        label: step.title,
        questionKey: step.questionKey
      }));
      onStepsReady(sidebarSteps);
    }
  }, [steps, onStepsReady]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      initializeActiveStep();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [initializeActiveStep]);

  // ========================================
  // 🎯 FUNCIONES DE NAVEGACIÓN (MEMOIZADAS)
  const isStepEnabled = useCallback((stepIndex: number): boolean => {
    if (stepIndex === 0) return true;

    for (let i = 0; i < stepIndex; i++) {
      const previousStep = steps[i];
      if (!hasResponse(previousStep.questionKey)) {
        return false;
      }
    }
    return true;
  }, [steps, hasResponse]);

  const handleStepClick = useCallback((questionKey: string) => {
    setSelectedQuestionKey(questionKey);
    console.log('Selected questionKey:', questionKey);
  }, []);

  // FUNCIONES DE ELIMINACIÓN
  const handleDeleteAllResponses = useCallback(async () => {
    if (!onDeleteAllResponses) return;

    await handleDelete(async () => {
      await onDeleteAllResponses();
    });
  }, [onDeleteAllResponses, handleDelete]);

  // FUNCIONES DEL SIDEBAR (MEMOIZADAS)
  const toggleSidebar = useCallback(() => setIsOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setIsOpen(false), []);

  return {
    formsData,
    steps,
    totalSteps,
    isLoading,
    error,
    isOpen,
    setIsOpen,
    toggleSidebar,
    closeSidebar,
    selectedQuestionKey,
    isStepEnabled,
    handleStepClick,
    handleDeleteAllResponses,
    isDeleting,
    deleteButtonText,
    isDeleteDisabled,
    refetchForms
  };
};
