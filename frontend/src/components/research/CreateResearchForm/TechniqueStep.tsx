import React from 'react';
import { Button } from '@/components/ui/Button';

interface TechniqueStepProps {
  selectedTechnique?: string;
  onTechniqueToggle: (technique: string) => void;
}

export const TechniqueStep: React.FC<TechniqueStepProps> = ({
  selectedTechnique,
  onTechniqueToggle
}) => {
  return (
    <div className="space-y-6 h-[310px]">
      <div>
        <h2 className="text-xl font-medium mb-2">Techniques for Behavioural Research</h2>
        <p className="text-neutral-500 text-sm mb-6">
          Please, select the configuration for this research.
        </p>

        <div className="space-y-4">
          {/* Opción AIM Framework Stage 3 */}
          <div className="flex items-center justify-between border border-neutral-200 rounded-lg p-4">
            <div className="flex-1">
              <div className="text-md font-medium mb-2">AIM Framework Stage 3</div>
              <p className="text-sm text-neutral-600">
                Start with VOC Smart or build an upgrade by your own
              </p>
            </div>
            <div className="ml-4">
              <Button
                type="button"
                variant={selectedTechnique === 'aim-framework' ? 'default' : 'outline'}
                onClick={() => onTechniqueToggle('aim-framework')}
                className={selectedTechnique === 'aim-framework' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                {selectedTechnique === 'aim-framework' ? 'Selected' : 'Choose'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};