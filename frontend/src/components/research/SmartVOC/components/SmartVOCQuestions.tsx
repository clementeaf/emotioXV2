import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormCard } from '@/components/common/FormCard';
import { FormInput } from '@/components/common/FormInput';
import { FormTextarea } from '@/components/common/FormTextarea';
import { FormSelect } from '@/components/common/FormSelect';
import { LabeledInput } from '@/components/common/LabeledInput';
import { ScaleSelector } from '@/components/common/ScaleSelector';
import { QuestionPreview } from '@/components/common/QuestionPreview';
import { ActionButton } from '@/components/common/ActionButton';
import { QuestionType } from 'shared/interfaces/question-types.enum';
import { UI_TEXTS } from '../constants';
import { SmartVOCQuestion, SmartVOCQuestionsProps } from '../types';
import { getQuestionTypeConfig } from '../config/question-types.config';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';
import { getNestedValue, createFieldChangeHandler } from '../utils/field-helpers';
import { AddQuestionModal } from './AddQuestionModal';

export const SmartVOCQuestions: React.FC<SmartVOCQuestionsProps> = ({
  questions,
  onUpdateQuestion,
  onAddQuestion,
  onRemoveQuestion,
  disabled
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const existingQuestionTypes = questions
    .map(q => q.type)
    .filter((t): t is QuestionType => ['CSAT', 'CES', 'CV', 'NEV', 'NPS', 'VOC'].includes(t));

  const questionsForUI = questions.map(q => ({
    ...q,
    type: q.type
  }));

  // Renderiza dinámicamente todos los campos basado en la configuración JSON
  const renderQuestionFields = (question: SmartVOCQuestion) => {
    const config = getQuestionTypeConfig(question.type);
    if (!config) return null;

    return (
      <div className="space-y-4">
        {/* Renderizar todos los campos dinámicamente */}
        {config.fields.map((field, index) => {
          const fieldValue = getNestedValue(question, field.name);
          const handleChange = createFieldChangeHandler(question.id, field.name, onUpdateQuestion);

          return (
            <DynamicFieldRenderer
              key={`${question.id}-${field.name}-${index}`}
              field={field}
              value={fieldValue}
              onChange={handleChange}
              disabled={disabled}
            />
          );
        })}

        {/* Info específica del tipo */}
        {config.info && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900">{config.name}</span>
            <div className="text-sm text-neutral-600 bg-neutral-100 px-3 py-2 rounded-lg">
              {config.info}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleAddQuestion = (question: SmartVOCQuestion) => {
    onAddQuestion(question);
  };

  return (
    <div className="space-y-6">
      {questionsForUI.map((question, index) => (
        <FormCard key={question.id || index} title={`Pregunta ${index + 1}: ${question.title}`}>
          <div className="space-y-5">
            {/* Renderizar todos los campos dinámicamente */}
            {renderQuestionFields(question)}

            {/* Vista previa usando commons */}
            <QuestionPreview
              title={question.title}
              description={question.description}
              instructions={question.instructions}
              type={question.type}
              config={question.config}
            />

            {/* Botón eliminar usando commons */}
            {questions.length > 1 && (
              <div className="flex justify-end pt-4 border-t">
                <ActionButton
                  variant="danger"
                  onClick={() => onRemoveQuestion(question.id)}
                  disabled={disabled}
                  icon="🗑️"
                >
                  Eliminar pregunta
                </ActionButton>
              </div>
            )}
          </div>
        </FormCard>
      ))}

      <div className="pt-4">
        <Button
          variant="outline"
          onClick={() => setIsAddModalOpen(true)}
          disabled={disabled || existingQuestionTypes.length === 7}
          className="w-full"
        >
          Añadir pregunta
        </Button>
      </div>

      <AddQuestionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddQuestion={handleAddQuestion}
        existingQuestionTypes={existingQuestionTypes}
      />
    </div>
  );
};
