'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { ChoiceQuestion } from '@/components/research/CognitiveTask/components/questions/ChoiceQuestion';
import type { Question, Choice } from '@/components/research/CognitiveTask/types';

interface ScreenerFormProps {
  researchId: string;
}

export const ScreenerForm = ({ researchId }: ScreenerFormProps) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [question, setQuestion] = useState<Question>({
    id: uuidv4(),
    title: '',
    description: '',
    type: 'choice',
    choices: [
      { id: uuidv4(), text: '', isQualify: false, isDisqualify: false },
      { id: uuidv4(), text: '', isQualify: false, isDisqualify: false }
    ],
    required: true,
    showConditionally: false,
    deviceFrame: false,
    files: []
  });

  const handleQuestionChange = (updates: Partial<Question>) => {
    setQuestion(prev => ({ ...prev, ...updates }));
  };

  const handleAddChoice = () => {
    const newChoice: Choice = {
      id: uuidv4(),
      text: '',
      isQualify: false,
      isDisqualify: false
    };
    setQuestion(prev => ({
      ...prev,
      choices: [...(prev.choices || []), newChoice]
    }));
  };

  const handleRemoveChoice = (choiceId: string) => {
    setQuestion(prev => ({
      ...prev,
      choices: prev.choices?.filter((choice: Choice) => choice.id !== choiceId) || []
    }));
  };

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Screener</h3>
            <p className="text-sm text-gray-600">
              Habilitar o deshabilitar el Screener para esta investigación
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {isEnabled ? 'Habilitado' : 'Deshabilitado'}
            </span>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              aria-label="Habilitar o deshabilitar Screener"
            />
          </div>
        </div>
      </div>

      {isEnabled && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              1.0.- Screener
            </h3>

            <ChoiceQuestion
              question={question}
              onQuestionChange={handleQuestionChange}
              onAddChoice={handleAddChoice}
              onRemoveChoice={handleRemoveChoice}
              validationErrors={null}
              disabled={false}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline">Vista Previa</Button>
            <Button>Guardar</Button>
          </div>
        </div>
      )}
    </div>
  );
};