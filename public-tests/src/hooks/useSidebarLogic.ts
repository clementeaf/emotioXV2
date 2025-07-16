import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CustomStep, SidebarStep, UseSidebarLogicProps, UseSidebarLogicReturn } from '../components/TestLayout/types';
import { useStepStore } from '../stores/useStepStore';
import { useTestStore } from '../stores/useTestStore';
import { useAvailableFormsQuery } from './useApiQueries';
import { useDeleteState } from './useDeleteState';

export const useSidebarLogic = ({
  researchId,
  onStepsReady,
  onNavigateToStep,
  onDeleteAllResponses
}: UseSidebarLogicProps): UseSidebarLogicReturn => {
  const { setStep, currentStepKey } = useStepStore();
  const { hasResponse } = useTestStore();

  const [isOpen, setIsOpen] = useState(false);
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
      return formsData.stepsConfiguration.map((stepConfig: any, index: number) => {
        // Extraer el title de contentConfiguration
        const title = stepConfig.contentConfiguration?.title || `Paso ${index + 1}`;

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
    if (steps.length > 0 && !currentStepKey && !hasInitializedRef.current) {
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
          setStep(firstUnansweredStep.questionKey);
        } else {
          setStep(steps[0].questionKey);
        }
      } else {
        setStep(steps[0].questionKey);
      }

      hasInitializedRef.current = true;
    }
  }, [steps, currentStepKey, hasResponse, setStep]);

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
    setStep(questionKey);
    if (onNavigateToStep) {
      onNavigateToStep(questionKey);
    }
  }, [setStep, onNavigateToStep]);

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
    currentStepKey,
    isStepEnabled,
    handleStepClick,
    handleDeleteAllResponses,
    isDeleting,
    deleteButtonText,
    isDeleteDisabled,
    refetchForms
  };
};
