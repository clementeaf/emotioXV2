import React, { useCallback, useState } from 'react';
import TestLayoutRenderer from '../TestLayoutRenderer';
import TestLayoutSidebar from '../sidebar/TestLayoutSidebar';
import { SidebarStep } from '../types/types';

const TestLayoutMain: React.FC = () => {
  const [, setSidebarSteps] = useState<SidebarStep[]>([]);
  const shouldShowSidebar = true;

  const handleStepsReady = useCallback((steps: SidebarStep[]) => {
    setSidebarSteps(steps);
  }, []);

  return (
    <>
      <main className="flex-1 w-full flex flex-col items-center justify-center px-2 sm:px-4 py-20">
        <div className={`flex w-full ${shouldShowSidebar ? 'max-w-7xl' : 'max-w-4xl'}`}>
          {shouldShowSidebar && (
            <TestLayoutSidebar
              onStepsReady={handleStepsReady}
              onNavigateToStep={() => { }}
            />
          )}
          <div className={`bg-white shadow-lg rounded-lg p-2 sm:px-4 md:p-6 w-full max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] flex flex-col justify-center ${shouldShowSidebar ? 'max-w-4xl' : 'max-w-2xl mx-auto'}`}>
            <TestLayoutRenderer />
          </div>
        </div>
      </main>
    </>
  );
};

export default TestLayoutMain;
