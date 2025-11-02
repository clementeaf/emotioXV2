import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
  CognitiveTaskFormData,
  UploadedFile
} from 'shared/interfaces/cognitive-task.interface';

import { useAuth } from '@/providers/AuthProvider';
import { useCreateCognitiveTask, useDeleteCognitiveTask, useCognitiveTaskData, useUpdateCognitiveTask } from '@/api/domains/cognitive-task';
import { toastHelpers } from '@/utils/toast';

import {
  logFormDebugInfo
} from '../../utils/CognitiveTaskFormHelpers';
import {
  QUERY_KEYS
} from '../constants';
import type { ErrorModalData, Question, UICognitiveTaskFormData } from '../types';
import { ValidationErrors } from '../types';
import { debugQuestionsToSendLocal, filterValidQuestionsLocal, ensureCognitiveTaskQuestionKeys } from '../utils';

import { QuestionType as GlobalQuestionType } from 'shared/interfaces/question-types.enum';
import { useCognitiveTaskFileUpload } from './useCognitiveTaskFileUpload';
import { useCognitiveTaskModals } from './useCognitiveTaskModals';

type QuestionType = 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'linear_scale' | 'ranking' | 'navigation_flow' | 'preference_test';

interface UIUploadedFile extends UploadedFile {
  status?: 'uploaded' | 'uploading' | 'error' | 'pending-delete';
  isLoading?: boolean;
  progress?: number;
  questionId?: string;
}

interface ExtendedUploadedFile extends UploadedFile {
  isLoading?: boolean;
  progress?: number;
  error?: boolean;
  url: string;
  questionId?: string;
  status?: 'uploaded' | 'uploading' | 'error' | 'pending-delete';
}

interface UseCognitiveTaskFormResult {
  formData: UICognitiveTaskFormData;
  cognitiveTaskId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  isAddQuestionModalOpen: boolean;
  isUploading: boolean;
  uploadProgress: number;
  currentFileIndex: number;
  totalFiles: number;
  questionTypes: any[];
  validationErrors: ValidationErrors | null;

  // Métodos de gestión
  handleQuestionChange: (questionId: string, updates: Partial<Question>) => void;
  handleAddChoice: (questionId: string) => void;
  handleRemoveChoice: (questionId: string, choiceId: string) => void;
  handleFileUpload: (questionId: string, files: FileList) => void;
  handleMultipleFilesUpload: (questionId: string, files: FileList) => void;
  handleFileDelete: (questionId: string, fileId: string) => void;
  handleAddQuestion: (type: string) => void;
  handleRandomizeChange: (checked: boolean) => void;
  openAddQuestionModal: () => void;
  closeAddQuestionModal: () => void;

  // Métodos de acción
  handleSave: () => void;
  handlePreview: () => void;
  handleDelete: () => void;
  validateForm: () => boolean;
  closeModal: () => void;
  initializeDefaultQuestions: (defaultQuestions: Question[]) => void;

  // Nuevas propiedades para el modal JSON
  showJsonPreview: boolean;
  closeJsonModal: () => void;
  isEmpty: boolean;
}

// Constante para el estado inicial por defecto con las 8 preguntas originales (3.1-3.8)
const DEFAULT_STATE: UICognitiveTaskFormData = {
  researchId: '', // El researchId vendrá de props o se establecerá después
  questions: [
    {
      id: '3.1',
      type: 'short_text',
      title: '',
      description: '',
      required: false,
      showConditionally: false,
      deviceFrame: false,
      files: []
    },
    {
      id: '3.2',
      type: 'long_text',
      title: '',
      required: false,
      showConditionally: false,
      deviceFrame: false,
      files: []
    },
    {
      id: '3.3',
      type: 'single_choice',
      title: '',
      required: false,
      showConditionally: false,
      choices: [
        { id: '1', text: '', isQualify: false, isDisqualify: false },
        { id: '2', text: '', isQualify: false, isDisqualify: false },
        { id: '3', text: '', isQualify: false, isDisqualify: false }
      ],
      deviceFrame: false,
      files: []
    },
    {
      id: '3.4',
      type: 'multiple_choice',
      title: '',
      required: false,
      showConditionally: false,
      choices: [
        { id: '1', text: '', isQualify: false, isDisqualify: false },
        { id: '2', text: '', isQualify: false, isDisqualify: false },
        { id: '3', text: '', isQualify: false, isDisqualify: false }
      ],
      deviceFrame: false,
      files: []
    },
    {
      id: '3.5',
      type: 'linear_scale',
      title: '',
      required: false,
      showConditionally: false,
      scaleConfig: {
        startValue: 1,
        endValue: 5,
        startLabel: '',
        endLabel: ''
      },
      deviceFrame: false,
      files: []
    },
    {
      id: '3.6',
      type: 'ranking',
      title: '',
      required: false,
      showConditionally: false,
      choices: [
        { id: '1', text: '', isQualify: false, isDisqualify: false },
        { id: '2', text: '', isQualify: false, isDisqualify: false },
        { id: '3', text: '', isQualify: false, isDisqualify: false }
      ],
      deviceFrame: false,
      files: []
    },
    {
      id: '3.7',
      type: 'navigation_flow',
      title: '',
      required: false,
      showConditionally: false,
      files: [],
      deviceFrame: true
    },
    {
      id: '3.8',
      type: 'preference_test',
      title: '',
      description: '',
      required: false,
      showConditionally: false,
      files: [],
      deviceFrame: true
    }
  ],
  randomizeQuestions: false
};

export const useCognitiveTaskForm = (researchId?: string): UseCognitiveTaskFormResult => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Estados principales
  const [formData, setFormData] = useState<UICognitiveTaskFormData>(DEFAULT_STATE);
  const [cognitiveTaskId, setCognitiveTaskId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors | null>(null);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);

  // Hooks de dominio
  const { data: existingData, isLoading } = useCognitiveTaskData(researchId || '');
  const createMutation = useCreateCognitiveTask();
  const updateMutation = useUpdateCognitiveTask();
  const deleteMutation = useDeleteCognitiveTask();

  // Hooks auxiliares
  const {
    isUploading,
    uploadProgress,
    currentFileIndex,
    totalFiles,
    handleFileUpload: uploadFile,
    handleMultipleFilesUpload: uploadMultipleFiles,
    handleFileDelete: deleteFile
  } = useCognitiveTaskFileUpload({
    researchId,
    formData,
    setFormData
  });

  const {
    modalVisible,
    modalError,
    showErrorModal,
    closeModal,
    showJsonPreview,
    jsonToSend,
    pendingAction,
    openJsonModal,
    closeJsonModal,
    showInteractivePreview,
    openInteractivePreview,
    closeInteractivePreview,
    isDeleteModalOpen,
    openDeleteModal,
    closeDeleteModal
  } = useCognitiveTaskModals();

  // Cargar datos existentes
  useEffect(() => {
    if (existingData) {
      // Normalizar tipos de preguntas antiguos (file_upload -> navigation_flow)
      const normalizedData = {
        ...existingData,
        questions: existingData.questions.map((q: Question) => {
          if (q.type === 'file_upload') {
            return { ...q, type: 'navigation_flow' };
          }
          return q;
        })
      };
      setFormData(normalizedData);
      setCognitiveTaskId('existing');
    } else {
      setFormData(prev => ({ ...prev, researchId: researchId || '' }));
      setCognitiveTaskId(null);
    }
  }, [existingData, researchId]);

  // Función para manejar cambios en preguntas
  const handleQuestionChange = useCallback((questionId: string, updates: Partial<Question>) => {
    setFormData(prevData => ({
      ...prevData,
      questions: prevData.questions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  }, []);

  // Función para agregar una opción a una pregunta
  const handleAddChoice = useCallback((questionId: string) => {
    setFormData(prevData => ({
      ...prevData,
      questions: prevData.questions.map(q =>
        q.id === questionId && q.choices
          ? {
            ...q,
            choices: [
              ...q.choices,
              { id: String(q.choices.length + 1), text: '', isQualify: false, isDisqualify: false }
            ]
          }
          : q
      )
    }));
  }, []);

  // Función para eliminar una opción de una pregunta
  const handleRemoveChoice = useCallback((questionId: string, choiceId: string) => {
    setFormData(prevData => ({
      ...prevData,
      questions: prevData.questions.map(q =>
        q.id === questionId && q.choices
          ? {
            ...q,
            choices: q.choices.filter(c => c.id !== choiceId)
          }
          : q
      )
    }));
  }, []);

  // Función para controlar el aleatorizado de preguntas
  const handleRandomizeChange = useCallback((checked: boolean) => {
    setFormData(prevData => ({
      ...prevData,
      randomizeQuestions: checked
    }));
  }, []);

  // Función para agregar pregunta
  const handleAddQuestion = useCallback((type: string) => {
    const newQuestion: Question = {
      id: `question_${Date.now()}`,
      type,
      title: '',
      required: false,
      showConditionally: false,
      deviceFrame: false,
      files: []
    };

    setFormData(prevData => ({
      ...prevData,
      questions: [...prevData.questions, newQuestion]
    }));

    setIsAddQuestionModalOpen(false);
  }, []);

  // Función para manejar subida de archivos
  const handleFileUpload = useCallback(async (questionId: string, files: FileList) => {
    await uploadFile(questionId, files);
  }, [uploadFile]);

  const handleMultipleFilesUpload = useCallback(async (questionId: string, files: FileList) => {
    await uploadMultipleFiles(questionId, files);
  }, [uploadMultipleFiles]);

  const handleFileDelete = useCallback(async (questionId: string, fileId: string) => {
    await deleteFile(questionId, fileId);
  }, [deleteFile]);

  // Función para abrir/cerrar modal de agregar pregunta
  const openAddQuestionModal = useCallback(() => {
    setIsAddQuestionModalOpen(true);
  }, []);

  const closeAddQuestionModal = useCallback(() => {
    setIsAddQuestionModalOpen(false);
  }, []);

  // Función de validación
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    if (!researchId) {
      errors.researchId = 'El ID de investigación es obligatorio';
    }

    const questionsWithTitle = formData.questions.filter(q => q.title && q.title.trim() !== '');
    if (questionsWithTitle.length === 0) {
      errors.questions = 'Debe haber al menos una pregunta con título';
    }

    setValidationErrors(Object.keys(errors).length > 0 ? errors : null);
    return Object.keys(errors).length === 0;
  }, [formData, researchId]);

  // Función para guardar
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      showErrorModal({
        title: 'Error de validación',
        message: 'Por favor, corrija los errores antes de guardar',
        type: 'error'
      });
      return;
    }

    try {
      const dataToSave = filterValidQuestionsLocal(formData);
      
      // Asegurar que todas las preguntas tengan questionKey antes de enviar
      const questionsWithKeys = ensureCognitiveTaskQuestionKeys(dataToSave.questions);
      
      // Convertir a los tipos del domain y normalizar tipos antiguos
      const domainData: CognitiveTaskFormData = {
        ...dataToSave,
        questions: questionsWithKeys.map(q => ({
          ...q,
          // Normalizar file_upload a navigation_flow para compatibilidad
          type: (q.type === 'file_upload' ? 'navigation_flow' : q.type) as any,
          // Preservar questionKey explícitamente
          questionKey: q.questionKey
        }))
      };
      
      if (cognitiveTaskId) {
        await updateMutation.mutateAsync({ researchId: researchId || '', data: domainData });
      } else {
        await createMutation.mutateAsync({ ...domainData, researchId: researchId || '' });
      }
    } catch (error) {
      showErrorModal({
        title: 'Error al guardar',
        message: 'No se pudo guardar la configuración',
        type: 'error'
      });
    }
  }, [validateForm, formData, cognitiveTaskId, researchId, updateMutation, createMutation, showErrorModal]);

  // Función para vista previa
  const handlePreview = useCallback(() => {
    openJsonModal(formData, 'preview');
  }, [formData, openJsonModal]);

  // Función para eliminar
  const handleDelete = useCallback(async () => {
    if (!cognitiveTaskId) return;

    try {
      await deleteMutation.mutateAsync(researchId || '');
      setFormData(DEFAULT_STATE);
      setCognitiveTaskId(null);
      toastHelpers.deleteSuccess('CognitiveTask');
    } catch (error) {
      showErrorModal({
        title: 'Error al eliminar',
        message: 'No se pudo eliminar la configuración',
        type: 'error'
      });
    }
  }, [cognitiveTaskId, researchId, deleteMutation, showErrorModal]);

  // Función para inicializar preguntas por defecto
  const initializeDefaultQuestions = useCallback((defaultQuestions: Question[]) => {
    setFormData(prevData => ({
      ...prevData,
      questions: defaultQuestions
    }));
  }, []);

  // Tipos de preguntas disponibles
  const questionTypes = [
    { id: 'short_text', label: 'Texto Corto', description: 'Respuestas cortas de texto' },
    { id: 'long_text', label: 'Texto Largo', description: 'Respuestas largas de texto' },
    { id: 'single_choice', label: 'Opción Única', description: 'Seleccionar una opción' },
    { id: 'multiple_choice', label: 'Opción Múltiple', description: 'Seleccionar múltiples opciones' },
    { id: 'linear_scale', label: 'Escala Lineal', description: 'Escala numérica' },
    { id: 'ranking', label: 'Ranking', description: 'Ordenar opciones por preferencia' },
    { id: 'navigation_flow', label: 'Flujo de Navegación', description: 'Prueba de flujo de navegación' },
    { id: 'preference_test', label: 'Prueba de Preferencia', description: 'Prueba A/B de preferencia' }
  ];

  return {
    formData,
    cognitiveTaskId,
    isLoading,
    isSaving: createMutation.isPending || updateMutation.isPending,
    modalError,
    modalVisible,
    isAddQuestionModalOpen,
    isUploading,
    uploadProgress,
    currentFileIndex,
    totalFiles,
    questionTypes,
    validationErrors,

    // Métodos de gestión
    handleQuestionChange,
    handleAddChoice,
    handleRemoveChoice,
    handleFileUpload,
    handleMultipleFilesUpload,
    handleFileDelete,
    handleAddQuestion,
    handleRandomizeChange,
    openAddQuestionModal,
    closeAddQuestionModal,

    // Métodos de acción
    handleSave,
    handlePreview,
    handleDelete,
    validateForm,
    closeModal,
    initializeDefaultQuestions,

    // Nuevas propiedades para el modal JSON
    showJsonPreview,
    closeJsonModal,
    isEmpty: formData.questions.length === 0,

    // Modal de confirmación para eliminar datos
    isDeleteModalOpen,
    openDeleteModal,
    closeDeleteModal
  };
};