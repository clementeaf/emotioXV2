import React from 'react';
import { useSidebarLogic } from '../../../hooks/useSidebarLogic';
import { useTestStore } from '../../../stores/useTestStore';
import BurgerMenuButton from '../BurgerMenuButton';
import MobileOverlay from '../MobileOverlay';
import ProgressDisplay from '../ProgressDisplay';
import SidebarContainer from '../SidebarContainer';
import StepsList from '../StepsList';
import { SidebarStep } from '../types';

interface Props {
  onStepsReady?: (steps: SidebarStep[]) => void;
  onNavigateToStep?: (stepKey: string) => void;
  onDeleteAllResponses?: () => Promise<void>;
}

const TestLayoutSidebar: React.FC<Props> = ({
  onStepsReady,
  onNavigateToStep,
  onDeleteAllResponses
}) => {
  const { researchId } = useTestStore();

  const {
    steps,
    totalSteps,
    isLoading,
    error,
    isOpen,
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
  } = useSidebarLogic({
    researchId: researchId || '',
    onStepsReady,
    onNavigateToStep,
    onDeleteAllResponses
  });

  return (
    <>
      <BurgerMenuButton onClick={toggleSidebar} />
      <MobileOverlay isOpen={isOpen} onClose={closeSidebar} />
      <SidebarContainer isOpen={isOpen} onClose={closeSidebar}>
        {isLoading ? (
          <div className="text-gray-400 text-sm">
            {researchId ? 'Cargando formularios desde API...' : 'Cargando pasos...'}
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">
            Error al cargar pasos: {error.message}
            {researchId && (
              <button
                onClick={() => refetchForms()}
                className="ml-2 text-blue-500 hover:text-blue-700 underline"
              >
                Reintentar
              </button>
            )}
          </div>
        ) : (
          <>
            <ProgressDisplay current={1} total={totalSteps} />
            <StepsList
              steps={steps}
              currentStepKey={currentStepKey || ''}
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
                  'Eliminar todas las respuestas'
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
