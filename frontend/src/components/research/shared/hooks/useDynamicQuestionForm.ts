import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { questionSchema } from '../schema';
import { apiClient } from '@/api/config';

const schema = questionSchema;

// Types
export type ModuleType = 'smart-voc' | 'cognitive-task' | 'eye-tracking';
export type QuestionType = string;

export interface QuestionField {
  name: string;
  label: string;
  component: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
}

export interface QuestionTypeConfig {
  id: string;
  name: string;
  description: string;
  fields: QuestionField[];
  previewType: string;
  info?: string;
}

export interface DynamicQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  instructions?: string;
  required?: boolean;
  showConditionally: boolean;
  config?: any;
  questionKey?: string;
  [key: string]: any; // Para campos dinámicos
}

export interface DynamicFormData {
  researchId: string;
  questions: DynamicQuestion[];
  randomizeQuestions: boolean;
  moduleRequired: boolean;
  metadata?: {
    estimatedCompletionTime?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface UseDynamicQuestionFormResult {
  // Estado
  formData: DynamicFormData;
  questions: DynamicQuestion[];
  isLoading: boolean;
  isSaving: boolean;
  validationErrors: Record<string, string>;
  modalError: { type: 'error' | 'warning' | 'info' | 'success'; title?: string; message: string } | null;
  modalVisible: boolean;
  isDeleteModalOpen: boolean;
  isExisting: boolean;
  
  // Configuración del módulo
  moduleConfig: any;
  availableQuestionTypes: QuestionTypeConfig[];
  
  // Métodos de gestión de preguntas
  addQuestion: (questionType: QuestionType) => void;
  updateQuestion: (questionId: string, updates: Partial<DynamicQuestion>) => void;
  removeQuestion: (questionId: string) => void;
  duplicateQuestion: (questionId: string) => void;
  reorderQuestions: (fromIndex: number, toIndex: number) => void;
  
  // Métodos de formulario
  handleSave: () => Promise<void>;
  handlePreview: () => void;
  handleDelete: () => Promise<void>;
  validateForm: () => boolean;
  
  // Métodos de modal
  closeModal: () => void;
  confirmDelete: () => Promise<void>;
  closeDeleteModal: () => void;
  
  // Utilidades
  getQuestionTypeConfig: (questionType: QuestionType) => QuestionTypeConfig | null;
  isEmpty: boolean;
}

/**
 * Hook genérico para manejo dinámico de formularios de preguntas
 * Funciona con cualquier módulo (Smart VOC, Cognitive Task, Eye Tracking, etc.)
 */
export const useDynamicQuestionForm = (
  moduleType: ModuleType,
  researchId: string,
  onSave?: (data: DynamicFormData) => void
): UseDynamicQuestionFormResult => {
  
  // Estado local
  const [formData, setFormData] = useState<DynamicFormData>({
    researchId,
    questions: [],
    randomizeQuestions: false,
    moduleRequired: true,
    metadata: {
      estimatedCompletionTime: '5-10',
      createdAt: new Date().toISOString()
    }
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [modalError, setModalError] = useState<{ type: 'error' | 'warning' | 'info' | 'success'; title?: string; message: string } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExisting, setIsExisting] = useState(false);
  
  // Query client para invalidar cache
  const queryClient = useQueryClient();
  
  // Obtener configuración del módulo desde schema
  const moduleConfig = schema.modules[moduleType];
  const availableQuestionTypes = Object.values(moduleConfig?.questionTypes || {}) as QuestionTypeConfig[];
  
  // Estados para API genérica basada en schema
  const [existingData, setExistingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Cargar datos existentes usando API genérica
  useEffect(() => {
    const loadExistingData = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('smartVoc', 'getByResearch', { researchId });
        if (response.data) {
          setExistingData(response.data);
          setFormData({
            ...response.data,
            moduleRequired: true
          });
          setIsExisting(true);
        }
      } catch (error) {
        console.log('No existing data found for', moduleType);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingData();
  }, [researchId, moduleType]);

  // Crear preguntas iniciales basadas en el schema
  useEffect(() => {
    if (moduleConfig && (!formData.questions || formData.questions.length === 0) && !existingData) {
      const initialQuestions = Object.keys(moduleConfig.questionTypes).map((questionType, index) => {
        const questionTypeConfig = moduleConfig.questionTypes[questionType as keyof typeof moduleConfig.questionTypes];
        
        // Configuración específica según el tipo de pregunta
        let config = {};
        if (questionType === 'CSAT') {
          config = {
            type: 'stars'
          };
        } else if (questionType === 'CES' || questionType === 'CV' || questionType === 'NPS') {
          config = {
            type: 'scale',
            scaleRange: 5
          };
        } else if (questionType === 'NEV') {
          config = {
            type: 'emojis'
          };
        } else if (questionType === 'VOC') {
          config = {
            type: 'text'
          };
        }
        
        return {
          id: `initial-${questionType}-${index}`,
          type: questionType,
          title: '',
          description: '',
          instructions: '',
          required: true,
          showConditionally: false,
          config
        };
      });
      
      setFormData(prev => ({
        ...prev,
        questions: initialQuestions
      }));
    }
  }, [moduleConfig, existingData]);
  
  // Métodos de gestión de preguntas
  const addQuestion = useCallback((questionType: QuestionType) => {
    const questionTypeConfig = moduleConfig.questionTypes[questionType as keyof typeof moduleConfig.questionTypes];
    if (!questionTypeConfig) return;
    
    // Configuración específica según el tipo de pregunta
    let config = {};
    if (questionType === 'CSAT') {
      config = {
        type: 'stars'
      };
    } else if (questionType === 'CES' || questionType === 'CV' || questionType === 'NPS') {
      config = {
        type: 'scale',
        scaleRange: 5
      };
    } else if (questionType === 'NEV') {
      config = {
        type: 'emojis'
      };
    } else if (questionType === 'VOC') {
      config = {
        type: 'text'
      };
    }
    
    const newQuestion: DynamicQuestion = {
      id: Math.random().toString(36).substring(2, 15),
      type: questionType,
      title: '',
      description: '',
      instructions: '',
      required: true,
      showConditionally: false,
      questionKey: questionType,
      config
    };
    
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  }, [moduleConfig]);
  
  const updateQuestion = useCallback((questionId: string, updates: Partial<DynamicQuestion>) => {
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
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  }, []);
  
  const duplicateQuestion = useCallback((questionId: string) => {
    const questionToDuplicate = formData.questions.find(q => q.id === questionId);
    if (!questionToDuplicate) return;
    
    const duplicatedQuestion: DynamicQuestion = {
      ...questionToDuplicate,
      id: Math.random().toString(36).substring(2, 15),
      title: `${questionToDuplicate.title} (Copia)`
    };
    
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, duplicatedQuestion]
    }));
  }, [formData.questions]);
  
  const reorderQuestions = useCallback((fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      const [movedQuestion] = newQuestions.splice(fromIndex, 1);
      newQuestions.splice(toIndex, 0, movedQuestion);
      
      return {
        ...prev,
        questions: newQuestions
      };
    });
  }, []);
  
  // Validación
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    
    // Validar que hay al menos una pregunta
    if (formData.questions.length === 0) {
      errors.questions = 'Debe agregar al menos una pregunta';
    }
    
    // Validar campos requeridos de cada pregunta
    formData.questions.forEach((question, index) => {
      if (!question.title.trim()) {
        errors[`question_${index}_title`] = 'El título es requerido';
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.questions]);
  
  // Métodos de formulario
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      setModalError({
        type: 'warning',
        title: 'Formulario inválido',
        message: 'Por favor corrija los errores antes de guardar'
      });
      setModalVisible(true);
      return;
    }
    
    // Transformar datos para que coincidan con la estructura esperada por el backend
    const dataToSave = {
      researchId: formData.researchId,
      questions: formData.questions.map(question => ({
        id: question.id,
        type: question.type,
        title: question.title,
        description: question.description || '',
        instructions: question.instructions || '',
        required: question.required || false,
        showConditionally: question.showConditionally,
        config: question.config,
        questionKey: question.questionKey
      })),
      randomizeQuestions: formData.randomizeQuestions,
      smartVocRequired: formData.moduleRequired, // Mapear moduleRequired a smartVocRequired
      metadata: {
        ...formData.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    
    // API genérica basada en schema
    if (isExisting) {
      setIsUpdating(true);
      try {
        await apiClient.put('smartVoc', 'update', dataToSave, { researchId, formId: 'default' });
      } finally {
        setIsUpdating(false);
      }
    } else {
      setIsCreating(true);
      try {
        await apiClient.post('smartVoc', 'create', dataToSave, { researchId });
        setIsExisting(true);
      } finally {
        setIsCreating(false);
      }
    }
    
    if (onSave) {
      onSave(dataToSave as any);
    }
  }, [formData, validateForm, isExisting, researchId, moduleType, onSave]);
  
  const handlePreview = useCallback(() => {
    // Implementar lógica de preview
    console.log('Preview:', formData);
  }, [formData]);
  
  const handleDelete = useCallback(async () => {
    setIsDeleteModalOpen(true);
  }, []);
  
  const confirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete('smartVoc', 'delete', { researchId });
      setFormData({
        researchId,
        questions: [],
        randomizeQuestions: false,
        moduleRequired: true,
        metadata: {
          estimatedCompletionTime: '5-10',
          createdAt: new Date().toISOString()
        }
      });
      setIsExisting(false);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  }, [researchId, moduleType]);
  
  // Métodos de modal
  const closeModal = useCallback(() => {
    setModalVisible(false);
    setModalError(null);
  }, []);
  
  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
  }, []);
  
  // Utilidades
  const getQuestionTypeConfig = useCallback((questionType: QuestionType): QuestionTypeConfig | null => {
    return moduleConfig.questionTypes[questionType as keyof typeof moduleConfig.questionTypes] || null;
  }, [moduleConfig]);
  
  return {
    // Estado
    formData,
    questions: formData.questions || [],
    isLoading,
    isSaving: isCreating || isUpdating || isDeleting,
    validationErrors,
    modalError,
    modalVisible,
    isDeleteModalOpen,
    isExisting,
    
    // Configuración del módulo
    moduleConfig,
    availableQuestionTypes,
    
    // Métodos de gestión de preguntas
    addQuestion,
    updateQuestion,
    removeQuestion,
    duplicateQuestion,
    reorderQuestions,
    
    // Métodos de formulario
    handleSave,
    handlePreview,
    handleDelete,
    validateForm,
    
    // Métodos de modal
    closeModal,
    confirmDelete,
    closeDeleteModal,
    
    // Utilidades
    getQuestionTypeConfig,
    isEmpty: !formData.questions || formData.questions.length === 0
  };
};
