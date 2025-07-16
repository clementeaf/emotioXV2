import React from 'react';
import { useDeleteAllResponsesMutation } from '../../../hooks/useApiQueries';
import { useSidebarLogic } from '../../../hooks/useSidebarLogic';
import { useStepStates } from '../../../hooks/useStepStates';
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

  // Consumir el GET de module-responses para obtener el estado actual
  const {
    currentState,
    lastCompletedStep,
    nextStep,
    completedSteps,
    totalResponses,
    getInitialStep
  } = useStepStates(currentQuestionKey, steps);

  // Log del estado actual basado en las respuestas del backend
  console.log('🔍 DEBUG Sidebar - Estado actual:', {
    lastCompletedStep,
    nextStep,
    completedSteps,
    totalResponses,
    currentQuestionKey
  });

  // Determinar el step activo basado en las respuestas del backend
  const effectiveCurrentStepKey = React.useMemo(() => {
    // Si hay respuestas en el backend, usar el siguiente step
    if (totalResponses > 0 && nextStep) {
      console.log('🔍 DEBUG Sidebar - Usando nextStep del backend:', nextStep);
      return nextStep;
    }

    // Si no hay respuestas, usar el step inicial
    const initialStep = getInitialStep();
    console.log('🔍 DEBUG Sidebar - Usando step inicial:', initialStep);
    return initialStep;
  }, [totalResponses, nextStep, getInitialStep]);

  // Sincronizar el step activo con el store
  React.useEffect(() => {
    if (effectiveCurrentStepKey && effectiveCurrentStepKey !== currentQuestionKey) {
      console.log('🔍 DEBUG Sidebar: Sincronizando effectiveCurrentStepKey -> currentQuestionKey:', effectiveCurrentStepKey);
      setCurrentQuestionKey(effectiveCurrentStepKey);
    }
  }, [effectiveCurrentStepKey, currentQuestionKey, setCurrentQuestionKey]);

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
            {/* Información del estado actual */}
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Estado Actual:</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Último completado: {lastCompletedStep || 'Ninguno'}</div>
                <div>Siguiente step: {nextStep}</div>
                <div>Respuestas: {totalResponses}</div>
                <div>Steps completados: {completedSteps.join(', ') || 'Ninguno'}</div>
              </div>
            </div>
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
