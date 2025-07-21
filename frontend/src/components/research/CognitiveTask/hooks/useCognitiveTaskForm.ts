import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
  CognitiveTaskFormData,
  UploadedFile
} from 'shared/interfaces/cognitive-task.interface';

import { useAuth } from '@/providers/AuthProvider';
import { cognitiveTaskService } from '@/services/cognitiveTaskService';

import {
  logFormDebugInfo
} from '../../CognitiveTaskFormHelpers';
import {
  QUERY_KEYS
} from '../constants';
import type { ErrorModalData, Question, UICognitiveTaskFormData } from '../types';
import { ValidationErrors } from '../types';
import { debugQuestionsToSendLocal, filterValidQuestionsLocal } from '../utils/validateRequiredFields';

import { QuestionType as GlobalQuestionType } from 'shared/interfaces/question-types.enum';
import { useCognitiveTaskFileUpload } from './useCognitiveTaskFileUpload';
import { useCognitiveTaskModals } from './useCognitiveTaskModals';
import { DEFAULT_STATE as DEFAULT_COGNITIVE_TASK_STATE, useCognitiveTaskState } from './useCognitiveTaskState';
import { useCognitiveTaskValidation } from './useCognitiveTaskValidation';

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
  questionTypes: { id: QuestionType; label: string; description: string }[];

  handleQuestionChange: (questionId: string, updates: Partial<Question>) => void;
  handleAddChoice: (questionId: string) => void;
  handleRemoveChoice: (questionId: string, choiceId: string) => void;
  handleAddQuestion: (type: string) => void;
  handleRandomizeChange: (checked: boolean) => void;
  handleFileUpload: (questionId: string, files: FileList) => Promise<void>;
  handleMultipleFilesUpload: (questionId: string, files: FileList) => Promise<void>;
  handleFileDelete: (questionId: string, fileId: string) => Promise<void>;

  handleSave: () => void;
  handlePreview: () => void;
  handleDelete: () => void;
  confirmDelete: () => void;

  validationErrors: ValidationErrors | null;
  validateForm: () => ValidationErrors | null;

  showConfirmModal: boolean;
  confirmAndSave: () => void;
  cancelSave: () => void;

  isUploading: boolean;
  uploadProgress: number;
  currentFileIndex: number;
  totalFiles: number;

  modalError: ErrorModalData | null;
  modalVisible: boolean;
  closeModal: () => void;
  showJsonPreview: boolean;
  closeJsonModal: () => void;
  jsonToSend: string;
  pendingAction: 'save' | 'preview' | null;
  continueWithAction: () => void;

  isEmpty: boolean;
}

const QUESTION_TYPES = [
  { id: 'short_text' as QuestionType, label: 'Texto Corto', description: 'Respuesta corta de texto' },
  { id: 'long_text' as QuestionType, label: 'Texto Largo', description: 'Respuesta larga de texto' },
  { id: 'single_choice' as QuestionType, label: 'Opción Única', description: 'Selecciona una opción' },
  { id: 'multiple_choice' as QuestionType, label: 'Opción Múltiple', description: 'Selecciona varias opciones' },
  { id: 'linear_scale' as QuestionType, label: 'Escala Lineal', description: 'Escala numérica' },
  { id: 'ranking' as QuestionType, label: 'Ranking', description: 'Ordenar opciones' },
  { id: 'navigation_flow' as QuestionType, label: 'Flujo de Navegación', description: 'Prueba de navegación' },
  { id: 'preference_test' as QuestionType, label: 'Prueba de Preferencia', description: 'Test A/B' }
];

declare global {
  interface Window {
    _lastMutationTimestamp?: number;
  }
}

// Función helper para mapear tipos Cognitive Task al ENUM
const getCognitiveQuestionType = (type: string): string => {
  // Si el tipo ya es un valor del enum, lo devolvemos tal cual
  if (Object.values(GlobalQuestionType).includes(type as GlobalQuestionType)) {
    return type;
  }
  switch (type) {
    case 'long_text': return GlobalQuestionType.COGNITIVE_LONG_TEXT;
    case 'multiple_choice': return GlobalQuestionType.COGNITIVE_MULTIPLE_CHOICE;
    case 'single_choice': return GlobalQuestionType.COGNITIVE_SINGLE_CHOICE;
    case 'rating': return GlobalQuestionType.COGNITIVE_RATING;
    case 'ranking': return GlobalQuestionType.COGNITIVE_RANKING;
    default: return `cognitive_${type}`;
  }
};

export const useCognitiveTaskForm = (
  researchId?: string,
  onSave?: (data: any) => void
): UseCognitiveTaskFormResult => {
  const queryClient = useQueryClient();
  const [cognitiveTaskId, setCognitiveTaskId] = useState<string | null>(null);
  const { user, token } = useAuth();
  const isAuthenticated = !!user && !!token;
  const {
    formData,
    setFormData,
    handleQuestionChange,
    handleAddChoice,
    handleRemoveChoice,
    handleRandomizeChange
  } = useCognitiveTaskState({});
  const modals = useCognitiveTaskModals();
  const { validationErrors, validateForm: runValidation } = useCognitiveTaskValidation();
  const {
    isUploading,
    uploadProgress,
    currentFileIndex,
    totalFiles,
    handleFileUpload,
    handleMultipleFilesUpload,
    handleFileDelete: originalHandleFileDelete,
    loadFilesFromLocalStorage
  } = useCognitiveTaskFileUpload({ researchId, formData, setFormData });
  const { data: cognitiveTaskData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId],
    queryFn: async () => {
      try {
        if (!isAuthenticated || !token || !researchId) {
          logFormDebugInfo('queryFn-precondition-fail', null, null, {
            isAuthenticated,
            hasToken: !!token,
            researchId
          });
          return null;
        }

        logFormDebugInfo('queryFn-pre-fetch', null, null, { researchId });

        if (window._lastMutationTimestamp && Date.now() - window._lastMutationTimestamp < 1000) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const response = await cognitiveTaskService.getByResearchId(researchId);

        logFormDebugInfo('queryFn-post-fetch', response);

        if (response && (!response.researchId || !Array.isArray(response.questions))) {
          logFormDebugInfo('queryFn-invalid-structure', response, new Error('Estructura de datos incompleta'));
        }

        return response;
      } catch (error: any) {
        logFormDebugInfo('queryFn-error', null, error, { researchId });

        if (error && error.message?.includes('404')) {
          return null;
        }

        try {
          const localFiles = loadFilesFromLocalStorage();
          if (localFiles && Object.keys(localFiles).length > 0) {
            return null;
          }
        } catch (localError) {
          console.error('[useCognitiveTaskForm] Error al intentar recuperar datos del localStorage:', localError);
        }

        return null;
      }
    },
    enabled: !!researchId && isAuthenticated,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (cognitiveTaskData) {
        const processedData = {
          ...cognitiveTaskData,
          questions: cognitiveTaskData.questions.map(question => {
            if (question.files && question.files.length > 0) {
              const existingQuestion = formData.questions.find(q => q.id === question.id);

              const processedFiles = question.files.map(file => {
                const existingFile = existingQuestion?.files?.find(f => f.id === file.id);

                if (existingFile?.hitZones && existingFile.hitZones.length > 0) {
                  return {
                    ...file,
                    hitZones: existingFile.hitZones
                  };
                }

                return {
                  ...file,
                  hitZones: file.hitZones ? file.hitZones.map((hz: any) => {
                    if (hz.x !== undefined) {
                      return hz;
                    }
                    return {
                      id: hz.id,
                      x: hz.region.x,
                      y: hz.region.y,
                      width: hz.region.width,
                      height: hz.region.height
                    };
                  }) : undefined
                };
              });
              return { ...question, files: processedFiles };
            }
            return question;
          })
        };

        setFormData(processedData);
        setCognitiveTaskId((cognitiveTaskData as any).id || null);
      } else {
        setFormData({
          ...DEFAULT_COGNITIVE_TASK_STATE,
          researchId: researchId || ''
        });
        setCognitiveTaskId(null);
      }
    }

    if (cognitiveTaskData === null && !isLoading) {
      setIsEmpty(true);
    } else {
      setIsEmpty(false);
    }
  }, [cognitiveTaskData, isLoading, researchId, setFormData]);

  const saveMutation = useMutation<CognitiveTaskFormData, unknown, CognitiveTaskFormData>({
    mutationFn: async (dataToSave: CognitiveTaskFormData): Promise<CognitiveTaskFormData> => {
      if (!researchId) { throw new Error('ID de investigación no encontrado'); }

      logFormDebugInfo('pre-save', dataToSave, null, { cognitiveTaskId });

      return cognitiveTaskService.save(researchId, convertToSharedFormat(dataToSave));
    },
    onSuccess: (data) => {
      const responseWithId = data as CognitiveTaskFormData & { id?: string };
      if (responseWithId.id && !cognitiveTaskId) {
        setCognitiveTaskId(responseWithId.id);
      }

      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId] });
      modals.closeModal();
      modals.showErrorModal({
        title: 'Éxito',
        message: 'La configuración se guardó correctamente.',
        type: 'success'
      });
      if (onSave) { onSave(data); }
    },
    onError: (error) => {
      modals.showErrorModal({
        title: 'Error al Guardar',
        message: (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Ocurrió un error inesperado.',
        type: 'error'
      });
    },
  });

  const { mutate: deleteMutation, isPending: isDeleting } = useMutation<void, Error, string>({
    mutationFn: (id: string) => {
      return cognitiveTaskService.deleteByResearchId(id);
    },
    onSuccess: (_, deletedResearchId) => {
      modals.showErrorModal({
        title: 'Configuración eliminada',
        message: `La configuración de la tarea cognitiva para la investigación ${deletedResearchId} ha sido eliminada.`,
        type: 'success'
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, deletedResearchId] });
      setFormData({
        ...DEFAULT_COGNITIVE_TASK_STATE,
        researchId: deletedResearchId || ''
      });
      setCognitiveTaskId(null);
    },
    onError: (error, deletedResearchId) => {
      modals.showErrorModal({
        title: 'Error al eliminar',
        message: `No se pudo eliminar la configuración para la investigación ${deletedResearchId}. ${error.message}`,
        type: 'error'
      });
    }
  });

  const handleAddQuestion = useCallback((type: string) => {
    const newQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: '',
      description: '',
      required: true,
      showConditionally: false,
      deviceFrame: false,
      questionKey: `${getCognitiveQuestionType(type)}_q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...(type === 'single_choice' || type === 'multiple_choice' || type === 'ranking' ? {
        choices: [
          { id: '1', text: '', isQualify: false, isDisqualify: false },
          { id: '2', text: '', isQualify: false, isDisqualify: false }
        ]
      } : {}),
      ...(type === 'linear_scale' ? {
        scaleConfig: { startValue: 1, endValue: 5 }
      } : {}),
      ...(type === 'navigation_flow' || type === 'preference_test' ? {
        files: []
      } : {})
    };

    setFormData((prev: UICognitiveTaskFormData) => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  }, [setFormData]);

  const validateCurrentForm = useCallback((): ValidationErrors | null => {
    const dataToValidate = { questions: formData.questions };
    return runValidation(dataToValidate, researchId);
  }, [formData.questions, researchId, runValidation]);

  const handlePreview = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId] });
      await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId] });
      modals.openInteractivePreview();
    } catch (error) {
      console.error('Error al refrescar los datos para la vista previa:', error);
      modals.showErrorModal({
        title: 'Error de Sincronización',
        message: 'No se pudieron cargar los datos más recientes para la vista previa. Inténtalo de nuevo.',
        type: 'error',
      });
    }
  };

  const handleSave = () => {
    const errors = runValidation(formData, researchId);
    if (errors && Object.keys(errors).length > 0) {
      const errorMessages = Object.entries(errors)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\\n');

      modals.showErrorModal({
        title: 'Errores de Validación',
        message: `Por favor, corrige los siguientes errores:\n\n${errorMessages}`,
        type: 'warning'
      });
      return;
    }

    const dataToSend = filterValidQuestionsLocal(formData);

    const enrichedDataToSend = {
      ...dataToSend,
      questions: dataToSend.questions.map(q => ({
        ...q,
        questionKey: getCognitiveQuestionType(q.type),
        type: `cognitive_${q.type}`
      }))
    };

    debugQuestionsToSendLocal(formData);

    const questionsWithFiles = enrichedDataToSend.questions.filter((q: Question) => q.files && q.files.length > 0);
    if (questionsWithFiles.length > 0) {
      questionsWithFiles.forEach((q: Question) => {
        const filesWithHitZones = q.files?.filter((f: any) => f.hitZones && f.hitZones.length > 0) || [];
      });
    }

    saveMutation.mutate(convertToSharedFormat(enrichedDataToSend));
  };

  const continueWithAction = () => {
    if (modals.pendingAction === 'save') {
      const dataToSend = formData;
      const enrichedDataToSend = {
        ...dataToSend,
        questions: dataToSend.questions.map(q => ({
          ...q,
          questionKey: getCognitiveQuestionType(q.type),
          type: `cognitive_${q.type}`
        }))
      };
      saveMutation.mutate(convertToSharedFormat(enrichedDataToSend));
      modals.closeJsonModal();
    }
  };

  const handleDelete = () => {
    modals.openDeleteModal();
  };

  const confirmDelete = async () => {
    modals.closeDeleteModal();

    if (researchId) {
      deleteMutation(researchId);
    } else {
      console.error('No se puede eliminar porque researchId es undefined.');
      modals.showErrorModal({
        title: 'Error',
        message: 'No se puede eliminar la configuración porque no se ha proporcionado un ID de investigación.',
        type: 'error'
      });
    }
  };

  const convertToSharedFormat = (localData: UICognitiveTaskFormData): CognitiveTaskFormData => {
    return {
      researchId: localData.researchId,
      questions: localData.questions.map(q => ({
        ...q,
        type: q.type as any
      })),
      randomizeQuestions: localData.randomizeQuestions,
      metadata: localData.metadata
    };
  };

  return {
    formData,
    cognitiveTaskId,
    isLoading,
    isSaving: saveMutation.isPending,
    questionTypes: QUESTION_TYPES,

    handleQuestionChange,
    handleAddChoice,
    handleRemoveChoice,
    handleAddQuestion,
    handleRandomizeChange,
    handleFileUpload,
    handleMultipleFilesUpload,
    handleFileDelete: originalHandleFileDelete,
    handleSave,
    handlePreview,
    handleDelete,
    confirmDelete,

    validationErrors,
    validateForm: validateCurrentForm,

    showConfirmModal: false,
    confirmAndSave: continueWithAction,
    cancelSave: continueWithAction,

    isUploading,
    uploadProgress,
    currentFileIndex,
    totalFiles,
    continueWithAction,

    ...modals,

    isEmpty,
  };
};
