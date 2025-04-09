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
  // Inicializar siempre con las preguntas predeterminadas
  const [formData, setFormData] = useState<CognitiveTaskFormData>({
    ...DEFAULT_COGNITIVE_TASK,
    questions: [...DEFAULT_QUESTIONS],
    researchId: researchId || ''
  });
  const [cognitiveTaskId, setCognitiveTaskId] = useState<string | null>(null);
  // Inicializar validationErrors como un objeto vacío
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState<boolean>(false);
  const { isAuthenticated, token } = useAuth();
  
  // Estados para controlar carga de archivos
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [totalFiles, setTotalFiles] = useState<number>(0);

  // Añadir después de los estados para el modal
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);
  const [jsonToSend, setJsonToSend] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'save' | 'preview' | null>(null);

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
  const { mutate, isPending: isSaving } = useMutation({
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
      
      // Mostrar mensaje de éxito
      toast.success('Tarea cognitiva guardada correctamente');
      
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
      
      toast.error(errorMsg);
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

  // Función para manejar la carga de archivos individuales
  const handleFileUpload = useCallback(async (questionId: string, files: FileList) => {
    if (files.length === 0 || !researchId) return;

    try {
      // Activar estado de carga inmediatamente
      setIsUploading(true);
      setUploadProgress(0);
      setCurrentFileIndex(0);
      setTotalFiles(1);
      
      // Convertir FileList a Array
      const file = files[0];
      
      console.log(`[useCognitiveTaskForm] Subiendo archivo: ${file.name}`);
      
      // Crear un objeto temporal de archivo para feedback visual inmediato
      const tempFileId = uuidv4();
      const tempFile: ExtendedUploadedFile = {
        id: tempFileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        isLoading: true,
        progress: 0
      };
      
      // Agregar inmediatamente el archivo temporal a la pregunta para feedback visual
      setFormData(prevData => ({
        ...prevData,
        questions: prevData.questions.map(q =>
          q.id === questionId
            ? {
                ...q,
                files: q.files 
                  ? [...q.files, tempFile]
                  : [tempFile]
              }
            : q
        )
      }));
      
      // Usar el servicio cognitiveTask para subir el archivo
      const uploadedFile = await cognitiveTaskFixedAPI.uploadFile(
        file,
        researchId,
        (progress) => {
          setUploadProgress(progress);
          
          // Actualizar el progreso del archivo temporal
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
          
          console.log(`[useCognitiveTaskForm] Progreso de carga: ${progress}%`);
        }
      );
      
      if (uploadedFile) {
        // Reemplazar el archivo temporal con el archivo real
        setFormData(prevData => {
          // Crear objeto de formulario actualizado con el archivo completado
          const updatedFormData = {
            ...prevData,
            questions: prevData.questions.map(q =>
              q.id === questionId
                ? {
                    ...q,
                    files: q.files 
                      ? q.files.map(f => f.id === tempFileId ? { 
                          ...uploadedFile, 
                          isLoading: false, 
                          progress: 100 
                        } : f)
                      : [{ ...uploadedFile, isLoading: false, progress: 100 }]
                  }
                : q
            )
          };
          
          // Guardar inmediatamente en localStorage - IMPORTANTE
          saveFilesToLocalStorage(updatedFormData.questions);
          
          return updatedFormData;
        });
        
        toast.success(`Archivo subido exitosamente: ${file.name}`);
        
        // Validar inmediatamente después de la carga para preference_test
        const question = formData.questions.find(q => q.id === questionId);
        if (question && question.type === 'preference_test') {
          setTimeout(() => {
            const validFiles = formData.questions
              .find(q => q.id === questionId)?.files
              ?.filter(f => f && f.s3Key && !f.url.startsWith('blob:')) || [];
            
            // Mostrar un mensaje informativo si tenemos exactamente 2 archivos válidos
            if (validFiles.length === 2) {
              toast.success('Prueba de preferencia completa: tienes exactamente 2 imágenes');
            } else if (validFiles.length > 2) {
              toast.error(`Tienes ${validFiles.length} imágenes. Las pruebas de preferencia requieren exactamente 2.`);
            } else {
              toast.success(`Necesitas ${2 - validFiles.length} imagen(es) más para completar la prueba de preferencia`);
            }
          }, 500); // Pequeño retraso para asegurar que el estado se ha actualizado
        }
      }
    } catch (error) {
      console.error('[useCognitiveTaskForm] Error al subir archivo:', error);
      toast.error('Error al subir archivo');
      
      // Eliminar el archivo temporal en caso de error
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
        title: 'Error al subir archivo',
        message: error instanceof Error ? error.message : 'Ocurrió un error inesperado',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  }, [researchId, showModal, saveFilesToLocalStorage, formData.questions]);

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
  const showJsonModal = useCallback((json: any, action: 'save' | 'preview') => {
    try {
      // Validar que el JSON sea válido
      const stringifiedJson = JSON.stringify(json, null, 2);
      JSON.parse(stringifiedJson); // Verificar que sea un JSON válido
      
      if (Object.keys(validationErrors).length > 0) {
        showModal({
          title: 'Errores de validación',
          message: 'Por favor, corrija los errores de validación antes de continuar.',
          type: 'error'
        });
        return;
      }
      
      setJsonToSend(stringifiedJson);
      setPendingAction(action);
      setShowJsonPreview(true);
      
      console.log(`[useCognitiveTaskForm] Mostrando modal JSON para acción: ${action}`);
      console.log('[useCognitiveTaskForm] JSON válido:', stringifiedJson);
    } catch (error) {
      console.error('[useCognitiveTaskForm] Error al procesar JSON:', error);
      showModal({
        title: 'Error al procesar datos',
        message: 'Los datos no tienen un formato JSON válido. Por favor, revise la estructura de los datos.',
        type: 'error'
      });
    }
  }, [showModal, validationErrors]);

  // Función para cerrar el modal JSON
  const closeJsonModal = useCallback(() => {
    setShowJsonPreview(false);
    setPendingAction(null);
    setJsonToSend('');
    
    console.log('[useCognitiveTaskForm] Modal JSON cerrado');
  }, []);

  // Función para renderizar el contenido específico de una pregunta en la vista previa
  const renderQuestionContent = (question: any) => {
    const isFileQuestion = ['navigation_flow', 'preference_test'].includes(question.type);
    const hasFiles = question.files && Array.isArray(question.files) && question.files.length > 0;
    const hasValidFiles = isFileQuestion && hasFiles && question.files.some((file: any) => file && file.s3Key);
    
    let content = '';
    
    // Según el tipo de pregunta, renderizar distinto contenido
    switch (question.type) {
      case 'short_text':
      case 'long_text':
        content = `<div class="text-input-preview" style="margin-top: 10px; color: #6b7280; font-style: italic;">[Campo de texto para respuesta]</div>`;
        break;
        
      case 'single_choice':
      case 'multiple_choice':
      case 'ranking':
        if (question.choices && question.choices.length > 0) {
          content = `
            <div class="choices-preview" style="margin-top: 10px;">
              <ul style="margin: 8px 0; padding-left: 20px;">
                ${question.choices.map((choice: any) => `
                  <li style="margin-bottom: 5px;">
                    ${choice.text || '(Opción sin texto)'}
                  </li>
                `).join('')}
              </ul>
            </div>
          `;
        } else {
          content = `<div style="margin-top: 10px; color: #6b7280; font-style: italic;">No hay opciones definidas</div>`;
        }
        break;
        
      case 'linear_scale':
        if (question.scaleConfig) {
          const { startValue, endValue, startLabel, endLabel } = question.scaleConfig;
          content = `
            <div class="scale-preview" style="margin-top: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <div>${startLabel || ''} (${startValue})</div>
                <div>${endLabel || ''} (${endValue})</div>
              </div>
              <div style="height: 8px; background: #e5e7eb; border-radius: 4px; position: relative;">
                ${Array.from({ length: endValue - startValue + 1 }, (_, i) => `
                  <div style="position: absolute; left: ${(i / (endValue - startValue)) * 100}%; transform: translateX(-50%); top: -8px; width: 20px; height: 20px; background: #white; border: 1px solid #d1d5db; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                    ${startValue + i}
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        } else {
          content = `<div style="margin-top: 10px; color: #6b7280; font-style: italic;">Escala no configurada</div>`;
        }
        break;
        
      case 'navigation_flow':
      case 'preference_test':
        if (hasValidFiles) {
          content = `
            <div class="file-preview" style="margin-top: 10px;">
              <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${question.files.map((file: any) => file && file.s3Key ? `
                  <div style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; width: 120px;">
                    <div style="height: 80px; background: #f9fafb; display: flex; align-items: center; justify-content: center;">
                      <span style="color: #6b7280; font-size: 12px;">[Vista previa de imagen]</span>
                    </div>
                    <div style="padding: 6px; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${file.name || 'Archivo'}
                    </div>
                  </div>
                ` : '').join('')}
              </div>
            </div>
          `;
        } else {
          content = `
            <div style="margin-top: 10px; padding: 8px 12px; background-color: #fffbeb; color: #d97706; border: 1px solid #fbbf24; border-radius: 4px; font-size: 14px;">
              ⚠️ No hay archivos subidos para esta pregunta
            </div>
          `;
        }
        break;
        
      default:
        content = `<div style="margin-top: 10px; color: #6b7280; font-style: italic;">Vista previa no disponible</div>`;
    }
    
    return content;
  };

  // Función para determinar si la pregunta es una de las predeterminadas sin modificar
  const isDefaultQuestion = (question: any) => {
    // Buscar la pregunta correspondiente en DEFAULT_QUESTIONS
    const defaultQuestion = DEFAULT_QUESTIONS.find(q => q.id === question.id);
    
    // Si no existe en las predeterminadas, es nueva (modificada)
    if (!defaultQuestion) return false;
    
    // Comprobar si el título ha cambiado
    if (defaultQuestion.title !== question.title) return false;
    
    // Comprobar si las opciones han cambiado (para preguntas de elección)
    if (question.choices && defaultQuestion.choices) {
      // Si el número de opciones es diferente, está modificada
      if (question.choices.length !== defaultQuestion.choices.length) return false;
      
      // Verificar cada opción
      for (let i = 0; i < question.choices.length; i++) {
        if (question.choices[i].text !== defaultQuestion.choices[i].text) return false;
      }
    }
    
    // Para escala lineal, comprobar la configuración de la escala
    if (question.type === 'linear_scale' && question.scaleConfig && defaultQuestion.scaleConfig) {
      if (
        question.scaleConfig.startValue !== defaultQuestion.scaleConfig.startValue ||
        question.scaleConfig.endValue !== defaultQuestion.scaleConfig.endValue ||
        question.scaleConfig.startLabel !== defaultQuestion.scaleConfig.startLabel ||
        question.scaleConfig.endLabel !== defaultQuestion.scaleConfig.endLabel
      ) {
        return false;
      }
    }
    
    // Si no se detectó ningún cambio, es una pregunta predeterminada sin modificar
    return true;
  };

  // Función auxiliar para obtener la etiqueta del tipo de pregunta
  const getQuestionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'short_text': 'Texto Corto',
      'long_text': 'Texto Largo',
      'single_choice': 'Opción Única',
      'multiple_choice': 'Opción Múltiple',
      'linear_scale': 'Escala Lineal',
      'ranking': 'Ranking',
      'navigation_flow': 'Flujo de Navegación',
      'preference_test': 'Prueba de Preferencia'
    };
    return typeMap[type] || type;
  };

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
              toast.success(`Se ha omitido la pregunta "${question.title}" porque requiere archivos`);
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
    
    // Verificar si hay errores de validación
    const hasErrors = Object.keys(validationErrors).length > 0;

    if (hasErrors) {
      toast.error('Hay errores de validación en el formulario');
      showModal({
        title: 'Errores de validación',
        message: Object.values(validationErrors).join('\n'),
        type: 'error'
      });
      return false;
    }
    
    // Mostrar modal con JSON en lugar de guardar directamente
    showJsonModal(dataToSave, 'save');
    
    // Solo mostramos la alerta de validación pero permitimos ver el JSON
    if (!validateForm()) {
      toast.error('Hay errores de validación en el formulario. Verifique los campos marcados.');
    }
  }, [isAuthenticated, showModal, validateForm, formData, showJsonModal, researchId, validationErrors, toast]);

  // Función para continuar con la acción después de mostrar el JSON
  const continueWithAction = useCallback(() => {
    closeJsonModal();
    
    if (pendingAction === 'save') {
      // Ejecutar la mutación para guardar
      try {
        // Parsear el JSON que se mostró en el modal
        const dataToSaveObj = JSON.parse(jsonToSend);
        
        // Usar la API correcta para el guardado
        mutate(dataToSaveObj);
      } catch (error) {
        console.error('[useCognitiveTaskForm] Error al procesar JSON:', error);
        toast.error('Error al procesar los datos del formulario');
        
        // Mostrar error detallado
        showModal({
          title: 'Error de procesamiento',
          message: error instanceof Error ? error.message : 'Ocurrió un error inesperado al procesar los datos',
          type: 'error'
        });
      }
    } else if (pendingAction === 'preview') {
      // Mostrar mensaje de previsualización
      showModal({
        title: 'Información',
        message: SUCCESS_MESSAGES_EXTENDED.PREVIEW_COMING_SOON,
        type: 'info'
      });
      
      toast.success(SUCCESS_MESSAGES_EXTENDED.PREVIEW_COMING_SOON);
    }
  }, [jsonToSend, pendingAction, mutate, showModal, closeJsonModal]);

  // Modificar la función de previsualización para incluir todas las preguntas
  const handlePreview = useCallback(() => {
    if (!validateForm()) {
      // Notificar errores de validación
      showModal({
        title: 'Error de validación',
        message: 'Por favor corrija los errores antes de previsualizar',
        type: 'error'
      });
      
      toast.error('Por favor corrija los errores antes de previsualizar');
      return;
    }
    
    // Preparar datos para previsualizar incluyendo TODAS las preguntas
    // (sin filtrar las de tipo 'navigation_flow' o 'preference_test' sin archivos)
    const dataToPreview = {
      ...formData,
      metadata: {
        version: '1.0.0',
        updatedAt: new Date().toISOString()
      }
    };
    
    // Mostrar modal con JSON
    showJsonModal(dataToPreview, 'preview');
  }, [validateForm, showModal, formData, showJsonModal]);

  // Función para inicializar las preguntas por defecto
  const initializeDefaultQuestions = useCallback((defaultQuestions: Question[]) => {
    setFormData(prev => ({
      ...prev,
      questions: defaultQuestions
    }));
  }, []);

  // Crear el elemento modal de JSON para mostrar el código
  useEffect(() => {
    // Solo crear el modal si se va a mostrar
    if (showJsonPreview && jsonToSend) {
      // Verificar si hay errores de validación
      const hasErrors = Object.keys(validationErrors).length > 0;
      
      // Verificar si hay errores de validación nuevamente
      // en lugar de confiar en validationErrors que podría estar desactualizado
      const currentErrors: Record<string, string> = {};
      
      // Validaciones básicas para determinar si el formulario tiene errores
      // Esto es una versión simplificada de validateForm() para el modal
      const data = JSON.parse(jsonToSend);
      
      // Solo verificamos si hay preguntas y si tienen títulos para simplificar
      const hasQuestions = data.questions && data.questions.length > 0;
      const hasInvalidQuestions = hasQuestions && data.questions.some(
        (q: any) => !q.title || q.title.trim() === ''
      );
      
      // Determinar si tiene errores críticos que impidan el envío
      const hasValidationErrors = hasErrors || !hasQuestions || hasInvalidQuestions;
      
      // Función para determinar si una pregunta ha sido modificada desde su estado predeterminado
      const isQuestionModified = (question: any) => {
        // Buscar la pregunta correspondiente en DEFAULT_QUESTIONS
        const defaultQuestion = DEFAULT_QUESTIONS.find(q => q.id === question.id);
        
        // Si no existe en las predeterminadas, es nueva (modificada)
        if (!defaultQuestion) return true;
        
        // Comprobar si el título ha cambiado
        if (defaultQuestion.title !== question.title) return true;
        
        // Comprobar si tiene archivos (las preguntas predeterminadas no tienen)
        if (question.files && question.files.length > 0) return true;
        
        // Comprobar si las opciones han cambiado (para preguntas de elección)
        if (question.choices && defaultQuestion.choices) {
          // Si el número de opciones es diferente, está modificada
          if (question.choices.length !== defaultQuestion.choices.length) return true;
          
          // Verificar cada opción
          for (let i = 0; i < question.choices.length; i++) {
            if (question.choices[i].text !== defaultQuestion.choices[i].text) return true;
          }
        }
        
        // Para escala lineal, comprobar la configuración de la escala
        if (question.type === 'linear_scale' && question.scaleConfig && defaultQuestion.scaleConfig) {
          if (
            question.scaleConfig.startValue !== defaultQuestion.scaleConfig.startValue ||
            question.scaleConfig.endValue !== defaultQuestion.scaleConfig.endValue ||
            question.scaleConfig.startLabel !== defaultQuestion.scaleConfig.startLabel ||
            question.scaleConfig.endLabel !== defaultQuestion.scaleConfig.endLabel
          ) {
            return true;
          }
        }
        
        // Si no se detectó ningún cambio, no está modificada
        return false;
      };
      
      // Función para renderizar una pregunta en formato HTML
      const renderQuestion = (question: any) => {
        const isModified = isQuestionModified(question);
        const colorClass = isModified ? 'blue' : 'red';
        
        // Determinar si la pregunta requiere archivos
        const requiresFiles = ['navigation_flow', 'preference_test'].includes(question.type);
        const hasFiles = question.files && question.files.length > 0;
        
        // Función para renderizar los booleanos de forma atractiva
        const renderBoolean = (value: boolean) => {
          return `<span class="boolean-value ${value ? 'boolean-true' : 'boolean-false'}">${value ? '✓ Sí' : '✗ No'}</span>`;
        };
        
        // Función para renderizar el tipo de pregunta
        const getQuestionTypeLabel = (type: string) => {
          const typeMap: Record<string, string> = {
            'short_text': 'Texto Corto',
            'long_text': 'Texto Largo',
            'single_choice': 'Opción Única',
            'multiple_choice': 'Opción Múltiple',
            'linear_scale': 'Escala Lineal',
            'ranking': 'Ranking',
            'navigation_flow': 'Flujo de Navegación',
            'preference_test': 'Prueba de Preferencia'
          };
          return typeMap[type] || type;
        };
        
        // Renderizar el contenido específico según el tipo de pregunta
        let questionContent = '';
        
        // Para preguntas de elección
        if (['single_choice', 'multiple_choice', 'ranking'].includes(question.type) && question.choices) {
          questionContent += `<div class="question-choices">
            <h4>Opciones:</h4>
            <ul>
              ${question.choices.map((choice: any, index: number) => `
                <li>
                  <strong>${index + 1}.</strong> ${choice.text}
                  ${choice.isQualify ? ' <span class="tag qualify">Califica</span>' : ''}
                  ${choice.isDisqualify ? ' <span class="tag disqualify">Descalifica</span>' : ''}
                </li>
              `).join('')}
            </ul>
          </div>`;
        }
        
        // Para escala lineal
        if (question.type === 'linear_scale' && question.scaleConfig) {
          questionContent += `<div class="question-scale">
            <h4>Configuración de escala:</h4>
            <div class="scale-visualization">
              <div class="scale-start">${question.scaleConfig.startLabel || ''} (${question.scaleConfig.startValue})</div>
              <div class="scale-line">
                ${Array.from({ length: question.scaleConfig.endValue - question.scaleConfig.startValue + 1 }, (_, i) => 
                  `<div class="scale-point">${question.scaleConfig.startValue + i}</div>`
                ).join('')}
              </div>
              <div class="scale-end">${question.scaleConfig.endLabel || ''} (${question.scaleConfig.endValue})</div>
            </div>
          </div>`;
        }
        
        // Para preguntas con archivos
        if (['navigation_flow', 'preference_test'].includes(question.type) && question.files && question.files.length > 0) {
          // Comprobar si es preference_test y tiene menos de 2 imágenes
          let warningMessage = '';
          if (question.type === 'preference_test' && question.files.length < 2) {
            warningMessage = `
              <div class="incomplete-preference">
                ⚠️ Advertencia: Esta prueba de preferencia tiene ${question.files.length} imagen(es). 
                Idealmente debería tener 2 imágenes para comparar.
              </div>
            `;
          }

          questionContent += `<div class="question-files">
            <h4>Archivos (${question.files.length}):</h4>
            <div class="files-grid">
              ${question.files.map((file: any) => `
                <div class="file-card">
                  <div class="file-image-container">
                    ${file.url ? `<img src="${file.url}" alt="${file.name}" class="file-image" />` : ''}
                  </div>
                  <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">${(file.size / 1024).toFixed(2)} KB</div>
                  </div>
                </div>
              `).join('')}
            </div>
            ${warningMessage}
          </div>`;
        } else if (requiresFiles && !hasFiles) {
          // Mostrar mensaje si la pregunta requiere archivos pero no tiene ninguno
          questionContent += `<div class="file-missing-warning">
            <p>⚠️ Esta pregunta requiere archivos, pero no se ha subido ninguno.</p>
            <p>La pregunta será omitida al guardar si es obligatoria.</p>
          </div>`;
        }
        
        // HTML para la pregunta completa
        return `
          <div class="question-card question-${colorClass}">
            <div class="question-header">
              <div class="question-id" data-id="${question.id}">ID: ${question.id}</div>
              <div class="question-type">
                Tipo: ${getQuestionTypeLabel(question.type)}
                ${requiresFiles ? `<span class="requires-files-tag">${hasFiles ? '✓' : '⚠️'} Requiere imágenes</span>` : ''}
              </div>
            </div>
            <div class="question-body">
              <h3 class="question-title">${question.title}</h3>
              ${questionContent}
            </div>
            <div class="question-footer">
              <div class="question-properties">
                <div class="property">
                  <span class="property-label">Requerido:</span> 
                  ${renderBoolean(question.required)}
                </div>
                <div class="property">
                  <span class="property-label">Mostrar condicionalmente:</span> 
                  ${renderBoolean(question.showConditionally)}
                </div>
                <div class="property">
                  <span class="property-label">Marco de dispositivo:</span> 
                  ${renderBoolean(question.deviceFrame)}
                </div>
              </div>
            </div>
          </div>
        `;
      };
      
      // Generar HTML para todas las preguntas
      const questionsHtml = data.questions.map(renderQuestion).join('');
      
      // CSS para el modal de vista previa - añadir estilos para navegación
      const modalStyles = `
        <style>
          .questions-preview {
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding-top: 15px;
          }
          .question-card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
            background: white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            scroll-margin-top: 100px; /* Para el scroll automático */
          }
          .question-blue {
            border-left: 4px solid #3f51b5;
          }
          .question-red {
            border-left: 4px solid #f44336;
          }
          .question-header {
            display: flex;
            justify-content: space-between;
            padding: 10px 15px;
            background: #f5f5f5;
            border-bottom: 1px solid #e0e0e0;
          }
          .question-id {
            font-weight: bold;
            color: #757575;
          }
          .question-type {
            color: #616161;
            font-style: italic;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 5px;
          }
          .requires-files-tag {
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 10px;
            background: #f9f9f9;
            border: 1px solid #e0e0e0;
            color: #616161;
            font-style: normal;
            white-space: nowrap;
          }
          .question-body {
            padding: 15px;
          }
          .question-title {
            margin: 0 0 15px 0;
            font-size: 18px;
            color: #212121;
          }
          .question-footer {
            padding: 10px 15px;
            background: #fafafa;
            border-top: 1px solid #e0e0e0;
          }
          .question-properties {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }
          .property {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          .property-label {
            font-weight: 500;
            color: #616161;
          }
          .boolean-value {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .boolean-true {
            background: #e8f5e9;
            color: #2e7d32;
          }
          .boolean-false {
            background: #ffebee;
            color: #c62828;
          }
          .question-choices ul {
            padding-left: 20px;
            margin: 10px 0;
          }
          .question-choices li {
            margin-bottom: 8px;
          }
          .tag {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 10px;
            font-weight: bold;
          }
          .qualify {
            background: #e3f2fd;
            color: #1565c0;
          }
          .disqualify {
            background: #ffebee;
            color: #c62828;
          }
          .files-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 10px;
          }
          .file-card {
            width: 200px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
            background: white;
          }
          .file-image-container {
            height: 150px;
            overflow: hidden;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .file-image {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          .file-info {
            padding: 10px;
          }
          .file-name {
            font-weight: 500;
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .file-meta {
            margin-top: 4px;
            font-size: 12px;
            color: #757575;
          }
          .scale-visualization {
            margin: 15px 0;
          }
          .scale-line {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            position: relative;
            height: 30px;
            background: #f5f5f5;
            border-radius: 15px;
          }
          .scale-point {
            position: relative;
            padding: 5px 8px;
            background: #e0e0e0;
            border-radius: 50%;
            text-align: center;
            font-weight: bold;
          }
          .scale-start, .scale-end {
            font-size: 14px;
            color: #616161;
          }
          .color-legend {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .color-box {
            width: 16px;
            height: 16px;
            border-radius: 3px;
          }
          .blue-box {
            background: #3f51b5;
          }
          .red-box {
            background: #f44336;
          }
          .yellow-box {
            background: #ffc107;
          }
          /* Estilos específicos para preference_test */
          .preference-test-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .preference-test-label {
            font-weight: 500;
            color: #616161;
          }
          /* Imagen resaltada cuando está seleccionada */
          .file-card.selected {
            border: 2px solid #3f51b5;
            box-shadow: 0 0 5px rgba(63, 81, 181, 0.5);
          }
          /* Estilo para cuando hay menos de 2 imágenes en preference_test */
          .incomplete-preference {
            background-color: #fff8e1;
            border: 1px solid #ffd54f;
            border-radius: 4px;
            padding: 8px 12px;
            margin-top: 10px;
            color: #ef6c00;
            font-size: 13px;
          }
          /* Estilo para advertencia de archivos faltantes */
          .file-missing-warning {
            background-color: #ffebee;
            border: 1px solid #ef9a9a;
            border-radius: 4px;
            padding: 10px 15px;
            margin-top: 10px;
            color: #c62828;
          }
          .file-missing-warning p {
            margin: 5px 0;
          }
          /* Estilos para la navegación de preguntas */
          .question-navigation {
            background: #f5f7fa;
            padding: 12px 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            position: sticky;
            top: 0;
            z-index: 10;
            border: 1px solid #e0e0e0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .question-nav-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 8px;
          }
          .nav-button {
            background: #ffffff;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 5px 10px;
            font-size: 12px;
            color: #374151;
            cursor: pointer;
            transition: all 0.2s;
          }
          .nav-button:hover {
            background: #f3f4f6;
          }
          .nav-button.active {
            background: #3f51b5;
            color: white;
            border-color: #3f51b5;
          }
        </style>
      `;
      
      // Crear HTML para el modal
      const modalHtml = `
        <div id="jsonPreviewModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
          <div style="background: white; border-radius: 8px; max-width: 95%; width: 900px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.2); overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
              <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Vista previa del formulario</h2>
              <button id="closeJsonModal" style="background: none; border: none; cursor: pointer; font-size: 20px; color: #6b7280;">&times;</button>
            </div>
            
            <div style="padding: 24px; overflow-y: auto; flex-grow: 1; max-height: calc(90vh - 150px);">
              ${hasValidationErrors ? `
                <div style="background-color: #fff5f5; color: #e53e3e; padding: 12px; border: 1px solid #e53e3e; border-radius: 6px; margin-bottom: 16px;">
                  <p style="margin: 0; font-weight: 500;">⚠️ Advertencia: El formulario tiene errores de validación</p>
                  <p style="margin: 6px 0 0; font-size: 14px;">Este formulario contiene errores que deben corregirse antes de continuar.</p>
                </div>
              ` : ''}
              
              <div class="color-legend">
                <div class="legend-item">
                  <div class="color-box blue-box"></div>
                  <span>Pregunta modificada</span>
                </div>
                <div class="legend-item">
                  <div class="color-box red-box"></div>
                  <span>Pregunta sin modificar</span>
                </div>
                <div class="legend-item">
                  <div class="color-box yellow-box"></div>
                  <span>Pregunta que no se enviará (sin archivos)</span>
                </div>
              </div>
              
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">
                Esta es una vista previa del formulario que se enviará. Revise los datos antes de continuar.
              </p>
              
              <!-- Índice de navegación para las preguntas -->
              <div class="question-navigation">
                <strong>Ir a pregunta:</strong>
                <div class="question-nav-buttons">
                  ${data.questions.map((q: any, index: number) => `
                    <button class="nav-button" data-question="${q.id}">
                      ${q.id}
                    </button>
                  `).join('')}
                </div>
              </div>
              
              <div class="questions-preview">
                ${questionsHtml}
              </div>
              
              <div style="margin-top: 20px;">
                <button id="showRawJson" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 16px; font-weight: 500; cursor: pointer;">Ver JSON</button>
                <div id="jsonContent" style="display: none; margin-top: 15px;">
                  <pre style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; overflow: auto; max-height: 300px; font-family: monospace; font-size: 14px; white-space: pre-wrap; word-break: break-word;">${jsonToSend.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                </div>
              </div>
            </div>
            
            <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px;">
              <button id="cancelJsonAction" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 16px; font-weight: 500; cursor: pointer;">Cerrar</button>
              ${!hasValidationErrors ? `
                <button id="continueJsonAction" style="background: #3f51b5; color: white; border: none; border-radius: 6px; padding: 8px 16px; font-weight: 500; cursor: pointer;">
                  ${pendingAction === 'save' ? 'Guardar' : 'Previsualizar'}
                </button>
              ` : ''}
            </div>
          </div>
        </div>
        ${modalStyles}
      `;
      
      // Crear elemento en el DOM
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = modalHtml;
      document.body.appendChild(modalContainer);
      
      // Configurar eventos
      document.getElementById('closeJsonModal')?.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
        closeJsonModal();
      });
      
      document.getElementById('cancelJsonAction')?.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
        closeJsonModal();
      });
      
      // Configurar los botones de navegación
      const navButtons = document.querySelectorAll('.nav-button');
      navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const questionId = (e.currentTarget as HTMLElement).getAttribute('data-question');
          if (questionId) {
            // Buscar la pregunta correspondiente
            const questionElement = document.querySelector(`.question-card:has([data-id="${questionId}"])`);
            
            // Si no funciona el selector :has en algunos navegadores, usar esta alternativa
            const allQuestions = document.querySelectorAll('.question-card');
            let targetQuestion = null;
            allQuestions.forEach(q => {
              if (q.querySelector(`[data-id="${questionId}"]`)) {
                targetQuestion = q;
              }
            });
            
            // Scroll a la pregunta
            const elementToScroll = questionElement || targetQuestion;
            if (elementToScroll) {
              elementToScroll.scrollIntoView({ behavior: 'smooth', block: 'start' });
              
              // Actualizar el botón activo
              navButtons.forEach(btn => btn.classList.remove('active'));
              (e.currentTarget as HTMLElement).classList.add('active');
            }
          }
        });
      });
      
      // Toggle para mostrar/ocultar el JSON crudo
      document.getElementById('showRawJson')?.addEventListener('click', () => {
        const jsonContent = document.getElementById('jsonContent');
        const button = document.getElementById('showRawJson');
        if (jsonContent && button) {
          if (jsonContent.style.display === 'none') {
            jsonContent.style.display = 'block';
            button.textContent = 'Ocultar JSON';
          } else {
            jsonContent.style.display = 'none';
            button.textContent = 'Ver JSON';
          }
        }
      });
      
      // Solo agregar el evento al botón "continuar" si no hay errores de validación
      if (!hasValidationErrors) {
        document.getElementById('continueJsonAction')?.addEventListener('click', () => {
          document.body.removeChild(modalContainer);
          continueWithAction();
        });
      }
      
      // También permitir cerrar haciendo clic fuera del modal
      modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer.firstChild) {
          document.body.removeChild(modalContainer);
          closeJsonModal();
        }
      });
      
      // Limpiar al desmontar
      return () => {
        if (document.body.contains(modalContainer)) {
          document.body.removeChild(modalContainer);
        }
      };
    }
  }, [showJsonPreview, jsonToSend, pendingAction, continueWithAction, closeJsonModal, validationErrors]);

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
    
    // Nuevas propiedades para el modal JSON
    showJsonPreview,
    closeJsonModal
  };
};

export default useCognitiveTaskForm; 