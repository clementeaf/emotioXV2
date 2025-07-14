import React from 'react';
import { useTestStep } from '../../hooks/useTestStep';
import TestLayoutSidebar from './TestLayoutSidebar';

const TestLayoutMain: React.FC = () => {
  const { currentStepKey, getCurrentStep } = useTestStep();

  const renderContent = () => {
    if (!currentStepKey) {
      return (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Bienvenido al Test</h2>
          <p className="text-gray-600 mb-6">
            Selecciona un paso del menú lateral para comenzar el test.
          </p>
        </div>
      );
    }

    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Paso: {currentStepKey}
        </h2>
        <p className="text-gray-600 mb-6">
          Contenido del formulario para: {currentStepKey}
        </p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center">
          <p className="text-gray-500">
            Aquí se renderizará el formulario correspondiente al step: {currentStepKey}
          </p>
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 w-full flex flex-col md:flex-row items-stretch px-2 sm:px-4 py-4">
      <TestLayoutSidebar />
      <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 w-full max-w-2xl flex-1 flex flex-col justify-center mx-auto">
        {renderContent()}
      </div>
    </main>
  );
};

export default TestLayoutMain;
