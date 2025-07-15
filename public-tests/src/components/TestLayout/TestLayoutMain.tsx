import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
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

  const participantData = useParticipantData(researchId, participantId);
  const { deleteAllResponses } = researchId && participantId ? participantData : { deleteAllResponses: async () => false };

  const [sidebarSteps, setSidebarSteps] = useState<SidebarStep[]>([]);

  const steps = getSidebarSteps(data?.data ?? undefined);

  const handleStepsReady = (steps: SidebarStep[]) => {
    setSidebarSteps(steps);
  };

  const handleNavigateToStep = (stepKey: string) => {
  };

  const handleDeleteAllResponses = async (): Promise<void> => {
    if (!researchId || !participantId) {
      toast.error('No se pueden eliminar las respuestas: datos de sesión incompletos');
      return;
    }

    try {
      toast.loading('Eliminando todas las respuestas...');

      const deleted = await deleteAllResponses();

      if (deleted) {
        toast.dismiss();
        toast.success('Todas las respuestas han sido eliminadas exitosamente');
      } else {
        console.error('[TestLayoutMain] ❌ Error eliminando respuestas');
        toast.dismiss();
        toast.error('Error al eliminar las respuestas. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('[TestLayoutMain] ❌ Error:', error);
      toast.dismiss();
      toast.error('Error inesperado al eliminar las respuestas');
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
