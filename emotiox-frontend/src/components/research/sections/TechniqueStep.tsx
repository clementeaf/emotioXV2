import React from 'react';
import { Button } from '../../commons';

interface TechniqueStepProps {
  selectedTechnique: string;
  onTechniqueToggle: (technique: string) => void;
}

const techniques = [
  { id: 'eye-tracking', name: 'Eye Tracking', description: 'Track eye movements and gaze patterns' },
  { id: 'implicit-association', name: 'Implicit Association Test', description: 'Measure unconscious biases' },
  { id: 'smart-voc', name: 'Smart VOC', description: 'Voice of Customer analysis' },
  { id: 'cognitive-task', name: 'Cognitive Task', description: 'Measure cognitive performance' }
];

export const TechniqueStep: React.FC<TechniqueStepProps> = ({
  selectedTechnique,
  onTechniqueToggle
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Techniques for Behavioural Research</h2>
        <p className="text-neutral-500 text-sm mb-6">
          Please, select the configuration for this research
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {techniques.map((technique) => (
            <div
              key={technique.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedTechnique === technique.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onTechniqueToggle(technique.id)}
            >
              <h3 className="font-medium text-gray-900 mb-2">{technique.name}</h3>
              <p className="text-sm text-gray-600">{technique.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
