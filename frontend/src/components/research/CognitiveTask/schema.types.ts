/**
 * Cognitive Task Schema Types
 * Tipos para el schema dinámico de Cognitive Task
 */

export interface CognitiveTaskFieldConfig {
  key: string;
  component: 'FormInput' | 'FormTextarea' | 'FormCheckbox' | 'ChoiceManager' | 'FileUploadManager';
  props: {
    label: string;
    placeholder?: string;
    required?: boolean;
    type?: string;
    rows?: number;
    minChoices?: number;
    maxChoices?: number;
    maxFiles?: number;
    acceptedTypes?: string[];
  };
}

export interface CognitiveTaskQuestionSchema {
  id: string;
  displayName: string;
  type: 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'linear_scale' | 'ranking' | 'file_upload' | 'preference_test';
  fields: CognitiveTaskFieldConfig[];
}
