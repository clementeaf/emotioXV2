import { useCallback } from 'react';

import { SmartVOCQuestion, ValidationErrors } from '../types';

/**
 * Hook para validación del formulario SmartVOC
 * Responsabilidad: Contener toda la lógica de validación y filtrado
 */
export const useSmartVOCValidation = () => {
  // Función para validar el formulario
  const validateForm = useCallback((questionsToValidate: SmartVOCQuestion[], formData: { questions: SmartVOCQuestion[] }): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    questionsToValidate.forEach(q => {
      if (!q.title.trim()) {
        newErrors[q.id] = 'El texto de la pregunta no puede estar vacío.';
      }
    });

    return newErrors;
  }, []);

  // --- Lógica de Filtrado ---
  // Títulos de las preguntas de plantilla originales para la comparación
  const TEMPLATE_TITLES = new Set([
    'Satisfacción del Cliente (CSAT)',
    'Esfuerzo del Cliente (CES)',
    'Valor Cognitivo (CV)',
    'Valor Emocional Neto (NEV)',
    'Net Promoter Score (NPS)',
    'Voz del Cliente (VOC)',
    'Nivel de Confianza',
    'CSAT' // ✅ Agregado para incluir el título simple
  ]);

  /**
   * Filtra las preguntas para enviar solo aquellas que han sido editadas por el usuario.
   * Una pregunta se considera editada si tiene un título que no está vacío y es diferente
   * de los títulos de las plantillas por defecto.
   */
  const filterEditedQuestions = useCallback((questions: SmartVOCQuestion[]): SmartVOCQuestion[] => {
    console.log('[useSmartVOCValidation] 🎯 filterEditedQuestions input:', {
      questionsCount: questions.length,
      questions: questions.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        instructions: q.instructions,
        config: q.config
      }))
    });

    const filtered = questions.filter(q => {
      const title = q.title.trim();
      // Se envía si: tiene título Y (no es un título de plantilla O tiene descripción/instrucciones)
      const isEdited = title && (!TEMPLATE_TITLES.has(title) || q.description || q.instructions);

      console.log('[useSmartVOCValidation] 🎯 Question filter result:', {
        id: q.id,
        title: q.title,
        isEdited,
        hasDescription: !!q.description,
        hasInstructions: !!q.instructions,
        isTemplateTitle: TEMPLATE_TITLES.has(title)
      });

      return isEdited;
    });

    console.log('[useSmartVOCValidation] 🎯 filterEditedQuestions output:', {
      filteredCount: filtered.length,
      filtered: filtered.map(q => ({
        id: q.id,
        title: q.title,
        config: q.config
      }))
    });

    return filtered;
  }, [TEMPLATE_TITLES]);

  return {
    validateForm,
    filterEditedQuestions
  };
};
