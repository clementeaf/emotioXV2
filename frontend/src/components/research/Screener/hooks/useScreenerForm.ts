/**
 * Hook para gestionar el formulario de Screener
 */

import { useState, useEffect, useCallback } from 'react';
import { useScreenerData } from '@/api/domains/screener';
import type { ScreenerFormData, ScreenerQuestion, ScreenerOption } from '@/api/domains/screener/screener.types';

export interface ValidationErrors {
  [key: string]: string;
}

export interface ErrorModalData {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

export interface UseScreenerFormResult {
  formData: ScreenerFormData;
  isLoading: boolean;
  isSaving: boolean;
  validationErrors: ValidationErrors;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  isDeleteModalOpen: boolean;
  handleChange: (field: keyof ScreenerFormData, value: unknown) => void;
  handleSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
  confirmDelete: () => Promise<void>;
  closeModal: () => void;
  closeDeleteModal: () => void;
  addQuestion: (questionType: ScreenerQuestion['questionType']) => void;
  updateQuestion: (questionId: string, updates: Partial<ScreenerQuestion>) => void;
  removeQuestion: (questionId: string) => void;
  addOption: (questionId: string) => void;
  updateOption: (questionId: string, optionId: string, updates: Partial<ScreenerOption>) => void;
  removeOption: (questionId: string, optionId: string) => void;
  reorderQuestions: (questionIds: string[]) => void;
}

const INITIAL_FORM_DATA: ScreenerFormData = {
  researchId: '',
  isEnabled: false,
  title: '',
  description: '',
  questions: [],
  randomizeQuestions: false
};

export const useScreenerForm = (researchId: string): UseScreenerFormResult => {
  const actualResearchId = researchId === 'current' ? '' : researchId;

  const {
    data: existingData,
    isLoading,
    createScreener,
    updateScreener,
    deleteScreener,
    isCreating,
    isUpdating,
    isDeleting
  } = useScreenerData(actualResearchId);

  const [formData, setFormData] = useState<ScreenerFormData>(INITIAL_FORM_DATA);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);

  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (!actualResearchId) {
      setFormData({ ...INITIAL_FORM_DATA, researchId: '' });
      return;
    }

    if (existingData) {
      setFormData({
        researchId: existingData.researchId,
        isEnabled: existingData.isEnabled ?? false,
        title: existingData.title || '',
        description: existingData.description || '',
        questions: existingData.questions || [],
        randomizeQuestions: existingData.randomizeQuestions ?? false
      });
      setHasBeenSaved(true);
    } else if (!hasBeenSaved) {
      setFormData({ ...INITIAL_FORM_DATA, researchId: actualResearchId });
    }
  }, [existingData, actualResearchId, hasBeenSaved]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.title.trim()) {
      errors.title = 'El título es requerido';
    }

    if (!formData.description.trim()) {
      errors.description = 'La descripción es requerida';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = useCallback((field: keyof ScreenerFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const handleSave = async () => {
    if (!validateForm()) {
      setModalError({
        title: 'Campos incompletos',
        message: 'Por favor, complete todos los campos requeridos.',
        type: 'warning'
      });
      setModalVisible(true);
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        researchId: actualResearchId
      };

      if (existingData && actualResearchId) {
        await updateScreener(dataToSubmit);
      } else if (actualResearchId) {
        await createScreener(dataToSubmit);
      } else {
        throw new Error('No hay researchId válido para guardar.');
      }

      setHasBeenSaved(true);
    } catch (error) {
      setModalError({
        title: 'Error al Guardar',
        message: `No se pudo guardar Screener: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      });
      setModalVisible(true);
    }
  };

  const handleDelete = async () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!existingData || !actualResearchId) return;

    try {
      await deleteScreener();
      setFormData({ ...INITIAL_FORM_DATA, researchId: actualResearchId });
      setHasBeenSaved(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo eliminar Screener.';
      setModalError({
        title: 'Error al eliminar',
        message: errorMessage,
        type: 'error'
      });
      setModalVisible(true);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalError(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const addQuestion = useCallback((questionType: ScreenerQuestion['questionType']) => {
    const newQuestion: ScreenerQuestion = {
      id: `question_${Date.now()}`,
      questionText: '',
      questionType,
      required: false,
      order: formData.questions.length,
      options: (questionType === 'single_choice' || questionType === 'multiple_choice' || questionType === 'ranking')
        ? [
            { id: '1', label: '', value: '', eligibility: 'qualify' },
            { id: '2', label: '', value: '', eligibility: 'qualify' },
            { id: '3', label: '', value: '', eligibility: 'qualify' }
          ]
        : undefined,
      scaleConfig: questionType === 'linear_scale'
        ? {
            startValue: 1,
            endValue: 5
          }
        : undefined
    };
    
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  }, [formData.questions.length]);

  const updateQuestion = useCallback((questionId: string, updates: Partial<ScreenerQuestion>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  }, []);

  const removeQuestion = useCallback((questionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions
        .filter(q => q.id !== questionId)
        .map((q, index) => ({ ...q, order: index }))
    }));
  }, []);

  const addOption = useCallback((questionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId && q.options) {
          const newOptionId = String((q.options.length || 0) + 1);
          return {
            ...q,
            options: [
              ...q.options,
              { id: newOptionId, label: '', value: '', eligibility: 'qualify' }
            ]
          };
        }
        return q;
      })
    }));
  }, []);

  const updateOption = useCallback((questionId: string, optionId: string, updates: Partial<ScreenerOption>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId && q.options) {
          return {
            ...q,
            options: q.options.map(opt =>
              opt.id === optionId ? { ...opt, ...updates } : opt
            )
          };
        }
        return q;
      })
    }));
  }, []);

  const removeOption = useCallback((questionId: string, optionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId && q.options) {
          const filtered = q.options.filter(opt => opt.id !== optionId);
          return { ...q, options: filtered.length > 0 ? filtered : undefined };
        }
        return q;
      })
    }));
  }, []);

  const reorderQuestions = useCallback((questionIds: string[]) => {
    setFormData(prev => {
      const questionMap = new Map(prev.questions.map(q => [q.id, q]));
      const reordered = questionIds
        .map(id => questionMap.get(id))
        .filter((q): q is ScreenerQuestion => q !== undefined)
        .map((q, index) => ({ ...q, order: index }));
      
      return {
        ...prev,
        questions: reordered
      };
    });
  }, []);

  return {
    formData,
    isLoading,
    isSaving,
    validationErrors,
    modalError,
    modalVisible,
    isDeleteModalOpen,
    handleChange,
    handleSave,
    handleDelete,
    confirmDelete,
    closeModal,
    closeDeleteModal,
    addQuestion,
    updateQuestion,
    removeQuestion,
    addOption,
    updateOption,
    removeOption,
    reorderQuestions
  };
};

