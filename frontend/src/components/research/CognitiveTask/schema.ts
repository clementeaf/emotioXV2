/**
 * Cognitive Task Dynamic Schema
 * Configuración declarativa para el formulario de tareas cognitivas
 */

import { CognitiveTaskFieldConfig, CognitiveTaskQuestionSchema } from './schema.types';

/**
 * Schema para las 8 preguntas de Cognitive Task
 */
export const COGNITIVE_TASK_QUESTIONS: Record<string, CognitiveTaskQuestionSchema> = {
  '3.1': {
    id: '3.1',
    displayName: 'Texto Corto',
    type: 'short_text',
    fields: [
      {
        key: 'title',
        component: 'FormInput',
        props: {
          label: 'Título de la pregunta',
          placeholder: 'Ingresa el título de la pregunta',
          required: true
        }
      },
      {
        key: 'description',
        component: 'FormTextarea',
        props: {
          label: 'Descripción',
          placeholder: 'Ingresa la descripción de la pregunta',
          rows: 3
        }
      },
      {
        key: 'required',
        component: 'FormCheckbox',
        props: {
          label: 'Pregunta obligatoria'
        }
      },
      {
        key: 'showConditionally',
        component: 'FormCheckbox',
        props: {
          label: 'Mostrar condicionalmente'
        }
      },
      {
        key: 'deviceFrame',
        component: 'FormCheckbox',
        props: {
          label: 'Mostrar marco de dispositivo'
        }
      },
      {
        key: 'answerPlaceholder',
        component: 'FormInput',
        props: {
          label: 'Placeholder de respuesta',
          placeholder: 'Ej: Escribe tu respuesta aquí...'
        }
      }
    ]
  },
  '3.2': {
    id: '3.2',
    displayName: 'Texto Largo',
    type: 'long_text',
    fields: [
      {
        key: 'title',
        component: 'FormInput',
        props: {
          label: 'Título de la pregunta',
          placeholder: 'Ingresa el título de la pregunta',
          required: true
        }
      },
      {
        key: 'description',
        component: 'FormTextarea',
        props: {
          label: 'Descripción',
          placeholder: 'Ingresa la descripción de la pregunta',
          rows: 3
        }
      },
      {
        key: 'required',
        component: 'FormCheckbox',
        props: {
          label: 'Pregunta obligatoria'
        }
      },
      {
        key: 'showConditionally',
        component: 'FormCheckbox',
        props: {
          label: 'Mostrar condicionalmente'
        }
      },
      {
        key: 'deviceFrame',
        component: 'FormCheckbox',
        props: {
          label: 'Mostrar marco de dispositivo'
        }
      },
      {
        key: 'answerPlaceholder',
        component: 'FormInput',
        props: {
          label: 'Placeholder de respuesta',
          placeholder: 'Ej: Escribe tu respuesta detallada aquí...'
        }
      }
    ]
  },
  '3.3': {
    id: '3.3',
    displayName: 'Opción Única',
    type: 'single_choice',
    fields: [
      {
        key: 'title',
        component: 'FormInput',
        props: {
          label: 'Título de la pregunta',
          placeholder: 'Ingresa el título de la pregunta',
          required: true
        }
      },
      {
        key: 'description',
        component: 'FormTextarea',
        props: {
          label: 'Descripción',
          placeholder: 'Ingresa la descripción de la pregunta',
          rows: 3
        }
      },
      {
        key: 'choices',
        component: 'ChoiceManager',
        props: {
          label: 'Opciones de respuesta',
          minChoices: 2,
          maxChoices: 10
        }
      },
      {
        key: 'required',
        component: 'FormCheckbox',
        props: {
          label: 'Pregunta obligatoria'
        }
      },
      {
        key: 'showConditionally',
        component: 'FormCheckbox',
        props: {
          label: 'Mostrar condicionalmente'
        }
      },
      {
        key: 'deviceFrame',
        component: 'FormCheckbox',
        props: {
          label: 'Mostrar marco de dispositivo'
        }
      }
    ]
  },
  '3.4': {
    id: '3.4',
    displayName: 'Opción Múltiple',
    type: 'multiple_choice',
    fields: [
      {
        key: 'title',
        component: 'FormInput',
        props: {
          label: 'Título de la pregunta',
          placeholder: 'Ingresa el título de la pregunta',
          required: true
        }
      },
      {
        key: 'description',
        component: 'FormTextarea',
        props: {
          label: 'Descripción',
          placeholder: 'Ingresa la descripción de la pregunta',
          rows: 3
        }
      },
      {
        key: 'choices',
        component: 'ChoiceManager',
        props: {
          label: 'Opciones de respuesta',
          minChoices: 2,
          maxChoices: 10
        }
      },
      {
        key: 'required',
        component: 'FormCheckbox',
        props: {
          label: 'Pregunta obligatoria'
        }
      },
      {
        key: 'showConditionally',
        component: 'FormCheckbox',
        props: {
          label: 'Mostrar condicionalmente'
        }
      },
      {
        key: 'deviceFrame',
        component: 'FormCheckbox',
        props: {
          label: 'Mostrar marco de dispositivo'
        }
      }
    ]
  },
  '3.5': {
    id: '3.5',
    displayName: 'Escala Lineal',
    type: 'linear_scale',
    fields: [
      {
        key: 'title',
        component: 'FormInput',
        props: {
          label: 'Título de la pregunta',
          placeholder: 'Ingresa el título de la pregunta',
          required: true
        }
      },
      {
        key: 'description',
        component: 'FormTextarea',
        props: {
          label: 'Descripción',
          placeholder: 'Ingresa la descripción de la pregunta',
          rows: 3
        }
      },
      {
        key: 'scaleConfig.startValue',
        component: 'FormInput',
        props: {
          label: 'Valor inicial',
          type: 'number',
          placeholder: '1'
        }
      },
      {
        key: 'scaleConfig.endValue',
        component: 'FormInput',
        props: {
          label: 'Valor final',
          type: 'number',
          placeholder: '5'
        }
      },
      {
        key: 'scaleConfig.startLabel',
        component: 'FormInput',
        props: {
          label: 'Etiqueta inicial',
          placeholder: 'Muy malo'
        }
      },
      {
        key: 'scaleConfig.endLabel',
        component: 'FormInput',
        props: {
          label: 'Etiqueta final',
          placeholder: 'Muy bueno'
        }
      },
      {
        key: 'required',
        component: 'FormCheckbox',
        props: {
          label: 'Pregunta obligatoria'
        }
      },
      {
        key: 'showConditionally',
        component: 'FormCheckbox',
        props: {
          label: 'Mostrar condicionalmente'
        }
      },
      {
        key: 'deviceFrame',
        component: 'FormCheckbox',
        props: {
          label: 'Mostrar marco de dispositivo'
        }
      }
    ]
  },
  '3.6': {
    id: '3.6',
    displayName: 'Ranking',
    type: 'ranking',
    fields: [
      {
        key: 'title',
        component: 'FormInput',
        props: {
          label: 'Título de la pregunta',
          placeholder: 'Ingresa el título de la pregunta',
          required: true
        }
      },
      {
        key: 'description',
        component: 'FormTextarea',
        props: {
          label: 'Descripción',
          placeholder: 'Ingresa la descripción de la pregunta',
          rows: 3
        }
      },
      {
        key: 'choices',
        component: 'ChoiceManager',
        props: {
          label: 'Opciones para ranking',
          minChoices: 2,
          maxChoices: 10
        }
      },
      {
        key: 'required',
        component: 'FormCheckbox',
        props: {
          label: 'Pregunta obligatoria'
        }
      }
    ]
  },
  '3.7': {
    id: '3.7',
    displayName: 'Carga de Archivos',
    type: 'file_upload',
    fields: [
      {
        key: 'title',
        component: 'FormInput',
        props: {
          label: 'Título de la pregunta',
          placeholder: 'Ingresa el título de la pregunta',
          required: true
        }
      },
      {
        key: 'description',
        component: 'FormTextarea',
        props: {
          label: 'Descripción',
          placeholder: 'Ingresa la descripción de la pregunta',
          rows: 3
        }
      },
      {
        key: 'files',
        component: 'FileUploadManager',
        props: {
          label: 'Archivos permitidos',
          maxFiles: 5,
          acceptedTypes: ['image/*', 'video/*', 'application/pdf']
        }
      },
      {
        key: 'required',
        component: 'FormCheckbox',
        props: {
          label: 'Pregunta obligatoria'
        }
      },
      {
        key: 'showConditionally',
        component: 'FormCheckbox',
        props: {
          label: 'Mostrar condicionalmente'
        }
      },
      {
        key: 'deviceFrame',
        component: 'FormCheckbox',
        props: {
          label: 'Mostrar marco de dispositivo'
        }
      }
    ]
  },
  '3.8': {
    id: '3.8',
    displayName: 'Prueba de Preferencia',
    type: 'preference_test',
    fields: [
      {
        key: 'title',
        component: 'FormInput',
        props: {
          label: 'Título de la pregunta',
          placeholder: 'Ingresa el título de la pregunta',
          required: true
        }
      },
      {
        key: 'description',
        component: 'FormTextarea',
        props: {
          label: 'Descripción',
          placeholder: 'Ingresa la descripción de la pregunta',
          rows: 3
        }
      },
      {
        key: 'files',
        component: 'FileUploadManager',
        props: {
          label: 'Imágenes para comparar',
          maxFiles: 10,
          acceptedTypes: ['image/*']
        }
      },
      {
        key: 'required',
        component: 'FormCheckbox',
        props: {
          label: 'Pregunta obligatoria'
        }
      },
      {
        key: 'showConditionally',
        component: 'FormCheckbox',
        props: {
          label: 'Mostrar condicionalmente'
        }
      },
      {
        key: 'deviceFrame',
        component: 'FormCheckbox',
        props: {
          label: 'Mostrar marco de dispositivo'
        }
      }
    ]
  }
};

/**
 * Obtener schema para una pregunta específica
 */
export const getCognitiveTaskSchema = (questionId: string): CognitiveTaskQuestionSchema | null => {
  return COGNITIVE_TASK_QUESTIONS[questionId] || null;
};

/**
 * Obtener todas las preguntas disponibles
 */
export const getAllCognitiveTaskQuestions = (): CognitiveTaskQuestionSchema[] => {
  return Object.values(COGNITIVE_TASK_QUESTIONS);
};
