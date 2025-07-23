import React from 'react';
import { useDeleteAllResponsesMutation } from '../../../hooks/useApiQueries';
import { useEyeTrackingConfigQuery } from '../../../hooks/useEyeTrackingConfigQuery';
import { useSidebarLogic } from '../../../hooks/useSidebarLogic';
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
    backendResponses
  } = useStepStore();
  const { clearAllFormData } = useFormDataStore();

  // 🎯 OBTENER CONFIGURACIÓN DE EYE TRACKING
  const { data: eyeTrackingConfig } = useEyeTrackingConfigQuery(researchId || '');
  const shouldShowProgressFeatures = eyeTrackingConfig?.linkConfig?.showProgressBar ?? true;

  // 🎯 DEBUG: Log para verificar la configuración
  console.log('[TestLayoutSidebar] Configuración:', {
    researchId,
    eyeTrackingConfig,
    showProgressBar: eyeTrackingConfig?.linkConfig?.showProgressBar,
    shouldShowProgressFeatures
  });

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
            {/* 🎯 PROGRESS DISPLAY - SOLO SI showProgressBar ES TRUE */}
            {shouldShowProgressFeatures && (
              <ProgressDisplay current={1} total={totalSteps} />
            )}

            {/* 🎯 STEPS LIST - SIEMPRE VISIBLE */}
            <StepsList
              key={sidebarKey}
              steps={steps}
              currentStepKey={currentQuestionKey}
              isStepEnabled={isStepEnabled}
            />

            {/* 🎯 BOTÓN PARA ELIMINAR TODAS LAS RESPUESTAS - SOLO SI showProgressBar ES TRUE */}
            {shouldShowProgressFeatures && (
              <div className="mt-6 p-4 border-t border-gray-200">
                <button
                  onClick={handleDeleteAllResponses}
                  disabled={isDeleteDisabled}
                  className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${isDeleteDisabled
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
            )}
          </>
        )}
      </SidebarContainer>
    </div>
  );
};

export default TestLayoutSidebar;
