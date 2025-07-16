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
import { Props } from '../types';

const TestLayoutSidebar: React.FC<Props> = ({
  onStepsReady,
}) => {
  const { researchId, participantId } = useTestStore();
  const { currentQuestionKey, setCurrentQuestionKey, setSteps } = useStepStore();
  const { clearAllFormData } = useFormDataStore();

  const deleteMutation = useDeleteAllResponsesMutation({
    onSuccess: () => {
      clearAllFormData();
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
    isStepEnabled,
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

  const {
    currentState,
    lastCompletedStep,
    nextStep,
    completedSteps,
    totalResponses,
    getInitialStep
  } = useStepStates(currentQuestionKey, steps);

  // Log para depuración del sidebar
  console.log('[TestLayoutSidebar] currentQuestionKey (store):', currentQuestionKey);

  // Sincronizar steps con el store global cuando se cargan
  React.useEffect(() => {
    if (steps.length > 0) {
      // Convertir steps a formato Step para el store
      const storeSteps = steps.map((step, index) => ({
        questionKey: step.questionKey,
        title: step.title,
        completed: false, // Inicialmente ninguno completado
        current: index === 0 // Solo el primero activo
      }));

      console.log('[TestLayoutSidebar] Cargando steps en store:', storeSteps);
      setSteps(storeSteps);
    }
  }, [steps, setSteps]);

  // Obtener estados del store en lugar de useStepStates
  const { getSteps, getCurrentStep, initializeFromBackendResponses, saveCurrentStepToLocalStorage } = useStepStore();
  const storeSteps = getSteps();
  const currentStep = getCurrentStep();

  // Calcular estados basados en el store
  const completedStepsFromStore = storeSteps.filter(step => step.completed);
  const currentStepFromStore = storeSteps.find(step => step.current);

  // Inicializar desde respuestas del backend cuando estén disponibles
  React.useEffect(() => {
    if (storeSteps.length > 0 && totalResponses > 0) {
      console.log('[TestLayoutSidebar] Inicializando desde respuestas del backend:', totalResponses);
      // Convertir completedSteps (string[]) a formato { questionKey: string }[]
      const responses = completedSteps.map(questionKey => ({ questionKey }));
      initializeFromBackendResponses(responses);
    }
  }, [storeSteps.length, totalResponses, completedSteps, initializeFromBackendResponses]);

  // Guardar step actual en localStorage cuando cambie
  React.useEffect(() => {
    if (currentQuestionKey) {
      console.log('[TestLayoutSidebar] Guardando step actual en localStorage:', currentQuestionKey);
      saveCurrentStepToLocalStorage();
    }
  }, [currentQuestionKey, saveCurrentStepToLocalStorage]);

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
              currentStepKey={currentQuestionKey} // SIEMPRE el del store global
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
