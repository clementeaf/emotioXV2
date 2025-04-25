import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  Question,
  UploadedFile
} from 'shared/interfaces/cognitive-task.interface';
import { 
  QUERY_KEYS, 
  SUCCESS_MESSAGES
} from '../constants';
import { useAuth } from '@/providers/AuthProvider';
import { cognitiveTaskFixedAPI } from '@/lib/cognitive-task-api';
import { ApiError } from '@/config/api-client';
import { useCognitiveTaskModals } from './useCognitiveTaskModals';
import { useCognitiveTaskValidation } from './useCognitiveTaskValidation';
import { useCognitiveTaskFileUpload } from './useCognitiveTaskFileUpload';
import { useCognitiveTaskState } from './useCognitiveTaskState';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';

// Tipos que faltan o que provocan conflictos
type ValidationErrors = Record<string, string>;

// Definición de QuestionType para evitar conflictos de importación
type QuestionType = 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'linear_scale' | 'ranking' | 'navigation_flow' | 'preference_test';

// Definir CognitiveTaskFormData localmente
export interface CognitiveTaskFormData {
  id?: string;
  researchId: string;
  questions: Question[];
  randomizeQuestions: boolean;
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    lastModifiedBy?: string;
    version?: string;
  };
  [key: string]: any;
}

// Extender UploadedFile para incluir propiedades adicionales usadas en UI
interface ExtendedUploadedFile extends UploadedFile {
  isLoading?: boolean;
  progress?: number;
  error?: boolean;
  url: string;
  questionId?: string; // Añadir referencia a la pregunta
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
  handleRandomizeChange: (checked: boolean) => void;
  
  // Handlers de archivos (vienen del hook)
  handleFileUpload: (questionId: string, files: FileList) => Promise<void>; 
  handleMultipleFilesUpload: (questionId: string, files: FileList) => Promise<void>; 
  handleFileDelete: (questionId: string, fileId: string) => Promise<void>;
  
  // Acciones principales
  handleSave: () => void;
  handlePreview: () => void;
  
  // Validación
  validationErrors: ValidationErrors | null;
  validateForm: () => boolean; 
  
  // Funciones de Modal de Confirmación
  confirmAndSave: () => void;
  cancelSave: () => void;

  // Estado de carga de archivos (viene del hook)
  isUploading: boolean;
  uploadProgress: number;
  currentFileIndex: number;
  totalFiles: number;
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

// Definición local de preguntas predeterminadas
const DEFAULT_QUESTIONS: Question[] = [
  {
    id: '3.1',
    type: 'short_text' as QuestionType,
    title: '',
    required: false,
    showConditionally: false,
    deviceFrame: false
  },
  {
    id: '3.2',
    type: 'long_text' as QuestionType,
    title: '',
    required: false,
    showConditionally: false,
    deviceFrame: false
  },
  {
    id: '3.3',
    type: 'single_choice' as QuestionType,
    title: '',
    required: false,
    showConditionally: false,
    choices: [
      { id: '1', text: '', isQualify: false, isDisqualify: false },
      { id: '2', text: '', isQualify: false, isDisqualify: false },
      { id: '3', text: '', isQualify: false, isDisqualify: false }
    ],
    deviceFrame: false
  },
  {
    id: '3.4',
    type: 'multiple_choice' as QuestionType,
    title: '',
    required: false,
    showConditionally: false,
    choices: [
      { id: '1', text: '', isQualify: false, isDisqualify: false },
      { id: '2', text: '', isQualify: false, isDisqualify: false },
      { id: '3', text: '', isQualify: false, isDisqualify: false }
    ],
    deviceFrame: false
  },
  {
    id: '3.5',
    type: 'linear_scale' as QuestionType,
    title: '',
    required: false,
    showConditionally: false,
    scaleConfig: {
      startValue: 1,
      endValue: 5,
      startLabel: '',
      endLabel: ''
    },
    deviceFrame: false
  },
  {
    id: '3.6',
    type: 'ranking' as QuestionType,
    title: '',
    required: false,
    showConditionally: false,
    choices: [
      { id: '1', text: '', isQualify: false, isDisqualify: false },
      { id: '2', text: '', isQualify: false, isDisqualify: false },
      { id: '3', text: '', isQualify: false, isDisqualify: false }
    ],
    deviceFrame: false
  },
  {
    id: '3.7',
    type: 'navigation_flow' as QuestionType,
    title: '',
    required: false,
    showConditionally: false,
    files: [],
    deviceFrame: true
  },
  {
    id: '3.8',
    type: 'preference_test' as QuestionType,
    title: '',
    required: false,
    showConditionally: false,
    files: [],
    deviceFrame: true
  }
];

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
    handleRandomizeChange,
    initializeDefaultQuestionsIfNeeded
  } = useCognitiveTaskState({ defaultQuestions: DEFAULT_QUESTIONS });

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
      handleFileDelete, 
      loadFilesFromLocalStorage
  } = useCognitiveTaskFileUpload({ researchId, formData, setFormData });

  // Consulta para obtener datos existentes (usando la nueva API)
  const { data: cognitiveTaskData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId],
    queryFn: async () => {
      try {
        if (!isAuthenticated || !token || !researchId) {
          // Devolver null o un objeto que indique error/no encontrado
          return null; 
        }
        console.log(`[useCognitiveTaskForm] Buscando config existente (fixed API): ${researchId}`);
        // Usar el método de la nueva API
        const response = await cognitiveTaskFixedAPI.getByResearchId(researchId);
        console.log('[useCognitiveTaskForm] Respuesta de API (fixed): ', response);
        // Devolver directamente la respuesta (puede ser null si es 404)
        return response; 
      } catch (error: any) {
        console.error('[useCognitiveTaskForm] Error al obtener datos (fixed API):', error);
        // Manejar errores específicos de ApiError si es necesario
        if (error instanceof ApiError && error.statusCode === 404) {
            return null; // Tratar 404 como "no encontrado"
        }
        // Lanzar otros errores para que React Query los maneje
        throw error; 
      }
    },
    enabled: !!researchId && isAuthenticated,
    retry: false, // Ajustar reintentos si es necesario
    staleTime: 60000, 
    refetchOnWindowFocus: false
  });

  // <<< Definir mutate e isPending (isMutating) aquí >>>
  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: async (dataToSave: CognitiveTaskFormData): Promise<CognitiveTaskFormData> => {
      console.warn("[MUTATE PLACEHOLDER] Simulating save for:", dataToSave);
      await new Promise(res => setTimeout(res, 750)); 
      
      let resultData: CognitiveTaskFormData;
      const finalData = { ...dataToSave, researchId: researchId || dataToSave.researchId }; // Asegurar researchId

      if (!cognitiveTaskId) { 
        const newId = uuidv4();
        console.log(`[MUTATE PLACEHOLDER] Simulating CREATE, new ID: ${newId}`);
        resultData = { ...finalData, id: newId };
      } else {
        console.log(`[MUTATE PLACEHOLDER] Simulating UPDATE for ID: ${cognitiveTaskId}`);
        resultData = { ...finalData, id: cognitiveTaskId }; 
      }
      return resultData; 
    },
    onSuccess: (data) => {
      console.log('[useCognitiveTaskForm] Datos guardados (simulado):', data);
      if (data && data.id) {
        setCognitiveTaskId(data.id);
      }
      if (researchId) {
        localStorage.removeItem(`cognitive_task_temp_files_${researchId}`);
        console.log('[useCognitiveTaskForm] Limpiando archivos temporales');
      }
      modals.closeConfirmModal(); 
      modals.closeJsonModal();
      if (typeof onSave === 'function') { onSave(data); }
      toast.success('Formulario guardado (simulado)');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId] }); 
    },
    onError: (error: any) => {
      console.error('[useCognitiveTaskForm] Error en mutación (simulado):', error);
      modals.closeConfirmModal(); 
      modals.showModal({ title: 'Error de Guardado (Simulado)', message: error.message || 'Error desconocido', type: 'error' });
    }
  });

  // Efecto para cargar datos existentes (ajustado para usar setFormData y el inicializador)
  useEffect(() => {
    if (isLoading) return; 

    let loadedData: Partial<CognitiveTaskFormData> = {};

    if (!cognitiveTaskData) {
      console.log('[useCognitiveTaskForm] No hay datos o hubo error (fixed API). Usando defaults.');
      loadedData = {
        researchId: researchId || '',
        questions: initializeDefaultQuestionsIfNeeded([]), // Usar inicializador con array vacío
        randomizeQuestions: false // <<< Corregido: Usar un valor default, no derivado de DEFAULT_QUESTIONS
      };
      setCognitiveTaskId(null);
    } else {
      console.log('[useCognitiveTaskForm] Datos recibidos del backend (fixed API):', cognitiveTaskData);
      const existingData = cognitiveTaskData as CognitiveTaskFormData;
      const taskId = existingData.id;
      setCognitiveTaskId(taskId || null);

      // Usar el inicializador para fusionar datos del backend con los defaults
      const mergedQuestions = initializeDefaultQuestionsIfNeeded(existingData.questions || []);
      
      loadedData = {
          ...existingData,
          researchId: researchId || existingData.researchId, // Asegurar researchId
          questions: mergedQuestions,
          randomizeQuestions: existingData.randomizeQuestions ?? false // <<< Corregido: Usar valor existente o default
      };
    }

    // Establecer el estado inicial usando setFormData del hook de estado
    setFormData(prev => ({ 
        ...prev, // Mantener cualquier estado previo si fuera necesario (poco probable aquí)
        ...loadedData 
    }));

    // Cargar archivos de localStorage DESPUÉS de establecer el estado inicial
    if(researchId) { // Siempre intentar cargar si hay researchId
        loadFilesFromLocalStorage();
    }
    
  }, [cognitiveTaskData, researchId, isLoading, setFormData, initializeDefaultQuestionsIfNeeded, loadFilesFromLocalStorage]);

  // Wrapper para validación
  const validateCurrentForm = useCallback(() => {
      return runValidation(formData, researchId);
  }, [formData, researchId, runValidation]);

  // --- Lógica de Acciones Principales (sin cambios grandes) ---
  const continueWithAction = () => { /* ... */ };
  const handlePreview = useCallback(() => {
    toast.success(SUCCESS_MESSAGES_EXTENDED.PREVIEW_COMING_SOON); 
  }, []);
  const handleSave = () => {
    if (validateCurrentForm()) {
        // Solo abrir modal si la validación pasa
        modals.showConfirmModalAction();
    } else {
        // Opcional: Mostrar un toast general si falla la validación
        toast.error('Por favor, corrija los errores en el formulario.');
    }
  };
  const confirmAndSave = useCallback(() => {
      if (!formData) return; // Seguridad
      // Pasar una copia profunda para evitar mutaciones inesperadas si mutate tarda
      const dataToSave = JSON.parse(JSON.stringify(formData));
      // Limpiar archivos temporales antes de guardar
      dataToSave.questions = dataToSave.questions.map((q: Question) => ({
          ...q,
          files: q.files?.map((f: ExtendedUploadedFile) => ({
              id: f.id,
              name: f.name,
              size: f.size,
              type: f.type,
              s3Key: f.s3Key, // Solo guardar lo necesario
          })) || []
      }));
      console.log("[ConfirmAndSave] Datos listos para mutación:", dataToSave);
      mutate(dataToSave); // Llamar a la mutación
  }, [formData, mutate]);
  const cancelSave = useCallback(() => {
    modals.closeConfirmModal();
  }, [modals]);

  // --- Retorno del Hook Principal --- 
  console.log('[useCognitiveTaskForm] Estado FINAL formData (desde hook estado):', 
    JSON.stringify(formData?.questions?.map(q => ({ id: q.id, type: q.type, title: q.title?.substring(0, 20) })) || [], null, 2)
  );

  return {
    formData, 
    cognitiveTaskId, 
    isLoading, 
    isSaving,
    questionTypes: QUESTION_TYPES,
    // Handlers de estado
    handleQuestionChange,
    handleAddChoice,
    handleRemoveChoice,
    handleRandomizeChange,
    // Handlers de archivos (del hook)
    handleFileUpload, 
    handleMultipleFilesUpload, 
    handleFileDelete, 
    // Acciones principales
    handleSave, 
    handlePreview, 
    // Validación (del hook)
    validationErrors, 
    validateForm: validateCurrentForm,
    // Modal de confirmación
    confirmAndSave,
    cancelSave,
    // Estado de carga (del hook)
    isUploading, 
    uploadProgress, 
    currentFileIndex, 
    totalFiles,
  };
};