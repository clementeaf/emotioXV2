import { useCallback, useState } from 'react';

import { SmartVOCFormData } from 'shared/interfaces/smart-voc.interface';

import { SmartVOCQuestion, ValidationErrors } from '../types';

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
        type: 'CSAT',
        title: 'Satisfacción del Cliente (CSAT)',
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
        type: 'CES',
        title: 'Esfuerzo del Cliente (CES)',
        description: '',
        instructions: '',
        showConditionally: false,
        config: {
          type: 'scale',
          scaleRange: {
            start: 1,
            end: 7
          },
          startLabel: '',
          endLabel: ''
        }
      },
      {
        id: 'cv-template',
        type: 'CV',
        title: 'Valor Cognitivo (CV)',
        description: '',
        instructions: '',
        showConditionally: false,
        config: {
          type: 'scale',
          scaleRange: {
            start: 1,
            end: 5
          },
          startLabel: '',
          endLabel: ''
        }
      },
      {
        id: 'nev-template',
        type: 'NEV',
        title: 'Valor Emocional Neto (NEV)',
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
        type: 'NPS',
        title: 'Net Promoter Score (NPS)',
        description: '',
        instructions: '',
        showConditionally: false,
        config: {
          type: 'scale',
          scaleRange: {
            start: 0,
            end: 10
          },
          companyName: '',
          startLabel: '',
          endLabel: ''
        }
      },
      {
        id: 'voc-template',
        type: 'VOC',
        title: 'Voz del Cliente (VOC)',
        description: '',
        instructions: '',
        showConditionally: false,
        config: {
          type: 'text'
        }
      },
      {
        id: 'trust-template',
        type: 'CSAT',
        title: 'Nivel de Confianza',
        description: '',
        instructions: '',
        showConditionally: false,
        config: {
          type: 'stars',
          companyName: ''
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
          type: 'CSAT',
          title: 'Satisfacción del Cliente (CSAT)',
          description: '',
          instructions: '',
          showConditionally: false,
          config: { type: 'stars', companyName: '' }
        },
        {
          id: 'ces-template',
          type: 'CES',
          title: 'Esfuerzo del Cliente (CES)',
          description: '',
          instructions: '',
          showConditionally: false,
          config: { type: 'scale', scaleRange: { start: 1, end: 7 }, startLabel: '', endLabel: '' }
        },
        {
          id: 'cv-template',
          type: 'CV',
          title: 'Valor Cognitivo (CV)',
          description: '',
          instructions: '',
          showConditionally: false,
          config: { type: 'scale', scaleRange: { start: 1, end: 5 }, startLabel: '', endLabel: '' }
        },
        {
          id: 'nev-template',
          type: 'NEV',
          title: 'Valor Emocional Neto (NEV)',
          description: '',
          instructions: '',
          showConditionally: false,
          config: { type: 'emojis', companyName: '' }
        },
        {
          id: 'nps-template',
          type: 'NPS',
          title: 'Net Promoter Score (NPS)',
          description: '',
          instructions: '',
          showConditionally: false,
          config: { type: 'scale', scaleRange: { start: 0, end: 10 }, companyName: '', startLabel: '', endLabel: '' }
        },
        {
          id: 'voc-template',
          type: 'VOC',
          title: 'Voz del Cliente (VOC)',
          description: '',
          instructions: '',
          showConditionally: false,
          config: { type: 'text' }
        },
        {
          id: 'trust-template',
          type: 'CSAT',
          title: 'Nivel de Confianza',
          description: '',
          instructions: '',
          showConditionally: false,
          config: { type: 'stars', companyName: '' }
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
