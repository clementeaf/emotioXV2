import React, { useState } from 'react';
import { useLoadResearchFormsConfig } from '../../hooks/useResearchForms';
import { useTestStep } from '../../hooks/useTestStep';
import { useParticipantStore } from '../../stores/participantStore';
import BurgerMenuButton from './BurgerMenuButton';
import MobileOverlay from './MobileOverlay';
import ProgressDisplay from './ProgressDisplay';
import SidebarContainer from './SidebarContainer';
import StepsList from './StepsList';
import { getSidebarSteps, MOCK_CURRENT_STEP } from './utils';

const TestLayoutSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const researchId = useParticipantStore(state => state.researchId);
  const { setStep } = useTestStep();

  const { data, isLoading, error } = useLoadResearchFormsConfig(researchId || '');

  const steps = getSidebarSteps(data?.data ?? undefined);
  const totalSteps = steps.length;

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
              currentStep={MOCK_CURRENT_STEP}
              onStepClick={handleStepClick}
            />
          </>
        )}
      </SidebarContainer>
    </>
  );
};

export default TestLayoutSidebar;
