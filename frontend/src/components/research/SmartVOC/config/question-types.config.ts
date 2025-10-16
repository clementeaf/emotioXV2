import { QuestionType } from 'shared/interfaces/question-types.enum';

export interface QuestionTypeConfig {
  id: string;
  name: string;
  description: string;
  fields: string[];
  displayOptions?: Array<{ value: string; label: string }>;
  scaleOptions?: Array<{ value: string; label: string }>;
  previewType: string;
  hasLabels?: boolean;
  hasScale?: boolean;
  hasDisplayType?: boolean;
}

export const QUESTION_TYPE_CONFIGS: Record<string, QuestionTypeConfig> = {
  [QuestionType.SMARTVOC_CSAT]: {
    id: 'CSAT',
    name: 'CSAT',
    description: 'Customer Satisfaction - Satisfacción del cliente',
    fields: ['title', 'description', 'instructions', 'displayType'],
    displayOptions: [
      { value: 'stars', label: 'Estrellas' },
      { value: 'numbers', label: 'Números' }
    ],
    previewType: 'CSAT',
    hasDisplayType: true
  },
  [QuestionType.SMARTVOC_CES]: {
    id: 'CES',
    name: 'CES',
    description: 'Customer Effort Score - Esfuerzo del cliente',
    fields: ['title', 'description', 'instructions'],
    previewType: 'CES',
    hasScale: false // Escala fija 1-5
  },
  [QuestionType.SMARTVOC_CV]: {
    id: 'CV',
    name: 'CV',
    description: 'Customer Value - Valor del cliente',
    fields: ['title', 'description', 'instructions', 'scaleRange', 'startLabel', 'endLabel'],
    scaleOptions: [
      { value: '1-5', label: 'Escala 1-5' },
      { value: '1-7', label: 'Escala 1-7' },
      { value: '1-10', label: 'Escala 1-10' }
    ],
    previewType: 'CV',
    hasScale: true,
    hasLabels: true
  },
  [QuestionType.SMARTVOC_NEV]: {
    id: 'NEV',
    name: 'NEV',
    description: 'Net Emotional Value - Valor emocional neto',
    fields: ['title', 'description', 'instructions'],
    previewType: 'NEV',
    hasScale: false
  },
  [QuestionType.SMARTVOC_NPS]: {
    id: 'NPS',
    name: 'NPS',
    description: 'Net Promoter Score - Puntuación de promotor neto',
    fields: ['title', 'description', 'instructions', 'scaleRange'],
    scaleOptions: [
      { value: '0-10', label: 'Escala 0-10' },
      { value: '0-6', label: 'Escala 0-6' }
    ],
    previewType: 'NPS',
    hasScale: true
  },
  [QuestionType.SMARTVOC_VOC]: {
    id: 'VOC',
    name: 'VOC',
    description: 'Voice of Customer - Voz del cliente',
    fields: ['title', 'description', 'instructions'],
    previewType: 'VOC',
    hasScale: false
  }
};

export const getQuestionTypeConfig = (type: string): QuestionTypeConfig | null => {
  return QUESTION_TYPE_CONFIGS[type] || null;
};

export const getAvailableQuestionTypes = (): QuestionTypeConfig[] => {
  return Object.values(QUESTION_TYPE_CONFIGS);
};
