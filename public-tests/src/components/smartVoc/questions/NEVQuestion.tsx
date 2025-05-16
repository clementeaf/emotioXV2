import React from 'react';

interface NEVQuestionConfig {
  id: string;
  title?: string;
  description?: string;
  required?: boolean;
}

interface NEVQuestionProps {
  questionConfig: NEVQuestionConfig;
  value: number | null;
  onChange: (questionId: string, value: number | null) => void;
}

const emojiOptions = [
  { value: 'negative', label: '😞', numValue: -1 },
  { value: 'neutral', label: '😐', numValue: 0 },
  { value: 'positive', label: '😊', numValue: 1 },
];

export const NEVQuestion: React.FC<NEVQuestionProps> = ({ questionConfig, value, onChange }) => {
  const { id, title: _title, description, required: _required } = questionConfig;

  return (
    <div className="space-y-4">
      <p className="text-base md:text-lg font-medium text-gray-800">{description}</p>
      
      <div className="flex justify-center gap-4 md:gap-6">
        {emojiOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(id, option.numValue)}
            className={`p-2 rounded-full transition-all duration-150 ease-in-out 
              // Comparar con valor numérico
              ${value === option.numValue 
                ? 'bg-blue-100 ring-2 ring-blue-500 scale-110' 
                : 'bg-gray-100 hover:bg-gray-200'
              }`}
             aria-label={`Select ${option.value}`}
          >
            <span className="text-3xl md:text-4xl">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}; 