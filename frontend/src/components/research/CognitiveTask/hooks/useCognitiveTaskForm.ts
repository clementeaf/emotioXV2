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
    required: true,
    showConditionally: false,
    files: [],
    deviceFrame: true
  },
  {
    id: '3.8',
    type: 'preference_test' as QuestionType,
    title: '¿Cuál de estos dos diseños prefieres y por qué?',
    required: true,
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
      
      // Validar preguntas que requieren archivos
      if (question.type === 'navigation_flow') {
        if (!question.files || !Array.isArray(question.files) || question.files.length === 0) {
          errors[`question_${question.id}_files`] = `Pregunta ${question.id}: Debe subir al menos una imagen para el flujo de navegación`;
          return;
        }

        // Verificar que todos los archivos tienen s3Key válido
        const hasInvalidFiles = question.files.some(
          file => !file.s3Key || typeof file.s3Key !== 'string' || file.s3Key.trim() === '' ||
          (file as ExtendedUploadedFile).url?.startsWith('blob:') || 
          (file as ExtendedUploadedFile).isLoading || 
          (file as ExtendedUploadedFile).error
        );

        if (hasInvalidFiles) {
          errors[`question_${question.id}_files`] = `Pregunta ${question.id}: Algunas imágenes aún se están cargando o tienen errores. Por favor, espere a que se completen las cargas o elimine los archivos con error`;
          return;
        }
      }
      
      // En la sección de validación para las preguntas de tipo preference_test
      if (question.type === 'preference_test') {
        // Para preference_test, validar que hay archivos y que son válidos
        const allFiles = question.files || [];
        
        // Filtrar archivos que tienen s3Key válida y eliminar duplicados
        const uniqueValidFiles: Array<ExtendedUploadedFile> = [];
        const processedIDs = new Set<string>();
        
        for (const file of allFiles) {
          // Criterio 1: No agregar archivos ya procesados (por ID)
          if (file && file.id && !processedIDs.has(file.id)) {
            // Criterio 2: Solo agregar archivos completamente procesados
            if (
              file && 
              file.s3Key && 
              typeof file.s3Key === 'string' && 
              file.s3Key.trim() !== '' && 
              !(file as ExtendedUploadedFile).url.startsWith('blob:') &&
              !(file as ExtendedUploadedFile).isLoading &&
              !(file as ExtendedUploadedFile).error &&
              !processedIDs.has(file.id)
            ) {
              uniqueValidFiles.push(file);
              processedIDs.add(file.id);
            }
          }
        }
        
        // Si encontramos duplicados o archivos inválidos, actualizar los archivos de la pregunta
        if (uniqueValidFiles.length !== allFiles.length) {
          const updatedQuestions = [...formData.questions];
          const questionIndex = updatedQuestions.findIndex(q => q.id === question.id);
          if (questionIndex !== -1) {
            updatedQuestions[questionIndex].files = uniqueValidFiles;
            setFormData(prev => ({
              ...prev,
              questions: updatedQuestions
            }));
          }
        }
        
        // Validar número de archivos - ERROR solo si no hay ninguna imagen válida
        if (uniqueValidFiles.length < 1) {
          errors[`question_${question.id}_files`] = `Pregunta ${question.id}: Debe subir al menos una imagen para la prueba de preferencia`;
          return;
        }

        // En lugar de error, mostrar advertencias para casos no ideales
        if (uniqueValidFiles.length === 1) {
          console.warn(`[validateForm] Advertencia: La prueba de preferencia ${question.id} tiene solo 1 imagen válida. Se recomienda tener 2 imágenes.`);
          toast.success(`Pregunta ${question.id}: La prueba de preferencia se guardará con solo 1 imagen.`);
        } else if (uniqueValidFiles.length > 2) {
          console.warn(`[validateForm] Advertencia: La prueba de preferencia ${question.id} tiene ${uniqueValidFiles.length} imágenes válidas (se usarán solo las 2 primeras).`);
          toast.success(`Pregunta ${question.id}: La prueba de preferencia solo necesita 2 imágenes. Se usarán las 2 primeras.`);
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
    setJsonToSend(JSON.stringify(json, null, 2));
    setPendingAction(action);
    setShowJsonPreview(true);
  }, []);

  // Función para cerrar el modal JSON
  const closeJsonModal = useCallback(() => {
    setShowJsonPreview(false);
    setPendingAction(null);
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

    // Construir el objeto que coincida exactamente con CognitiveTaskFormData de shared/interfaces
    const dataToSave: CognitiveTaskFormData = {
      researchId: researchId || '',
      questions: formData.questions.map(question => {
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
        
        // Agregar archivos solo para tipos específicos y si existen
        if (['navigation_flow', 'preference_test'].includes(question.type) && question.files) {
          // Filtrar archivos que tienen s3Key válida y eliminar duplicados
          const uniqueValidFiles: Array<{
            id: string;
            name: string;
            size: number;
            type: string;
            url: string;
            s3Key: string;
          }> = [];
          const processedS3Keys = new Set();
          
          for (const file of question.files) {
            if (
              file && 
              file.s3Key && 
              typeof file.s3Key === 'string' && 
              file.s3Key.trim() !== '' && 
              !(file as ExtendedUploadedFile).url.startsWith('blob:') &&
              !(file as ExtendedUploadedFile).isLoading &&
              !(file as ExtendedUploadedFile).error &&
              !processedS3Keys.has(file.s3Key)
            ) {
              uniqueValidFiles.push({
                id: file.id,
                name: file.name,
                size: Number(file.size),
                type: file.type,
                url: file.url,
                s3Key: file.s3Key
              });
              
              // Marcar este s3Key como procesado
              processedS3Keys.add(file.s3Key);
            }
          }
          
          // Log detallado de archivos
          console.log(`[useCognitiveTaskForm] Procesando archivos para pregunta ${question.id} (${question.type}):`);
          console.log('- Total archivos:', question.files.length);
          console.log('- Archivos únicos válidos:', uniqueValidFiles.length);
          console.log('- S3Keys procesadas:', Array.from(processedS3Keys));
          
          question.files.forEach((f: ExtendedUploadedFile, i) => {
            console.log(`  Archivo ${i+1}:`, { 
              id: f.id, 
              name: f.name, 
              hasS3Key: !!f.s3Key, 
              s3Key: f.s3Key,
              url: f.url?.substring(0, 50) + '...',
              isBlob: f.url?.startsWith('blob:'),
              isLoading: f.isLoading,
              hasError: f.error,
              isDuplicate: f.s3Key && processedS3Keys.has(f.s3Key) && !uniqueValidFiles.some(vf => vf.id === f.id)
            });
          });
          
          // Asignar archivos validados
          cleanQuestion.files = uniqueValidFiles;
          
          // Advertencia si no hay archivos válidos para tipos que los requieren
          if (uniqueValidFiles.length === 0) {
            console.warn(`[useCognitiveTaskForm] Advertencia: No hay archivos válidos para la pregunta ${question.id} (${question.type})`);
            // No añadir files vacío al objeto si no hay archivos válidos
            delete cleanQuestion.files;
          }
          
          // Advertencia específica para preference_test
          if (question.type === 'preference_test') {
            // Log de diagnóstico
            console.log(`[useCognitiveTaskForm] Validando prueba de preferencia ${question.id} con ${uniqueValidFiles.length} imágenes válidas`);
            
            // Si hay menos de 1 imagen, mostrar advertencia pero continuar
            if (uniqueValidFiles.length < 1) {
              console.warn(`[useCognitiveTaskForm] Advertencia: La prueba de preferencia ${question.id} no tiene imágenes válidas`);
            } 
            // Si hay solo 1 imagen, mostrar advertencia pero continuar
            else if (uniqueValidFiles.length === 1) {
              console.warn(`[useCognitiveTaskForm] Advertencia: La prueba de preferencia ${question.id} debería tener 2 imágenes, pero solo tiene 1`);
              toast.success('La prueba de preferencia se guardará con solo 1 imagen. Recuerda añadir la segunda imagen más tarde.');
            } 
            // Si hay más de 2, limitamos a 2
            else if (uniqueValidFiles.length > 2) {
              console.warn(`[useCognitiveTaskForm] Advertencia: La prueba de preferencia ${question.id} tiene ${uniqueValidFiles.length} imágenes. Se limitará a las 2 primeras.`);
              cleanQuestion.files = uniqueValidFiles.slice(0, 2);
            }
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
    const isValid = validateForm();
    
    // Mostrar modal con JSON en lugar de guardar directamente
    showJsonModal(dataToSave, 'save');
    
    // Solo mostramos la alerta de validación pero permitimos ver el JSON
    if (!isValid) {
      toast.error('Hay errores de validación en el formulario. Verifique los campos marcados.');
    }
  }, [isAuthenticated, showModal, validateForm, formData, showJsonModal, researchId, toast]);

  // Función para continuar con la acción después de mostrar el JSON
  const continueWithAction = useCallback(() => {
    closeJsonModal();
    
    if (pendingAction === 'save') {
      // Ejecutar la mutación para guardar
      try {
        // Parsear el JSON que se mostró en el modal
        const dataToSaveObj = JSON.parse(jsonToSend);
        
        // Verificaciones adicionales antes de enviar
        const hasInvalidQuestions = dataToSaveObj.questions.some((q: any) => {
          // Para tipos que requieren archivos, verificar que estén correctamente formados
          if (['navigation_flow', 'preference_test'].includes(q.type)) {
            // Si no tiene la propiedad files o está vacía
            if (!q.files || !Array.isArray(q.files) || q.files.length === 0) {
              console.error(`[useCognitiveTaskForm] Error: La pregunta ${q.id} (${q.type}) no tiene archivos`);
              return true;
            }
            
            // Verificar que todos los archivos tengan s3Key válida
            const validFiles = q.files.filter((f: any) => f && f.s3Key && typeof f.s3Key === 'string');
            
            if (validFiles.length !== q.files.length) {
              console.error(`[useCognitiveTaskForm] Error: La pregunta ${q.id} (${q.type}) tiene archivos sin s3Key válida`);
              return true;
            }
            
            // Verificación específica para preference_test
            if (q.type === 'preference_test') {
              if (validFiles.length < 1) {
                // Error solo si no hay imágenes
                console.error(`[useCognitiveTaskForm] Error: La prueba de preferencia requiere al menos 1 imagen, pero no tiene ninguna`);
                return true;
              } else if (validFiles.length === 1) {
                // Advertencia si solo hay 1 imagen, pero permitimos continuar
                console.warn(`[useCognitiveTaskForm] Advertencia: La prueba de preferencia debería tener 2 imágenes, pero solo tiene 1. Se permitirá guardar de todas formas.`);
                toast.success('La prueba de preferencia se guardará con solo 1 imagen. Recuerda añadir la segunda imagen más tarde.');
              } else if (validFiles.length > 2) {
                // Si hay más de 2, las limitamos automáticamente y continuamos
                console.warn(`[useCognitiveTaskForm] Advertencia: La prueba de preferencia tiene ${validFiles.length} imágenes. Se limitará a las 2 primeras.`);
                q.files = validFiles.slice(0, 2);
              }
            }
            
            if (q.type === 'navigation_flow' && validFiles.length === 0) {
              console.error(`[useCognitiveTaskForm] Error: El flujo de navegación requiere al menos 1 imagen`);
              return true;
            }
          }
          return false;
        });
        
        if (hasInvalidQuestions) {
          toast.error('Hay problemas con los archivos. Verifica que todas las imágenes estén completamente cargadas.');
          showModal({
            title: 'Error en archivos',
            message: 'Algunas imágenes no están correctamente procesadas. Asegúrate de que todas las imágenes estén completamente cargadas antes de guardar.',
            type: 'error'
          });
          return;
        }
        
        // Log detallado antes de enviar
        console.log('[useCognitiveTaskForm] Guardando con nueva API - Datos finales:', dataToSaveObj);
        
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

  // Previsualizar formulario (modificado para mostrar JSON primero)
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
    
    // Preparar datos para previsualizar
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
      const hasValidationErrors = !hasQuestions || hasInvalidQuestions;
      
      // Crear HTML para el modal
      const modalHtml = `
        <div id="jsonPreviewModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
          <div style="background: white; border-radius: 8px; max-width: 90%; width: 800px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.2); overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
              <h2 style="margin: 0; font-size: 18px; font-weight: 600;">JSON a enviar</h2>
              <button id="closeJsonModal" style="background: none; border: none; cursor: pointer; font-size: 20px; color: #6b7280;">&times;</button>
            </div>
            <div style="padding: 24px; overflow-y: auto; flex-grow: 1;">
              ${hasValidationErrors ? `
                <div style="background-color: #fff5f5; color: #e53e3e; padding: 12px; border: 1px solid #e53e3e; border-radius: 6px; margin-bottom: 16px;">
                  <p style="margin: 0; font-weight: 500;">⚠️ Advertencia: El formulario tiene errores de validación</p>
                  <p style="margin: 6px 0 0; font-size: 14px;">Este JSON se muestra solo con fines informativos pero no puede ser enviado hasta corregir los errores.</p>
                </div>
              ` : ''}
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">
                Este es el JSON que se enviará al servidor. Revise los datos antes de continuar.
              </p>
              <pre style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; overflow: auto; max-height: 400px; font-family: monospace; font-size: 14px; white-space: pre-wrap; word-break: break-word;">${jsonToSend.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
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
  }, [showJsonPreview, jsonToSend, pendingAction, continueWithAction, closeJsonModal]);

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