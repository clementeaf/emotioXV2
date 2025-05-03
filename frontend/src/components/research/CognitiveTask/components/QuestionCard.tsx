import React from 'react';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Question, QuestionCardProps } from '../types';
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
  onFileDelete,
  disabled = false,
  validationErrors = {},
  isUploading,
  uploadProgress
}) => {
  const renderQuestionInput = () => {
    const baseProps = {
      disabled,
      validationErrors
    };

    switch (question.type) {
      case 'short_text':
      case 'long_text':
        return (
          <TextQuestion
            question={question}
            onQuestionChange={(updates) => onQuestionChange(question.id, updates)}
            {...baseProps}
          />
        );

      case 'single_choice':
      case 'multiple_choice':
      case 'ranking':
        return (
          <ChoiceQuestion
            question={question}
            onQuestionChange={(updates) => onQuestionChange(question.id, updates)}
            onAddChoice={() => onAddChoice && onAddChoice(question.id)}
            onRemoveChoice={(choiceId) => onRemoveChoice && onRemoveChoice(question.id, choiceId)}
            {...baseProps}
          />
        );

      case 'linear_scale':
        return (
          <ScaleQuestion
            question={question}
            onQuestionChange={(updates) => onQuestionChange(question.id, updates)}
            {...baseProps}
          />
        );

      case 'navigation_flow':
      case 'preference_test':
        return (
          <FileUploadQuestion
            question={question}
            onQuestionChange={(updates) => onQuestionChange(question.id, updates)}
            onFileUpload={(files) => onFileUpload && onFileUpload(question.id, files)}
            onFileDelete={(fileId) => onFileDelete && onFileDelete(question.id, fileId)}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            {...baseProps}
          />
        );

      default:
        return <p className="text-red-500">Tipo de pregunta no soportado: {question.type}</p>;
    }
  };

  const getQuestionTypeLabel = () => {
    switch (question.type) {
      case 'short_text': return 'Texto Corto';
      case 'long_text': return 'Texto Largo';
      case 'single_choice': return 'Opción Única';
      case 'multiple_choice': return 'Opción Múltiple';
      case 'linear_scale': return 'Escala Lineal';
      case 'ranking': return 'Ranking';
      case 'navigation_flow': return 'Flujo de Navegación';
      case 'preference_test': return 'Prueba de Preferencia';
      default: return 'Tipo Desconocido';
    }
  };

  return (
    <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-100" style={{ maxWidth: '100%', boxSizing: 'border-box' }}>
      <div className="mb-4 pb-3 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-medium text-gray-800">{question.id}</span>
          <span className="ml-2 text-sm text-gray-500">({getQuestionTypeLabel()})</span>
        </div>
        {question.required && (
          <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            Obligatorio
          </div>
        )}
      </div>
      {renderQuestionInput()}
    </div>
  );
}; 