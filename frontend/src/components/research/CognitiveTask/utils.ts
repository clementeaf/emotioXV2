import { CognitiveTaskFormData } from 'shared/interfaces/cognitive-task.interface';
import { Question, UICognitiveTaskFormData } from './types';

/**
 * Valida si una pregunta individual tiene todos los campos requeridos
 */
export const isQuestionValid = (question: Question): { isValid: boolean; missingFields: string[] } => {
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

  if (question.required === undefined || question.required === null) {
    missingFields.push('required');
  }

  if (question.showConditionally === undefined || question.showConditionally === null) {
    missingFields.push('showConditionally');
  }

  if (question.deviceFrame === undefined || question.deviceFrame === null) {
    missingFields.push('deviceFrame');
  }

  // Validar campos específicos según el tipo de pregunta
  const typeSpecificFields = validateQuestionTypeSpecificFields(question);
  missingFields.push(...typeSpecificFields);

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Valida campos específicos según el tipo de pregunta
 */
const validateQuestionTypeSpecificFields = (question: Question): string[] => {
  const missingFields: string[] = [];

  switch (question.type) {
    case 'single_choice':
    case 'multiple_choice':
    case 'ranking':
      if (!question.choices || question.choices.length === 0) {
        missingFields.push('choices (debe tener al menos una opción)');
      } else {
        // Validar que al menos una opción tenga texto
        const validChoices = question.choices.filter(choice =>
          choice.text && choice.text.trim() !== ''
        );
        if (validChoices.length === 0) {
          missingFields.push('choices (al menos una opción debe tener texto)');
        }
      }
      break;

    case 'linear_scale':
      if (!question.scaleConfig) {
        missingFields.push('scaleConfig');
      } else {
        if (typeof question.scaleConfig.startValue !== 'number') {
          missingFields.push('scaleConfig.startValue');
        }
        if (typeof question.scaleConfig.endValue !== 'number') {
          missingFields.push('scaleConfig.endValue');
        }
        if (question.scaleConfig.startValue >= question.scaleConfig.endValue) {
          missingFields.push('scaleConfig (valor inicial debe ser menor que el final)');
        }
      }
      break;

    case 'navigation_flow':
      if (!question.files || question.files.length === 0) {
        missingFields.push('files (navigation_flow requiere al menos un archivo)');
      } else {
        // Validar que los archivos tengan los datos necesarios, incluyendo s3Key
        const validFiles = question.files.filter(file =>
          file.name && file.url && file.s3Key // Requerir s3Key explícitamente
        );
        if (validFiles.length === 0) {
          missingFields.push('files (archivos deben tener nombre, URL y s3Key válidos)');
        }
      }
      break;

    case 'preference_test':
      if (!question.files || question.files.length < 2) {
        missingFields.push('files (preference_test requiere al menos 2 archivos)');
      } else {
        // Validar que al menos 2 archivos sean válidos, incluyendo s3Key
        const validFiles = question.files.filter(file =>
          file.name && file.url && file.s3Key // Requerir s3Key explícitamente
        );
        if (validFiles.length < 2) {
          missingFields.push('files (al menos 2 archivos deben ser válidos con s3Key)');
        }
      }
      break;

    case 'short_text':
    case 'long_text':
      // Estos tipos no requieren campos adicionales específicos
      break;
  }

  return missingFields;
};

/**
 * Filtra las preguntas que tienen todos los campos requeridos (las que se enviarán al backend)
 */
export const filterValidQuestions = (formData: CognitiveTaskFormData): CognitiveTaskFormData => {
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
export const filterQuestionsWithTitle = (formData: CognitiveTaskFormData): CognitiveTaskFormData => {
  return filterValidQuestions(formData);
};

/**
 * Valida que el formulario tenga al menos una pregunta válida
 */
export const validateForm = (formData: CognitiveTaskFormData): {
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
export const getQuestionsValidationInfo = (formData: CognitiveTaskFormData): {
  total: number;
  valid: Question[];
  invalid: { question: Question; missingFields: string[] }[];
} => {
  const valid: Question[] = [];
  const invalid: { question: Question; missingFields: string[] }[] = [];

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
export const debugQuestionsToSend = (formData: CognitiveTaskFormData): void => {
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

/**
 * Filtra las preguntas que tienen todos los campos requeridos (versión local)
 */
export const filterValidQuestionsLocal = (formData: UICognitiveTaskFormData): UICognitiveTaskFormData => {
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
 * Log de debug para verificar las preguntas que se enviarán (versión local)
 */
export const debugQuestionsToSendLocal = (formData: UICognitiveTaskFormData): void => {
  if (process.env.NODE_ENV === 'development') {

    const validationInfo = getQuestionsValidationInfo(formData as any);

    validationInfo.valid.forEach((q, index) => {
    });

    if (validationInfo.invalid.length > 0) {
      validationInfo.invalid.forEach(({ question, missingFields }, index) => {
      });
    }

  }
};
