import React, { useCallback } from 'react';
import { SidebarStep } from '../types';
import TestLayoutSidebar from './TestLayoutSidebar';

interface Props {
  onStepsReady?: (steps: SidebarStep[]) => void;
}

const TestLayoutSidebarContainer: React.FC<Props> = ({ onStepsReady }) => {
  const handleNavigateToStep = useCallback((stepKey: string) => {
    // Aquí puedes agregar lógica de navegación si es necesario
    console.log('[TestLayoutSidebarContainer] Navegando a paso:', stepKey);
  }, []);

  const handleDeleteAllResponses = useCallback(async () => {
    // Aquí puedes agregar lógica de eliminación si es necesario
    console.log('[TestLayoutSidebarContainer] Eliminando todas las respuestas');
  }, []);

  return (
    <TestLayoutSidebar
      onStepsReady={onStepsReady}
      onNavigateToStep={handleNavigateToStep}
      onDeleteAllResponses={handleDeleteAllResponses}
    />
  );
};

export default TestLayoutSidebarContainer;
