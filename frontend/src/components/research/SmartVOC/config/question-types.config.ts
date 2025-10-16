import { QuestionType } from 'shared/interfaces/question-types.enum';

export interface FieldConfig {
  name: string;
  label: string;
  component: 'FormInput' | 'FormTextarea' | 'FormSelect' | 'LabeledInput' | 'ScaleSelector';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  required?: boolean;
  conditional?: {
    field: string;
    value: any;
  };
}

export interface QuestionTypeConfig {
  id: string;
  name: string;
  description: string;
  fields: FieldConfig[];
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
        placeholder: 'Introduzca una descripción opcional para la pregunta',
        rows: 3
      },
      {
        name: 'instructions',
        label: 'Instrucciones (opcional)',
        component: 'FormTextarea',
        placeholder: 'Añada instrucciones o información adicional para los participantes',
        rows: 3
      },
      {
        name: 'config.type',
        label: 'Tipo de visualización',
        component: 'FormSelect',
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
        placeholder: 'Introduzca una descripción opcional para la pregunta',
        rows: 3
      },
      {
        name: 'instructions',
        label: 'Instrucciones (opcional)',
        component: 'FormTextarea',
        placeholder: 'Añada instrucciones o información adicional para los participantes',
        rows: 3
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
        placeholder: 'Introduzca una descripción opcional para la pregunta',
        rows: 3
      },
      {
        name: 'instructions',
        label: 'Instrucciones (opcional)',
        component: 'FormTextarea',
        placeholder: 'Añada instrucciones o información adicional para los participantes',
        rows: 3
      },
      {
        name: 'config.scaleRange',
        label: 'Escala',
        component: 'ScaleSelector',
        options: [
          { value: '1-5', label: 'Escala 1-5' },
          { value: '1-7', label: 'Escala 1-7' },
          { value: '1-10', label: 'Escala 1-10' }
        ]
      },
      {
        name: 'config.startLabel',
        label: 'Etiqueta inicio',
        component: 'LabeledInput',
        placeholder: 'Texto de inicio'
      },
      {
        name: 'config.endLabel',
        label: 'Etiqueta fin',
        component: 'LabeledInput',
        placeholder: 'Texto de fin'
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
        placeholder: 'Introduzca una descripción opcional para la pregunta',
        rows: 3
      },
      {
        name: 'instructions',
        label: 'Instrucciones (opcional)',
        component: 'FormTextarea',
        placeholder: 'Añada instrucciones o información adicional para los participantes',
        rows: 3
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
        placeholder: 'Introduzca una descripción opcional para la pregunta',
        rows: 3
      },
      {
        name: 'instructions',
        label: 'Instrucciones (opcional)',
        component: 'FormTextarea',
        placeholder: 'Añada instrucciones o información adicional para los participantes',
        rows: 3
      },
      {
        name: 'config.scaleRange',
        label: 'Escala',
        component: 'ScaleSelector',
        options: [
          { value: '0-10', label: 'Escala 0-10' },
          { value: '0-6', label: 'Escala 0-6' }
        ]
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
        placeholder: 'Introduzca una descripción opcional para la pregunta',
        rows: 3
      },
      {
        name: 'instructions',
        label: 'Instrucciones (opcional)',
        component: 'FormTextarea',
        placeholder: 'Añada instrucciones o información adicional para los participantes',
        rows: 3
      }
    ],
    previewType: 'VOC'
  }
};

export const getQuestionTypeConfig = (type: string): QuestionTypeConfig | null => {
  return QUESTION_TYPE_CONFIGS[type] || null;
};

export const getAvailableQuestionTypes = (): QuestionTypeConfig[] => {
  return Object.values(QUESTION_TYPE_CONFIGS);
};
