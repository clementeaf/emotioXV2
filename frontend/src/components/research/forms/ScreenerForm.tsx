'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { FormToggle } from '@/components/common/FormToggle';
import { ActionButton } from '@/components/common/ActionButton';
import { ConditionalSection } from '@/components/common/ConditionalSection';
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

  const handlePreview = () => {
    console.log('Vista previa del screener:', question, 'para investigación:', researchId);
  };

  const handleSave = () => {
    console.log('Guardando screener:', question, 'para investigación:', researchId);
  };

  return (
    <div className="space-y-6">
      {/* ✅ USAR FormToggle de commons */}
      <FormToggle
        label="Screener"
        description="Habilitar o deshabilitar el Screener para esta investigación"
        checked={isEnabled}
        onChange={setIsEnabled}
      />

      {/* ✅ USAR ConditionalSection de commons */}
      <ConditionalSection isVisible={isEnabled} animation={true} fadeIn={true}>
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

          {/* ✅ USAR ActionButton de commons */}
          <div className="flex justify-end space-x-3">
            <ActionButton variant="secondary" onClick={handlePreview}>
              Vista Previa
            </ActionButton>
            <ActionButton variant="primary" onClick={handleSave}>
              Guardar
            </ActionButton>
          </div>
        </div>
      </ConditionalSection>
    </div>
  );
};