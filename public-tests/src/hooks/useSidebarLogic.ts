import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SidebarStep, UseSidebarLogicProps, UseSidebarLogicReturn } from '../components/TestLayout/types';
import { StepConfiguration } from '../lib/types';
import { useStepStore } from '../stores/useStepStore';
import { useAvailableFormsQuery } from './useApiQueries';
import { useDeleteState } from './useDeleteState';
import { useStepStates } from './useStepStates';

export const useSidebarLogic = ({
  researchId,
  onStepsReady,
  onDeleteAllResponses
}: UseSidebarLogicProps): UseSidebarLogicReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuestionKey, setSelectedQuestionKey] = useState<string>('');
  const stepsNotifiedRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Usar el store global para currentQuestionKey
  const { currentQuestionKey, setCurrentQuestionKey } = useStepStore();

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

  const steps = useMemo(() => {
    if (formsData?.stepsConfiguration && formsData.stepsConfiguration.length > 0) {
      return formsData.stepsConfiguration.map((stepConfig: StepConfiguration, index: number) => {
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

  const effectiveCurrentQuestionKey = currentQuestionKey || selectedQuestionKey;

  const { getInitialStep, canAccessStep } = useStepStates(effectiveCurrentQuestionKey, steps);

  // INICIALIZACIÓN DEL PASO ACTIVO
  const initializeActiveStep = useCallback(() => {

    if (steps.length > 0 && !effectiveCurrentQuestionKey && !hasInitializedRef.current) {
      const initialStep = getInitialStep();
      setSelectedQuestionKey(initialStep);
      setCurrentQuestionKey(initialStep);
      hasInitializedRef.current = true;
    }
  }, [steps, selectedQuestionKey, currentQuestionKey, effectiveCurrentQuestionKey, getInitialStep, setCurrentQuestionKey]);

  useEffect(() => {
    if (steps.length > 0 && onStepsReady && !stepsNotifiedRef.current) {
      stepsNotifiedRef.current = true;
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
    return canAccessStep(stepIndex);
  }, [canAccessStep]);

  const handleStepClick = useCallback((questionKey: string) => {
    setSelectedQuestionKey(questionKey);
    setCurrentQuestionKey(questionKey);
  }, [setCurrentQuestionKey]);

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
    selectedQuestionKey: effectiveCurrentQuestionKey, // Usar el efectivo
    isStepEnabled,
    handleStepClick,
    handleDeleteAllResponses,
    isDeleting,
    deleteButtonText,
    isDeleteDisabled,
    refetchForms
  };
};
