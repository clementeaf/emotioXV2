import React, { useEffect, useState } from 'react';
import { useStepStore } from '../../stores/useStepStore';
import BurgerMenuButton from './BurgerMenuButton';
import MobileOverlay from './MobileOverlay';
import ProgressDisplay from './ProgressDisplay';
import SidebarContainer from './SidebarContainer';
import StepsList from './StepsList';
import { TestLayoutSidebarProps } from './types';
import { MOCK_CURRENT_STEP } from './utils';

const TestLayoutSidebar: React.FC<TestLayoutSidebarProps> = ({ steps, isLoading, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const setStep = useStepStore(state => state.setStep);
  const currentStepKey = useStepStore(state => state.currentStepKey);
  const totalSteps = steps.length;

  useEffect(() => {
    if (steps.length > 0 && !currentStepKey) {
      setStep(steps[0].questionKey);
    }
  }, [steps, currentStepKey, setStep]);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const handleStepClick = (step: any, index: number) => {
    setStep(step.questionKey);
  };

  return (
    <>
      <BurgerMenuButton onClick={toggleSidebar} />
      <MobileOverlay isOpen={isOpen} onClose={closeSidebar} />
      <SidebarContainer isOpen={isOpen} onClose={closeSidebar}>
        {isLoading ? (
          <div className="text-gray-400 text-sm">Cargando pasos...</div>
        ) : error ? (
          <div className="text-red-500 text-sm">Error al cargar pasos</div>
        ) : (
          <>
            <ProgressDisplay current={MOCK_CURRENT_STEP} total={totalSteps} />
            <StepsList
              steps={steps}
              currentStepKey={currentStepKey}
              onStepClick={handleStepClick}
            />
          </>
        )}
      </SidebarContainer>
    </>
  );
};

export default TestLayoutSidebar;
