import React, { useCallback } from 'react';
import { SidebarStep } from '../types';
import TestLayoutSidebar from './TestLayoutSidebar';

interface Props {
  onStepsReady?: (steps: SidebarStep[]) => void;
}

const TestLayoutSidebarContainer: React.FC<Props> = ({ onStepsReady }) => {

  const handleDeleteAllResponses = useCallback(async () => {
  }, []);

  return (
    <TestLayoutSidebar
      onStepsReady={onStepsReady}
      onDeleteAllResponses={handleDeleteAllResponses}
    />
  );
};

export default TestLayoutSidebarContainer;
