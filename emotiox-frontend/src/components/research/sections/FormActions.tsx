import React from 'react';
import { Button } from '../../commons';

interface FormActionsProps {
  currentStep: number;
  totalSteps: number;
  canGoNext: boolean;
  isSubmitting: boolean;
  selectedTechnique?: string;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({
  currentStep,
  totalSteps,
  canGoNext,
  isSubmitting,
  selectedTechnique,
  onPrevious,
  onNext,
  onSubmit
}) => {
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex justify-between mt-6">
      {currentStep > 1 && (
        <Button
          onClick={onPrevious}
          className="bg-gray-600 text-white hover:bg-gray-700"
        >
          Anterior
        </Button>
      )}
      <div className="ml-auto">
        {!isLastStep ? (
          <Button
            onClick={onNext}
            disabled={!canGoNext}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            Siguiente
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={!selectedTechnique || isSubmitting}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Creando...' : 
              selectedTechnique === 'aim-framework'
                ? 'Configurar AIM Framework'
                : 'Crear Investigación'}
          </Button>
        )}
      </div>
    </div>
  );
};
