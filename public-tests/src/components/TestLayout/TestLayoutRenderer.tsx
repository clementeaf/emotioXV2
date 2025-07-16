import React from 'react';
import { useStepStore } from '../../stores/useStepStore';

const TestLayoutRenderer: React.FC = () => {
  let renderedForm: React.ReactNode = null;
  const currentQuestionKey = useStepStore(state => state.currentQuestionKey);

  if (currentQuestionKey === 'welcome_screen') {
    renderedForm = (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>¡Bienvenido!</h1>
        <p>Gracias por participar en este estudio</p>
        <p>Estás a punto de comenzar una experiencia única</p>
        <button style={{ padding: '10px 20px', backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '5px' }}>
          Comenzar
        </button>
      </div>
    );
  } else {
    renderedForm = <div>No se encontró información para este step</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {renderedForm}
      </div>
    </div>
  );
};

export default TestLayoutRenderer;
