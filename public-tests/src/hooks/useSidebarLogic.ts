import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SidebarStep, UseSidebarLogicProps, UseSidebarLogicReturn } from '../components/TestLayout/types';
import { StepConfiguration } from '../lib/types';
import { useStepStore } from '../stores/useStepStore';
import { useTestStore } from '../stores/useTestStore';
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

  // Usar el store de test para sincronizar steps
  const { setCurrentStep, completeStep, setSteps } = useTestStore();

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
      // Ordenar los steps según la lógica correcta del flujo
      const stepOrder = ['welcome_screen', 'demographics', 'smartvoc_csat', 'thank_you_screen'];

      // Crear un mapa de configuración por questionKey para acceso rápido
      const configMap = new Map();
      formsData.stepsConfiguration.forEach((stepConfig: StepConfiguration) => {
        configMap.set(stepConfig.questionKey, stepConfig);
      });

      // Construir steps en el orden correcto
      const orderedSteps = stepOrder
        .map(questionKey => {
          const stepConfig = configMap.get(questionKey);
          if (!stepConfig) return null;

          let title = '';
          switch (questionKey) {
            case 'demographics':
              title = 'Preguntas demográficas';
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
              title = String(stepConfig.contentConfiguration?.title || questionKey);
          }

          return {
            title: title,
            questionKey: stepConfig.questionKey
          };
        })
        .filter(step => step !== null);

      return orderedSteps;
    }
    return [];
  }, [formsData?.stepsConfiguration]);

  const totalSteps = steps.length;

  // Usar currentQuestionKey del store como fuente de verdad
  const effectiveCurrentQuestionKey = currentQuestionKey || selectedQuestionKey;

  const { getInitialStep, canAccessStep } = useStepStates(effectiveCurrentQuestionKey, steps);

  // SINCRONIZAR STEPS CON useTestStore
  useEffect(() => {
    if (steps.length > 0) {
      // Convertir steps a formato TestStep para useTestStore
      const testSteps = steps.map((step, index) => ({
        id: step.questionKey,
        type: step.questionKey,
        name: step.title,
        completed: false,
        current: index === 0
      }));

      setSteps(testSteps);
    }
  }, [steps, setSteps]);

  // INICIALIZACIÓN DEL PASO ACTIVO
  const initializeActiveStep = useCallback(() => {

    if (steps.length > 0 && !effectiveCurrentQuestionKey && !hasInitializedRef.current) {
      const initialStep = getInitialStep();

      setSelectedQuestionKey(initialStep);
      setCurrentQuestionKey(initialStep);
      hasInitializedRef.current = true;
    }
  }, [steps, effectiveCurrentQuestionKey, getInitialStep, setCurrentQuestionKey]);

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

  // SINCRONIZAR currentQuestionKey CON selectedQuestionKey
  useEffect(() => {
    if (currentQuestionKey && currentQuestionKey !== selectedQuestionKey) {
      setSelectedQuestionKey(currentQuestionKey);
    }
  }, [currentQuestionKey, selectedQuestionKey]);

  // ========================================
  // 🎯 FUNCIONES DE NAVEGACIÓN (MEMOIZADAS)
  const isStepEnabled = useCallback((stepIndex: number): boolean => {
    return canAccessStep(stepIndex);
  }, [canAccessStep]);

  const handleStepClick = useCallback((questionKey: string) => {
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
