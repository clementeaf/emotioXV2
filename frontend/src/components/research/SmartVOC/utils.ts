/**
 * Utilidades para SmartVOC
 */

/**
 * Obtiene un valor anidado de un objeto usando notación de punto
 */
export const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Crea un manejador de cambios para campos anidados
 */
export const createFieldChangeHandler = (
  questionId: string,
  fieldPath: string,
  onUpdateQuestion: (id: string, updates: any) => void
) => {
  return (value: any) => {
    const updates = { [fieldPath]: value };
    onUpdateQuestion(questionId, updates);
  };
};

/**
 * Valida que un campo requerido no esté vacío
 */
export const validateRequiredField = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (typeof value === 'number') {
    return !isNaN(value);
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value != null && value !== undefined;
};
