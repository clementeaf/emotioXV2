import React, { useEffect, useRef, useState } from 'react';
import { useDeleteState } from '../../hooks/useDeleteState';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
import BurgerMenuButton from './BurgerMenuButton';
import MobileOverlay from './MobileOverlay';
import ProgressDisplay from './ProgressDisplay';
import SidebarContainer from './SidebarContainer';
import StepsList from './StepsList';
import { SidebarStep, TestLayoutSidebarProps } from './types';
import { MOCK_CURRENT_STEP } from './utils';

interface TestLayoutSidebarPropsExtended extends TestLayoutSidebarProps {
  onStepsReady?: (steps: SidebarStep[]) => void;
  onNavigateToStep?: (stepKey: string) => void;
  onDeleteAllResponses?: () => Promise<void>;
}

const TestLayoutSidebar: React.FC<TestLayoutSidebarPropsExtended> = ({
  steps,
  isLoading,
  error,
  onStepsReady,
  onNavigateToStep,
  onDeleteAllResponses
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { setStep, currentStepKey } = useStepStore();
  const { hasResponse } = useTestStore();

  const {
    isDeleting,
    buttonText: deleteButtonText,
    isButtonDisabled: isDeleteDisabled,
    handleDelete
  } = useDeleteState({
    showToasts: false
  });

  const totalSteps = steps.length;
  const stepsNotifiedRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Función para inicializar el paso activo
  const initializeActiveStep = () => {
    if (steps.length > 0 && !currentStepKey && !hasInitializedRef.current) {
      console.log('[TestLayoutSidebar] 🔍 Inicializando paso activo...');
      console.log('[TestLayoutSidebar] Pasos disponibles:', steps.map(s => s.questionKey));

      // Verificar si hay respuestas locales
      const hasAnyResponses = steps.some(step => {
        const hasStepResponse = hasResponse(step.questionKey);
        console.log(`[TestLayoutSidebar] Paso ${step.questionKey}: hasResponse = ${hasStepResponse}`);
        return hasStepResponse;
      });

      console.log('[TestLayoutSidebar] ¿Hay respuestas locales?', hasAnyResponses);

      if (hasAnyResponses) {
        // Si hay respuestas, comenzar por el primer paso que no tenga respuesta
        const firstUnansweredStep = steps.find(step => {
          return !hasResponse(step.questionKey);
        });

        if (firstUnansweredStep) {
          console.log('[TestLayoutSidebar] Navegando al primer paso sin respuesta:', firstUnansweredStep.questionKey);
          setStep(firstUnansweredStep.questionKey);
        } else {
          // Si todos tienen respuesta, comenzar por el primer paso
          console.log('[TestLayoutSidebar] Todos los pasos tienen respuesta, navegando al primero:', steps[0].questionKey);
          setStep(steps[0].questionKey);
        }
      } else {
        // Si NO hay respuestas, SIEMPRE comenzar por Bienvenido
        console.log('[TestLayoutSidebar] No hay respuestas, navegando al primer paso:', steps[0].questionKey);
        setStep(steps[0].questionKey);
      }

      // Marcar como inicializado para evitar bucle infinito
      hasInitializedRef.current = true;
    }
  };

  useEffect(() => {
    if (steps.length > 0 && onStepsReady && !stepsNotifiedRef.current) {
      stepsNotifiedRef.current = true;
      onStepsReady(steps);
    }
  }, [steps, onStepsReady]);

  useEffect(() => {
    // Agregar un pequeño delay para asegurar que el store esté inicializado
    const timeoutId = setTimeout(() => {
      initializeActiveStep();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [steps, currentStepKey]);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  // Función para determinar si un paso está habilitado
  const isStepEnabled = (stepIndex: number): boolean => {
    // El primer paso siempre está habilitado
    if (stepIndex === 0) return true;

    // Para los demás pasos, verificar que todos los pasos anteriores tengan respuesta
    for (let i = 0; i < stepIndex; i++) {
      const previousStep = steps[i];

      if (!hasResponse(previousStep.questionKey)) {
        return false;
      }
    }

    return true;
  };

  // Función para manejar clicks en pasos
  const handleStepClick = (step: SidebarStep, index: number) => {
    // Solo permitir click si el paso está habilitado
    if (!isStepEnabled(index)) {
      console.log(`[TestLayoutSidebar] Paso bloqueado: ${step.questionKey}`);
      return;
    }

    setStep(step.questionKey);
    if (onNavigateToStep) {
      onNavigateToStep(step.questionKey);
    }
  };

  const handleDeleteAllResponses = async () => {
    if (!onDeleteAllResponses) return;

    await handleDelete(async () => {
      await onDeleteAllResponses();
    });
  };

  return (
    <>
      <BurgerMenuButton onClick={toggleSidebar} />
      <MobileOverlay isOpen={isOpen} onClose={closeSidebar} />
      <SidebarContainer isOpen={isOpen} onClose={closeSidebar}>
        {isLoading ? (
          <div className="text-gray-400 text-sm">Cargando pasos...</div>
        ) : error ? (
          <div className="text-red-500 text-sm">Error al cargar pasos</div>
        ) : (
          <>
            <ProgressDisplay current={MOCK_CURRENT_STEP} total={totalSteps} />
            <StepsList
              steps={steps}
              currentStepKey={currentStepKey}
              isStepEnabled={isStepEnabled}
              onStepClick={handleStepClick}
            />
            {/* Botón para eliminar todas las respuestas */}
            <div className="mt-6 p-4 border-t border-gray-200">
              <button
                onClick={handleDeleteAllResponses}
                disabled={isDeleteDisabled}
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isDeleteDisabled
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {deleteButtonText}
                  </div>
                ) : (
                  deleteButtonText
                )}
              </button>
            </div>
          </>
        )}
      </SidebarContainer>
    </>
  );
};

export default TestLayoutSidebar;
