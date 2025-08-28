import React from 'react';
import { Button } from '@/components/ui/Button';

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
    <div className="flex justify-between mt-4">
      {currentStep > 1 && (
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
        >
          Previous
        </Button>
      )}
      <div className="ml-auto">
        {!isLastStep ? (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onSubmit}
            loading={isSubmitting}
            disabled={!selectedTechnique}
          >
            {selectedTechnique === 'aim-framework'
              ? 'Setup AIM Framework'
              : 'Create Research'}
          </Button>
        )}
      </div>
    </div>
  );
};