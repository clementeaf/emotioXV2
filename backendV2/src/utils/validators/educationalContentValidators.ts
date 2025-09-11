import { CreateEducationalContentRequest, UpdateEducationalContentRequest } from '../../models/EducationalContentModel';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateCreateEducationalContent = (data: CreateEducationalContentRequest): ValidationResult => {
  const errors: string[] = [];

  // Validar contentType
  if (!data.contentType) {
    errors.push('contentType es requerido');
  } else if (!['smart_voc', 'cognitive_task'].includes(data.contentType)) {
    errors.push('contentType debe ser "smart_voc" o "cognitive_task"');
  }

  // Validar title
  if (!data.title) {
    errors.push('title es requerido');
  } else if (typeof data.title !== 'string') {
    errors.push('title debe ser una cadena de texto');
  } else if (data.title.trim().length < 3) {
    errors.push('title debe tener al menos 3 caracteres');
  } else if (data.title.length > 200) {
    errors.push('title no puede tener más de 200 caracteres');
  }

  // Validar generalDescription
  if (!data.generalDescription) {
    errors.push('generalDescription es requerido');
  } else if (typeof data.generalDescription !== 'string') {
    errors.push('generalDescription debe ser una cadena de texto');
  } else if (data.generalDescription.trim().length < 10) {
    errors.push('generalDescription debe tener al menos 10 caracteres');
  } else if (data.generalDescription.length > 1000) {
    errors.push('generalDescription no puede tener más de 1000 caracteres');
  }

  // Validar typeExplanation
  if (!data.typeExplanation) {
    errors.push('typeExplanation es requerido');
  } else if (typeof data.typeExplanation !== 'string') {
    errors.push('typeExplanation debe ser una cadena de texto');
  } else if (data.typeExplanation.trim().length < 10) {
    errors.push('typeExplanation debe tener al menos 10 caracteres');
  } else if (data.typeExplanation.length > 2000) {
    errors.push('typeExplanation no puede tener más de 2000 caracteres');
  }

  // Validar userId
  if (!data.userId) {
    errors.push('userId es requerido');
  } else if (typeof data.userId !== 'string') {
    errors.push('userId debe ser una cadena de texto');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateUpdateEducationalContent = (data: UpdateEducationalContentRequest): ValidationResult => {
  const errors: string[] = [];

  // Validar que al menos un campo esté presente
  if (!data.title && !data.generalDescription && !data.typeExplanation) {
    errors.push('Debe proporcionar al menos un campo para actualizar');
  }

  // Validar title si está presente
  if (data.title !== undefined) {
    if (typeof data.title !== 'string') {
      errors.push('title debe ser una cadena de texto');
    } else if (data.title.trim().length < 3) {
      errors.push('title debe tener al menos 3 caracteres');
    } else if (data.title.length > 200) {
      errors.push('title no puede tener más de 200 caracteres');
    }
  }

  // Validar generalDescription si está presente
  if (data.generalDescription !== undefined) {
    if (typeof data.generalDescription !== 'string') {
      errors.push('generalDescription debe ser una cadena de texto');
    } else if (data.generalDescription.trim().length < 10) {
      errors.push('generalDescription debe tener al menos 10 caracteres');
    } else if (data.generalDescription.length > 1000) {
      errors.push('generalDescription no puede tener más de 1000 caracteres');
    }
  }

  // Validar typeExplanation si está presente
  if (data.typeExplanation !== undefined) {
    if (typeof data.typeExplanation !== 'string') {
      errors.push('typeExplanation debe ser una cadena de texto');
    } else if (data.typeExplanation.trim().length < 10) {
      errors.push('typeExplanation debe tener al menos 10 caracteres');
    } else if (data.typeExplanation.length > 2000) {
      errors.push('typeExplanation no puede tener más de 2000 caracteres');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};