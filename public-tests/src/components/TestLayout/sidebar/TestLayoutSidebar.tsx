import React from 'react';
import { useDeleteAllResponsesMutation } from '../../../hooks/useApiQueries';
import { useSidebarLogic } from '../../../hooks/useSidebarLogic';
import { useFormDataStore } from '../../../stores/useFormDataStore';
import { useStepStore } from '../../../stores/useStepStore';
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
  onDeleteAllResponses
}) => {
  const { researchId, participantId } = useTestStore();
  const { currentQuestionKey, setCurrentQuestionKey } = useStepStore();
  const { clearAllFormData } = useFormDataStore();

  const deleteMutation = useDeleteAllResponsesMutation({
    onSuccess: () => {
      console.log('✅ Respuestas eliminadas exitosamente');
      // Limpiar datos del formulario
      clearAllFormData();
      // Resetear al primer step
      setCurrentQuestionKey('');
    },
    onError: (error) => {
      console.error('❌ Error al eliminar respuestas:', error);
    }
  });

  const {
    steps,
    totalSteps,
    isLoading,
    error,
    isOpen,
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
  } = useSidebarLogic({
    researchId: researchId || '',
    onStepsReady,
    onDeleteAllResponses: async () => {
      if (researchId && participantId) {
        await deleteMutation.mutateAsync({ researchId, participantId });
      }
    }
  });

  // Sincronizar selectedQuestionKey con currentQuestionKey del store
  React.useEffect(() => {
    if (selectedQuestionKey && selectedQuestionKey !== currentQuestionKey) {
      console.log('🔍 DEBUG Sidebar: Sincronizando selectedQuestionKey -> currentQuestionKey:', selectedQuestionKey);
      setCurrentQuestionKey(selectedQuestionKey);
    }
  }, [selectedQuestionKey, currentQuestionKey, setCurrentQuestionKey]);

  // Sincronizar currentQuestionKey con selectedQuestionKey del sidebar
  React.useEffect(() => {
    if (currentQuestionKey && currentQuestionKey !== selectedQuestionKey) {
      console.log('🔍 DEBUG Sidebar: Sincronizando currentQuestionKey -> selectedQuestionKey:', currentQuestionKey);
      // Nota: No podemos modificar selectedQuestionKey directamente desde aquí
      // porque está en el scope del useSidebarLogic
    }
  }, [currentQuestionKey, selectedQuestionKey]);

  // Usar currentQuestionKey del store para el StepsList
  const effectiveCurrentStepKey = currentQuestionKey || selectedQuestionKey || '';

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
              currentStepKey={effectiveCurrentStepKey}
              isStepEnabled={isStepEnabled}
            />
            {/* Botón para eliminar todas las respuestas */}
            <div className="mt-6 p-4 border-t border-gray-200">
              <button
                onClick={handleDeleteAllResponses}
                disabled={isDeleteDisabled || deleteMutation.isPending}
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isDeleteDisabled || deleteMutation.isPending
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isDeleting || deleteMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Eliminando...
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
