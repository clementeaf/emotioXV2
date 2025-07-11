import { QuestionType, SmartVOCQuestion } from '../types';

/**
 * Plantillas disponibles para crear nuevas preguntas
 * Estas NO son preguntas por defecto, sino plantillas que el usuario puede usar para crear preguntas
 */
export const QUESTION_TEMPLATES: Partial<Record<QuestionType, Omit<SmartVOCQuestion, 'id'>>> = {
  [QuestionType.SMARTVOC_CSAT]: {
    type: QuestionType.SMARTVOC_CSAT,
    title: 'Customer Satisfaction Score (CSAT)',
    description: '¿Cómo calificaría su nivel general de satisfacción con [empresa]?',
    instructions: '',
    showConditionally: false,
    config: {
      type: 'stars',
      companyName: ''
    }
  },
  [QuestionType.SMARTVOC_ESAT]: {
    type: QuestionType.SMARTVOC_ESAT,
    title: 'Customer Effort Score (CES)',
    description: 'Fue fácil para mí resolver mi problema hoy.',
    instructions: '',
    showConditionally: false,
    config: {
      type: 'scale',
      scaleRange: { start: 1, end: 7 }
    }
  },
  [QuestionType.SMARTVOC_CV]: {
    type: QuestionType.SMARTVOC_CV,
    title: 'Cognitive Value (CV)',
    description: 'Esta experiencia superó mis expectativas.',
    instructions: '',
    showConditionally: false,
    config: {
      type: 'scale',
      scaleRange: { start: 1, end: 7 },
      startLabel: 'Muy en desacuerdo',
      endLabel: 'Muy de acuerdo'
    }
  },
  [QuestionType.SMARTVOC_OSAT]: {
    type: QuestionType.SMARTVOC_OSAT,
    title: 'Net Emotional Value (NEV)',
    description: '¿Cómo se siente acerca de la experiencia ofrecida por [empresa]?',
    instructions: '',
    showConditionally: false,
    config: {
      type: 'emojis',
      companyName: ''
    }
  },
  [QuestionType.SMARTVOC_NPS]: {
    type: QuestionType.SMARTVOC_NPS,
    title: 'Net Promoter Score (NPS)',
    description: 'En una escala de 0-10, ¿qué tan probable es que recomiende [empresa] a un amigo o colega?',
    instructions: '',
    showConditionally: false,
    config: {
      type: 'scale',
      scaleRange: { start: 0, end: 10 },
      companyName: ''
    }
  },
  [QuestionType.SMARTVOC_VOC]: {
    type: QuestionType.SMARTVOC_VOC,
    title: 'Voice of Customer (VOC)',
    description: '¿Cómo podemos mejorar nuestro servicio?',
    instructions: '',
    showConditionally: false,
    config: {
      type: 'text'
    }
  }
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
