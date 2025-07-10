import { QuestionDictionary, QuestionModule } from '../interfaces/question-dictionary.interface';

/**
 * Infiero el módulo a partir de la estructura de la pregunta si no viene explícito
 */
function inferModule(q: any): QuestionModule {
  if (q.module) return q.module;
  if (q.type && typeof q.type === 'string') {
    const t = q.type.toLowerCase();
    if (t.includes('voc')) return 'smartvoc';
    if (t.includes('cognitive')) return 'cognitive_task';
    if (t.includes('demographic')) return 'demographic';
    if (t.includes('eye')) return 'eye_tracking';
  }
  return 'custom';
}

/**
 * Infiero el tipo de pregunta si no viene explícito
 */
function inferType(q: any): string {
  if (q.type) return q.type;
  if (q.config && q.config.type) return q.config.type;
  return 'unknown';
}

/**
 * Genera un questionKey único y estable para cada pregunta
 */
function buildQuestionKey(module: string, type: string, id: string): string {
  return `${module}:${type}:${id}`;
}

/**
 * Construye el diccionario global de preguntas a partir de una lista de preguntas
 * @param allQuestions Lista de preguntas de todos los módulos
 */
export function buildQuestionDictionary(allQuestions: any[]): QuestionDictionary {
  const dict: QuestionDictionary = {};

  allQuestions.forEach((q, idx) => {
    const module = inferModule(q);
    const type = inferType(q);
    const id = q.id || q.questionId || `q_${idx}`;
    const questionKey = buildQuestionKey(module, type, id);

    dict[questionKey] = {
      questionKey,
      id,
      module,
      type,
      title: q.title || '',
      description: q.description,
      placeholder: q.placeholder,
      labels: q.labels,
      images: q.images,
      hitzones: q.hitzones,
      config: q.config,
      renderComponent: q.renderComponent || inferRenderComponent(type, module),
      ...q // Otros props custom
    };
  });

  return dict;
}

/**
 * Mapea el tipo y módulo al nombre del componente React a renderizar
 * Puedes personalizar este mapeo según tu design system
 */
function inferRenderComponent(type: string, _module: string): string {
  // Ejemplo simple, puedes expandirlo según tus componentes
  const map: Record<string, string> = {
    'VOC': 'VOCTextQuestion',
    'CSAT': 'CSATView',
    'CES': 'DifficultyScaleView',
    'CV': 'AgreementScaleView',
    'NPS': 'NPSView',
    'NEV': 'EmotionSelectionView',
    'SHORT_TEXT': 'ShortTextQuestion',
    'LONG_TEXT': 'LongTextQuestion',
    'MULTIPLE_CHOICE': 'MultipleChoiceQuestion',
    'RANKING': 'RankingQuestion',
    'LINEAR_SCALE': 'LinearScaleQuestion',
    // ...otros mapeos
  };
  return map[type.toUpperCase()] || 'GenericQuestion';
}
