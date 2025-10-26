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

    switch (question.type) {
      case 'short_text':
      case 'long_text':
        return <TextQuestion {...questionProps} />;
      
      case 'single_choice':
      case 'multiple_choice':
        return <ChoiceQuestion {...questionProps} />;
      
      case 'linear_scale':
        return <ScaleQuestion {...questionProps} />;
      
      case 'file_upload':
        return <FileUploadQuestion {...questionProps} />;
      
      case 'ranking':
        return (
          <ErrorDisplay
            message="Ranking component not implemented yet"
            component="Ranking"
          />
        );
      
      case 'preference_test':
        return (
          <ErrorDisplay
            message="Preference Test component not implemented yet"
            component="PreferenceTest"
          />
        );
      
      default:
        return (
          <ErrorDisplay
            message={`Unknown question type: ${question.type}`}
            component="QuestionType"
          />
        );
    }
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
