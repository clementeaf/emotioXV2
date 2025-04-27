import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  UploadedFile
} from 'shared/interfaces/cognitive-task.interface';
import { 
  QUERY_KEYS, 
  SUCCESS_MESSAGES
} from '../constants';
import { Question, ValidationErrors, FileInfo } from '../types';
import { useAuth } from '@/providers/AuthProvider';
import { cognitiveTaskFixedAPI } from '@/lib/cognitive-task-api';
import { ApiError } from '@/config/api-client';
import { useCognitiveTaskModals } from './useCognitiveTaskModals';
import type { ErrorModalData } from '../types';
import { useCognitiveTaskValidation } from './useCognitiveTaskValidation';
import { useCognitiveTaskFileUpload } from './useCognitiveTaskFileUpload';
import { useCognitiveTaskState } from './useCognitiveTaskState';
import { toast } from 'react-hot-toast';

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
  
  // <<< Añadir propiedades faltantes para los modales >>>
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  closeModal: () => void;
  showJsonPreview: boolean;
  closeJsonModal: () => void;
  jsonToSend: string;
  pendingAction: 'save' | 'preview' | null;
  continueWithAction: () => void; // Asegurarse que esta función existe y se devuelve
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

// Helper para limpieza profunda de archivos pendientes de eliminación
const cleanupPendingDeleteFiles = (questions: Question[]): Question[] => {
  return questions.map(q => {
    if (!q.files) return q;
    // Filtrar archivos que NO están pendientes de eliminar
    const keptFiles = q.files.filter(f => f.status !== 'pending-delete');
    return { ...q, files: keptFiles };
  });
};

// Helper para revertir archivos pendientes de eliminación
const revertPendingDeleteFiles = (questions: Question[]): Question[] => {
  return questions.map(q => {
    if (!q.files) return q;
    const revertedFiles = q.files.map(f => {
      if (f.status === 'pending-delete') {
        const { status, ...restOfFile } = f; // Quitar status
        // Si tenía s3Key, restaurar status a 'uploaded'
        if (f.s3Key) {
          return { ...restOfFile, status: 'uploaded' as const }; // Volver a uploaded
        }
        // Si no tenía s3Key (era temporal), simplemente devolver sin status
        return restOfFile; 
      }
      return f;
    });
    return { ...q, files: revertedFiles as FileInfo[] }; // Asegurar tipo final del array
  });
};

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
      handleFileDelete: originalHandleFileDelete,
      loadFilesFromLocalStorage
  } = useCognitiveTaskFileUpload({ researchId, formData, setFormData });

  // Consulta para obtener datos existentes (usando la nueva API)
  const { data: cognitiveTaskData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId],
    queryFn: async () => {
      try {
        if (!isAuthenticated || !token || !researchId) {
          return null; 
        }
        console.log(`[useCognitiveTaskForm] Buscando config existente (fixed API): ${researchId}`);
        const response = await cognitiveTaskFixedAPI.getByResearchId(researchId);
        console.log('[useCognitiveTaskForm] Respuesta de API (fixed): ', response);
        return response; 
      } catch (error: any) {
        console.error('[useCognitiveTaskForm] Error al obtener datos (fixed API):', error);
        if (error instanceof ApiError && error.statusCode === 404) {
            console.log('[useCognitiveTaskForm] Configuración no encontrada (404), tratando como null.');
            return null; // Tratar 404 como "no encontrado"
        }
        console.error('[useCognitiveTaskForm] Error no manejado en queryFn, devolviendo null.', error);
        return null; // Indicar a React Query que la consulta falló pero no relanzar
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
      if (!researchId) throw new Error(VALIDATION_ERROR_MESSAGES.RESEARCH_ID_REQUIRED);
      
      // --- Inicio: Filtrar archivos pending-delete antes de enviar --- 
      const questionsForPayload = dataToSave.questions.map(q => {
        if (!q.files) return q;
        // Filtrar solo los archivos que NO están pendientes de eliminar
        const keptFiles = q.files.filter(f => f.status !== 'pending-delete');
        // Limpiar el estado interno `status` antes de enviar al backend
        const cleanedFiles = keptFiles.map(({ status, isLoading, progress, error, questionId, ...rest }) => rest);
        return { ...q, files: cleanedFiles }; 
      });
      // --- Fin: Filtrar archivos --- 

      // Construir payload final
      const payload = {
        ...dataToSave,
        questions: questionsForPayload, // Usar preguntas filtradas
        researchId: researchId, // Asegurar que researchId va en el payload
      };
      
      // Limpiar metadata interna si existe antes de enviar
      if (payload.metadata) {
          delete payload.metadata.version;
          // delete payload.metadata.lastModifiedBy; // Podría ser útil mantenerlo
      }

      console.log("[DIAGNOSTICO-IMAGEN:FORM:MUTATE] Payload a enviar:", JSON.stringify(payload, null, 2));

      if (cognitiveTaskId) {
        console.log(`[useCognitiveTaskForm] Llamando a update para researchId: ${researchId}, taskId: ${cognitiveTaskId}`);
        // Pasar researchId, taskId y el payload completo (que incluye researchId)
        return await cognitiveTaskFixedAPI.update(researchId, cognitiveTaskId, payload);
      } else {
        console.log(`[useCognitiveTaskForm] Llamando a create para researchId: ${researchId}`);
        // Pasar researchId y el payload completo (que incluye researchId)
        return await cognitiveTaskFixedAPI.create(researchId, payload);
      }
    },
    onSuccess: (data) => {
      console.log('[useCognitiveTaskForm] Datos guardados (REAL):', data);
      // <<< Guardar el ID antes de usarlo para el mensaje de toast >>>
      const wasUpdating = !!cognitiveTaskId; 
      if (data && data.id) {
        setCognitiveTaskId(data.id); // Actualizar ID si se creó uno nuevo
      }
      if (researchId) {
        localStorage.removeItem(`cognitive_task_temp_files_${researchId}`);
        console.log('[useCognitiveTaskForm] Limpiando archivos temporales');
      }
      modals.closeConfirmModal(); 
      modals.closeJsonModal();
      if (typeof onSave === 'function') { onSave(data); }
      // Usar mensaje de éxito específico y los nombres correctos de las constantes
      // <<< Usar wasUpdating para determinar el mensaje correcto >>>
      toast.success(wasUpdating ? SUCCESS_MESSAGES.UPDATED : SUCCESS_MESSAGES.CREATED);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId] }); 
      
      // --- Inicio: Limpiar archivos pending-delete del estado local --- 
      setFormData(prevData => ({
        ...prevData,
        questions: cleanupPendingDeleteFiles(prevData.questions)
      }));
      // --- Fin: Limpiar archivos --- 
    },
    onError: (error: any) => {
      console.error('[useCognitiveTaskForm] Error en mutación (REAL):', error);
      modals.closeConfirmModal(); 
      // Usar ApiError si está disponible
      const errorMessage = error instanceof ApiError ? error.message : (error.message || 'Error desconocido al guardar');
      modals.showModal({ title: 'Error de Guardado', message: errorMessage, type: 'error' });
      
      // --- Inicio: Revertir estado pending-delete en error --- 
      setFormData(prevData => ({
        ...prevData,
        questions: revertPendingDeleteFiles(prevData.questions)
      }));
      // --- Fin: Revertir estado --- 
    }
  });

  // Efecto para cargar datos existentes y fusionar centralizadamente
  useEffect(() => {
    if (isLoading) return; 

    // Llamar a loadFilesFromLocalStorage para obtener datos guardados
    const filesFromLocalStorage = loadFilesFromLocalStorage();
    console.log('[useEffect Form Data] Archivos cargados de localStorage:', filesFromLocalStorage);

    // Usar la forma funcional de setFormData para asegurar consistencia 
    // aunque en este enfoque centralizado, el `prev` es menos crítico.
    setFormData(prev => { // `prev` aquí representa el estado inicial o el anterior a la carga completa
      let finalQuestions: Question[];
      let finalRandomize = false;
      let finalDataFromBackend: Partial<CognitiveTaskFormData> = {};

      if (!cognitiveTaskData) {
        console.log('[useEffect Form Data] No hay datos backend. Usando defaults y localStorage.');
        // Empezar con las preguntas default
        finalQuestions = initializeDefaultQuestionsIfNeeded([]); 
        finalRandomize = false; 
        setCognitiveTaskId(null); 
      } else {
        console.log('[useEffect Form Data] Hay datos backend. Fusionando con defaults y localStorage.');
        const existingData = cognitiveTaskData as CognitiveTaskFormData;
        finalDataFromBackend = existingData; // Guardar datos del backend
        finalRandomize = existingData.randomizeQuestions ?? false;
        setCognitiveTaskId(existingData.id || null);
        // Fusionar estructura de preguntas default con datos del backend (sin archivos aún)
        finalQuestions = initializeDefaultQuestionsIfNeeded(existingData.questions || []);
      }

      // <<< FUSION FINAL DE ARCHIVOS >>>
      // Iterar sobre las preguntas finales (ya fusionadas con backend si aplica)
      finalQuestions = finalQuestions.map(question => {
        const backendFiles = (finalDataFromBackend.questions?.find(q => q.id === question.id)?.files || []) as ExtendedUploadedFile[];
        const localStorageFiles = filesFromLocalStorage ? (filesFromLocalStorage[question.id] || []) : [];
        
        // Combinar y eliminar duplicados por ID
        const allFilesMap = new Map<string, ExtendedUploadedFile>();
        
        // Prioridad a archivos del backend (más recientes/autoritativos)
        backendFiles.forEach(file => allFilesMap.set(file.id, file));
        
        // Añadir archivos de localStorage solo si no existen ya (por ID)
        localStorageFiles.forEach(file => {
          if (!allFilesMap.has(file.id)) {
            allFilesMap.set(file.id, file);
          }
        });

        // Devolver la pregunta con la lista de archivos única
        return {
          ...question,
          files: Array.from(allFilesMap.values())
        };
      });
      
      // Construir el estado final a devolver
      const finalState: CognitiveTaskFormData = {
        ...(prev || {}), // Usar prev como base MUY inicial si es necesario
        ...finalDataFromBackend, // Sobrescribir con datos del backend (ID, metadata, etc.)
        researchId: researchId || finalDataFromBackend.researchId || '', // Asegurar researchId
        questions: finalQuestions, // Usar las preguntas con archivos correctamente fusionados
        randomizeQuestions: finalRandomize,
      };

      console.log('[useEffect Form Data] Estado FINAL a devolver:', JSON.stringify(finalState.questions.find(q=>q.id==='3.8')?.files?.map(f=>f.id), null, 2));
      return finalState;
    });
    
  // Dependencias: Ejecutar cuando cambie la carga, los datos del backend, el researchId 
  // o las funciones de los hooks hijos que usamos.
  }, [cognitiveTaskData, researchId, isLoading, setFormData, initializeDefaultQuestionsIfNeeded, loadFilesFromLocalStorage]);

  // Wrapper para validación
  const validateCurrentForm = useCallback(() => {
      return runValidation(formData, researchId);
  }, [formData, researchId, runValidation]);

  // --- Lógica de Acciones Principales (sin cambios grandes) ---
  const continueWithAction = () => { /* ... */ };
  
  // <<< Implementar handlePreview >>>
  const handlePreview = useCallback(() => {
    if (validateCurrentForm()) {
        // Formatear formData para mostrarlo
        // Usar una copia profunda y limpiar archivos si es necesario para el preview
        const previewData = JSON.parse(JSON.stringify(formData));
        // Opcional: Limpiar/simplificar datos para la vista previa si es necesario
        // previewData.questions = previewData.questions.map((q: Question) => ({ ... }));

        const jsonData = JSON.stringify(previewData, null, 2); // Indentado para legibilidad
        modals.showJsonModal(jsonData, 'preview');
    } else {
        // Mostrar un toast o modal si falla la validación
        toast.error('Por favor, corrija los errores en el formulario antes de previsualizar.');
        // Opcionalmente, usar el modal general:
        // modals.showModal({ 
        //     title: 'Formulario Inválido', 
        //     message: 'Por favor, corrija los errores antes de previsualizar.', 
        //     type: 'warning' 
        // });
    }
  }, [formData, validateCurrentForm, modals]);

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
    handleFileDelete: originalHandleFileDelete,
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
    // <<< Añadir propiedades faltantes para los modales >>>
    modalError: null,
    modalVisible: false,
    closeModal: () => {},
    showJsonPreview: false,
    closeJsonModal: () => {},
    jsonToSend: '',
    pendingAction: null,
    continueWithAction,
  };
};