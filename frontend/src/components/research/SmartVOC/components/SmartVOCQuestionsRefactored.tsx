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
import { AddQuestionModal } from './AddQuestionModal';

/**
 * Componente refactorizado para gestionar las preguntas de SmartVOC
 * Utiliza componentes commons reutilizables y configuración JSON-driven
 */
export const SmartVOCQuestionsRefactored: React.FC<SmartVOCQuestionsProps> = ({
  questions,
  onUpdateQuestion,
  onAddQuestion,
  onRemoveQuestion,
  disabled
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Obtener los tipos de preguntas ya existentes
  const existingQuestionTypes = questions
    .map(q => q.type)
    .filter((t): t is QuestionType => ['CSAT', 'CES', 'CV', 'NEV', 'NPS', 'VOC'].includes(t));

  // Normalizar preguntas para la UI
  const questionsForUI = questions.map(q => ({
    ...q,
    type: q.type
  }));

  // Renderiza la configuración específica para cada tipo de pregunta usando commons
  const renderQuestionConfig = (question: SmartVOCQuestion) => {
    const config = getQuestionTypeConfig(question.type);
    if (!config) return null;

    return (
      <div className="space-y-4">
        {/* Display Type para CSAT */}
        {config.hasDisplayType && (
          <FormSelect
            label="Tipo de visualización"
            value={question.config.type || 'stars'}
            onChange={(value) => onUpdateQuestion(question.id, {
              config: { ...question.config, type: value as any }
            })}
            options={config.displayOptions || []}
            disabled={disabled}
          />
        )}

        {/* Scale Selector para CV y NPS */}
        {config.hasScale && (
          <ScaleSelector
            value={question.config.scaleRange || { start: 1, end: 5 }}
            onChange={(range) => onUpdateQuestion(question.id, {
              config: { ...question.config, scaleRange: range }
            })}
            options={config.scaleOptions?.map(opt => ({ value: opt.value, label: opt.label }))}
            disabled={disabled}
          />
        )}

        {/* Labels para CV */}
        {config.hasLabels && (
          <div className="space-y-3">
            <LabeledInput
              label={UI_TEXTS.QUESTIONS.START_LABEL_TEXT}
              value={question.config.startLabel || ''}
              onChange={(value) => onUpdateQuestion(question.id, {
                config: { ...question.config, startLabel: value }
              })}
              placeholder={UI_TEXTS.QUESTIONS.START_LABEL_PLACEHOLDER}
              disabled={disabled}
            />
            <LabeledInput
              label={UI_TEXTS.QUESTIONS.END_LABEL_TEXT}
              value={question.config.endLabel || ''}
              onChange={(value) => onUpdateQuestion(question.id, {
                config: { ...question.config, endLabel: value }
              })}
              placeholder={UI_TEXTS.QUESTIONS.END_LABEL_PLACEHOLDER}
              disabled={disabled}
            />
          </div>
        )}

        {/* Info para CES */}
        {question.type === QuestionType.SMARTVOC_CES && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900">CES</span>
            <div className="text-sm text-neutral-600 bg-neutral-100 px-3 py-2 rounded-lg">
              Escala fija 1-5
            </div>
          </div>
        )}

        {/* Info para NEV */}
        {question.type === QuestionType.SMARTVOC_NEV && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900">NEV</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-900">Jerarquía de Valor Emocional</span>
            </div>
          </div>
        )}

        {/* Info para CV */}
        {question.type === QuestionType.SMARTVOC_CV && (
          <div className="bg-amber-50 p-2 rounded text-xs text-amber-700">
            3 escalas principales de valoración en la región
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
            {/* Campos básicos usando commons */}
            <FormInput
              label="Título de la pregunta"
              value={question.title}
              onChange={(value) => onUpdateQuestion(question.id, { title: value })}
              placeholder="Introduzca el título de la pregunta"
              disabled={disabled}
            />

            <FormTextarea
              label="Descripción (opcional)"
              value={question.description || ''}
              onChange={(value) => onUpdateQuestion(question.id, { description: value })}
              placeholder="Introduzca una descripción opcional para la pregunta"
              rows={3}
              disabled={disabled}
            />

            <FormTextarea
              label="Instrucciones (opcional)"
              value={question.instructions || ''}
              onChange={(value) => onUpdateQuestion(question.id, { instructions: value })}
              placeholder="Añada instrucciones o información adicional para los participantes"
              rows={3}
              disabled={disabled}
            />

            {/* Configuración específica del tipo */}
            {renderQuestionConfig(question)}

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

      {/* Botón para agregar nueva pregunta */}
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
