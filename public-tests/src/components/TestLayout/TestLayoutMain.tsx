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
    <main className="flex-1 w-full flex flex-col items-center justify-center md:flex-row items-stretch px-2 sm:px-4 py-20">
      <TestLayoutSidebarContainer
        onStepsReady={handleStepsReady}
      />
      <div className="bg-white shadow-lg rounded-lg p-2 sm:p-4 md:p-6 w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[75vw] max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] flex-1 flex flex-col justify-center mx-auto">
        <TestLayoutRenderer />
      </div>
    </main>
  );
};

export default TestLayoutMain;
