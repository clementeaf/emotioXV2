import { useCallback, useEffect, useState } from 'react';
import { useSmartVOCData } from '@/api/domains/smart-voc';
import { SmartVOCFormData, SmartVOCQuestion } from '@/api/domains/smart-voc';
import { QuestionType } from 'shared/interfaces/question-types.enum';
import { toastHelpers } from '@/utils/toast';
import { useFormManager, useModalManager, type ErrorModalData } from '@/components/common/hooks';

interface ValidationErrors {
  [key: string]: string;
}

interface UseSmartVOCFormResult {
  formData: SmartVOCFormData;
  smartVocId: string | null;
  validationErrors: ValidationErrors;
  isLoading: boolean;
  isSaving: boolean;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  questions: SmartVOCQuestion[];
  updateQuestion: (id: string, updates: Partial<SmartVOCQuestion>) => void;
  addQuestion: (question: SmartVOCQuestion) => void;
  removeQuestion: (id: string) => void;
  handleSave: () => Promise<void>;
  handlePreview: () => void;
  handleDelete: () => Promise<void>;
  closeModal: () => void;
  isExisting: boolean;
  isDeleteModalOpen: boolean;
  confirmDelete: () => Promise<void>;
  closeDeleteModal: () => void;
}

// Initial form data
const INITIAL_FORM_DATA: SmartVOCFormData = {
  researchId: '',
  questions: [
    {
      id: QuestionType.SMARTVOC_CSAT,
      type: QuestionType.SMARTVOC_CSAT,
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
};

export const useSmartVOCFormRefactored = (researchId: string): UseSmartVOCFormResult => {
  const actualResearchId = researchId === 'current' ? '' : researchId;
  const [smartVocId, setSmartVocId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SmartVOCQuestion[]>(INITIAL_FORM_DATA.questions);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);

  // Usar el hook centralizado para obtener datos y operaciones
  const {
    data: existingData,
    isLoading,
    updateSmartVOC,
    createSmartVOC,
    deleteSmartVOC
  } = useSmartVOCData(actualResearchId);

  // Usar hooks genéricos
  const formManager = useFormManager({
    initialFormData: { ...INITIAL_FORM_DATA, researchId: actualResearchId },
    onSave: async (data: SmartVOCFormData) => {
      try {
        if (existingData) {
          await updateSmartVOC(data);
          setSmartVocId('existing');
          toastHelpers.updateSuccess('Smart VOC');
        } else {
          await createSmartVOC(data);
          setSmartVocId('new');
          toastHelpers.saveSuccess('Smart VOC');
        }
        setHasBeenSaved(true);
      } catch (error) {
        throw new Error('Error al guardar Smart VOC');
      }
    },
    onDelete: async () => {
      try {
        await deleteSmartVOC();
        toastHelpers.deleteSuccess('Smart VOC');
        setSmartVocId(null);
      } catch (error) {
        throw new Error('Error al eliminar Smart VOC');
      }
    },
    onPreview: () => {
      console.log('Preview Smart VOC');
    },
    validateForm: (data: SmartVOCFormData) => {
      const errors: Record<string, string> = {};
      
      if (questions.length === 0) {
        errors.questions = 'Debe tener al menos una pregunta';
      }
      
      return errors;
    },
    existingItem: existingData
  });

  const modalManager = useModalManager();

  // Procesar datos cuando cambien
  useEffect(() => {
    if (!actualResearchId) {
      setQuestions(INITIAL_FORM_DATA.questions);
      return;
    }

    if (existingData) {
      setQuestions(existingData.questions || []);
      setSmartVocId('existing');
      setHasBeenSaved(true);
    } else if (!hasBeenSaved) {
      setQuestions(INITIAL_FORM_DATA.questions);
    }
  }, [existingData, actualResearchId, hasBeenSaved]);

  // Funciones específicas de SmartVOC
  const updateQuestion = useCallback((id: string, updates: Partial<SmartVOCQuestion>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  }, []);

  const addQuestion = useCallback((question: SmartVOCQuestion) => {
    setQuestions(prev => [...prev, { ...question, order: prev.length + 1 }]);
  }, []);

  const removeQuestion = useCallback((id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  }, []);

  const handleSave = useCallback(async () => {
    await formManager.handleSave();
  }, [formManager]);

  const handlePreview = useCallback(() => {
    formManager.handlePreview();
  }, [formManager]);

  const handleDelete = useCallback(async () => {
    await formManager.handleDelete();
  }, [formManager]);

  const confirmDelete = useCallback(async () => {
    await handleDelete();
    modalManager.closeDeleteModal();
  }, [handleDelete, modalManager]);

  return {
    formData: formManager.formData,
    smartVocId,
    validationErrors: formManager.validationErrors,
    isLoading: formManager.isLoading || isLoading,
    isSaving: formManager.isSaving,
    modalError: formManager.modalError,
    modalVisible: formManager.modalVisible,
    questions,
    updateQuestion,
    addQuestion,
    removeQuestion,
    handleSave,
    handlePreview,
    handleDelete,
    closeModal: formManager.closeModal,
    isExisting: formManager.isExisting,
    isDeleteModalOpen: modalManager.isDeleteModalOpen,
    confirmDelete,
    closeDeleteModal: modalManager.closeDeleteModal
  };
};