import { QuestionDictionary, QuestionModule } from '../../../shared/interfaces/question-dictionary.interface';

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
 * Construye el diccionario global de preguntas a partir de una lista de formularios
 * @param forms Lista de formularios de todos los módulos
 */
export function buildQuestionDictionary(forms: any[]): QuestionDictionary {
  const dict: QuestionDictionary = {};

  forms.forEach((form, formIdx) => {
    // NUEVO: Procesar cada pregunta individual dentro del formulario
    if (form.questions && Array.isArray(form.questions)) {
      form.questions.forEach((question: any, questionIndex: number) => {
        const module = inferModule(question);
        const type = inferType(question);
        const id = question.id || `q_${formIdx}_${questionIndex}`;
        const questionKey = buildQuestionKey(module, type, id);

        dict[questionKey] = {
          questionKey,
          id,
          module,
          type,
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
      });
    } else {
      // FALLBACK: Si no hay questions array, tratar el formulario como una pregunta
      const module = inferModule(form);
      const type = inferType(form);
      const id = form.id || form.questionId || `form_${formIdx}`;
      const questionKey = buildQuestionKey(module, type, id);

      dict[questionKey] = {
        questionKey,
        id,
        module,
        type,
        title: form.title || form.name || '',
        description: form.description,
        placeholder: form.placeholder,
        labels: form.labels,
        images: form.images,
        hitzones: form.hitzones,
        config: form.config,
        renderComponent: form.renderComponent || inferRenderComponent(type, module),
        ...form // Otros props custom
      };
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
