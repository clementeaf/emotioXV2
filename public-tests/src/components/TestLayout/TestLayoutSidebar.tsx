import React from 'react';
import { useAvailableFormsQuery } from '../../hooks/useApiQueries';
import { useSidebarLogic } from '../../hooks/useSidebarLogic';
import BurgerMenuButton from './BurgerMenuButton';
import MobileOverlay from './MobileOverlay';
import ProgressDisplay from './ProgressDisplay';
import SidebarContainer from './SidebarContainer';
import StepsList from './StepsList';
import { SidebarStep } from './types';

interface TestLayoutSidebarProps {
  researchId?: string;
  onStepsReady?: (steps: SidebarStep[]) => void;
  onNavigateToStep?: (stepKey: string) => void;
  onDeleteAllResponses?: () => Promise<void>;
}

const TestLayoutSidebar: React.FC<TestLayoutSidebarProps> = ({
  researchId,
  onStepsReady,
  onNavigateToStep,
  onDeleteAllResponses
}) => {

  const {
    // Estado de la API
    steps,
    totalSteps,
    isLoading,
    error,

    // Estado del sidebar
    isOpen,
    toggleSidebar,
    closeSidebar,

    // Estado del paso actual
    selectedQuestionKey,

    // Funciones de navegación
    isStepEnabled,
    handleStepClick,

    // Funciones de eliminación
    handleDeleteAllResponses,
    isDeleting,
    deleteButtonText,
    isDeleteDisabled,

    // Funciones de API
    refetchForms
  } = useSidebarLogic({
    researchId,
    onStepsReady,
    onNavigateToStep,
    onDeleteAllResponses
  });

    const {
    data: apiData,
    isLoading: apiLoading,
    error: apiError
  } = useAvailableFormsQuery(researchId || '');

  if (apiData) {
    console.log('[TestLayoutSidebar] 📊 API Forms Data:', apiData);
  }

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
                onClick={() => {}}
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
              currentStepKey={selectedQuestionKey || ''}
              isStepEnabled={isStepEnabled}
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
