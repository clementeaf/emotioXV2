import React, { useEffect, useRef, useState } from 'react';
import { useDeleteState } from '../../hooks/useDeleteState';
import { useParticipantStore } from '../../stores/participantStore';
import { useResponsesStore } from '../../stores/useResponsesStore';
import { useStepStore } from '../../stores/useStepStore';
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
  const setStep = useStepStore(state => state.setStep);

  const {
    isDeleting,
    buttonText: deleteButtonText,
    isButtonDisabled: isDeleteDisabled,
    handleDelete
  } = useDeleteState({
    showToasts: false // NUEVO: No mostrar toasts aquí, se manejan en TestLayoutMain
  });
  const currentStepKey = useStepStore(state => state.currentStepKey);
  const totalSteps = steps.length;
  const stepsNotifiedRef = useRef(false);

  useEffect(() => {
    if (steps.length > 0 && onStepsReady && !stepsNotifiedRef.current) {
      stepsNotifiedRef.current = true;
      onStepsReady(steps);
    }
  }, [steps, onStepsReady]);

  useEffect(() => {
    if (steps.length > 0 && !currentStepKey) {
      // SIEMPRE comenzar por el primer paso (Bienvenido)
      setStep(steps[0].questionKey);
    }
  }, [steps, currentStepKey, setStep]);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  // NUEVO: Usar el store de respuestas para mostrar indicadores
  const { hasBackendResponse, getResponsesCount } = useResponsesStore();

  // NUEVO: Verificar si hay datos válidos para eliminar respuestas
  const { researchId, participantId } = useParticipantStore();
  const canDeleteResponses = !!(researchId && participantId);

  // NUEVO: Función para determinar si un paso está habilitado
  const isStepEnabled = (stepIndex: number): boolean => {
    // El primer paso siempre está habilitado
    if (stepIndex === 0) return true;

    // Para los demás pasos, verificar que todos los pasos anteriores tengan respuesta enviada al backend
    for (let i = 0; i < stepIndex; i++) {
      const previousStep = steps[i];

      // Caso especial: Pasos de bienvenida se consideran automáticamente como completados
      if (previousStep.questionKey === 'welcome_screen' || previousStep.questionKey === 'welcome') {
        continue; // Saltar la verificación para pasos de bienvenida
      }

      if (!hasBackendResponse(previousStep.questionKey)) {
        return false;
      }
    }

    return true;
  };

  // NUEVO: Función para manejar clicks en pasos
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

    // NUEVO: Validar que haya researchId y participantId antes de intentar eliminar
    const { researchId, participantId } = useParticipantStore.getState();
    if (!researchId || !participantId) {
      console.error('[TestLayoutSidebar] ❌ No se pueden eliminar respuestas: researchId o participantId no disponibles');
      console.log('[TestLayoutSidebar] Debug - researchId:', researchId, 'participantId:', participantId);
      return;
    }

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
                disabled={isDeleteDisabled || !canDeleteResponses}
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isDeleteDisabled || !canDeleteResponses
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {deleteButtonText}
                  </div>
                ) : !canDeleteResponses ? (
                  'Esperando datos...'
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
