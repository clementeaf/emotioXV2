import React from 'react';
import { useDeleteAllResponsesMutation } from '../../../hooks/useApiQueries';
import { useSidebarLogic } from '../../../hooks/useSidebarLogic';
import { useStepStoreWithBackend } from '../../../hooks/useStepStoreWithBackend';
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
  const {
    currentQuestionKey,
    setCurrentQuestionKey,
    setSteps,
    getTotalResponses,
    getLastCompletedStep,
    getNextStep,
    getCompletedSteps,
    backendResponses
  } = useStepStore();
  const { clearAllFormData } = useFormDataStore();

  // Integrar con respuestas del backend
  const { isLoading: isLoadingResponses, error: responsesError } = useStepStoreWithBackend();

  const deleteMutation = useDeleteAllResponsesMutation({
    onSuccess: () => {
      console.log('[TestLayoutSidebar] ✅ Respuestas eliminadas exitosamente');
      clearAllFormData();
      const { resetStore } = useStepStore.getState();
      resetStore();
    },
    onError: (error) => {
      console.error('❌ Error al eliminar respuestas:', error);
    }
  });

  // Sincronizar steps del useSidebarLogic con el store
  const { steps, totalSteps, isLoading, error, isOpen, toggleSidebar, closeSidebar, isStepEnabled, handleDeleteAllResponses, isDeleting, deleteButtonText, isDeleteDisabled, refetchForms } = useSidebarLogic({
    researchId: researchId || '',
    onStepsReady,
    onDeleteAllResponses: async () => {
      if (researchId && participantId) {
        await deleteMutation.mutateAsync({ researchId, participantId });
      }
    }
  });

  // Forzar re-render usando una key que depende del estado global
  const sidebarKey = `${backendResponses.length}-${currentQuestionKey}`;

  return (
    <div key={sidebarKey}>
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
              key={sidebarKey}
              steps={steps}
              currentStepKey={currentQuestionKey}
              isStepEnabled={isStepEnabled}
            />
            {/* Información del estado actual */}
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Estado Actual:</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <div>Último completado: {getLastCompletedStep() || 'Ninguno'}</div>
                <div>Siguiente step: {getNextStep()}</div>
                <div>Respuestas: {getTotalResponses()}</div>
                <div>Steps completados: {getCompletedSteps().join(', ') || 'Ninguno'}</div>
              </div>
              {/* 🎯 LOG PARA DEBUGGEAR LA INCONSISTENCIA */}
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <div><strong>DEBUG:</strong></div>
                <div>currentQuestionKey: {currentQuestionKey}</div>
                <div>backendResponses: {JSON.stringify(backendResponses.map(r => r.questionKey))}</div>
                <div>steps: {JSON.stringify(steps.map(s => ({ questionKey: s.questionKey, title: s.title })))} </div>
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
    </div>
  );
};

export default TestLayoutSidebar;
