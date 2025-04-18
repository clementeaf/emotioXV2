import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { 
  Question,
  UploadedFile,
  QUESTION_TEMPLATES
} from 'shared/interfaces/cognitive-task.interface';
import { 
  QUERY_KEYS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES
} from '../constants';
import { useAuth } from '@/providers/AuthProvider';
import { s3Service } from '@/services';
import { cognitiveTaskFixedAPI } from '@/lib/cognitive-task-api';

// Tipos que faltan o que provocan conflictos
type ValidationErrors = Record<string, string>;

// Definición de QuestionType para evitar conflictos de importación
type QuestionType = 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'linear_scale' | 'ranking' | 'navigation_flow' | 'preference_test';

// Definición local de ErrorModalData
interface ErrorModalData {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
}

// Definir CognitiveTaskFormData localmente
interface CognitiveTaskFormData {
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

// DEFAULT_COGNITIVE_TASK local
const DEFAULT_COGNITIVE_TASK: CognitiveTaskFormData = {
  researchId: '',
  questions: [],
  randomizeQuestions: false
};

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

// Interfaz para el resultado del hook
interface UseCognitiveTaskFormResult {
  formData: CognitiveTaskFormData;
  cognitiveTaskId: string | null;
  validationErrors: ValidationErrors | null;
  isLoading: boolean;
  isSaving: boolean;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  isAddQuestionModalOpen: boolean;
  isUploading: boolean;
  uploadProgress: number;
  currentFileIndex: number;
  totalFiles: number;
  questionTypes: { id: QuestionType; label: string; description: string }[];
  
  // Métodos de gestión
  handleQuestionChange: (questionId: string, updates: Partial<Question>) => void;
  handleAddChoice: (questionId: string) => void;
  handleRemoveChoice: (questionId: string, choiceId: string) => void;
  handleFileUpload: (questionId: string, files: FileList) => void;
  handleMultipleFilesUpload: (questionId: string, files: FileList) => void;
  handleFileDelete: (questionId: string, fileId: string) => void;
  handleAddQuestion: (type: QuestionType) => void;
  handleRandomizeChange: (checked: boolean) => void;
  openAddQuestionModal: () => void;
  closeAddQuestionModal: () => void;
  
  // Métodos de acción
  handleSave: () => void;
  handlePreview: () => void;
  validateForm: () => boolean;
  closeModal: () => void;
  initializeDefaultQuestions: (defaultQuestions: Question[]) => void;
  
  // Propiedades del modal JSON
  showJsonPreview: boolean;
  closeJsonModal: () => void;
  jsonToSend: string;
  pendingAction: 'save' | 'preview' | null;
  continueWithAction: () => void;
  
  // Propiedades para el modal de confirmación
  showConfirmModal: boolean;
  confirmAndSave: () => void;
  cancelSave: () => void;
  dataToSaveInConfirm: CognitiveTaskFormData | null;
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

// Definición local de preguntas predeterminadas según las imágenes Figma
const DEFAULT_QUESTIONS: Question[] = [
  {
    id: '3.1',
    type: 'short_text' as QuestionType,
    title: '¿Cuál es tu primera impresión sobre la navegación del sitio?',
    required: true,
    showConditionally: false,
    deviceFrame: false
  },
  {
    id: '3.2',
    type: 'long_text' as QuestionType,
    title: 'Describe detalladamente tu experiencia al intentar completar la tarea asignada.',
    required: true,
    showConditionally: false,
    deviceFrame: false
  },
  {
    id: '3.3',
    type: 'single_choice' as QuestionType,
    title: '¿Qué aspecto de la interfaz te pareció más intuitivo?',
    required: true,
    showConditionally: false,
    choices: [
      { id: '1', text: 'La navegación principal', isQualify: false, isDisqualify: false },
      { id: '2', text: 'Los botones de acción', isQualify: false, isDisqualify: false },
      { id: '3', text: 'El formulario de búsqueda', isQualify: false, isDisqualify: false },
      { id: '4', text: 'Las notificaciones', isQualify: false, isDisqualify: false }
    ],
    deviceFrame: false
  },
  {
    id: '3.4',
    type: 'multiple_choice' as QuestionType,
    title: 'Selecciona todos los elementos con los que interactuaste durante la prueba:',
    required: true,
    showConditionally: false,
    choices: [
      { id: '1', text: 'Menú principal', isQualify: false, isDisqualify: false },
      { id: '2', text: 'Filtros de búsqueda', isQualify: false, isDisqualify: false },
      { id: '3', text: 'Carrito de compras', isQualify: false, isDisqualify: false },
      { id: '4', text: 'Sección de comentarios', isQualify: false, isDisqualify: false }
    ],
    deviceFrame: false
  },
  {
    id: '3.5',
    type: 'linear_scale' as QuestionType,
    title: '¿Qué tan fácil fue encontrar la información que buscabas?',
    required: true,
    showConditionally: false,
    scaleConfig: {
      startValue: 1,
      endValue: 5,
      startLabel: 'Muy difícil',
      endLabel: 'Muy fácil'
    },
    deviceFrame: false
  },
  {
    id: '3.6',
    type: 'ranking' as QuestionType,
    title: 'Ordena las siguientes características según su importancia para ti:',
    required: true,
    showConditionally: false,
    choices: [
      { id: '1', text: 'Velocidad de carga', isQualify: false, isDisqualify: false },
      { id: '2', text: 'Diseño visual', isQualify: false, isDisqualify: false },
      { id: '3', text: 'Facilidad de uso', isQualify: false, isDisqualify: false },
      { id: '4', text: 'Claridad de la información', isQualify: false, isDisqualify: false }
    ],
    deviceFrame: false
  },
  {
    id: '3.7',
    type: 'navigation_flow' as QuestionType,
    title: 'Observa la siguiente imagen del flujo de navegación y describe cualquier problema que encuentres:',
    required: false, // No requerido para permitir guardar sin archivos
    showConditionally: false,
    files: [],
    deviceFrame: true
  },
  {
    id: '3.8',
    type: 'preference_test' as QuestionType,
    title: '¿Cuál de estos dos diseños prefieres y por qué?',
    required: false, // No requerido para permitir guardar sin archivos
    showConditionally: false,
    files: [],
    deviceFrame: true
  }
];

/**
 * Hook personalizado para gestionar la lógica del formulario de tareas cognitivas
 */
export const useCognitiveTaskForm = (
  researchId?: string, 
  onSave?: (data: any) => void
): UseCognitiveTaskFormResult => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CognitiveTaskFormData>(DEFAULT_COGNITIVE_TASK);
  const [cognitiveTaskId, setCognitiveTaskId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors | null>(null);
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState<boolean>(false);
  const { user, token } = useAuth();
  const isAuthenticated = !!user && !!token;
  
  // Estados para la gestión de archivos y carga
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [totalFiles, setTotalFiles] = useState<number>(0);

  // Estados para el JSON modal
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);
  const [jsonToSend, setJsonToSend] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'save' | 'preview' | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Referencias para cacheo de archivos
  const tempFilesRef = useRef<Record<string, Record<string, ExtendedUploadedFile>>>({});

  // Define variables for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [dataToSaveInConfirm, setDataToSaveInConfirm] = useState<CognitiveTaskFormData | null>(null);

  // Handlers para el modal
  const closeModal = useCallback(() => setModalVisible(false), []);
  const showModal = useCallback((errorData: ErrorModalData) => {
    setModalError(errorData);
    setModalVisible(true);
  }, []);

  // Handlers para el modal de agregar pregunta
  const openAddQuestionModal = useCallback(() => setIsAddQuestionModalOpen(true), []);
  const closeAddQuestionModal = useCallback(() => setIsAddQuestionModalOpen(false), []);

  // Consulta para obtener datos existentes
  const { data: cognitiveTaskData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId],
    queryFn: async () => {
      try {
        if (!isAuthenticated || !token || !researchId) {
          return { data: null, error: true, message: 'No autenticado o falta ID de investigación' };
        }

        console.log(`[useCognitiveTaskForm] Buscando configuración existente para investigación: ${researchId}`);
        // Usar el servicio real de API en lugar del mock
        const response = await cognitiveTaskFixedAPI.getByResearchId(researchId).send();
        console.log('[useCognitiveTaskForm] Respuesta de API:', response);
        return { data: response };
      } catch (error: any) {
        console.error('[useCognitiveTaskForm] Error al obtener datos:', error);
        
        // Si es error 404, es normal (no hay configuración previa)
        if (error?.statusCode === 404 || error?.message?.includes('404')) {
          console.log('[useCognitiveTaskForm] No se encontró configuración existente - esto es normal para una nueva investigación');
          return { data: null, notFound: true };
        }
        
        return { data: null, error: true, message: ERROR_MESSAGES.FETCH_ERROR };
      }
    },
    enabled: !!researchId && isAuthenticated,
    retry: false,
    staleTime: 60000, // 1 minuto
    refetchOnWindowFocus: false
  });

  // Mejorar la función saveFilesToLocalStorage para almacenar todos los datos necesarios
  const saveFilesToLocalStorage = useCallback((questions: Question[]) => {
    if (!researchId) return;
    
    try {
      // Generar un objeto con archivos organizados por pregunta
      const filesMap: Record<string, ExtendedUploadedFile[]> = {};
      
      questions.forEach(question => {
        if (question.files && question.files.length > 0) {
          // Solo guardar archivos que han sido completamente cargados y tienen s3Key
          const validFiles = question.files
            .filter(file => 
              file && 
              file.s3Key && 
              typeof file.s3Key === 'string' && 
              file.s3Key.trim() !== '' && 
              !file.url.startsWith('blob:')
            )
            .map(file => ({
              ...file,
              isLoading: false, // Asegurar que se almacena como completamente cargado
              progress: 100     // Asegurar que el progreso está completo
            }));
          
          if (validFiles.length > 0) {
            filesMap[question.id] = validFiles;
          }
        }
      });
      
      // Almacenar en localStorage solo si hay archivos válidos
      if (Object.keys(filesMap).length > 0) {
        const storageKey = `cognitive_task_temp_files_${researchId}`;
        localStorage.setItem(storageKey, JSON.stringify(filesMap));
        
        console.log('[useCognitiveTaskForm] Archivos guardados temporalmente en localStorage:', filesMap);
      }
    } catch (error) {
      console.error('[useCognitiveTaskForm] Error al guardar archivos en localStorage:', error);
    }
  }, [researchId]);

  // Crear una función específica para cargar archivos de localStorage - es más explícito
  const loadFilesFromLocalStorage = useCallback(() => {
    if (!researchId) return;
    
    try {
      // Recuperar archivos guardados temporalmente
      const storageKey = `cognitive_task_temp_files_${researchId}`;
      const savedFilesJson = localStorage.getItem(storageKey);
      
      if (!savedFilesJson) {
        console.log('[useCognitiveTaskForm] No hay archivos temporales guardados en localStorage para este researchId');
        return;
      }
      
      const savedFiles = JSON.parse(savedFilesJson);
      console.log('[useCognitiveTaskForm] Recuperando archivos temporales de localStorage:', savedFiles);
      
      // Actualizar el estado con los archivos recuperados
      setFormData(prevData => {
        // Crear una copia para manipular
        const updatedQuestions = [...prevData.questions];
        
        // Procesar cada pregunta
        for (let i = 0; i < updatedQuestions.length; i++) {
          const question = updatedQuestions[i];
          const questionFiles = savedFiles[question.id];
          
          if (questionFiles && questionFiles.length > 0) {
            console.log(`[useCognitiveTaskForm] Encontrados ${questionFiles.length} archivos guardados para pregunta ${question.id}`);
            
            // Si es una prueba de preferencia, limitamos a exactamente 2 archivos válidos como máximo
            if (question.type === 'preference_test') {
              const validSavedFiles = questionFiles
                .filter((f: any) => f && f.s3Key && typeof f.s3Key === 'string' && f.s3Key.trim() !== '')
                .slice(0, 2); // Solo tomamos los primeros 2 archivos válidos
                
              if (validSavedFiles.length > 0) {
                // Para preference_test, reemplazamos completamente los archivos en lugar de añadir
                updatedQuestions[i] = {
                  ...question,
                  files: validSavedFiles.map((file: any) => ({
                    ...file,
                    isLoading: false,
                    progress: 100,
                    error: false
                  }))
                };
                
                console.log(`[useCognitiveTaskForm] Reemplazados archivos para prueba de preferencia. Ahora tiene ${validSavedFiles.length} archivos válidos.`);
              }
            } else {
              // Para otros tipos, filtrar archivos duplicados
              const existingFileIds = new Set(question.files?.map((f: ExtendedUploadedFile) => f.id) || []);
              const newFiles = questionFiles
                .filter((f: any) => !existingFileIds.has(f.id) && f.s3Key && typeof f.s3Key === 'string');
              
              if (newFiles.length > 0) {
                console.log(`[useCognitiveTaskForm] Añadiendo ${newFiles.length} nuevos archivos a pregunta ${question.id}`);
                
                // Asegurar que los archivos tienen las propiedades correctas
                const processedNewFiles = newFiles.map((file: any) => ({
                  ...file,
                  isLoading: false,
                  progress: 100,
                  error: false
                }));
                
                // Actualizar pregunta con los archivos
                updatedQuestions[i] = {
                  ...question,
                  files: [...(question.files || []), ...processedNewFiles]
                };
              }
            }
          }
        }
        
        return {
          ...prevData,
          questions: updatedQuestions
        };
      });
      
    } catch (error) {
      console.error('[useCognitiveTaskForm] Error al recuperar archivos de localStorage:', error);
    }
  }, [researchId]);

  // Modificar el useEffect que carga archivos para usar la nueva función
  useEffect(() => {
    // Solo cargar si estamos en un formulario existente con un researchId
    if (researchId) {
      // Usar la función dedicada para cargar archivos
      loadFilesFromLocalStorage();
    }
  }, [researchId, loadFilesFromLocalStorage]); // Dependencia en loadFilesFromLocalStorage

  // Mutación para guardar datos
  const { mutate, isPending: isMutating } = useMutation({
    mutationFn: async (data: CognitiveTaskFormData) => {
      if (!isAuthenticated) {
        throw new Error('No autenticado: Se requiere un token de autenticación');
      }

      if (!researchId) {
        throw new Error('ID de investigación no proporcionado');
      }

      try {
        console.log('[useCognitiveTaskForm] Guardando datos:', data);
        
        // Usar explícitamente la nueva API
        const result = await cognitiveTaskFixedAPI.createOrUpdateByResearchId(
          researchId,
          data
        ).send();
        
        // Verificar si hay un error en la respuesta
        if (result.error) {
          console.error('[useCognitiveTaskForm] Error en respuesta API:', result);
          throw new Error(result.message || 'Error al guardar la tarea cognitiva');
        }
        
        return result;
      } catch (error: any) {
        console.error('[useCognitiveTaskForm] Error al guardar:', error);
        // Formatear el error para mejor información
        const errorMessage = error.message || 'Error desconocido al guardar';
        const errorDetails = error.data ? JSON.stringify(error.data) : '';
        throw new Error(`${errorMessage}${errorDetails ? ` - Detalles: ${errorDetails}` : ''}`);
      }
    },
    onSuccess: (data) => {
      console.log('[useCognitiveTaskForm] Datos guardados con éxito:', data);
      
      if (data && data.id) {
        setCognitiveTaskId(data.id);
      }
      
      // Limpiar localStorage después de guardar exitosamente
      if (researchId) {
        const storageKey = `cognitive_task_temp_files_${researchId}`;
        localStorage.removeItem(storageKey);
        console.log('[useCognitiveTaskForm] Limpiando archivos temporales después de guardar exitoso');
      }
      
      // Invalidar la consulta para recargar datos
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId] });
      
      // Cerrar el modal JSON si está abierto
      closeJsonModal();
      
      // Ejecutar callback si existe
      if (typeof onSave === 'function') {
        onSave(data);
      }
    },
    onError: (error: any) => {
      console.error('[useCognitiveTaskForm] Error en mutación:', error);
      
      let errorMsg = 'Error al guardar la tarea cognitiva';
      if (error.message) {
        errorMsg += `: ${error.message}`;
      }
      
      // Mostrar mensaje de error
      showModal({
        title: 'Error de guardado',
        message: errorMsg,
        type: 'error'
      });
    }
  });

  // Efecto para cargar datos existentes cuando estén disponibles
  useEffect(() => {
    if (cognitiveTaskData && cognitiveTaskData.data) {
      const existingData = cognitiveTaskData.data;
      console.log('[useCognitiveTaskForm] Datos recibidos:', existingData);
      
      // Actualizar ID
      if (existingData.id) {
        setCognitiveTaskId(existingData.id);
        console.log('[useCognitiveTaskForm] ID de Cognitive Task encontrado:', existingData.id);
      }
      
      // Verificar si hay preguntas en los datos existentes
      if (existingData.questions && existingData.questions.length > 0) {
        // Actualizar formData con los valores existentes
        setFormData({
          ...DEFAULT_COGNITIVE_TASK,
          ...existingData,
          researchId: researchId || ''
        });
      } else {
        // Si no hay preguntas, usar las predeterminadas
        setFormData({
          ...DEFAULT_COGNITIVE_TASK,
          ...existingData,
          questions: [...DEFAULT_QUESTIONS],
          researchId: researchId || ''
        });
      }
    } else {
      console.log('[useCognitiveTaskForm] No hay datos existentes, usando configuración por defecto');
      setFormData({
        ...DEFAULT_COGNITIVE_TASK,
        questions: [...DEFAULT_QUESTIONS],
        researchId: researchId || ''
      });
      setCognitiveTaskId(null);
    }
  }, [cognitiveTaskData, researchId]);

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

  // Función para manejar la carga de archivos
  const handleFileUpload = useCallback((questionId: string, files: FileList) => {
    console.log(`[useCognitiveTaskForm] Subiendo archivos para pregunta ${questionId}: ${files.length} archivos`);
    
    if (files.length === 0) return;
    
    // Crear un array de archivos para procesar
    const filesToUpload: File[] = Array.from(files);
    
    // Asegurarse de que estamos trabajando con la pregunta correcta
    setFormData(prevData => {
      // Encontrar la pregunta específica
      const updatedQuestions = [...prevData.questions];
      const questionIndex = updatedQuestions.findIndex(q => q.id === questionId);
      
      if (questionIndex === -1) {
        console.error(`[useCognitiveTaskForm] No se encontró la pregunta con ID ${questionId}`);
        return prevData;
      }
      
      const question = updatedQuestions[questionIndex];
      
      // Crear identificadores únicos para esta pregunta y archivos
      const uploadTimestamp = Date.now();
      const questionSpecificId = `${questionId}_${uploadTimestamp}`;
      
      // Crear archivos temporales con IDs específicos para esta pregunta
      const tempFiles = filesToUpload.map((file, index) => {
        // Generar un ID que sea único para esta pregunta
        const fileId = `${questionId}_file_${uploadTimestamp}_${index}`;
        
        return {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          s3Key: '',
          isLoading: true,
          progress: 0,
          // Guardar la referencia específica a la pregunta
          questionId: questionId
        };
      });
      
      // Para estas preguntas específicas, reemplazamos los archivos existentes
      if (questionId === '3.7' || questionId === '3.8') {
        // Reemplazar los archivos de esta pregunta específica
        updatedQuestions[questionIndex] = {
          ...question,
          files: tempFiles
        };
        
        console.log(`[useCognitiveTaskForm] Archivos actualizados para pregunta ${questionId}:`, 
          updatedQuestions[questionIndex].files);
      } else {
        // Para otros tipos de preguntas, añadir a los existentes
        updatedQuestions[questionIndex] = {
          ...question,
          files: [...(question.files || []), ...tempFiles]
        };
      }
      
      // Iniciar el proceso de carga
      setIsUploading(true);
      setUploadProgress(0);
      setCurrentFileIndex(0);
      setTotalFiles(tempFiles.length);
      
      // Procesar los archivos específicamente para esta pregunta
      setTimeout(() => {
        processFilesForQuestion(questionId, tempFiles);
      }, 0);
      
      return {
        ...prevData,
        questions: updatedQuestions
      };
    });
  }, []);
  
  // Nueva función para procesar archivos específicos de una pregunta
  const processFilesForQuestion = useCallback(async (questionId: string, tempFiles: ExtendedUploadedFile[]) => {
    console.log(`[useCognitiveTaskForm] Procesando ${tempFiles.length} archivos para la pregunta ${questionId}`);
    
    // Clonar los archivos para trabajar sobre ellos
    const filesToProcess = [...tempFiles];
    
    // Función para procesar un archivo individual
    const processFile = async (index: number) => {
      if (index >= filesToProcess.length) {
        // Hemos terminado de procesar todos los archivos
        setIsUploading(false);
        setUploadProgress(100);
        console.log(`[useCognitiveTaskForm] Procesamiento completado para la pregunta ${questionId}`);
        return;
      }
      
      setCurrentFileIndex(index);
      const currentFile = filesToProcess[index];
      
      try {
        // Simular progreso de carga (para UI)
        const updateProgress = (progress: number) => {
          setUploadProgress(progress);
          
          // Actualizar el progreso SOLO en la pregunta correcta
          setFormData(prevData => {
            const updatedQuestions = [...prevData.questions];
            const questionIndex = updatedQuestions.findIndex(q => q.id === questionId);
            
            if (questionIndex === -1) return prevData;
            
            const question = updatedQuestions[questionIndex];
            
            // Verificar que la pregunta tiene archivos
            if (!question.files) return prevData;
            
            // Buscar el archivo específico por ID
            const fileIndex = question.files.findIndex(f => f.id === currentFile.id);
            if (fileIndex === -1) return prevData;
            
            // Crear una copia del array de archivos
            const updatedFiles = [...question.files] as ExtendedUploadedFile[];
            
            // Actualizar solo el archivo correcto
            updatedFiles[fileIndex] = {
              ...updatedFiles[fileIndex],
              progress
            } as ExtendedUploadedFile;
            
            // Actualizar la pregunta con los archivos actualizados
            updatedQuestions[questionIndex] = {
              ...question,
              files: updatedFiles
            };
            
            return {
              ...prevData,
              questions: updatedQuestions
            };
          });
        };
        
        // Simular carga con intervalos de progreso
        for (let i = 0; i <= 100; i += 10) {
          updateProgress(i);
          await new Promise(resolve => setTimeout(resolve, 50)); // Simular delay de red
        }
        
        // Una vez "cargado", actualizar el archivo con datos de éxito
        setFormData(prevData => {
          const updatedQuestions = [...prevData.questions];
          const questionIndex = updatedQuestions.findIndex(q => q.id === questionId);
          
          if (questionIndex === -1) return prevData;
          
          const question = updatedQuestions[questionIndex];
          
          // Verificar que la pregunta tiene archivos
          if (!question.files) return prevData;
          
          // Buscar el archivo específico por ID
          const fileIndex = question.files.findIndex(f => f.id === currentFile.id);
          if (fileIndex === -1) return prevData;
          
          // Crear una copia del array de archivos
          const updatedFiles = [...question.files] as ExtendedUploadedFile[];
          
          // Actualizar solo el archivo correcto
          updatedFiles[fileIndex] = {
            ...updatedFiles[fileIndex],
            isLoading: false,
            progress: 100,
            s3Key: `${questionId}/example/${currentFile.name}` // Incluir questionId en la clave
          } as ExtendedUploadedFile;
          
          // Actualizar la pregunta con los archivos actualizados
          updatedQuestions[questionIndex] = {
            ...question,
            files: updatedFiles
          };
          
          // Guardar los archivos en localStorage
          saveFilesToLocalStorage(updatedQuestions);
          
          console.log(`[useCognitiveTaskForm] Archivo procesado para pregunta ${questionId}:`, updatedFiles[fileIndex]);
          
          return {
            ...prevData,
            questions: updatedQuestions
          };
        });
        
        // Procesar el siguiente archivo
        processFile(index + 1);
      } catch (error) {
        console.error(`[useCognitiveTaskForm] Error al procesar archivo ${currentFile.name} para pregunta ${questionId}:`, error);
        
        // Marcar el archivo con error
        setFormData(prevData => {
          const updatedQuestions = [...prevData.questions];
          const questionIndex = updatedQuestions.findIndex(q => q.id === questionId);
          
          if (questionIndex === -1) return prevData;
          
          const question = updatedQuestions[questionIndex];
          
          // Verificar que la pregunta tiene archivos
          if (!question.files) return prevData;
          
          // Buscar el archivo específico por ID
          const fileIndex = question.files.findIndex(f => f.id === currentFile.id);
          if (fileIndex === -1) return prevData;
          
          // Crear una copia del array de archivos
          const updatedFiles = [...question.files] as ExtendedUploadedFile[];
          
          // Actualizar solo el archivo correcto
          updatedFiles[fileIndex] = {
            ...updatedFiles[fileIndex],
            isLoading: false,
            error: true
          } as ExtendedUploadedFile;
          
          // Actualizar la pregunta con los archivos actualizados
          updatedQuestions[questionIndex] = {
            ...question,
            files: updatedFiles
          };
          
          return {
            ...prevData,
            questions: updatedQuestions
          };
        });
        
        // Continuar con el siguiente archivo a pesar del error
        processFile(index + 1);
      }
    };
    
    // Comenzar el procesamiento con el primer archivo
    processFile(0);
  }, [saveFilesToLocalStorage]);

  // Función para manejar la carga de múltiples archivos
  const handleMultipleFilesUpload = useCallback(async (questionId: string, files: FileList) => {
    if (files.length === 0 || !researchId) return;

    try {
      // Activar estado de carga inmediatamente
      setIsUploading(true);
      setUploadProgress(0);
      setCurrentFileIndex(0);
      setTotalFiles(files.length);
      
      // Convertir FileList a Array
      const fileArray = Array.from(files);
      
      // Crear objetos temporales para todos los archivos
      const tempFiles = fileArray.map(file => ({
        id: uuidv4(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        isLoading: true,
        progress: 0
      }));
      
      // Agregar archivos temporales inmediatamente para feedback visual
      setFormData(prevData => ({
        ...prevData,
        questions: prevData.questions.map(q =>
          q.id === questionId
            ? {
                ...q,
                files: q.files 
                  ? [...q.files, ...tempFiles]
                  : tempFiles
              }
            : q
        )
      }));
      
      // Mapeo de tempFileId -> index para actualizar el progreso
      const tempFileIdToIndexMap = tempFiles.reduce((map, file, index) => {
        map[file.id] = index;
        return map;
      }, {} as Record<string, number>);
      
      // Usar el servicio cognitiveTask para subir múltiples archivos
      const uploadedFiles = await cognitiveTaskFixedAPI.uploadMultipleFiles(
        fileArray,
        researchId,
        (progress, fileIndex) => {
          setUploadProgress(progress);
          setCurrentFileIndex(fileIndex);
          
          // Actualizar progreso del archivo actual
          const tempFileId = tempFiles[fileIndex].id;
          
          setFormData(prevData => ({
            ...prevData,
            questions: prevData.questions.map(q =>
              q.id === questionId
                ? {
                    ...q,
                    files: q.files?.map((f: ExtendedUploadedFile) => 
                      f.id === tempFileId 
                        ? { ...f, progress, isLoading: progress < 100 }
                        : f
                    )
                  }
                : q
            )
          }));
          
          console.log(`[useCognitiveTaskForm] Progreso de carga (${fileIndex+1}/${fileArray.length}): ${progress}%`);
        }
      );
      
      // Una vez que todos los archivos se han cargado, reemplazar los temporales con los reales
      if (uploadedFiles.length > 0) {
        setFormData(prevData => {
          // Encontrar archivos temporales para reemplazar
          const updatedQuestions = prevData.questions.map(q => {
            if (q.id !== questionId) return q;
            
            // Filtrar archivos que no son temporales
            const nonTempFiles = q.files?.filter(f => !tempFileIdToIndexMap.hasOwnProperty(f.id)) || [];
            
            // Obtener archivos reales con información de carga completa
            const completedFiles = uploadedFiles.map(f => ({ ...f, isLoading: false, progress: 100 }));
            
            return {
              ...q,
              files: [...nonTempFiles, ...completedFiles]
            };
          });
          
          const updatedFormData = {
            ...prevData,
            questions: updatedQuestions
          };
          
          // Guardar en localStorage para persistencia temporal
          saveFilesToLocalStorage(updatedFormData.questions);
          
          return updatedFormData;
        });
        
        toast.success(`${uploadedFiles.length} archivos subidos exitosamente`);
      }
    } catch (error) {
      console.error('[useCognitiveTaskForm] Error al subir archivos múltiples:', error);
      toast.error('Error al subir archivos');
      
      // Eliminar archivos temporales en caso de error
      setFormData(prevData => ({
        ...prevData,
        questions: prevData.questions.map(q =>
          q.id === questionId
            ? {
                ...q,
                files: q.files?.filter((f: ExtendedUploadedFile) => !f.isLoading)
              }
            : q
        )
      }));
      
      showModal({
        title: 'Error al subir archivos',
        message: error instanceof Error ? error.message : 'Ocurrió un error inesperado',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  }, [researchId, showModal, saveFilesToLocalStorage]);

  // Función para eliminar un archivo
  const handleFileDelete = useCallback(async (questionId: string, fileId: string) => {
    try {
      console.log(`[useCognitiveTaskForm] Eliminando archivo con ID: ${fileId} de la pregunta: ${questionId}`);
      
      // Buscar la pregunta y el archivo a eliminar
      const question = formData.questions.find(q => q.id === questionId);
      const file = question?.files?.find(f => f.id === fileId);
      
      if (!file) {
        console.error(`[useCognitiveTaskForm] No se encontró el archivo a eliminar (ID: ${fileId})`);
        toast.error('No se pudo eliminar el archivo: no encontrado');
        return;
      }
      
      // Revisar si es un archivo temporal o uno ya subido a S3
      const isTemporaryFile = file.url?.startsWith('blob:') || !file.s3Key;
      
      // Eliminación en S3 (solo si tiene s3Key)
      if (!isTemporaryFile && file.s3Key) {
        try {
          console.log(`[useCognitiveTaskForm] Eliminando archivo de S3 con clave: ${file.s3Key}`);
          await s3Service.deleteFile(file.s3Key);
          console.log(`[useCognitiveTaskForm] Archivo eliminado exitosamente de S3`);
        } catch (error) {
          console.error(`[useCognitiveTaskForm] Error al eliminar archivo de S3:`, error);
          // Continuar con la eliminación local incluso si falla en S3
          toast.error('El archivo se eliminó localmente, pero hubo un problema al eliminarlo del servidor');
        }
      } else {
        console.log(`[useCognitiveTaskForm] Eliminando archivo temporal local (no subido a S3)`);
      }
      
      // Revocamos el URL blob para liberar memoria si es un archivo temporal
      if (isTemporaryFile && file.url?.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(file.url);
          console.log(`[useCognitiveTaskForm] URL del archivo temporal revocado`);
        } catch (e) {
          console.warn(`[useCognitiveTaskForm] Error al revocar URL de objeto:`, e);
        }
      }
      
      // Eliminar el archivo del estado local
      setFormData(prevData => {
        // Crear formulario actualizado sin el archivo eliminado
        const updatedFormData = {
          ...prevData,
          questions: prevData.questions.map(q =>
            q.id === questionId && q.files
              ? {
                  ...q,
                  files: q.files.filter(f => f.id !== fileId)
                }
              : q
          )
        };
        
        // Actualizar localStorage sin el archivo eliminado
        saveFilesToLocalStorage(updatedFormData.questions);
        
        return updatedFormData;
      });
      
      // Verificar si es una pregunta de tipo preference_test para mostrar mensajes informativos
      if (question?.type === 'preference_test') {
        // Calcular cuántos archivos válidos quedarán después de eliminar este
        const remainingValidFiles = (question.files || [])
          .filter(f => f.id !== fileId && f.s3Key && !f.url?.startsWith('blob:'))
          .length;
        
        if (remainingValidFiles === 1) {
          toast.success('Necesitas 1 imagen más para completar la prueba de preferencia');
        } else if (remainingValidFiles === 0) {
          toast.success('Necesitas 2 imágenes para completar la prueba de preferencia');
        }
      } else {
        // Mensaje genérico para otros tipos de preguntas
        toast.success('Archivo eliminado exitosamente');
      }
      
    } catch (error) {
      console.error('[useCognitiveTaskForm] Error al eliminar archivo:', error);
      toast.error('Error al eliminar archivo: ' + (error instanceof Error ? error.message : 'error desconocido'));
    }
  }, [formData.questions, saveFilesToLocalStorage]);

  // Agregar un observador de debug para ver eventos de clic en botones de eliminar
  useEffect(() => {
    // Solo agregamos en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const handleDeleteButtonClick = (e: MouseEvent) => {
        // Buscar si el elemento clickeado es un botón de eliminar o está dentro de uno
        let target = e.target as HTMLElement | null;
        while (target) {
          if (target.classList?.contains('delete-file-button') || 
              target.getAttribute('data-role') === 'delete-file') {
            console.log('[DEBUG] Botón de eliminar archivos clickeado:', target);
            break;
          }
          target = target.parentElement;
        }
      };
      
      document.addEventListener('click', handleDeleteButtonClick);
      return () => document.removeEventListener('click', handleDeleteButtonClick);
    }
  }, []);

  // Limpiar localStorage cuando se completa el guardado
  useEffect(() => {
    // Solo limpiar cuando se guarda correctamente
    const handleSaveSuccess = () => {
      if (researchId) {
        const storageKey = `cognitive_task_temp_files_${researchId}`;
        localStorage.removeItem(storageKey);
        console.log('[useCognitiveTaskForm] Limpiando archivos temporales de localStorage después de guardar');
      }
    };
    
    // Configurar un listener para cuando la mutación sea exitosa
    if (researchId) {
      queryClient.getQueryState(['saveSuccess', researchId])?.data === true && handleSaveSuccess();
    }
    
    // Limpiar al desmontar el componente (si el usuario cancela)
    return () => {
      // No eliminar automáticamente al desmontar, solo si se confirma guardado
      // para preservar posibles uploads en caso de navegación accidental
    };
  }, [researchId, queryClient]);

  // Función para agregar una nueva pregunta
  const handleAddQuestion = useCallback((type: QuestionType) => {
    const newQuestionId = uuidv4();
    
    // Obtener la plantilla para este tipo de pregunta
    const template = QUESTION_TEMPLATES[type];
    
    if (!template) {
      console.error(`[useCognitiveTaskForm] No hay plantilla para el tipo: ${type}`);
      return;
    }
    
    // Crear nueva pregunta basada en la plantilla, asegurando que todas las propiedades requeridas estén presentes
    const newQuestion: Question = {
      ...template,               // Primero aplicamos la plantilla
      id: newQuestionId,
      type: type,
      title: 'Nueva Pregunta',  
      required: true,           
      showConditionally: false, 
      deviceFrame: false        // Aseguramos que deviceFrame siempre sea un boolean
    };
    
    // Agregar la nueva pregunta al estado
    setFormData(prevData => ({
      ...prevData,
      questions: [...prevData.questions, newQuestion]
    }));
    
    // Cerrar el modal
    closeAddQuestionModal();
  }, [closeAddQuestionModal]);

  // Función para controlar el aleatorizado de preguntas
  const handleRandomizeChange = useCallback((checked: boolean) => {
    setFormData(prevData => ({
      ...prevData,
      randomizeQuestions: checked
    }));
  }, []);

  // Función para validar el formulario
  const validateForm = useCallback(() => {
    const errors: ValidationErrors = {};
    
    // Validar researchId
    if (!researchId) {
      errors.researchId = VALIDATION_ERROR_MESSAGES.RESEARCH_ID_REQUIRED;
    }
    
    // Validar que haya al menos una pregunta
    if (!formData.questions || formData.questions.length === 0) {
      errors.questions = VALIDATION_ERROR_MESSAGES.QUESTIONS_REQUIRED;
    }

    // Log de debugging
    console.log('Validación del formulario CognitiveTask:');
    console.log('- Research ID:', researchId);
    console.log('- Número de preguntas:', formData.questions?.length || 0);
    
    // Validar cada pregunta
    formData.questions.forEach((question, index) => {
      // Log de cada pregunta para debugging
      console.log(`Pregunta ${index + 1}:`, {
        id: question.id,
        type: question.type,
        title: question.title,
        required: question.required,
        hasFiles: (question.files?.length || 0) > 0,
        hasChoices: (question.choices?.length || 0) > 0
      });
      
      // Validar título
      if (!question.title?.trim()) {
        errors[`question_${index}_title`] = VALIDATION_ERROR_MESSAGES.TITLE_REQUIRED;
      }
      
      // Validar opciones para preguntas de elección
      if (['single_choice', 'multiple_choice', 'ranking'].includes(question.type)) {
        if (!question.choices || question.choices.length === 0) {
          errors[`question_${index}_choices`] = VALIDATION_ERROR_MESSAGES.CHOICES_REQUIRED;
        } else {
          // Validar que cada opción tenga texto
          question.choices.forEach((choice, choiceIndex) => {
            if (!choice.text?.trim()) {
              errors[`question_${index}_choice_${choiceIndex}`] = VALIDATION_ERROR_MESSAGES.CHOICE_TEXT_REQUIRED;
            }
          });
        }
      }
      
      // Validar configuración de escala para preguntas de escala lineal
      if (question.type === 'linear_scale' && question.scaleConfig) {
        const { startValue, endValue } = question.scaleConfig;
        
        // Validar valores inicial y final
        if (startValue === undefined || startValue === null) {
          errors[`question_${index}_scale_start`] = VALIDATION_ERROR_MESSAGES.SCALE_START_REQUIRED;
        }
        
        if (endValue === undefined || endValue === null) {
          errors[`question_${index}_scale_end`] = VALIDATION_ERROR_MESSAGES.SCALE_END_REQUIRED;
        }
        
        if (startValue !== undefined && endValue !== undefined && startValue >= endValue) {
          errors[`question_${index}_scale`] = VALIDATION_ERROR_MESSAGES.SCALE_INVALID_RANGE;
        }
      }
    });
    
    // Mostrar un resumen de errores encontrados
    console.log('Errores de validación encontrados:', Object.keys(errors).length);
    if (Object.keys(errors).length > 0) {
      console.log('Detalle de errores:', errors);
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, researchId]);

  // Función para mostrar el modal con JSON
  const showJsonModal = (data: any, action: 'save' | 'preview') => {
    setJsonToSend(JSON.stringify(data, null, 2));
    setPendingAction(action);
    setShowJsonPreview(true);
  };

  // Cerrar el modal JSON
  const closeJsonModal = () => {
    setShowJsonPreview(false);
    setPendingAction(null);
  };

  // Continuar con la acción después de mostrar JSON
  const continueWithAction = () => {
    closeJsonModal();
    
    if (pendingAction === 'save') {
      try {
        // Asegurarse de que el objeto tiene la estructura correcta
        const dataToSave = JSON.parse(jsonToSend);
        
        // Validar el objeto antes de guardarlo
        if (!dataToSave.questions || !Array.isArray(dataToSave.questions)) {
          console.error('Error: El objeto no tiene un array de preguntas válido');
          toast.error('Datos incorrectos. No se encontró información de preguntas.');
          return;
        }
        
        // Si todo está bien, llamar a la mutación para guardar
        mutate(dataToSave);
        
        // Notificar al padre (si existe el callback)
        if (onSave) {
          onSave(dataToSave);
        }
      } catch (error) {
        console.error('Error al procesar JSON:', error);
        toast.error('Error al procesar los datos del formulario');
      }
    } else if (pendingAction === 'preview') {
      // La vista previa ahora se maneja en el componente JsonPreviewModal
      console.log('Acción de vista previa completada');
    }
  };

  // Función para previsualizar el formulario
  const handlePreview = useCallback(() => {
    if (!validateForm()) {
      // Crear un mensaje con la lista de errores
      const errorMessageText = 'Errores: ' + Object.values(validationErrors || {}).join(', ');
      
      showModal({
        title: 'Error de previsualización',
        message: errorMessageText,
        type: 'error'
      });
      
      toast.error('Por favor corrija los errores antes de previsualizar', {
        duration: 5000,
        style: {
          background: '#FEF2F2',
          color: '#991B1B',
          padding: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        },
        icon: '⚠️'
      });
      return;
    }
    
    try {
      // Mostrar mensaje de funcionalidad en desarrollo
      toast.success(SUCCESS_MESSAGES_EXTENDED.PREVIEW_COMING_SOON, {
        duration: 5000,
        style: {
          background: '#F0F9FF',
          color: '#0C4A6E',
          padding: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        },
        icon: 'ℹ️'
      });
      
      // Preparar datos para preview
      const dataToPreview = {
        ...formData,
        metadata: {
          updatedAt: new Date().toISOString()
        }
      };
      
      // Mostrar modal con JSON
      showJsonModal(dataToPreview, 'preview');
    } catch (error) {
      console.error('[useCognitiveTaskForm] Error al preparar vista previa:', error);
      toast.error('Error al generar la vista previa', {
        duration: 5000,
        style: {
          background: '#FEF2F2',
          color: '#991B1B',
          padding: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        },
        icon: '❌'
      });
    }
  }, [validateForm, validationErrors, formData, showModal, showJsonModal]);

  // Función para inicializar preguntas predeterminadas
  const initializeDefaultQuestions = useCallback((defaultQuestions: Question[]) => {
    setFormData(prevData => ({
      ...prevData,
      questions: defaultQuestions.map(q => ({
        ...q,
        id: q.id || uuidv4()
      }))
    }));
    
    console.log('[useCognitiveTaskForm] Inicializadas preguntas predeterminadas:', defaultQuestions.length);
  }, []);

  // Función para guardar formulario (modificado para mostrar JSON primero)
  const handleSave = useCallback(() => {
    if (!isAuthenticated) {
      showModal({
        title: 'Error de autenticación',
        message: 'No está autenticado. Por favor, inicie sesión para guardar.',
        type: 'error'
      });
      return;
    }

    // Verificar si hay errores de validación primero
    const isValid = validateForm();
    if (!isValid) {
      toast.error('Hay errores de validación en el formulario. Verifique los campos marcados.');
      return;
    }

    try {
    // Construir el objeto que coincida exactamente con CognitiveTaskFormData de shared/interfaces
    const dataToSave: CognitiveTaskFormData = {
      researchId: researchId || '',
      questions: formData.questions
        // Filtrar preguntas que son required=true pero no tienen archivos
        .filter(question => {
          if (['navigation_flow', 'preference_test'].includes(question.type) && question.required) {
            // Solo mantener si tiene archivos válidos
            const hasValidFiles = question.files && 
                                 Array.isArray(question.files) && 
                                 question.files.length > 0 && 
                                 question.files.some(file => file && file.s3Key && typeof file.s3Key === 'string');
            
            if (!hasValidFiles) {
              console.log(`[useCognitiveTaskForm] Omitiendo pregunta obligatoria ${question.id} sin archivos`);
                toast.error(`La pregunta "${question.title}" requiere archivos pero no tiene ninguno.`);
              return false;
            }
          }
          return true;
        })
        .map(question => {
        // Crear objeto limpio para cada pregunta según la interfaz Question
        const cleanQuestion: Question = {
          id: question.id,
          type: question.type,
          title: question.title || '',
          required: Boolean(question.required),
          showConditionally: Boolean(question.showConditionally),
          deviceFrame: Boolean(question.deviceFrame)
        };
        
        // Agregar descripción solo si existe
        if (question.description) {
          cleanQuestion.description = question.description;
        }
        
        // Agregar choices solo para tipos específicos y si existen
        if (['single_choice', 'multiple_choice', 'ranking'].includes(question.type) && question.choices) {
          cleanQuestion.choices = question.choices.map(choice => ({
            id: choice.id,
            text: choice.text || '',
            isQualify: Boolean(choice.isQualify),
            isDisqualify: Boolean(choice.isDisqualify)
          }));
        }
        
        // Agregar scaleConfig solo para linear_scale y si existe
        if (question.type === 'linear_scale' && question.scaleConfig) {
          cleanQuestion.scaleConfig = {
            startValue: Number(question.scaleConfig.startValue),
            endValue: Number(question.scaleConfig.endValue),
            startLabel: question.scaleConfig.startLabel || '',
            endLabel: question.scaleConfig.endLabel || ''
          };
        }
        
        // Para tipos que usan archivos, simplemente incluimos los que tengan s3Key 
        // sin aplicar reglas estrictas
        if (['navigation_flow', 'preference_test'].includes(question.type) && question.files) {
          // Simplemente incluir todos los archivos que tengan s3Key
          const validFiles = question.files
            .filter(file => file && file.s3Key && typeof file.s3Key === 'string')
            .map(file => ({
              id: file.id,
              name: file.name,
              size: Number(file.size),
              type: file.type,
              url: file.url,
              s3Key: file.s3Key
            }));
          
          // Asignar archivos validados (pero sin restricciones estrictas)
          if (validFiles.length > 0) {
            cleanQuestion.files = validFiles;
          } else {
            // Si no hay archivos válidos, usamos un array vacío
            cleanQuestion.files = [];
          }
        }
        
        return cleanQuestion;
      }),
      randomizeQuestions: Boolean(formData.randomizeQuestions),
      metadata: {
        updatedAt: new Date().toISOString(),
        lastModifiedBy: 'user-interface'
      }
    };
    
    console.log('[useCognitiveTaskForm] Datos filtrados según interfaz compartida:', dataToSave);
    
      // Crear modal de confirmación utilizando DOM nativo
      const confirmModalContainer = document.createElement('div');
      confirmModalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto p-6 relative">
            <button id="closeConfirmModal" style="background: none; border: none; cursor: pointer; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #6b7280; border-radius: 50%; transition: all 0.2s; position: absolute; right: 16px; top: 16px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div class="mb-5">
              <h3 class="text-lg font-bold text-gray-900 mb-2">Confirmar Acción</h3>
              <p class="text-gray-600">¿Estás seguro que deseas guardar esta tarea cognitiva?</p>
            </div>
            
            <div class="text-left mb-6">
              <p class="text-sm font-medium text-gray-700 mb-2">Resumen del formulario:</p>
              <ul class="pl-5 space-y-1 text-sm text-gray-600 list-disc">
                <li><span class="font-medium">Número de preguntas:</span> ${dataToSave.questions.length}</li>
                <li><span class="font-medium">Aleatorizar preguntas:</span> ${dataToSave.randomizeQuestions ? 'Sí' : 'No'}</li>
                <li>
                  <span class="font-medium">Tipos de preguntas:</span>
                  <ul class="pl-4 mt-1 space-y-1 list-circle text-xs">
                    ${
                      Array.from(new Set(dataToSave.questions.map(q => q.type)))
                        .map(type => {
                          const count = dataToSave.questions.filter(q => q.type === type).length;
                          const typeLabel = QUESTION_TYPES.find(t => t.id === type)?.label || type;
                          return `<li>${typeLabel} (${count})</li>`;
                        })
                        .join('')
                    }
                  </ul>
                </li>
              </ul>
            </div>
            
            <div class="flex gap-3 justify-end">
              <button id="cancelSaveButton" class="px-4 py-2 border rounded-md text-gray-600 bg-white hover:bg-gray-50 transition-colors duration-200">
                Cancelar
              </button>
              <button id="confirmSaveButton" class="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200">
                Guardar
              </button>
            </div>
          </div>
        </div>
      `;

      // Añadir estilos al modal
      const style = document.createElement('style');
      style.innerHTML = `
        #closeConfirmModal:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .list-circle {
          list-style-type: circle;
        }
      `;
      confirmModalContainer.appendChild(style);

      // Añadir el modal al DOM
      document.body.appendChild(confirmModalContainer);

      // Evento para cerrar el modal
      document.getElementById('closeConfirmModal')?.addEventListener('click', () => {
        document.body.removeChild(confirmModalContainer);
      });

      // Evento para cancelar
      document.getElementById('cancelSaveButton')?.addEventListener('click', () => {
        document.body.removeChild(confirmModalContainer);
      });

      // Evento para confirmar y guardar
      document.getElementById('confirmSaveButton')?.addEventListener('click', () => {
        document.body.removeChild(confirmModalContainer);
        
        // Mostrar indicador de carga y mensaje de guardando
        const loadingToastId = toast.loading('Guardando tarea cognitiva...', {
          duration: Infinity, // Que no desaparezca automáticamente
          style: {
            background: '#F0F9FF',
            color: '#0C4A6E',
            padding: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          },
          icon: '⏳'
        });
    setIsSaving(true);
        
        // Ejecutar la mutación
        mutate(dataToSave, {
      onSuccess: (data) => {
        if (data && data.id) {
          setCognitiveTaskId(data.id);
        }
        
        // Limpiar localStorage después de guardar exitosamente
        if (researchId) {
          const storageKey = `cognitive_task_temp_files_${researchId}`;
          localStorage.removeItem(storageKey);
          console.log('[useCognitiveTaskForm] Limpiando archivos temporales después de guardar exitoso');
        }
        
            // Actualizar mensaje de toast a éxito
            toast.success(cognitiveTaskId ? 'Tarea cognitiva actualizada exitosamente' : 'Tarea cognitiva creada exitosamente', { 
              id: loadingToastId,
              duration: 5000,
              style: {
                background: '#F0FDF4',
                color: '#166534',
                padding: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              },
              icon: '✅'
            });
        
        // Invalidar la consulta para recargar datos
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId] });
        
        // Ejecutar callback si existe
        if (typeof onSave === 'function') {
          onSave(data);
        }
        
        // Restablecer estado de guardado
        setIsSaving(false);
      },
      onError: (error: any) => {
        console.error('[useCognitiveTaskForm] Error en mutación:', error);
        
        let errorMsg = 'Error al guardar la tarea cognitiva';
        if (error.message) {
          errorMsg += `: ${error.message}`;
        }
        
            // Actualizar mensaje de toast a error
            toast.error(errorMsg, { 
              id: loadingToastId,
              duration: 5000,
              style: {
                background: '#FEF2F2',
                color: '#991B1B',
                padding: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              },
              icon: '❌'
            });
            
            // Mostrar modal de error
        showModal({
          title: 'Error de guardado',
          message: errorMsg,
          type: 'error'
        });
        
        // Restablecer estado de guardado
        setIsSaving(false);
      }
    });
      });

      // Cerrar modal al hacer clic fuera de él
      confirmModalContainer.addEventListener('click', (e) => {
        if (e.target === confirmModalContainer.firstChild) {
          document.body.removeChild(confirmModalContainer);
        }
      });
    } catch (error) {
      console.error('[useCognitiveTaskForm] Error al preparar guardado:', error);
      toast.error('Error al preparar la tarea cognitiva para guardar');
      setIsSaving(false);
    }
  }, [isAuthenticated, showModal, validateForm, formData, researchId, cognitiveTaskId, mutate, setCognitiveTaskId, queryClient, onSave]);

  return {
    formData,
    cognitiveTaskId,
    validationErrors,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    isAddQuestionModalOpen,
    isUploading,
    uploadProgress,
    currentFileIndex,
    totalFiles,
    questionTypes: QUESTION_TYPES,
    
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
    validateForm,
    closeModal,
    initializeDefaultQuestions,
    
    // Propiedades para el modal JSON
    showJsonPreview,
    closeJsonModal,
    jsonToSend,
    pendingAction,
    continueWithAction,
    
    // Propiedades para el modal de confirmación
    showConfirmModal: false,
    confirmAndSave: () => {}, // Función vacía para mantener la interfaz compatible
    cancelSave: () => {}, // Función vacía para mantener la interfaz compatible
    dataToSaveInConfirm: null
  };
};

export default useCognitiveTaskForm; 