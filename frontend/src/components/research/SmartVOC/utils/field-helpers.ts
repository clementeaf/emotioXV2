/**
 * Obtiene un valor anidado de un objeto usando notación de punto
 * Ejemplo: getNestedValue(obj, 'config.scaleRange.start') -> obj.config.scaleRange.start
 */
export const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Establece un valor anidado en un objeto usando notación de punto
 * Ejemplo: setNestedValue(obj, 'config.scaleRange.start', 1)
 */
export const setNestedValue = (obj: any, path: string, value: any): any => {
  const keys = path.split('.');
  const result = { ...obj };
  let current = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return result;
};

/**
 * Crea un handler de cambio para campos anidados
 */
export const createFieldChangeHandler = (
  questionId: string,
  fieldName: string,
  onUpdateQuestion: (id: string, updates: any) => void
) => {
  return (value: any) => {
    const updates = setNestedValue({}, fieldName, value);
    onUpdateQuestion(questionId, updates);
  };
};
