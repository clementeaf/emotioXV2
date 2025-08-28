import { QuestionType } from 'shared/interfaces/question-types.enum';
import { SmartVOCFormData } from 'shared/interfaces/smart-voc.interface';

import { SmartVOCQuestion } from '../types';

/**
 * Valida si una pregunta individual tiene todos los campos requeridos
 */
export const isQuestionValid = (question: SmartVOCQuestion): { isValid: boolean; missingFields: string[] } => {
  const missingFields: string[] = [];

  // Validar campos básicos requeridos
  if (!question.id || question.id.trim() === '') {
    missingFields.push('id');
  }

  if (!question.type) {
    missingFields.push('type');
  }

  if (!question.title || question.title.trim() === '') {
    missingFields.push('title');
  }

  if (!question.description || question.description.trim() === '') {
    missingFields.push('description');
  }

  if (question.showConditionally === undefined || question.showConditionally === null) {
    missingFields.push('showConditionally');
  }

  if (!question.config) {
    missingFields.push('config');
  } else {
    // Validar campos específicos según el tipo de pregunta
    const configMissingFields = validateQuestionConfig(question.type, question.config);
    missingFields.push(...configMissingFields);
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Valida la configuración específica según el tipo de pregunta
 */
const validateQuestionConfig = (questionType: SmartVOCQuestion['type'], config: any): string[] => {
  const missingFields: string[] = [];

  if (!config.type) {
    missingFields.push('config.type');
  }

  switch (questionType) {
    case QuestionType.SMARTVOC_CSAT:
      if (!config.companyName || config.companyName.trim() === '') {
        missingFields.push('config.companyName');
      }
      if (!['stars', 'numbers', 'emojis'].includes(config.type)) {
        missingFields.push('config.type (debe ser stars, numbers o emojis)');
      }
      break;
    // case QuestionType.SMARTVOC_CES:
    //   // No existe en el ENUM global. Si lo necesitas, agrégalo a shared/interfaces/question-types.enum.ts
    //   break;
    case QuestionType.SMARTVOC_CV:
      if (config.type !== 'scale') {
        missingFields.push('config.type (debe ser scale)');
      }
      if (!config.scaleRange || typeof config.scaleRange.start !== 'number' || typeof config.scaleRange.end !== 'number') {
        missingFields.push('config.scaleRange');
      }
      break;
    // case QuestionType.SMARTVOC_NEV:
    //   // No existe en el ENUM global. Si lo necesitas, agrégalo a shared/interfaces/question-types.enum.ts
    //   break;
    case QuestionType.SMARTVOC_NPS:
      if (!config.companyName || config.companyName.trim() === '') {
        missingFields.push('config.companyName');
      }
      if (config.type !== 'scale') {
        missingFields.push('config.type (debe ser scale)');
      }
      if (!config.scaleRange || typeof config.scaleRange.start !== 'number' || typeof config.scaleRange.end !== 'number') {
        missingFields.push('config.scaleRange');
      }
      break;
    case QuestionType.SMARTVOC_VOC:
      if (config.type !== 'text') {
        missingFields.push('config.type (debe ser text)');
      }
      break;
  }

  return missingFields;
};

/**
 * Filtra las preguntas que tienen todos los campos requeridos (las que se enviarán al backend)
 */
export const filterValidQuestions = (formData: SmartVOCFormData): SmartVOCFormData => {
  const validQuestions = formData.questions.filter(question => {
    const validation = isQuestionValid(question);
    return validation.isValid;
  });

  return {
    ...formData,
    questions: validQuestions
  };
};

/**
 * Filtra las preguntas que tienen título (funcionalidad original - mantenida para compatibilidad)
 * @deprecated Use filterValidQuestions instead
 */
export const filterQuestionsWithTitle = (formData: SmartVOCFormData): SmartVOCFormData => {
  return filterValidQuestions(formData);
};

/**
 * Valida que el formulario tenga al menos una pregunta válida
 */
export const validateForm = (formData: SmartVOCFormData): {
  isValid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];

  const validQuestions = formData.questions.filter(question => {
    const validation = isQuestionValid(question);
    return validation.isValid;
  });

  if (validQuestions.length === 0) {
    issues.push('Debe haber al menos una pregunta válida con todos los campos requeridos');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
};

/**
 * Obtiene información detallada de validación para todas las preguntas
 */
export const getQuestionsValidationInfo = (formData: SmartVOCFormData): {
  total: number;
  valid: SmartVOCQuestion[];
  invalid: { question: SmartVOCQuestion; missingFields: string[] }[];
} => {
  const valid: SmartVOCQuestion[] = [];
  const invalid: { question: SmartVOCQuestion; missingFields: string[] }[] = [];

  formData.questions.forEach(question => {
    const validation = isQuestionValid(question);
    if (validation.isValid) {
      valid.push(question);
    } else {
      invalid.push({ question, missingFields: validation.missingFields });
    }
  });

  return {
    total: formData.questions.length,
    valid,
    invalid
  };
};

/**
 * Log de debug para verificar las preguntas que se enviarán
 */
export const debugQuestionsToSend = (formData: SmartVOCFormData): void => {
  if (process.env.NODE_ENV === 'development') {

    const validationInfo = getQuestionsValidationInfo(formData);


    validationInfo.valid.forEach((q, index) => {
    });

    if (validationInfo.invalid.length > 0) {
      validationInfo.invalid.forEach(({ question, missingFields }, index) => {
      });
    }

  }
};
