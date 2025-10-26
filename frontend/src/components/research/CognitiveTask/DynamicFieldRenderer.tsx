/**
 * Dynamic Field Renderer for Cognitive Task
 * Renders form fields dynamically based on schema configuration
 */

import React from 'react';
import { FormInput } from '@/components/common/FormInput';
import { FormTextarea } from '@/components/common/FormTextarea';
import { ChoiceManager } from '@/components/common/ChoiceManager';
import { FormCheckbox, FileUploadPlaceholder, ErrorDisplay } from '@/components/common/atomic';
import { CognitiveTaskFieldConfig } from './schema.types';
import { ScaleQuestion, ChoiceQuestion, FileUploadQuestion, TextQuestion } from './components/questions';

// Object mapping para renderers de preguntas - más escalable que switch case
const QUESTION_RENDERERS = {
  short_text: TextQuestion,
  long_text: TextQuestion,
  single_choice: ChoiceQuestion,
  multiple_choice: ChoiceQuestion,
  ranking: ChoiceQuestion,
  linear_scale: ScaleQuestion,
  file_upload: FileUploadQuestion,
  preference_test: FileUploadQuestion,
  // Agregar nuevos tipos aquí sin modificar el switch
} as const;

type QuestionType = keyof typeof QUESTION_RENDERERS;

interface DynamicFieldRendererProps {
  field: CognitiveTaskFieldConfig;
  value: any;
  onChange: (value: any) => void;
  question?: any;
  updateQuestion?: (questionId: string, data: any) => void;
}

/**
 * Renders a single field based on its configuration
 */
export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  field,
  value,
  onChange,
  question,
  updateQuestion
}) => {
  const commonProps = {
    value: value || '',
    onChange: (e: any) => onChange(e.target ? e.target.value : e),
  };

  // Si tenemos una pregunta completa, usar componentes específicos
  if (question && updateQuestion) {
    const questionProps = {
      question,
      onQuestionChange: (data: any) => updateQuestion(question.id, data),
      validationErrors: {},
      disabled: false,
      // Props adicionales para ChoiceQuestion
      onAddChoice: () => {
        const currentChoices = question.choices || [];
        const newChoice = {
          id: Date.now().toString(),
          text: '',
          isQualify: false,
          isDisqualify: false
        };
        updateQuestion(question.id, {
          choices: [...currentChoices, newChoice]
        });
      },
      onRemoveChoice: (choiceId: string) => {
        const currentChoices = question.choices || [];
        const newChoices = currentChoices.filter((choice: any) => choice.id !== choiceId);
        updateQuestion(question.id, {
          choices: newChoices
        });
      },
      // Props adicionales para FileUploadQuestion
      onFileUpload: (file: any) => {
        const currentFiles = question.files || [];
        updateQuestion(question.id, {
          files: [...currentFiles, file]
        });
      },
      onFileDelete: (fileId: string) => {
        const currentFiles = question.files || [];
        const newFiles = currentFiles.filter((f: any) => f.id !== fileId);
        updateQuestion(question.id, {
          files: newFiles
        });
      }
    };

    // Usar object mapping en lugar de switch case - más escalable
    const QuestionRenderer = QUESTION_RENDERERS[question.type as QuestionType];
    
    if (!QuestionRenderer) {
      // Manejar tipos no soportados
      return (
        <ErrorDisplay
          message={`Unknown question type: ${question.type}`}
          component="QuestionType"
        />
      );
    }
    
    return <QuestionRenderer {...questionProps} />;
  }

  // Fallback a componentes básicos para campos individuales
  switch (field.component) {
    case 'FormInput':
      return (
        <FormInput
          label={field.props.label}
          placeholder={field.props.placeholder}
          {...commonProps}
        />
      );

    case 'FormTextarea':
      return (
        <FormTextarea
          label={field.props.label}
          placeholder={field.props.placeholder}
          rows={field.props.rows || 3}
          {...commonProps}
        />
      );

    case 'FormCheckbox':
      return (
        <FormCheckbox
          id={field.key}
          label={field.props.label}
          checked={value || false}
          onChange={onChange}
        />
      );

    case 'ChoiceManager':
      return (
        <ChoiceManager
          label={field.props.label}
          value={value || []}
          onChange={onChange}
          minChoices={field.props.minChoices || 2}
          maxChoices={field.props.maxChoices || 10}
          placeholder={field.props.placeholder || 'Ingresa el texto de la opción'}
        />
      );

    case 'FileUploadManager':
      return (
        <FileUploadPlaceholder
          label={field.props.label}
          message="Funcionalidad de carga de archivos en desarrollo"
          acceptedTypes={field.props.acceptedTypes}
        />
      );

    default:
      return (
        <ErrorDisplay
          message={field.component}
          component="Componente"
        />
      );
  }
};
