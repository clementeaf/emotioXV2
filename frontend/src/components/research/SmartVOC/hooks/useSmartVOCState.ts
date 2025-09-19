import { useCallback, useState } from 'react';
import { QuestionType } from 'shared/interfaces/question-types.enum';
import { SmartVOCFormData, SmartVOCQuestion } from 'shared/interfaces/smart-voc.interface';

import { ValidationErrors } from '../types';

/**
 * Hook para gestión de estado del formulario SmartVOC
 * Responsabilidad: Manejar formData y funciones que lo modifican directamente
 */
export const useSmartVOCState = (researchId: string) => {
  const [formData, setFormData] = useState<SmartVOCFormData>({
    researchId,
    questions: [
      {
        id: QuestionType.SMARTVOC_CSAT,
        type: QuestionType.SMARTVOC_CSAT,
        title: '',
        description: '',
        instructions: '',
        showConditionally: false,
        config: {
          type: 'stars',
          companyName: ''
        }
      },
      {
        id: QuestionType.SMARTVOC_CES,
        type: QuestionType.SMARTVOC_CES,
        title: '',
        description: '',
        instructions: '',
        showConditionally: false,
        config: {
          type: 'scale',
          scaleRange: { start: 1, end: 5 },
          startLabel: '',
          endLabel: ''
        }
      },
      {
        id: QuestionType.SMARTVOC_CV,
        type: QuestionType.SMARTVOC_CV,
        title: '',
        description: '',
        instructions: '',
        showConditionally: false,
        config: {
          type: 'scale',
          scaleRange: { start: 1, end: 5 },
          startLabel: '',
          endLabel: ''
        }
      },
      {
        id: QuestionType.SMARTVOC_NEV,
        type: QuestionType.SMARTVOC_NEV,
        title: '',
        description: '',
        instructions: '',
        showConditionally: false,
        config: {
          type: 'emojis',
          companyName: ''
        }
      },
      {
        id: QuestionType.SMARTVOC_NPS,
        type: QuestionType.SMARTVOC_NPS,
        title: '',
        description: '',
        instructions: '',
        showConditionally: false,
        config: {
          type: 'scale',
          scaleRange: { start: 0, end: 10 },
          startLabel: '',
          endLabel: '',
          companyName: ''
        }
      },
      {
        id: QuestionType.SMARTVOC_VOC,
        type: QuestionType.SMARTVOC_VOC,
        title: '',
        description: '',
        instructions: '',
        showConditionally: false,
        config: {
          type: 'text'
        }
      }
    ],
    randomizeQuestions: false,
    smartVocRequired: true,
    metadata: {
      createdAt: new Date().toISOString(),
      estimatedCompletionTime: '5-10'
    }
  });

  const [smartVocId, setSmartVocId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Función para actualizar una pregunta específica
  const updateQuestion = useCallback((id: string, updates: Partial<SmartVOCQuestion>) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
      };

      return newFormData;
    });
  }, []);

  // Función para actualizar configuraciones generales
  const updateSettings = useCallback((updates: Partial<Pick<SmartVOCFormData, 'randomizeQuestions' | 'smartVocRequired'>>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Función para añadir una nueva pregunta
  const addQuestion = useCallback((newQuestion: SmartVOCQuestion) => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  }, []);

  // Función para eliminar una pregunta
  const removeQuestion = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  }, []);

  // Función para restaurar preguntas por defecto (usado en handleDelete)
  const resetToDefaultQuestions = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      questions: [
        {
          id: 'csat-template',
          type: QuestionType.SMARTVOC_CSAT,
          title: 'CSAT',
          description: '',
          instructions: '',
          showConditionally: false,
          config: {
            type: 'stars',
            companyName: ''
          }
        },
        {
          id: 'ces-template',
          type: QuestionType.SMARTVOC_CES,
          title: 'CES',
          description: '',
          instructions: '',
          showConditionally: false,
          config: {
            type: 'scale',
            scaleRange: { start: 1, end: 5 },
            startLabel: '',
            endLabel: ''
          }
        },
        {
          id: 'cv-template',
          type: QuestionType.SMARTVOC_CV,
          title: 'CV',
          description: '',
          instructions: '',
          showConditionally: false,
          config: {
            type: 'scale',
            scaleRange: { start: 1, end: 5 },
            startLabel: '',
            endLabel: ''
          }
        },
        {
          id: 'nev-template',
          type: QuestionType.SMARTVOC_NEV,
          title: 'NEV',
          description: '',
          instructions: '',
          showConditionally: false,
          config: {
            type: 'emojis',
            companyName: ''
          }
        },
        {
          id: 'nps-template',
          type: QuestionType.SMARTVOC_NPS,
          title: 'NPS',
          description: '',
          instructions: '',
          showConditionally: false,
          config: {
            type: 'scale',
            scaleRange: { start: 0, end: 10 },
            startLabel: '',
            endLabel: '',
            companyName: ''
          }
        },
        {
          id: 'voc-template',
          type: QuestionType.SMARTVOC_VOC,
          title: 'VOC',
          description: '',
          instructions: '',
          showConditionally: false,
          config: {
            type: 'text'
          }
        }
      ]
    }));
  }, []);

  return {
    formData,
    setFormData,
    smartVocId,
    setSmartVocId,
    validationErrors,
    setValidationErrors,
    updateQuestion,
    updateSettings,
    addQuestion,
    removeQuestion,
    resetToDefaultQuestions
  };
};
