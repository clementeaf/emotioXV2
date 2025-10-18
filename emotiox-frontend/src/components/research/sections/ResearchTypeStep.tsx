import React from 'react';
import { Button } from '../../commons';

interface ResearchTypeStepProps {
  selectedType: string;
  onTypeToggle: (type: string) => void;
}

const researchTypes = [
  { id: 'behavioral', name: 'Behavioral Research', description: 'Study human behavior patterns' },
  { id: 'cognitive', name: 'Cognitive Research', description: 'Study mental processes' },
  { id: 'emotional', name: 'Emotional Research', description: 'Study emotional responses' }
];

export const ResearchTypeStep: React.FC<ResearchTypeStepProps> = ({
  selectedType,
  onTypeToggle
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Kind of research</h2>
        <p className="text-neutral-500 text-sm mb-6">
          Select the type of research you wish to carry out
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {researchTypes.map((type) => (
            <div
              key={type.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedType === type.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onTypeToggle(type.id)}
            >
              <h3 className="font-medium text-gray-900 mb-2">{type.name}</h3>
              <p className="text-sm text-gray-600">{type.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
