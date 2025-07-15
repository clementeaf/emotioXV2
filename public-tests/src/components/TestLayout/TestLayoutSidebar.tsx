import React, { useEffect, useRef, useState } from 'react';
import { useDeleteState } from '../../hooks/useDeleteState';
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
  } = useDeleteState({});
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
      setStep(steps[0].questionKey);
    }
  }, [steps, currentStepKey, setStep]);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const handleStepClick = (step: SidebarStep, index: number) => {
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
