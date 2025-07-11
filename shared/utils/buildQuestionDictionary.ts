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
  if (q.type) {
    // NUEVO: Evitar doble prefijo 'cognitive_'
    if (typeof q.type === 'string' && q.type.startsWith('cognitive_')) {
      return q.type;
    }
    // Si es pregunta cognitiva y no tiene el prefijo, agregarlo
    if (q.module === 'cognitive_task' && typeof q.type === 'string' && !q.type.startsWith('cognitive_')) {
      return `cognitive_${q.type}`;
    }
    return q.type;
  }
  if (q.config && q.config.type) return q.config.type;
  return 'unknown';
}

/**
 * NUEVO: Función para limpiar doble prefijo cognitive_ como medida de seguridad
 */
function cleanDoubleCognitivePrefix(type: string): string {
  if (typeof type === 'string' && type.includes('cognitive_cognitive_')) {
    console.warn(`[buildQuestionDictionary] ⚠️ Detectado doble prefijo cognitive_: ${type}`);
    return type.replace('cognitive_cognitive_', 'cognitive_');
  }
  return type;
}

/**
 * Genera un questionKey único y estable para cada pregunta
 */
function buildQuestionKey(module: string, type: string, id: string): string {
  return `${module}:${type}:${id}`;
}

/**
 * Construye el diccionario global de preguntas a partir de una lista de pasos
 * @param allSteps Lista de pasos de todos los módulos
 */
export function buildQuestionDictionary(allSteps: any[]): QuestionDictionary {
  const dict: QuestionDictionary = {};

  allSteps.forEach((step, stepIdx) => {
    // NUEVO: Procesar cada pregunta individual dentro del paso
    if (step.config && step.config.questions && Array.isArray(step.config.questions)) {
      step.config.questions.forEach((question: any, questionIndex: number) => {
        const module = inferModule(question);
        const type = inferType(question);
        const id = question.id || `q_${stepIdx}_${questionIndex}`;
        const questionKey = question.questionKey || buildQuestionKey(module, type, id);

        const entry = {
          questionKey,
          id,
          module,
          type: cleanDoubleCognitivePrefix(type), // NUEVO: Aplicar limpieza
          title: question.title || '',
          description: question.description,
          placeholder: question.placeholder,
          labels: question.labels,
          images: question.images,
          hitzones: question.hitzones,
          config: question.config,
          renderComponent: question.renderComponent || inferRenderComponent(type, module),
          ...question // Otros props custom
        };

        // Indexar por questionKey
        dict[questionKey] = entry;
        // Indexar también por id (solo si no colisiona)
        if (id && !dict[id]) {
          dict[id] = entry;
        }
      });
    } else {
      // FALLBACK: Si no hay questions array, tratar el paso como una pregunta
      const module = inferModule(step);
      const type = inferType(step);
      const id = step.id || `step_${stepIdx}`;
      const questionKey = step.questionKey || buildQuestionKey(module, type, id);

      const entry = {
        questionKey,
        id,
        module,
        type: cleanDoubleCognitivePrefix(type), // NUEVO: Aplicar limpieza
        title: step.title || step.name || '',
        description: step.description,
        placeholder: step.placeholder,
        labels: step.labels,
        images: step.images,
        hitzones: step.hitzones,
        config: step.config,
        renderComponent: step.renderComponent || inferRenderComponent(type, module),
        ...step // Otros props custom
      };

      dict[questionKey] = entry;
      if (id && !dict[id]) {
        dict[id] = entry;
      }
    }
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
