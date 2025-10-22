import { QuestionType } from 'shared/interfaces/question-types.enum';

export interface FieldConfig {
  name: string;
  label: string;
  component: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  options?: Array<{ value: string; label: string }>;
}

export interface QuestionTypeConfig {
  id: string;
  name: string;
  description: string;
  fields: Array<{
    name: string;
    label: string;
    component: string;
    placeholder?: string;
    required?: boolean;
    options?: Array<{ value: string; label: string }>;
  }>;
  previewType: string;
  info?: string;
}

export const QUESTION_TYPE_CONFIGS: Record<string, QuestionTypeConfig> = {
  [QuestionType.SMARTVOC_CSAT]: {
    id: 'CSAT',
    name: 'CSAT',
    description: 'Customer Satisfaction - Satisfacción del cliente',
    fields: [
      {
        name: 'title',
        label: 'Título de la pregunta',
        component: 'FormInput',
        placeholder: 'Introduzca el título de la pregunta',
        required: true
      },
      {
        name: 'description',
        label: 'Descripción (opcional)',
        component: 'FormTextarea',
        placeholder: 'Introduzca una descripción opcional para la pregunta'
      },
      {
        name: 'instructions',
        label: 'Instrucciones (opcional)',
        component: 'FormTextarea',
        placeholder: 'Añada instrucciones o información adicional para los participantes'
      },
      {
        name: 'config.type',
        label: 'Tipo de visualización',
        component: 'FormSelect',
        placeholder: 'Seleccionar tipo',
        options: [
          { value: 'stars', label: 'Estrellas' },
          { value: 'numbers', label: 'Números' }
        ]
      }
    ],
    previewType: 'CSAT'
  },
  [QuestionType.SMARTVOC_CES]: {
    id: 'CES',
    name: 'CES',
    description: 'Customer Effort Score - Esfuerzo del cliente',
    fields: [
      {
        name: 'title',
        label: 'Título de la pregunta',
        component: 'FormInput',
        placeholder: 'Introduzca el título de la pregunta',
        required: true
      },
      {
        name: 'description',
        label: 'Descripción (opcional)',
        component: 'FormTextarea',
        placeholder: 'Introduzca una descripción opcional para la pregunta'
      },
      {
        name: 'instructions',
        label: 'Instrucciones (opcional)',
        component: 'FormTextarea',
        placeholder: 'Añada instrucciones o información adicional para los participantes'
      }
    ],
    previewType: 'CES',
    info: 'Escala fija 1-5'
  },
  [QuestionType.SMARTVOC_CV]: {
    id: 'CV',
    name: 'CV',
    description: 'Customer Value - Valor del cliente',
    fields: [
      {
        name: 'title',
        label: 'Título de la pregunta',
        component: 'FormInput',
        placeholder: 'Introduzca el título de la pregunta',
        required: true
      },
      {
        name: 'description',
        label: 'Descripción (opcional)',
        component: 'FormTextarea',
        placeholder: 'Introduzca una descripción opcional para la pregunta'
      },
      {
        name: 'instructions',
        label: 'Instrucciones (opcional)',
        component: 'FormTextarea',
        placeholder: 'Añada instrucciones o información adicional para los participantes'
      }
    ],
    previewType: 'CV',
    info: '3 escalas principales de valoración en la región'
  },
  [QuestionType.SMARTVOC_NEV]: {
    id: 'NEV',
    name: 'NEV',
    description: 'Net Emotional Value - Valor emocional neto',
    fields: [
      {
        name: 'title',
        label: 'Título de la pregunta',
        component: 'FormInput',
        placeholder: 'Introduzca el título de la pregunta',
        required: true
      },
      {
        name: 'description',
        label: 'Descripción (opcional)',
        component: 'FormTextarea',
        placeholder: 'Introduzca una descripción opcional para la pregunta'
      },
      {
        name: 'instructions',
        label: 'Instrucciones (opcional)',
        component: 'FormTextarea',
        placeholder: 'Añada instrucciones o información adicional para los participantes'
      }
    ],
    previewType: 'NEV',
    info: 'Jerarquía de Valor Emocional'
  },
  [QuestionType.SMARTVOC_NPS]: {
    id: 'NPS',
    name: 'NPS',
    description: 'Net Promoter Score - Puntuación de promotor neto',
    fields: [
      {
        name: 'title',
        label: 'Título de la pregunta',
        component: 'FormInput',
        placeholder: 'Introduzca el título de la pregunta',
        required: true
      },
      {
        name: 'description',
        label: 'Descripción (opcional)',
        component: 'FormTextarea',
        placeholder: 'Introduzca una descripción opcional para la pregunta'
      },
      {
        name: 'instructions',
        label: 'Instrucciones (opcional)',
        component: 'FormTextarea',
        placeholder: 'Añada instrucciones o información adicional para los participantes'
      }
    ],
    previewType: 'NPS'
  },
  [QuestionType.SMARTVOC_VOC]: {
    id: 'VOC',
    name: 'VOC',
    description: 'Voice of Customer - Voz del cliente',
    fields: [
      {
        name: 'title',
        label: 'Título de la pregunta',
        component: 'FormInput',
        placeholder: 'Introduzca el título de la pregunta',
        required: true
      },
      {
        name: 'description',
        label: 'Descripción (opcional)',
        component: 'FormTextarea',
        placeholder: 'Introduzca una descripción opcional para la pregunta'
      },
      {
        name: 'instructions',
        label: 'Instrucciones (opcional)',
        component: 'FormTextarea',
        placeholder: 'Añada instrucciones o información adicional para los participantes'
      }
    ],
    previewType: 'VOC'
  }
};

export const getQuestionTypeConfig = (type: string): QuestionTypeConfig | null => {
  return QUESTION_TYPE_CONFIGS[type] || null;
};
