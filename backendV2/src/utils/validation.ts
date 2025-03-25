import { NewResearch, ResearchType } from '../models/newResearch.model';

/**
 * Clase para errores de validación
 */
export class ValidationError extends Error {
  public errors: Record<string, string>;

  constructor(message: string, errors: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Valida los datos de una nueva investigación
 * @param data Datos a validar
 * @throws ValidationError si los datos no son válidos
 */
export function validateNewResearch(data: Partial<NewResearch>): void {
  const errors: Record<string, string> = {};

  // Validar campos obligatorios
  if (data.name !== undefined) {
    if (!data.name.trim()) {
      errors.name = 'El nombre de la investigación es obligatorio';
    } else if (data.name.length < 3) {
      errors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (data.name.length > 100) {
      errors.name = 'El nombre no puede exceder los 100 caracteres';
    }
  }

  if (data.enterprise !== undefined) {
    if (!data.enterprise.trim()) {
      errors.enterprise = 'La empresa es obligatoria';
    } else if (data.enterprise.length > 100) {
      errors.enterprise = 'El nombre de la empresa no puede exceder los 100 caracteres';
    }
  }

  if (data.type !== undefined) {
    const validTypes = Object.values(ResearchType);
    
    // Mapa para convertir los tipos mostrados en el frontend a los tipos del backend
    const typeMap: Record<string, ResearchType> = {
      'Behavioural Research': ResearchType.BEHAVIOURAL,
      'Eye Tracking': ResearchType.EYE_TRACKING,
      'Attention Prediction': ResearchType.ATTENTION_PREDICTION,
      'Cognitive Analysis': ResearchType.COGNITIVE_ANALYSIS
    };
    
    // Si el tipo está en el mapa, convertirlo al valor correcto
    if (typeMap[data.type as string]) {
      // Convertir automáticamente el tipo
      (data.type as any) = typeMap[data.type as string];
    }
    
    // Ahora validar contra los tipos válidos
    if (!validTypes.includes(data.type)) {
      errors.type = `El tipo debe ser uno de los siguientes: ${validTypes.join(', ')}`;
    }
  }

  if (data.technique !== undefined) {
    if (!data.technique.trim()) {
      errors.technique = 'La técnica es obligatoria';
    } else if (data.technique.length > 100) {
      errors.technique = 'La técnica no puede exceder los 100 caracteres';
    }
  }

  // Validar campos opcionales
  if (data.description !== undefined && data.description.length > 1000) {
    errors.description = 'La descripción no puede exceder los 1000 caracteres';
  }

  if (data.targetParticipants !== undefined) {
    if (isNaN(data.targetParticipants) || data.targetParticipants <= 0) {
      errors.targetParticipants = 'El número de participantes objetivo debe ser un número positivo';
    } else if (data.targetParticipants > 10000) {
      errors.targetParticipants = 'El número de participantes no puede exceder 10000';
    }
  }

  if (data.objectives !== undefined) {
    if (!Array.isArray(data.objectives)) {
      errors.objectives = 'Los objetivos deben ser una lista';
    } else {
      if (data.objectives.length > 10) {
        errors.objectives = 'No se pueden tener más de 10 objetivos';
      }
      
      for (let i = 0; i < data.objectives.length; i++) {
        const objective = data.objectives[i];
        if (typeof objective !== 'string') {
          errors.objectives = 'Todos los objetivos deben ser texto';
          break;
        } else if (objective.length > 200) {
          errors.objectives = `El objetivo ${i + 1} es demasiado largo (máximo 200 caracteres)`;
          break;
        }
      }
    }
  }

  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.tags = 'Las etiquetas deben ser una lista';
    } else {
      if (data.tags.length > 20) {
        errors.tags = 'No se pueden tener más de 20 etiquetas';
      }
      
      for (let i = 0; i < data.tags.length; i++) {
        const tag = data.tags[i];
        if (typeof tag !== 'string') {
          errors.tags = 'Todas las etiquetas deben ser texto';
          break;
        } else if (tag.length > 50) {
          errors.tags = `La etiqueta ${i + 1} es demasiado larga (máximo 50 caracteres)`;
          break;
        }
      }
    }
  }

  if (data.status !== undefined) {
    const validStatus = ['draft', 'active', 'completed', 'canceled'];
    if (!validStatus.includes(data.status)) {
      errors.status = `El estado debe ser uno de los siguientes: ${validStatus.join(', ')}`;
    }
  }

  // Si hay errores, lanzar excepción
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Error de validación en los datos de investigación', errors);
  }
}

/**
 * Valida que todos los campos requeridos estén presentes para crear una nueva investigación
 * @param data Datos a validar
 * @throws ValidationError si faltan campos obligatorios
 */
export function validateRequiredFields(data: Partial<NewResearch>): void {
  const errors: Record<string, string> = {};
  
  // Lista de campos obligatorios
  const requiredFields = ['name', 'enterprise', 'type', 'technique'];
  
  // Verificar cada campo obligatorio
  for (const field of requiredFields) {
    if (!data[field as keyof NewResearch]) {
      errors[field] = `El campo ${field} es obligatorio`;
    }
  }
  
  // Si hay errores, lanzar excepción
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Faltan campos obligatorios', errors);
  }
} 