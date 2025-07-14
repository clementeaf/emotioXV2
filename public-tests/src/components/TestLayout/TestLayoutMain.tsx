import React from 'react';
import { useLoadResearchFormsConfig } from '../../hooks/useResearchForms';
import { useParticipantStore } from '../../stores/participantStore';
import TestLayoutRenderer from './TestLayoutRenderer';
import TestLayoutSidebar from './TestLayoutSidebar';
import { getSidebarSteps } from './utils';

const TestLayoutMain: React.FC = () => {
  const researchId = useParticipantStore(state => state.researchId);
  const { data, isLoading, error } = useLoadResearchFormsConfig(researchId || '');

  const steps = getSidebarSteps(data?.data ?? undefined);
  return (
    <main className="flex-1 w-full flex flex-col md:flex-row items-stretch px-2 sm:px-4 py-4">
      <TestLayoutSidebar steps={steps} isLoading={isLoading} error={error} />
      <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 w-full max-w-2xl flex-1 flex flex-col justify-center mx-auto">
        <TestLayoutRenderer data={data?.data} isLoading={isLoading} error={error} />
      </div>
    </main>
  );
};

export default TestLayoutMain;
