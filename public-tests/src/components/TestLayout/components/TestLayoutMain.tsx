import React, { useCallback, useState } from 'react';
import TestLayoutRenderer from '../TestLayoutRenderer';
import TestLayoutSidebar from '../sidebar/TestLayoutSidebar';
import { SidebarStep } from '../types/types';
import { usePreviewModeStore } from '../../../stores/usePreviewModeStore';
import { useTestStore } from '../../../stores/useTestStore';
import { useEyeTrackingConfigQuery } from '../../../hooks/useEyeTrackingConfigQuery';

const TestLayoutMain: React.FC = () => {
  const [, setSidebarSteps] = useState<SidebarStep[]>([]);
  const isPreviewMode = usePreviewModeStore((state) => state.isPreviewMode);
  const { researchId } = useTestStore();
  const { data: eyeTrackingConfig } = useEyeTrackingConfigQuery(researchId || '');
  
  const shouldShowSidebar = eyeTrackingConfig?.linkConfig?.showProgressBar ?? true;

  const handleStepsReady = useCallback((steps: SidebarStep[]) => {
    setSidebarSteps(steps);
  }, []);

  return (
    <>
      {/* Banner de modo preview */}
      {isPreviewMode && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white px-4 py-2 text-center font-medium shadow-md z-50">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>MODO PREVIEW - Las respuestas no se guardarán</span>
          </div>
        </div>
      )}

      <main className="w-screen h-screen flex flex-col items-center justify-center px-2 sm:px-4 py-20 bg-blue-50">
        <div className={`flex w-full ${shouldShowSidebar ? 'max-w-7xl' : 'max-w-4xl'}`}>
          {shouldShowSidebar && (
            <TestLayoutSidebar
              onStepsReady={handleStepsReady}
              onNavigateToStep={() => { }}
            />
          )}
          <div className={`bg-white shadow-sm rounded-xl p-6 justify-center w-full`}>
            <TestLayoutRenderer />
          </div>
        </div>
      </main>
    </>
  );
};

export default TestLayoutMain;
