import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTestStore } from '../../stores/useTestStore';
import TestLayoutRenderer from './TestLayoutRenderer';
import TestLayoutSidebar from './TestLayoutSidebar';
import { SidebarStep, StepData } from './types';
import { getSidebarSteps } from './utils';

const TestLayoutMain: React.FC = () => {
  const {
    researchId,
    participantId,
    clearResponses,
    responses,
  } = useTestStore();

  const [sidebarSteps, setSidebarSteps] = useState<SidebarStep[]>([]);

  // Crear pasos de ejemplo para el test local
  const exampleSteps: StepData[] = [
    {
      originalSk: 'WELCOME_SCREEN',
      config: { title: 'Bienvenido' },
      derivedType: 'screen'
    },
    {
      originalSk: 'EYE_TRACKING_CONFIG',
      config: { demographicQuestions: {} },
      derivedType: 'demographics'
    },
    {
      originalSk: 'SMART_VOC_FORM',
      config: {
        questions: [
          { questionKey: 'smartvoc_csat', title: 'SmartVOC CSAT', type: 'csat' }
        ]
      },
      derivedType: 'smartvoc'
    },
    {
      originalSk: 'THANK_YOU_SCREEN',
      config: { title: 'Gracias' },
      derivedType: 'screen'
    },
  ];

  const steps = getSidebarSteps(exampleSteps);

  const handleStepsReady = (steps: SidebarStep[]) => {
    setSidebarSteps(steps);
  };

  const handleNavigateToStep = (stepKey: string) => {
    // Navegación manejada por el store
  };

  const handleDeleteAllResponses = async (): Promise<void> => {
    try {
      toast.loading('Eliminando todas las respuestas...');

      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 500));

      clearResponses();

      toast.dismiss();
      toast.success('Todas las respuestas han sido eliminadas exitosamente');
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
        isLoading={false}
        error={null}
        onStepsReady={handleStepsReady}
        onNavigateToStep={handleNavigateToStep}
        onDeleteAllResponses={handleDeleteAllResponses}
      />
      <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 w-full max-w-2xl flex-1 flex flex-col justify-center mx-auto">
        <TestLayoutRenderer
          data={exampleSteps}
          isLoading={false}
          error={null}
          sidebarSteps={sidebarSteps}
        />
      </div>
    </main>
  );
};

export default TestLayoutMain;
