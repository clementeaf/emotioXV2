import { ApiError } from '@/config/api-client';
import { cognitiveTaskFixedAPI } from '@/lib/cognitive-task-api';
import { useAuth } from '@/providers/AuthProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
  CognitiveTaskFormData,
  Question,
  UploadedFile
} from 'shared/interfaces/cognitive-task.interface';
import {
  logFormDebugInfo
} from '../../CognitiveTaskFormHelpers';
import {
  QUERY_KEYS,
  SUCCESS_MESSAGES
} from '../constants';
import type { ErrorModalData } from '../types';
import { ValidationErrors } from '../types';
import {
  filterValidQuestions
} from '../utils/validateRequiredFields';
import { useCognitiveTaskFileUpload } from './useCognitiveTaskFileUpload';
import { useCognitiveTaskModals } from './useCognitiveTaskModals';
import { DEFAULT_STATE as DEFAULT_COGNITIVE_TASK_STATE, useCognitiveTaskState } from './useCognitiveTaskState';
import { useCognitiveTaskValidation } from './useCognitiveTaskValidation';

// Definición de QuestionType para evitar conflictos de importación
type QuestionType = 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'linear_scale' | 'ranking' | 'navigation_flow' | 'preference_test';

// Extender UploadedFile para uso interno de UI (no para requests/responses)
interface UIUploadedFile extends UploadedFile {
  status?: 'uploaded' | 'uploading' | 'error' | 'pending-delete';
  isLoading?: boolean;
  progress?: number;
  questionId?: string;
}

// Extender UploadedFile para incluir propiedades adicionales usadas en UI
interface ExtendedUploadedFile extends UploadedFile {
  isLoading?: boolean;
  progress?: number;
  error?: boolean;
  url: string;
  questionId?: string; // Añadir referencia a la pregunta
  status?: 'uploaded' | 'uploading' | 'error' | 'pending-delete'; // Estado del archivo en la UI
}

// Añadir PREVIEW_COMING_SOON si no existe en SUCCESS_MESSAGES
const SUCCESS_MESSAGES_EXTENDED = {
  ...SUCCESS_MESSAGES,
  PREVIEW_COMING_SOON: 'La vista previa estará disponible próximamente'
};

// Crear constantes para los mensajes de error directamente
const VALIDATION_ERROR_MESSAGES = {
  TITLE_REQUIRED: 'El título de la pregunta es obligatorio',
  CHOICES_REQUIRED: 'Debe agregar al menos una opción',
  CHOICE_TEXT_REQUIRED: 'El texto de la opción es obligatorio',
  SCALE_START_REQUIRED: 'El valor inicial de la escala es obligatorio',
  SCALE_END_REQUIRED: 'El valor final de la escala es obligatorio',
  SCALE_INVALID_RANGE: 'El valor inicial debe ser menor que el valor final',
  FILES_REQUIRED: 'Debe subir al menos un archivo',
  PREFERENCE_TEST_FILES_REQUIRED: 'Las pruebas de preferencia requieren exactamente 2 imágenes',
  RESEARCH_ID_REQUIRED: 'El ID de investigación es obligatorio',
  QUESTIONS_REQUIRED: 'Debe agregar al menos una pregunta'
};

// Interfaz para el resultado del hook principal (actualizada)
interface UseCognitiveTaskFormResult {
  formData: CognitiveTaskFormData;
  cognitiveTaskId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  questionTypes: { id: QuestionType; label: string; description: string }[];

  // Handlers de estado
  handleQuestionChange: (questionId: string, updates: Partial<Question>) => void;
  handleAddChoice: (questionId: string) => void;
  handleRemoveChoice: (questionId: string, choiceId: string) => void;
  handleAddQuestion: (type: QuestionType) => void;
  handleRandomizeChange: (checked: boolean) => void;

  // Handlers de archivos (vienen del hook)
  handleFileUpload: (questionId: string, files: FileList) => Promise<void>;
  handleMultipleFilesUpload: (questionId: string, files: FileList) => Promise<void>;
  handleFileDelete: (questionId: string, fileId: string) => Promise<void>;

  // Acciones principales
  handleSave: () => void;
  handlePreview: () => void;
  handleDelete: () => void;

  // Validación
  validationErrors: ValidationErrors | null;
  validateForm: () => ValidationErrors | null;

  // Funciones de Modal de Confirmación
  showConfirmModal: boolean;
  confirmAndSave: () => void;
  cancelSave: () => void;

  // Estado de carga de archivos (viene del hook)
  isUploading: boolean;
  uploadProgress: number;
  currentFileIndex: number;
  totalFiles: number;

  // <<< Añadir propiedades faltantes para los modales >>>
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  closeModal: () => void;
  showJsonPreview: boolean;
  closeJsonModal: () => void;
  jsonToSend: string;
  pendingAction: 'save' | 'preview' | null;
  continueWithAction: () => void;
}

// Definiciones locales para QUESTION_TYPES
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

// No usamos preguntas predeterminadas - el formulario empieza vacío

// Añadir la definición de la interfaz Window con _lastMutationTimestamp
declare global {
  interface Window {
    _lastMutationTimestamp?: number;
  }
}

/**
 * Hook principal refactorizado...
 */
export const useCognitiveTaskForm = (
  researchId?: string,
  onSave?: (data: any) => void
): UseCognitiveTaskFormResult => {
  const queryClient = useQueryClient();
  const [cognitiveTaskId, setCognitiveTaskId] = useState<string | null>(null);
  const { user, token } = useAuth();
  const isAuthenticated = !!user && !!token;

  // <<< Usar hook de estado >>>
    const {
    formData,
    setFormData,
    handleQuestionChange,
    handleAddChoice,
    handleRemoveChoice,
    handleRandomizeChange
  } = useCognitiveTaskState({});

  // Usar hook de modales
  const modals = useCognitiveTaskModals();

  // <<< Usar hook de validación >>>
  const { validationErrors, validateForm: runValidation } = useCognitiveTaskValidation();

  // <<< Usar hook de archivos >>>
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

  // Consulta para obtener datos existentes (usando la nueva API)
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

        console.log(`[useCognitiveTaskForm] Buscando config existente (fixed API): ${researchId}`);
        logFormDebugInfo('queryFn-pre-fetch', null, null, { researchId });

        // Añadir un tiempo de espera para asegurar que el backend tenga tiempo de procesar
        if (window._lastMutationTimestamp && Date.now() - window._lastMutationTimestamp < 1000) {
          console.log('[useCognitiveTaskForm] Esperando brevemente antes de GET para asegurar consistencia');
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const response = await cognitiveTaskFixedAPI.getByResearchId(researchId);

        console.log('[useCognitiveTaskForm] Respuesta de API (fixed): ', response);
        logFormDebugInfo('queryFn-post-fetch', response);

        // Validar la integridad básica de los datos
        if (response && (!response.researchId || !Array.isArray(response.questions))) {
          console.warn('[useCognitiveTaskForm] ⚠️ Datos recibidos con estructura incompleta:', response);
          logFormDebugInfo('queryFn-invalid-structure', response, new Error('Estructura de datos incompleta'));
          // Aún así devolver los datos para que se pueda intentar trabajar con ellos
        }

        return response;
      } catch (error: any) {
        console.error('[useCognitiveTaskForm] Error al obtener datos (fixed API):', error);
        logFormDebugInfo('queryFn-error', null, error, { researchId });

        if (error instanceof ApiError && error.statusCode === 404) {
            console.log('[useCognitiveTaskForm] Configuración no encontrada (404), tratando como null.');
            return null; // Tratar 404 como "no encontrado"
        }

        // Intentar recuperar datos del localStorage como alternativa de último recurso
        try {
          const localFiles = loadFilesFromLocalStorage();
          if (localFiles && Object.keys(localFiles).length > 0) {
            console.log('[useCognitiveTaskForm] Intentando construir estado inicial desde localStorage');
            // No lanzar error, devolver null pero permitir que useEffect utilice localStorage
            return null;
          }
        } catch (localError) {
          console.error('[useCognitiveTaskForm] Error al intentar recuperar datos del localStorage:', localError);
        }

        console.error('[useCognitiveTaskForm] Error no manejado en queryFn, devolviendo null.', error);
        return null; // Indicar a React Query que la consulta falló pero no relanzar
      }
    },
    enabled: !!researchId && isAuthenticated,
    retry: 2, // Aumentar a 2 reintentos
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  // Efecto para actualizar el formulario cuando los datos de la consulta se cargan
  useEffect(() => {
    if (!isLoading) { // Solo actuar cuando la carga inicial haya terminado
      if (cognitiveTaskData) {
        console.log('[useCognitiveTaskForm] Datos existentes encontrados. Actualizando formulario.');
        console.log('[useCognitiveTaskForm] Datos del backend (raw):', cognitiveTaskData);

        // Procesar los datos para convertir HitZone[] a HitzoneArea[] en los archivos
        const processedData = {
          ...cognitiveTaskData,
          questions: cognitiveTaskData.questions.map(question => {
            if (question.files && question.files.length > 0) {
              const processedFiles = question.files.map(file => {
                // Convertir HitZone[] del backend a HitzoneArea[] para el frontend
                const processedFile = {
                  ...file,
                  hitZones: file.hitZones ? file.hitZones.map((hz: any) => {
                    // Si ya es HitzoneArea (tiene x, y directamente), devolverlo tal como está
                    if (hz.x !== undefined) {
                      return hz;
                    }
                    // Si es HitZone (tiene region), convertirlo
                    return {
                      id: hz.id,
                      x: hz.region.x,
                      y: hz.region.y,
                      width: hz.region.width,
                      height: hz.region.height
                    };
                  }) : undefined
                };
                console.log(`[useCognitiveTaskForm] Archivo procesado ${file.name}:`, processedFile);
                return processedFile;
              });
              return { ...question, files: processedFiles };
            }
            return question;
          })
        };

        console.log('[useCognitiveTaskForm] Datos procesados para UI:', processedData);
        setFormData(processedData);
        setCognitiveTaskId((cognitiveTaskData as any).id || null);
      } else {
        console.log('[useCognitiveTaskForm] No se encontraron datos. Usando configuración por defecto.');
        // Si no hay datos, usar el estado por defecto, asegurando que el researchId se asigne
        setFormData({
          ...DEFAULT_COGNITIVE_TASK_STATE,
          researchId: researchId || ''
        });
        setCognitiveTaskId(null);
      }
    }
  }, [cognitiveTaskData, isLoading, researchId, setFormData]);

  const saveMutation = useMutation<CognitiveTaskFormData, ApiError, CognitiveTaskFormData>({
    mutationFn: async (dataToSave: CognitiveTaskFormData): Promise<CognitiveTaskFormData> => {
      if (!researchId) throw new Error('ID de investigación no encontrado');

      logFormDebugInfo('pre-save', dataToSave, null, { cognitiveTaskId });

      // SIEMPRE usar la ruta 'save' que maneja tanto creación como actualización
      console.log(`[useCognitiveTaskForm] Guardando config para researchId: ${researchId} (usando ruta save)`);
      return cognitiveTaskFixedAPI.save(researchId, dataToSave);
    },
    onSuccess: (data) => {
      // Extraer el ID de la respuesta y actualizar el estado
      const responseWithId = data as CognitiveTaskFormData & { id?: string };
      if (responseWithId.id && !cognitiveTaskId) {
        setCognitiveTaskId(responseWithId.id);
        console.log('[useCognitiveTaskForm] Nuevo ID de tarea cognitiva configurado:', responseWithId.id);
      }

      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId] });
      modals.closeModal();
      modals.showErrorModal({
        title: 'Éxito',
        message: 'La configuración se guardó correctamente.',
        type: 'success'
      });
      if (onSave) onSave(data);
    },
    onError: (error) => {
      modals.showErrorModal({
        title: 'Error al Guardar',
        message: error.message || 'Ocurrió un error inesperado.',
        type: 'error'
      });
    },
  });

  // Hook de mutación para eliminar toda la configuración de la tarea cognitiva por researchId
  const { mutate: deleteMutation, isPending: isDeleting } = useMutation<void, Error, string>({
    mutationFn: (id: string) => {
      if (!cognitiveTaskFixedAPI) {
        throw new Error('API client no inicializado');
      }
      // Corregido: Llamar al método correcto que construye la URL adecuadamente
      return cognitiveTaskFixedAPI.deleteByResearchId(id);
    },
    onSuccess: (_, deletedResearchId) => {
      modals.showErrorModal({
        title: 'Configuración eliminada',
        message: `La configuración de la tarea cognitiva para la investigación ${deletedResearchId} ha sido eliminada.`,
        type: 'success'
      });
      // Invalidar la consulta para forzar una recarga en la UI
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, deletedResearchId] });
      // Restaurar el estado del formulario con las preguntas por defecto (3.1 a 3.8)
      setFormData({
        ...DEFAULT_COGNITIVE_TASK_STATE,
        researchId: deletedResearchId
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

  // Función para agregar una nueva pregunta
  const handleAddQuestion = useCallback((type: QuestionType) => {
    const newQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: '',
      description: '',
      required: true,
      showConditionally: false,
      deviceFrame: false,
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

    setFormData((prev: CognitiveTaskFormData) => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  }, [setFormData]);

  // Wrapper para validación (actualizar para que coincida)
  const validateCurrentForm = useCallback((): ValidationErrors | null => {
      // Pasar solo los campos necesarios de formData para la validación
      const dataToValidate = { questions: formData.questions };
      return runValidation(dataToValidate, researchId);
  }, [formData.questions, researchId, runValidation]); // Asegurar dependencias correctas

  const handlePreview = async () => {
    try {
      // 1. Invalidar la query para marcar los datos como obsoletos
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId] });
      // 2. Forzar un refetch para obtener los datos más recientes (incluyendo hitzones)
      await queryClient.refetchQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId] });
      // 3. Abrir el modal de previsualización interactiva
      modals.openInteractivePreview();
    } catch (error) {
      console.error("Error al refrescar los datos para la vista previa:", error);
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
      // Convertir el objeto de errores en un mensaje de texto legible
      const errorMessages = Object.entries(errors)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\\n'); // Usar saltos de línea de texto

      modals.showErrorModal({
        title: 'Errores de Validación',
        message: `Por favor, corrige los siguientes errores:\n\n${errorMessages}`,
        type: 'warning'
      });
      return;
    }

    // Llamar directamente a la mutación en lugar de abrir el modal intermedio
    const dataToSend = filterValidQuestions(formData);
    saveMutation.mutate(dataToSend);
  };

  const continueWithAction = () => {
    if (modals.pendingAction === 'save') {
      const dataToSend = filterValidQuestions(formData);
      saveMutation.mutate(dataToSend);
      modals.closeJsonModal();
    }
    // No hay acción para 'preview' aquí
  };

  // Función para eliminar datos CognitiveTasks
  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta configuración? Esta acción no se puede deshacer.')) {
      if (researchId) {
        deleteMutation(researchId);
      } else {
        console.error("No se puede eliminar porque researchId es undefined.");
        modals.showErrorModal({
          title: 'Error',
          message: 'No se puede eliminar la configuración porque no se ha proporcionado un ID de investigación.',
          type: 'error'
        });
      }
    }
  };

  // --- Retorno del Hook Principal ---
  console.log('[useCognitiveTaskForm] Estado FINAL formData (desde hook estado):',
    JSON.stringify(formData?.questions?.map((q: Question) => ({ id: q.id, type: q.type, title: q.title?.substring(0, 20) })) || [])
  );

  return {
    formData,
    cognitiveTaskId,
    isLoading,
    isSaving: saveMutation.isPending,
    questionTypes: QUESTION_TYPES,
    // Handlers de estado
    handleQuestionChange,
    handleAddChoice,
    handleRemoveChoice,
    handleAddQuestion,
    handleRandomizeChange,
    // Handlers de archivos (del hook)
    handleFileUpload,
    handleMultipleFilesUpload,
    handleFileDelete: originalHandleFileDelete,
    // Acciones principales
    handleSave,
    handlePreview,
    handleDelete,
    // Validación (del hook)
    validationErrors,
    validateForm: validateCurrentForm,

    // <<< Asegurarse que se retornan las funciones y estado del modal de confirmación >>>
    showConfirmModal: false,
    confirmAndSave: continueWithAction,
    cancelSave: continueWithAction,

    // Estado de carga (del hook)
    isUploading,
    uploadProgress,
    currentFileIndex,
    totalFiles,
    continueWithAction,

    // Exportar todos los estados y funciones del modal
    ...modals
  };
};
