import React, { useState } from 'react';
import { useParticipantData } from '../../hooks/useParticipantData';
import { useLoadResearchFormsConfig } from '../../hooks/useResearchForms';
import { useParticipantStore } from '../../stores/participantStore';
import TestLayoutRenderer from './TestLayoutRenderer';
import TestLayoutSidebar from './TestLayoutSidebar';
import { SidebarStep } from './types';
import { getSidebarSteps } from './utils';

const TestLayoutMain: React.FC = () => {
  const researchId = useParticipantStore(state => state.researchId);
  const participantId = useParticipantStore(state => state.participantId);
  const { data, isLoading, error } = useLoadResearchFormsConfig(researchId || '');
  const { deleteAllResponses } = useParticipantData();
  const [sidebarSteps, setSidebarSteps] = useState<SidebarStep[]>([]);

  const steps = getSidebarSteps(data?.data ?? undefined);

  const handleStepsReady = (steps: SidebarStep[]) => {
    setSidebarSteps(steps);
  };

  const handleNavigateToStep = (stepKey: string) => {
    console.log('[TestLayoutMain] Navegando a step:', stepKey);
  };

  const handleDeleteAllResponses = async () => {
    if (!researchId || !participantId) {
      console.error('[TestLayoutMain] ❌ Faltan researchId o participantId para eliminar respuestas');
      return;
    }

    try {
      const deleted = await deleteAllResponses();
      if (deleted) {
        console.log('[TestLayoutMain] ✅ Todas las respuestas eliminadas exitosamente');
      } else {
        console.error('[TestLayoutMain] ❌ Error eliminando respuestas');
        throw new Error('Error al eliminar respuestas');
      }
    } catch (error) {
      console.error('[TestLayoutMain] ❌ Error:', error);
      throw error;
    }
  };

  return (
    <main className="flex-1 w-full flex flex-col md:flex-row items-stretch px-2 sm:px-4 py-4">
      <TestLayoutSidebar
        steps={steps}
        isLoading={isLoading}
        error={error}
        onStepsReady={handleStepsReady}
        onNavigateToStep={handleNavigateToStep}
        onDeleteAllResponses={handleDeleteAllResponses}
      />
      <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 w-full max-w-2xl flex-1 flex flex-col justify-center mx-auto">
        <TestLayoutRenderer
          data={data?.data ?? undefined}
          isLoading={isLoading}
          error={error}
          sidebarSteps={sidebarSteps}
        />
      </div>
    </main>
  );
};

export default TestLayoutMain;
