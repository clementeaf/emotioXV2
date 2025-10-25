/**
 * Configuración de validación para formularios
 * Define las reglas de validación para cada tipo de formulario
 * Alineado con el JSON Dynamic Schema
 */

export interface ValidationConfig {
  title?: string;
  message: string;
  validator: (formData: Record<string, unknown>) => boolean;
}

export type ValidationConfigMap = Record<string, ValidationConfig>;

/**
 * Validadores genéricos reutilizables
 */
const validators = {
  // Validar título requerido
  titleRequired: (data: Record<string, unknown>) => !!(data.title as string)?.trim(),
  
  // Validar que hay preguntas con títulos
  questionsWithTitles: (data: Record<string, unknown>) => {
    const questions = data.questions as Array<{ title?: string }>;
    return questions?.length > 0 && questions.every(q => q.title?.trim());
  },
  
  // Validar que hay preguntas
  questionsRequired: (data: Record<string, unknown>) => (data.questions as Array<unknown>)?.length > 0,
  
  // Validar configuración de eye tracking
  eyeTrackingConfig: (data: Record<string, unknown>) => 
    !!(data.buildConfig as Record<string, unknown>) || !!(data.recruitConfig as Record<string, unknown>)
};

/**
 * Configuración de validación por tipo de formulario
 * Alineada con el JSON Dynamic Schema
 */
export const validationConfig: ValidationConfigMap = {
  // Pantallas simples - Validación básica de título
  'welcome_screen': {
    title: 'Validación',
    message: 'El título es requerido',
    validator: validators.titleRequired
  },
  'thank_you_screen': {
    title: 'Validación',
    message: 'El título es requerido',
    validator: validators.titleRequired
  },
  
  // SmartVOC - Todos usan la misma validación (preguntas con títulos)
  // Esto está alineado con el schema que todos tienen campos similares
  'smartvoc_csat': {
    title: 'Validación',
    message: 'Debe tener al menos una pregunta con título',
    validator: validators.questionsWithTitles
  },
  'smartvoc_ces': {
    title: 'Validación',
    message: 'Debe tener al menos una pregunta con título',
    validator: validators.questionsWithTitles
  },
  'smartvoc_cv': {
    title: 'Validación',
    message: 'Debe tener al menos una pregunta con título',
    validator: validators.questionsWithTitles
  },
  'smartvoc_nev': {
    title: 'Validación',
    message: 'Debe tener al menos una pregunta con título',
    validator: validators.questionsWithTitles
  },
  'smartvoc_nps': {
    title: 'Validación',
    message: 'Debe tener al menos una pregunta con título',
    validator: validators.questionsWithTitles
  },
  'smartvoc_voc': {
    title: 'Validación',
    message: 'Debe tener al menos una pregunta con título',
    validator: validators.questionsWithTitles
  },
  
  // Tareas cognitivas - 8 preguntas distintas
  'cognitive_short_text': {
    title: 'Validación',
    message: 'Debe tener al menos una pregunta de texto corto',
    validator: validators.questionsRequired
  },
  'cognitive_long_text': {
    title: 'Validación',
    message: 'Debe tener al menos una pregunta de texto largo',
    validator: validators.questionsRequired
  },
  'cognitive_single_choice': {
    title: 'Validación',
    message: 'Debe tener al menos una pregunta de opción única',
    validator: validators.questionsRequired
  },
  'cognitive_multiple_choice': {
    title: 'Validación',
    message: 'Debe tener al menos una pregunta de opción múltiple',
    validator: validators.questionsRequired
  },
  'cognitive_linear_scale': {
    title: 'Validación',
    message: 'Debe tener al menos una pregunta de escala lineal',
    validator: validators.questionsRequired
  },
  'cognitive_ranking': {
    title: 'Validación',
    message: 'Debe tener al menos una pregunta de ranking',
    validator: validators.questionsRequired
  },
  'cognitive_navigation_flow': {
    title: 'Validación',
    message: 'Debe tener al menos una pregunta de flujo de navegación',
    validator: validators.questionsRequired
  },
  'cognitive_preference_test': {
    title: 'Validación',
    message: 'Debe tener al menos una pregunta de prueba de preferencia',
    validator: validators.questionsRequired
  },
  
  // Eye tracking - Validación de configuración
  'eye_tracking': {
    title: 'Validación',
    message: 'Debe configurar al menos una opción de eye tracking',
    validator: validators.eyeTrackingConfig
  }
};

/**
 * Obtener configuración de validación por questionKey
 */
export const getValidationConfig = (questionKey: string): ValidationConfig | undefined => {
  return validationConfig[questionKey];
};

/**
 * Validar formulario usando configuración
 */
export const validateFormWithConfig = (
  questionKey: string, 
  formData: Record<string, unknown>
): { isValid: boolean; config?: ValidationConfig } => {
  const config = getValidationConfig(questionKey);
  
  if (!config) {
    return { isValid: true }; // Sin validación específica = válido
  }
  
  return {
    isValid: config.validator(formData),
    config
  };
};
