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

/**
 * Genera un questionKey único para una pregunta de SmartVOC
 * Formato: smartvoc:{type}:{id}
 * @param question - Pregunta a la que se le generará el questionKey
 * @returns questionKey generado
 */
export const generateSmartVOCQuestionKey = (question: { questionKey?: string; type?: string; id?: string }): string => {
  if (question.questionKey) {
    return question.questionKey;
  }
  
  const type = question.type || 'unknown';
  const id = question.id || `q_${Date.now()}`;
  
  return `smartvoc:${type}:${id}`;
};

/**
 * Asegura que todas las preguntas de SmartVOC tengan questionKey
 * @param questions - Array de preguntas (puede ser undefined o null)
 * @returns Array de preguntas con questionKey generado si no existe, o array vacío si questions es undefined/null
 */
export const ensureSmartVOCQuestionKeys = <T extends { questionKey?: string; type?: string; id?: string }>(
  questions: T[] | undefined | null
): T[] => {
  if (!questions || !Array.isArray(questions)) {
    return [];
  }
  
  return questions.map(question => ({
    ...question,
    questionKey: generateSmartVOCQuestionKey(question)
  }));
};
