import React from 'react';
import { ChoiceItem, AddButton, ScrollableContainer, LimitIndicator } from './atomic';

interface Choice {
  id: string;
  text: string;
  isQualify?: boolean;
  isDisqualify?: boolean;
}

interface ChoiceManagerProps {
  label: string;
  value: Choice[];
  onChange: (choices: Choice[]) => void;
  minChoices?: number;
  maxChoices?: number;
  placeholder?: string;
  className?: string;
}

export const ChoiceManager: React.FC<ChoiceManagerProps> = ({
  label,
  value = [],
  onChange,
  minChoices = 2,
  maxChoices = 10,
  placeholder = 'Ingresa el texto de la opción',
  className = ''
}) => {
  const addChoice = () => {
    if (value.length < maxChoices) {
      const newChoice: Choice = {
        id: Date.now().toString(),
        text: '',
        isQualify: false,
        isDisqualify: false
      };
      onChange([...value, newChoice]);
    }
  };

  const removeChoice = (index: number) => {
    if (value.length > minChoices) {
      const newChoices = value.filter((_, i) => i !== index);
      onChange(newChoices);
    }
  };

  const updateChoice = (index: number, text: string) => {
    const newChoices = [...value];
    newChoices[index] = { ...newChoices[index], text };
    onChange(newChoices);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="space-y-3 h-[140px]">
        <ScrollableContainer height="h-[140px]">
          {value.map((choice, index) => (
            <ChoiceItem
              key={choice.id}
              value={choice.text}
              onChange={(text) => updateChoice(index, text)}
              onRemove={() => removeChoice(index)}
              placeholder={placeholder}
              canRemove={value.length > minChoices}
              index={index}
            />
          ))}
        </ScrollableContainer>

        <AddButton
          onClick={addChoice}
          label="Agregar opción"
          disabled={value.length >= maxChoices}
          className="pt-2"
        />

        <LimitIndicator
          current={value.length}
          max={maxChoices}
          type="max"
        />
      </div>
    </div>
  );
};
