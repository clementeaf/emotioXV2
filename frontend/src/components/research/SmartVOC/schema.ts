import { FormInput } from '@/components/common/FormInput';
import { FormTextarea } from '@/components/common/FormTextarea';
import { FormSelect } from '@/components/common/FormSelect';
import { CustomSelect } from '@/components/ui/CustomSelect';

export interface SmartVOCFieldConfig {
  component: 'FormInput' | 'FormTextarea' | 'FormSelect' | 'CustomSelect';
  props: Record<string, any>;
  conditional?: {
    field: string;
    value: any;
  };
}

export interface SmartVOCQuestionSchema {
  id: string;
  name: string;
  displayName: string; // Nombre legible para navegación
  description: string;
  fields: SmartVOCFieldConfig[];
}

export const SMARTVOC_QUESTION_SCHEMAS: Record<string, SmartVOCQuestionSchema> = {
  smartvoc_csat: {
    id: 'smartvoc_csat',
    name: 'CSAT',
    displayName: 'CSAT',
    description: 'Customer Satisfaction - Satisfacción del cliente',
    fields: [
      {
        component: 'FormInput',
        props: {
          label: 'Título de la pregunta',
          placeholder: 'Introduzca el título de la pregunta'
        }
      },
      {
        component: 'FormTextarea',
        props: {
          label: 'Descripción (opcional)',
          placeholder: 'Introduzca una descripción opcional para la pregunta',
          rows: 3
        }
      },
      {
        component: 'FormTextarea',
        props: {
          label: 'Instrucciones (opcional)',
          placeholder: 'Añada instrucciones o información adicional para los participantes',
          rows: 3
        }
      },
      {
        component: 'FormSelect',
        props: {
          label: 'Tipo de visualización',
          options: [
            { value: 'stars', label: 'Estrellas' },
            { value: 'numbers', label: 'Números' }
          ]
        }
      }
    ]
  },
  smartvoc_ces: {
    id: 'smartvoc_ces',
    name: 'CES',
    displayName: 'CES',
    description: 'Customer Effort Score - Esfuerzo del cliente',
    fields: [
      {
        component: 'FormInput',
        props: {
          label: 'Título de la pregunta',
          placeholder: 'Introduzca el título de la pregunta'
        }
      },
      {
        component: 'FormTextarea',
        props: {
          label: 'Descripción (opcional)',
          placeholder: 'Introduzca una descripción opcional para la pregunta',
          rows: 3
        }
      },
      {
        component: 'FormTextarea',
        props: {
          label: 'Instrucciones (opcional)',
          placeholder: 'Añada instrucciones o información adicional para los participantes',
          rows: 3
        }
      },
      {
        component: 'CustomSelect',
        props: {
          label: 'Tipo de escala',
          options: [
            { value: '1-5', label: 'Escala 1-5 (CES)' },
            { value: '1-7', label: 'Escala 1-7 (CV)' },
            { value: '0-10', label: 'Escala 0-10 (NPS)' },
            { value: 'custom', label: 'Personalizada' }
          ],
          placeholder: 'Seleccionar tipo de escala'
        }
      }
    ]
  },
  smartvoc_cv: {
    id: 'smartvoc_cv',
    name: 'CV',
    displayName: 'CV',
    description: 'Customer Value - Valor del cliente',
    fields: [
      {
        component: 'FormInput',
        props: {
          label: 'Título de la pregunta',
          placeholder: 'Introduzca el título de la pregunta'
        }
      },
      {
        component: 'FormTextarea',
        props: {
          label: 'Descripción (opcional)',
          placeholder: 'Introduzca una descripción opcional para la pregunta',
          rows: 3
        }
      },
      {
        component: 'FormTextarea',
        props: {
          label: 'Instrucciones (opcional)',
          placeholder: 'Añada instrucciones o información adicional para los participantes',
          rows: 3
        }
      },
      {
        component: 'CustomSelect',
        props: {
          label: 'Tipo de escala',
          options: [
            { value: '1-5', label: 'Escala 1-5 (CES)' },
            { value: '1-7', label: 'Escala 1-7 (CV)' },
            { value: '0-10', label: 'Escala 0-10 (NPS)' },
            { value: 'custom', label: 'Personalizada' }
          ],
          placeholder: 'Seleccionar tipo de escala'
        }
      }
    ]
  },
  smartvoc_nev: {
    id: 'smartvoc_nev',
    name: 'NEV',
    displayName: 'NEV',
    description: 'Net Emotional Value - Valor emocional neto',
    fields: [
      {
        component: 'FormInput',
        props: {
          label: 'Título de la pregunta',
          placeholder: 'Introduzca el título de la pregunta'
        }
      },
      {
        component: 'FormTextarea',
        props: {
          label: 'Descripción (opcional)',
          placeholder: 'Introduzca una descripción opcional para la pregunta',
          rows: 3
        }
      },
      {
        component: 'FormTextarea',
        props: {
          label: 'Instrucciones (opcional)',
          placeholder: 'Añada instrucciones o información adicional para los participantes',
          rows: 3
        }
      },
      {
        component: 'FormSelect',
        props: {
          label: 'Tipo de visualización',
          options: [
            { value: 'emojis', label: 'Emojis' }
          ]
        }
      }
    ]
  },
  smartvoc_nps: {
    id: 'smartvoc_nps',
    name: 'NPS',
    displayName: 'NPS',
    description: 'Net Promoter Score - Puntuación de promotor neto',
    fields: [
      {
        component: 'FormInput',
        props: {
          label: 'Título de la pregunta',
          placeholder: 'Introduzca el título de la pregunta'
        }
      },
      {
        component: 'FormTextarea',
        props: {
          label: 'Descripción (opcional)',
          placeholder: 'Introduzca una descripción opcional para la pregunta',
          rows: 3
        }
      },
      {
        component: 'FormTextarea',
        props: {
          label: 'Instrucciones (opcional)',
          placeholder: 'Añada instrucciones o información adicional para los participantes',
          rows: 3
        }
      },
      {
        component: 'CustomSelect',
        props: {
          label: 'Tipo de escala',
          options: [
            { value: '1-5', label: 'Escala 1-5 (CES)' },
            { value: '1-7', label: 'Escala 1-7 (CV)' },
            { value: '0-10', label: 'Escala 0-10 (NPS)' },
            { value: 'custom', label: 'Personalizada' }
          ],
          placeholder: 'Seleccionar tipo de escala'
        }
      }
    ]
  },
  smartvoc_voc: {
    id: 'smartvoc_voc',
    name: 'VOC',
    displayName: 'VOC',
    description: 'Voice of Customer - Voz del cliente',
    fields: [
      {
        component: 'FormInput',
        props: {
          label: 'Título de la pregunta',
          placeholder: 'Introduzca el título de la pregunta'
        }
      },
      {
        component: 'FormTextarea',
        props: {
          label: 'Descripción (opcional)',
          placeholder: 'Introduzca una descripción opcional para la pregunta',
          rows: 3
        }
      },
      {
        component: 'FormTextarea',
        props: {
          label: 'Instrucciones (opcional)',
          placeholder: 'Añada instrucciones o información adicional para los participantes',
          rows: 3
        }
      },
      {
        component: 'FormSelect',
        props: {
          label: 'Tipo de visualización',
          options: [
            { value: 'text', label: 'Texto libre' }
          ]
        }
      }
    ]
  }
};

export const getSmartVOCSchema = (questionId: string): SmartVOCQuestionSchema | null => {
  return SMARTVOC_QUESTION_SCHEMAS[questionId] || null;
};
