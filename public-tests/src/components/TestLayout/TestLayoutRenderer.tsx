import React from 'react';
import { useStepStore } from '../../stores/useStepStore';

const TestLayoutRenderer: React.FC = () => {
  const currentStepKey = useStepStore(state => state.currentStepKey);
  return (
    <div className='flex flex-col items-center justify-center h-full'>
      {!currentStepKey && <div>No step selected</div>}
      {currentStepKey && <div>Step activo: {currentStepKey}</div>}
    </div>
  );
};

export default TestLayoutRenderer;
