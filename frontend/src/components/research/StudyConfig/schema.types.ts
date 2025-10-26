export interface StudyConfigField {
  name: string;
  label: string;
  component: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  type?: string;
}

export interface StudyConfigSection {
  id: string;
  displayName: string;
  description: string;
  fields: StudyConfigField[];
  previewType: string;
  info?: string;
}

export const STUDY_CONFIG_SECTIONS: Record<string, StudyConfigSection> = {
  'eye-tracking': {
    id: 'eye-tracking',
    displayName: 'Eye Tracking',
    description: 'Configuración de seguimiento ocular',
    fields: [
      {
        name: 'enabled',
        label: 'Habilitar Eye Tracking',
        component: 'FormToggle',
        required: true
      },
      {
        name: 'parameters.saveResponseTimes',
        label: 'Guardar tiempos de respuesta',
        component: 'FormToggle'
      },
      {
        name: 'parameters.saveUserJourney',
        label: 'Guardar recorrido del usuario',
        component: 'FormToggle'
      },
      {
        name: 'parameters.showProgressBar',
        label: 'Mostrar barra de progreso',
        component: 'FormToggle'
      }
    ],
    previewType: 'eye-tracking'
  },
  'smart-voc': {
    id: 'smart-voc',
    displayName: 'Smart VOC',
    description: 'Configuración de Voice of Customer',
    fields: [
      {
        name: 'enabled',
        label: 'Habilitar Smart VOC',
        component: 'FormToggle',
        required: true
      },
      {
        name: 'questions',
        label: 'Preguntas',
        component: 'FormArray',
        type: 'question'
      }
    ],
    previewType: 'smart-voc'
  },
  'cognitive-tasks': {
    id: 'cognitive-tasks',
    displayName: 'Tareas Cognitivas',
    description: 'Configuración de tareas cognitivas',
    fields: [
      {
        name: 'enabled',
        label: 'Habilitar Tareas Cognitivas',
        component: 'FormToggle',
        required: true
      },
      {
        name: 'tasks',
        label: 'Tareas',
        component: 'FormArray',
        type: 'task'
      }
    ],
    previewType: 'cognitive-tasks'
  },
  'demographics': {
    id: 'demographics',
    displayName: 'Demografía',
    description: 'Configuración de datos demográficos',
    fields: [
      {
        name: 'enabled',
        label: 'Habilitar Demografía',
        component: 'FormToggle',
        required: true
      },
      {
        name: 'questions',
        label: 'Preguntas',
        component: 'FormArray',
        type: 'demographic'
      }
    ],
    previewType: 'demographics'
  }
} as const;

export type StudyConfigSectionType = keyof typeof STUDY_CONFIG_SECTIONS;
