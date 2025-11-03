import { useCallback, useEffect, useState } from 'react';
import { useSmartVOCData } from '@/api/domains/smart-voc';
import { SmartVOCFormData, SmartVOCQuestion } from '@/api/domains/smart-voc';
import { QuestionType } from 'shared/interfaces/question-types.enum';
import { toastHelpers } from '@/utils/toast';
import { ensureSmartVOCQuestionKeys } from '../utils';

// Tipos locales del hook
interface ErrorModalData {
  type: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
}

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
              type: 'stars'
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
              type: 'emojis'
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
              endLabel: ''
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
};

export const useSmartVOCForm = (researchId: string): UseSmartVOCFormResult => {
  const actualResearchId = researchId === 'current' ? '' : researchId;

  // Usar el hook centralizado para obtener datos y operaciones
  const {
    data: existingData,
    isLoading,
    updateSmartVOC,
    createSmartVOC,
    deleteSmartVOC
  } = useSmartVOCData(actualResearchId);

  const [formData, setFormData] = useState<SmartVOCFormData>(INITIAL_FORM_DATA);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);

  // Procesar datos cuando cambien
  useEffect(() => {
    if (!actualResearchId) {
      setFormData({ ...INITIAL_FORM_DATA });
      return;
    }

    if (existingData) {
      // Asegurar que existingData tenga questions definido
      setFormData({
        ...existingData,
        questions: existingData.questions || []
      });
      setHasBeenSaved(true);
    } else if (!hasBeenSaved) {
      setFormData({ ...INITIAL_FORM_DATA });
    }
  }, [existingData, actualResearchId, hasBeenSaved]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!formData.questions || formData.questions.length === 0) {
      errors.questions = 'Debe tener al menos una pregunta';
    }

    formData.questions?.forEach((question, index) => {
      if (!question.title?.trim()) {
        errors[`question_${index}_title`] = 'El título es requerido';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateQuestion = useCallback((id: string, updates: Partial<SmartVOCQuestion>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    }));
  }, []);

  const addQuestion = useCallback((question: SmartVOCQuestion) => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, question]
    }));
  }, []);

  const removeQuestion = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  }, []);

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

    setIsSaving(true);
    try {
      // Validar que questions exista
      if (!formData.questions || !Array.isArray(formData.questions)) {
        throw new Error('questions is not defined or is not an array');
      }
      
      // Asegurar que todas las preguntas tengan questionKey antes de enviar
      const questionsWithKeys = ensureSmartVOCQuestionKeys(formData.questions);
      
      const dataToSubmit = {
        ...formData,
        researchId: actualResearchId,
        questions: questionsWithKeys
      };

      if (existingData && actualResearchId) {
        // Actualizar existente
        await updateSmartVOC(dataToSubmit);
      } else if (actualResearchId) {
        // Crear nuevo
        await createSmartVOC(dataToSubmit);
      } else {
        throw new Error('No hay researchId válido para guardar.');
      }

      setHasBeenSaved(true);
      // El toast se muestra en los hooks de la API (createSmartVOC/updateSmartVOC)

    } catch (error) {
      setModalError({
        title: 'Error al Guardar',
        message: `No se pudo guardar SmartVOC: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      });
      setModalVisible(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (!validateForm()) {
      setModalError({
        title: 'Campos incompletos',
        message: 'Por favor, complete todos los campos requeridos antes de previsualizar.',
        type: 'warning'
      });
      setModalVisible(true);
      return;
    }

    // Implementar vista previa
    toastHelpers.error('Vista previa no implementada aún');
  };

  const handleDelete = async () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!existingData || !actualResearchId) return;
    
    try {
      await deleteSmartVOC();
      setFormData({ ...INITIAL_FORM_DATA });
      setHasBeenSaved(false);
      // El toast se muestra en el hook de la API (deleteMutation)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo eliminar SmartVOC.';
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

  return {
    formData,
    smartVocId: existingData ? 'existing' : null,
    validationErrors,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    questions: formData.questions,
    updateQuestion,
    addQuestion,
    removeQuestion,
    handleSave,
    handlePreview,
    handleDelete,
    closeModal,
    isExisting: !!existingData,
    isDeleteModalOpen,
    confirmDelete,
    closeDeleteModal,
  };
};