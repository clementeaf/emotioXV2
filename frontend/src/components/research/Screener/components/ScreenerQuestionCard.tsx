/**
 * Componente para mostrar y editar una pregunta individual del Screener
 */

import React from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CustomSelect, Option } from '@/components/ui/CustomSelect';
import type { ScreenerQuestion, ScreenerOption } from '@/api/domains/screener/screener.types';

interface ScreenerQuestionCardProps {
  question: ScreenerQuestion;
  questionNumber: number;
  onUpdate: (updates: Partial<ScreenerQuestion>) => void;
  onDelete: () => void;
  onAddOption: () => void;
  onUpdateOption: (optionId: string, updates: Partial<ScreenerOption>) => void;
  onRemoveOption: (optionId: string) => void;
  disabled?: boolean;
}

const QUESTION_TYPES: Option[] = [
  { value: 'single_choice', label: 'Single choice' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text', label: 'Long text' },
  { value: 'linear_scale', label: 'Linear scale' },
  { value: 'ranking', label: 'Ranking' },
  { value: 'navigation_flow', label: 'Navigation flow' },
  { value: 'preference_test', label: 'Preference test' }
];

const ELIGIBILITY_OPTIONS: Option[] = [
  { value: 'qualify', label: 'Qualify' },
  { value: 'disqualify', label: 'Disqualify' }
];

export const ScreenerQuestionCard: React.FC<ScreenerQuestionCardProps> = ({
  question,
  questionNumber,
  onUpdate,
  onDelete,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  disabled = false
}) => {
  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ questionText: e.target.value });
  };

  const handleQuestionTypeChange = (value: string) => {
    const newType = value as ScreenerQuestion['questionType'];
    const updates: Partial<ScreenerQuestion> = { questionType: newType };
    
    // Tipos que requieren opciones con qualify/disqualify
    if (newType === 'single_choice' || newType === 'multiple_choice' || newType === 'ranking') {
      if (!question.options || question.options.length === 0) {
        updates.options = [
          { id: '1', label: '', value: '', eligibility: 'qualify' },
          { id: '2', label: '', value: '', eligibility: 'qualify' },
          { id: '3', label: '', value: '', eligibility: 'qualify' }
        ];
      }
    } else if (newType === 'linear_scale') {
      updates.options = undefined;
      if (!question.scaleConfig) {
        updates.scaleConfig = {
          startValue: 1,
          endValue: 5
        };
      }
    } else {
      // short_text, long_text, navigation_flow, preference_test
      updates.options = undefined;
    }
    
    onUpdate(updates);
  };

  const handleOptionLabelChange = (optionId: string, value: string) => {
    onUpdateOption(optionId, { label: value, value: value });
  };

  const handleOptionEligibilityChange = (optionId: string, value: string) => {
    onUpdateOption(optionId, { eligibility: value as 'qualify' | 'disqualify' });
  };

  const showOptions = question.questionType === 'single_choice' || 
                      question.questionType === 'multiple_choice' || 
                      question.questionType === 'ranking';
  
  const showScaleConfig = question.questionType === 'linear_scale';
  
  const showTextFields = question.questionType === 'short_text' || question.questionType === 'long_text';

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start gap-3 mb-4">
        <div className="cursor-move mt-2 text-gray-400 hover:text-gray-600">
          <GripVertical className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-500 mb-1">
            {questionNumber}.{questionNumber}.-Question
          </div>
          
          <div className="flex items-center gap-3 mb-3">
            <input
              type="text"
              value={question.questionText || ''}
              onChange={handleQuestionTextChange}
              placeholder="Ask something"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
            
            <CustomSelect
              value={question.questionType}
              onChange={handleQuestionTypeChange}
              options={QUESTION_TYPES}
              disabled={disabled}
              className="w-[140px]"
            />
            
            <button
              onClick={onDelete}
              disabled={disabled}
              className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>

          {showOptions && question.options && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">
                  Choices (Press ENTER for new line or paste a list)
                </div>
                <div className="text-sm font-medium text-gray-700">
                  Elegibility
                </div>
              </div>
              
              {question.options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-3">
                  <div className="cursor-move text-gray-400 hover:text-gray-600">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  
                  <input
                    type="text"
                    value={option.label || ''}
                    onChange={(e) => handleOptionLabelChange(option.id, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={disabled}
                  />
                  
                  <CustomSelect
                    value={option.eligibility}
                    onChange={(value) => handleOptionEligibilityChange(option.id, value)}
                    options={ELIGIBILITY_OPTIONS}
                    disabled={disabled}
                    className="w-32"
                  />
                  
                  <button
                    onClick={() => onRemoveOption(option.id)}
                    disabled={disabled || question.options!.length <= 1}
                    className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={onAddOption}
                disabled={disabled}
                className="mt-2"
              >
                Add another choice
              </Button>
            </div>
          )}

          {showScaleConfig && question.scaleConfig && (
            <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-3">Linear Scale Configuration</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Start Value</label>
                  <input
                    type="number"
                    value={question.scaleConfig.startValue || 1}
                    onChange={(e) => onUpdate({
                      scaleConfig: {
                        ...question.scaleConfig!,
                        startValue: parseInt(e.target.value) || 1
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">End Value</label>
                  <input
                    type="number"
                    value={question.scaleConfig.endValue || 5}
                    onChange={(e) => onUpdate({
                      scaleConfig: {
                        ...question.scaleConfig!,
                        endValue: parseInt(e.target.value) || 5
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Start Label (optional)</label>
                  <input
                    type="text"
                    value={question.scaleConfig.startLabel || ''}
                    onChange={(e) => onUpdate({
                      scaleConfig: {
                        ...question.scaleConfig!,
                        startLabel: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={disabled}
                    placeholder="e.g., Poor"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">End Label (optional)</label>
                  <input
                    type="text"
                    value={question.scaleConfig.endLabel || ''}
                    onChange={(e) => onUpdate({
                      scaleConfig: {
                        ...question.scaleConfig!,
                        endLabel: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={disabled}
                    placeholder="e.g., Excellent"
                  />
                </div>
              </div>
            </div>
          )}

          {showTextFields && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Answer Placeholder (optional)</label>
                <input
                  type="text"
                  value={question.answerPlaceholder || ''}
                  onChange={(e) => onUpdate({ answerPlaceholder: e.target.value })}
                  placeholder="Enter placeholder text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={disabled}
                />
              </div>
            </div>
          )}

          {(question.questionType === 'navigation_flow' || question.questionType === 'preference_test') && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> {question.questionType === 'navigation_flow' 
                  ? 'Navigation flow and preference test questions require file uploads. This functionality will be available in a future update.'
                  : 'Preference test questions require file uploads. This functionality will be available in a future update.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

