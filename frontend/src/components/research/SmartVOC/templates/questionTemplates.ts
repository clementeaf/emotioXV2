import { QuestionType, SmartVOCQuestion } from '../types';

/**
 * Plantillas disponibles para crear nuevas preguntas
 * Estas NO son preguntas por defecto, sino plantillas que el usuario puede usar para crear preguntas
 */
export const QUESTION_TEMPLATES: Partial<Record<QuestionType, Omit<SmartVOCQuestion, 'id'>>> = {
  [QuestionType.SMARTVOC_CSAT]: {
    type: QuestionType.SMARTVOC_CSAT,
    title: 'CSAT',
    description: 'Mide satisfacción general',
    instructions: '',
    showConditionally: false,
    required: true,
    config: {
      type: 'stars'
    }
  },
  [QuestionType.SMARTVOC_CES]: {
    type: QuestionType.SMARTVOC_CES,
    title: 'CES',
    description: 'Mide facilidad de uso',
    instructions: '',
    showConditionally: false,
    config: {
      type: 'scale',
      scaleRange: { start: 1, end: 5 }
    }
  },
  [QuestionType.SMARTVOC_CV]: {
    type: QuestionType.SMARTVOC_CV,
    title: 'CV',
    description: 'Captura valor percibido',
    instructions: '',
    showConditionally: false,
    config: {
      type: 'scale',
      scaleRange: { start: 1, end: 7 },
      startLabel: '',
      endLabel: ''
    }
  },
  [QuestionType.SMARTVOC_NPS]: {
    type: QuestionType.SMARTVOC_NPS,
    title: 'NPS',
    description: 'Evalúa lealtad y recomendación',
    instructions: '',
    showConditionally: false,
    config: {
      type: 'scale',
      scaleRange: { start: 0, end: 10 },
      startLabel: '',
      endLabel: ''
    }
  },
  [QuestionType.SMARTVOC_NEV]: {
    type: QuestionType.SMARTVOC_NEV,
    title: 'NEV',
    description: 'Analiza valor emocional',
    instructions: '',
    showConditionally: false,
    required: true,
    config: {
      type: 'emojis'
    }
  },
  [QuestionType.SMARTVOC_VOC]: {
    type: QuestionType.SMARTVOC_VOC,
    title: 'VOC',
    description: 'Recolecta comentarios abiertos',
    instructions: '',
    showConditionally: false,
    config: {
      type: 'text',
      maxLength: 500
    }
  },
};

/**
 * Obtiene los tipos de preguntas disponibles que no han sido creados aún
 */
export const getAvailableQuestionTypes = (existingTypes: QuestionType[]): QuestionType[] => {
  return Object.keys(QUESTION_TEMPLATES).filter(
    type => !existingTypes.includes(type as QuestionType)
  ) as QuestionType[];
};

/**
 * Crea una nueva pregunta basada en una plantilla
 */
export const createQuestionFromTemplate = (
  type: QuestionType,
  customInstructions?: string
): SmartVOCQuestion => {
  const template = QUESTION_TEMPLATES[type];
  if (!template) {
    throw new Error(`No existe plantilla para el tipo: ${type}`);
  }
  const uniqueId = `${type.toLowerCase()}_${Date.now()}`;
  return {
    ...template,
    id: uniqueId,
    instructions: customInstructions || template.instructions
  };
};
