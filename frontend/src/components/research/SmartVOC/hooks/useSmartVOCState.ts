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
        id: 'csat-template',
        type: QuestionType.SMARTVOC_CSAT,
        title: 'CSAT',
        description: 'Customer Satisfaction',
        instructions: '¿Qué tan satisfecho estás con nuestro servicio?',
        showConditionally: false,
        config: {
          type: 'scale',
          scaleRange: { start: 1, end: 5 },
          startLabel: 'Muy insatisfecho',
          endLabel: 'Muy satisfecho'
        }
      },
      {
        id: 'ces-template',
        type: QuestionType.SMARTVOC_CES,
        title: 'CES',
        description: 'Customer Effort Score',
        instructions: '¿Qué tan fácil fue completar tu tarea?',
        showConditionally: false,
        config: {
          type: 'scale',
          scaleRange: { start: 1, end: 7 },
          startLabel: 'Muy difícil',
          endLabel: 'Muy fácil'
        }
      },
      {
        id: 'cv-template',
        type: QuestionType.SMARTVOC_CV,
        title: 'CV',
        description: 'Customer Value',
        instructions: '¿Qué tan valioso fue para ti?',
        showConditionally: false,
        config: {
          type: 'scale',
          scaleRange: { start: 1, end: 5 },
          startLabel: 'Sin valor',
          endLabel: 'Muy valioso'
        }
      },
      {
        id: 'nev-template',
        type: QuestionType.SMARTVOC_NEV,
        title: 'NEV',
        description: 'Net Emotional Value',
        instructions: '¿Qué emoción experimentaste?',
        showConditionally: false,
        config: {
          type: 'emojis'
        }
      },
      {
        id: 'nps-template',
        type: QuestionType.SMARTVOC_NPS,
        title: 'NPS',
        description: 'Net Promoter Score',
        instructions: '¿Qué tan probable es que recomiendes nuestro producto/servicio?',
        showConditionally: false,
        config: {
          type: 'scale',
          scaleRange: { start: 0, end: 10 },
          startLabel: 'Muy improbable',
          endLabel: 'Muy probable'
        }
      },
      {
        id: 'voc-template',
        type: QuestionType.SMARTVOC_VOC,
        title: 'VOC',
        description: 'Voice of Customer',
        instructions: 'Cuéntanos tu experiencia',
        showConditionally: false,
        config: {
          type: 'text'
        }
      },
      {
        id: 'nc-template',
        type: QuestionType.SMARTVOC_NC,
        title: 'NC',
        description: 'Nivel de Confianza/Satisfacción',
        instructions: '¿Qué tan satisfecho estás?',
        showConditionally: false,
        config: {
          type: 'scale',
          scaleRange: { start: 1, end: 5 },
          startLabel: 'Muy insatisfecho',
          endLabel: 'Muy satisfecho'
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
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    }));
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
          description: 'Customer Satisfaction',
          instructions: '¿Qué tan satisfecho estás con nuestro servicio?',
          showConditionally: false,
          config: {
            type: 'scale',
            scaleRange: { start: 1, end: 5 },
            startLabel: 'Muy insatisfecho',
            endLabel: 'Muy satisfecho'
          }
        },
        {
          id: 'ces-template',
          type: QuestionType.SMARTVOC_CES,
          title: 'CES',
          description: 'Customer Effort Score',
          instructions: '¿Qué tan fácil fue completar tu tarea?',
          showConditionally: false,
          config: {
            type: 'scale',
            scaleRange: { start: 1, end: 7 },
            startLabel: 'Muy difícil',
            endLabel: 'Muy fácil'
          }
        },
        {
          id: 'cv-template',
          type: QuestionType.SMARTVOC_CV,
          title: 'CV',
          description: 'Customer Value',
          instructions: '¿Qué tan valioso fue para ti?',
          showConditionally: false,
          config: {
            type: 'scale',
            scaleRange: { start: 1, end: 5 },
            startLabel: 'Sin valor',
            endLabel: 'Muy valioso'
          }
        },
        {
          id: 'nev-template',
          type: QuestionType.SMARTVOC_NEV,
          title: 'NEV',
          description: 'Net Emotional Value',
          instructions: '¿Qué emoción experimentaste?',
          showConditionally: false,
          config: {
            type: 'emojis'
          }
        },
        {
          id: 'nps-template',
          type: QuestionType.SMARTVOC_NPS,
          title: 'NPS',
          description: 'Net Promoter Score',
          instructions: '¿Qué tan probable es que recomiendes nuestro producto/servicio?',
          showConditionally: false,
          config: {
            type: 'scale',
            scaleRange: { start: 0, end: 10 },
            startLabel: 'Muy improbable',
            endLabel: 'Muy probable'
          }
        },
        {
          id: 'voc-template',
          type: QuestionType.SMARTVOC_VOC,
          title: 'VOC',
          description: 'Voice of Customer',
          instructions: 'Cuéntanos tu experiencia',
          showConditionally: false,
          config: {
            type: 'text'
          }
        },
        {
          id: 'nc-template',
          type: QuestionType.SMARTVOC_NC,
          title: 'NC',
          description: 'Nivel de Confianza/Satisfacción',
          instructions: '¿Qué tan satisfecho estás?',
          showConditionally: false,
          config: {
            type: 'scale',
            scaleRange: { start: 1, end: 5 },
            startLabel: 'Muy insatisfecho',
            endLabel: 'Muy satisfecho'
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
