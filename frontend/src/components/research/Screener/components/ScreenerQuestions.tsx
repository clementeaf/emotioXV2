/**
 * Componente para gestionar todas las preguntas del Screener
 */

import React from 'react';
import { ScreenerQuestionCard } from './ScreenerQuestionCard';
import type { ScreenerQuestion, ScreenerOption } from '@/api/domains/screener/screener.types';

interface ScreenerQuestionsProps {
  questions: ScreenerQuestion[];
  onUpdateQuestion: (questionId: string, updates: Partial<ScreenerQuestion>) => void;
  onRemoveQuestion: (questionId: string) => void;
  onAddOption: (questionId: string) => void;
  onUpdateOption: (questionId: string, optionId: string, updates: Partial<ScreenerOption>) => void;
  onRemoveOption: (questionId: string, optionId: string) => void;
  disabled?: boolean;
}

export const ScreenerQuestions: React.FC<ScreenerQuestionsProps> = ({
  questions,
  onUpdateQuestion,
  onRemoveQuestion,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  disabled = false
}) => {
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      {sortedQuestions.map((question, index) => (
        <ScreenerQuestionCard
          key={question.id}
          question={question}
          questionNumber={index + 1}
          onUpdate={(updates) => onUpdateQuestion(question.id, updates)}
          onDelete={() => onRemoveQuestion(question.id)}
          onAddOption={() => onAddOption(question.id)}
          onUpdateOption={(optionId, updates) => onUpdateOption(question.id, optionId, updates)}
          onRemoveOption={(optionId) => onRemoveOption(question.id, optionId)}
          disabled={disabled}
        />
      ))}

    </div>
  );
};

