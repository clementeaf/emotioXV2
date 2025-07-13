import { TaskDefinition } from '../../types';
import NavigationFlowTask from './NavigationFlowTask';
import PrioritizationTask from './PrioritizationTask';
import { LinearScaleView } from './questions/LinearScaleView';
import { LongTextView } from './questions/LongTextView';
import { MultiChoiceView } from './questions/MultiChoiceView';
import { ShortTextView } from './questions/ShortTextView';
import { SingleChoiceView } from './questions/SingleChoiceView';
import TransactionAuthTask from './TransactionAuthTask';

// Mapeo dinámico de tipos de pregunta a componentes
export const QUESTION_TYPE_COMPONENTS: Record<string, React.ComponentType<unknown>> = {
  'cognitive_short_text': ShortTextView as React.ComponentType<unknown>,
  'cognitive_long_text': LongTextView as React.ComponentType<unknown>,
  'single_choice': SingleChoiceView as React.ComponentType<unknown>,
  'multiple_choice': MultiChoiceView as React.ComponentType<unknown>,
  'linear_scale': LinearScaleView as React.ComponentType<unknown>,
  'ranking': PrioritizationTask as React.ComponentType<unknown>,
  'navigation_flow': NavigationFlowTask as React.ComponentType<unknown>,
  'preference_test': TransactionAuthTask as React.ComponentType<unknown>,
};

// Props por defecto para cada tipo (opcional)
export const DEFAULT_QUESTION_PROPS: Record<string, Record<string, unknown>> = {
  'cognitive_short_text': {
    placeholder: 'Escribe tu respuesta...',
    maxLength: 500
  },
  'cognitive_long_text': {
    placeholder: 'Escribe tu respuesta detallada aquí...',
    minLength: 50,
    maxLength: 2000
  },
  'single_choice': {
    allowOther: false
  },
  'multiple_choice': {
    minSelections: 1,
    maxSelections: null,
    allowOther: false
  },
  'linear_scale': {
    showNumbers: true,
    showLabels: true
  },
  'ranking': {
    enableDragAndDrop: true,
    showNumbers: true
  },
  'navigation_flow': {
    instructions: 'Haz clic en una opción para ver en detalle',
    footerText: 'Revisa todas las pantallas antes de elegir una únicamente',
    deviceFrame: true
  },
  'preference_test': {
    viewFormat: 'desktop-image',
    deviceFrame: true,
    allowComments: true
  }
};

// Función para crear TaskDefinition dinámicamente
export const createTaskDefinition = (question: any): TaskDefinition | null => {
  const questionType = question.type;
  const component = QUESTION_TYPE_COMPONENTS[questionType];

  if (!component) {
    console.warn(`[tasks.ts] Tipo de pregunta no soportado: ${questionType}`);
    return null;
  }

  return {
    id: question.id,
    component,
    title: question.title || `Pregunta ${questionType}`,
    description: question.description,
    questionType,
    props: {
      ...DEFAULT_QUESTION_PROPS[questionType],
      ...question.props
    }
  };
};

// Mantener TASKS para compatibilidad, pero generado dinámicamente
export const TASKS: TaskDefinition[] = [];

// Función para construir TASKS dinámicamente desde configuración
export const buildTasksFromConfig = (questions: any[]): TaskDefinition[] => {
  const tasks: TaskDefinition[] = [];

  for (const question of questions) {
    const taskDef = createTaskDefinition(question);
    if (taskDef) {
      tasks.push(taskDef);
    }
  }

  return tasks;
};

export const getTaskProgress = (currentTaskIndex: number, totalTasks: number): number => {
  if (currentTaskIndex < 0 || !totalTasks) return 0;

  if (currentTaskIndex === 0) return 0;

  return Math.round(((currentTaskIndex) / (totalTasks - 1)) * 100);
};
