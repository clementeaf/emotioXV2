import React, { useCallback, useState } from 'react';
import TestLayoutRenderer from './TestLayoutRenderer';
import TestLayoutSidebarContainer from './sidebar/TestLayoutSidebarContainer';
import { SidebarStep } from './types';

const TestLayoutMain: React.FC = () => {
  const [sidebarSteps, setSidebarSteps] = useState<SidebarStep[]>([]);

  const handleStepsReady = useCallback((steps: SidebarStep[]) => {
    setSidebarSteps(steps);
  }, []);

  return (
    <main className="flex-1 w-full flex flex-col md:flex-row items-stretch px-2 sm:px-4 py-4">
      <TestLayoutSidebarContainer
        onStepsReady={handleStepsReady}
      />
      <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 w-full max-w-2xl flex-1 flex flex-col justify-center mx-auto">
        <TestLayoutRenderer
          data={[]}
          isLoading={false}
          error={null}
          sidebarSteps={sidebarSteps}
        />
      </div>
    </main>
  );
};

export default TestLayoutMain;
