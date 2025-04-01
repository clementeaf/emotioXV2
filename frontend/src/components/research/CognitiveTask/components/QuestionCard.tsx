import React from 'react';
import { Switch } from '@/components/ui/Switch';
import { QuestionCardProps } from '../types';
import { UI_TEXTS } from '../constants';
import { TextQuestion } from './questions/TextQuestion';
import { ChoiceQuestion } from './questions/ChoiceQuestion';
import { ScaleQuestion } from './questions/ScaleQuestion';
import { FileUploadQuestion } from './questions/FileUploadQuestion';

/**
 * Componente para mostrar una tarjeta de pregunta con su configuración específica según el tipo
 */
export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onQuestionChange,
  onAddChoice,
  onRemoveChoice,
  onFileUpload,
  disabled,
  validationErrors
}) => {
  // Renderiza el contenido específico de la pregunta según su tipo
  const renderQuestionContent = () => {
    switch (question.type) {
      case 'short_text':
      case 'long_text':
        return (
          <TextQuestion
            question={question}
            onQuestionChange={(updates) => onQuestionChange(question.id, updates)}
            validationErrors={validationErrors}
            disabled={disabled}
          />
        );
      
      case 'single_choice':
      case 'multiple_choice':
      case 'ranking':
        return (
          <ChoiceQuestion
            question={question}
            onQuestionChange={(updates) => onQuestionChange(question.id, updates)}
            onAddChoice={() => onAddChoice?.(question.id)}
            onRemoveChoice={(choiceId) => onRemoveChoice?.(question.id, choiceId)}
            validationErrors={validationErrors}
            disabled={disabled}
          />
        );
      
      case 'linear_scale':
        return (
          <ScaleQuestion
            question={question}
            onQuestionChange={(updates) => onQuestionChange(question.id, updates)}
            validationErrors={validationErrors}
            disabled={disabled}
          />
        );
      
      case 'navigation_flow':
      case 'preference_test':
        return (
          <FileUploadQuestion
            question={question}
            onQuestionChange={(updates) => onQuestionChange(question.id, updates)}
            onFileUpload={(files) => onFileUpload?.(question.id, files)}
            validationErrors={validationErrors}
            disabled={disabled}
          />
        );
      
      default:
        return <div>Tipo de pregunta no soportado</div>;
    }
  };

  return (
    <div className="mb-6 p-4 bg-white rounded-lg border border-neutral-100 shadow-sm">
      <div className="mb-4 pb-4 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-medium">Pregunta: {question.type}</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-neutral-500">{UI_TEXTS.QUESTION_CARD.SHOW_CONDITIONALLY_LABEL}</span>
              <Switch
                checked={question.showConditionally}
                onCheckedChange={(checked) => onQuestionChange(question.id, { showConditionally: checked })}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-neutral-500">{UI_TEXTS.QUESTION_CARD.REQUIRED_LABEL}</span>
              <Switch
                checked={question.required}
                onCheckedChange={(checked) => onQuestionChange(question.id, { required: checked })}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenido específico según tipo de pregunta */}
      {renderQuestionContent()}
      
      {/* Configuración del marco de dispositivo */}
      <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">{UI_TEXTS.QUESTION_CARD.DEVICE_FRAME_LABEL}</span>
          <Switch
            checked={question.deviceFrame}
            onCheckedChange={(checked) => onQuestionChange(question.id, { deviceFrame: checked })}
            disabled={disabled}
          />
        </div>
        <span className="text-xs text-neutral-500">{UI_TEXTS.QUESTION_CARD.NO_FRAME_LABEL}</span>
      </div>
    </div>
  );
}; 