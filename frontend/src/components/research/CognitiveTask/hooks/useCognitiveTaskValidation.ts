import { useState, useCallback } from 'react';
import { Question } from 'shared/interfaces/cognitive-task.interface'; // Necesario para formData

// Tipos locales necesarios
type ValidationErrors = Record<string, string>;

// Interfaz simplificada de FormData necesaria para la validación
interface ValidationFormData {
  questions: Question[];
  // Añadir otros campos si validateForm los usa, por ahora solo questions
}

// Mensajes de error (podrían importarse si se mueven a constantes)
const VALIDATION_ERROR_MESSAGES = {
  TITLE_REQUIRED: 'El título de la pregunta es obligatorio',
  CHOICES_REQUIRED: 'Debe agregar al menos una opción',
  CHOICE_TEXT_REQUIRED: 'El texto de la opción es obligatorio',
  SCALE_START_REQUIRED: 'El valor inicial de la escala es obligatorio',
  SCALE_END_REQUIRED: 'El valor final de la escala es obligatorio',
  SCALE_INVALID_RANGE: 'El valor inicial debe ser menor que el valor final',
  FILES_REQUIRED: 'Debe subir al menos un archivo',
  PREFERENCE_TEST_FILES_REQUIRED: 'Las pruebas de preferencia requieren exactamente 2 imágenes',
  RESEARCH_ID_REQUIRED: 'El ID de investigación es obligatorio',
  QUESTIONS_REQUIRED: 'Debe agregar al menos una pregunta'
};

interface UseCognitiveTaskValidationResult {
  validationErrors: ValidationErrors | null;
  validateForm: (formData: ValidationFormData, researchId?: string) => ValidationErrors | null;
}

export const useCognitiveTaskValidation = (): UseCognitiveTaskValidationResult => {
  const [validationErrors, setValidationErrors] = useState<ValidationErrors | null>(null);

  const validateForm = useCallback((formData: ValidationFormData, researchId?: string): ValidationErrors | null => {
    const errors: ValidationErrors = {};
    
    // Validar researchId (si se pasa)
    if (researchId === undefined || researchId === '') { // Chequeo más robusto
      errors.researchId = VALIDATION_ERROR_MESSAGES.RESEARCH_ID_REQUIRED;
    }
    
    // Validar que haya al menos una pregunta con título
    // Filtrar solo preguntas con título para validación
    const questionsWithTitle = formData.questions ? formData.questions.filter(q => q.title && q.title.trim() !== '') : [];
  
    if (questionsWithTitle.length === 0) {
      errors.questions = 'Debe haber al menos una pregunta con título';
    }

    // Validar cada pregunta que tenga título
    questionsWithTitle.forEach((question, index) => {
      // Solo validar título si la pregunta está marcada como required por el usuario
      if (question.required && !question.title?.trim()) {
        errors[`question_${index}_title`] = VALIDATION_ERROR_MESSAGES.TITLE_REQUIRED;
      }
      
      // Validar opciones para preguntas de elección (solo si están marcadas como required)
      if (question.required && ['single_choice', 'multiple_choice', 'ranking'].includes(question.type)) {
        if (!question.choices || question.choices.length === 0) {
          errors[`question_${index}_choices`] = VALIDATION_ERROR_MESSAGES.CHOICES_REQUIRED;
        } else {
          question.choices.forEach((choice, choiceIndex) => {
            if (!choice.text?.trim()) {
              errors[`question_${index}_choice_${choiceIndex}`] = VALIDATION_ERROR_MESSAGES.CHOICE_TEXT_REQUIRED;
            }
          });
        }
      }
      
      // Validar configuración de escala (solo si están marcadas como required)
      if (question.required && question.type === 'linear_scale' && question.scaleConfig) {
        const { startValue, endValue } = question.scaleConfig;
        if (startValue === undefined || startValue === null) {
          errors[`question_${index}_scale_start`] = VALIDATION_ERROR_MESSAGES.SCALE_START_REQUIRED;
        }
        if (endValue === undefined || endValue === null) {
          errors[`question_${index}_scale_end`] = VALIDATION_ERROR_MESSAGES.SCALE_END_REQUIRED;
        }
        if (startValue !== undefined && endValue !== undefined && startValue >= endValue) {
          errors[`question_${index}_scale`] = VALIDATION_ERROR_MESSAGES.SCALE_INVALID_RANGE;
        }
      }
      
      // Validación de Archivos (Corregida)
      if (question.required && ['navigation_flow', 'preference_test'].includes(question.type)) {
        const fileCount = question.files?.length || 0; // Usar longitud directa del array
        if (fileCount === 0) {
          errors[`question_${index}_files`] = VALIDATION_ERROR_MESSAGES.FILES_REQUIRED;
        } else if (question.type === 'preference_test' && fileCount !== 2) {
          errors[`question_${index}_files`] = VALIDATION_ERROR_MESSAGES.PREFERENCE_TEST_FILES_REQUIRED;
        }
      }
    });
    
    const errorCount = Object.keys(errors).length;
    const result = errorCount > 0 ? errors : null;
    // console.log(`[useCognitiveTaskValidation] Validación completada. ${errorCount} errores encontrados:`, result || '{}');
    
    setValidationErrors(result);
    return result;
  }, []);

  return {
    validationErrors,
    validateForm,
  };
}; 