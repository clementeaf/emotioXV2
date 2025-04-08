import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { 
  CognitiveTaskFormData,
  Question,
  ValidationErrors,
  ErrorModalData,
  QuestionType,
  UseCognitiveTaskFormResult
} from '../types';
import { 
  QUERY_KEYS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES
} from '../constants';
import { useAuth } from '@/providers/AuthProvider';
import { s3Service } from '@/services';
import { cognitiveTaskFixedAPI } from '@/lib/cognitive-task-api';

// Definir los tipos que faltan localmente si no están en ../types
// CognitiveTaskFormData
interface CognitiveTaskFormData {
  researchId: string;
  questions: Question[];
  randomizeQuestions: boolean;
  [key: string]: any;
}

// ValidationErrors
interface ValidationErrors {
  [key: string]: string;
}

// QuestionType
type QuestionType = 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'linear_scale' | 'ranking' | 'navigation_flow' | 'preference_test';

// Definición local para reemplazar DEFAULT_COGNITIVE_TASK
const DEFAULT_COGNITIVE_TASK: CognitiveTaskFormData = {
  researchId: '',
  questions: [],
  randomizeQuestions: false
};

// Definiciones locales para QUESTION_TYPES y QUESTION_TEMPLATES
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

// Plantillas para nuevas preguntas con valores por defecto para propiedades obligatorias
const QUESTION_TEMPLATES: Record<QuestionType, Partial<Question>> = {
  short_text: {
    type: 'short_text',
    title: 'Nueva Pregunta',
    required: true,
    showConditionally: false,
    deviceFrame: false
  },
  long_text: {
    type: 'long_text',
    title: 'Nueva Pregunta',
    required: true,
    showConditionally: false,
    deviceFrame: false
  },
  single_choice: {
    type: 'single_choice',
    title: 'Nueva Pregunta',
    required: true,
    showConditionally: false,
    deviceFrame: false,
    choices: [
      { id: '1', text: 'Opción 1', isQualify: false, isDisqualify: false },
      { id: '2', text: 'Opción 2', isQualify: false, isDisqualify: false },
      { id: '3', text: 'Opción 3', isQualify: false, isDisqualify: false }
    ]
  },
  multiple_choice: {
    type: 'multiple_choice',
    title: 'Nueva Pregunta',
    required: true,
    showConditionally: false,
    deviceFrame: false,
    choices: [
      { id: '1', text: 'Opción 1', isQualify: false, isDisqualify: false },
      { id: '2', text: 'Opción 2', isQualify: false, isDisqualify: false },
      { id: '3', text: 'Opción 3', isQualify: false, isDisqualify: false }
    ]
  },
  linear_scale: {
    type: 'linear_scale',
    title: 'Nueva Pregunta',
    required: true,
    showConditionally: false,
    deviceFrame: false,
    scaleConfig: {
      startValue: 1,
      endValue: 5
    }
  },
  ranking: {
    type: 'ranking',
    title: 'Nueva Pregunta',
    required: true,
    showConditionally: false,
    deviceFrame: false,
    choices: [
      { id: '1', text: 'Opción 1', isQualify: false, isDisqualify: false },
      { id: '2', text: 'Opción 2', isQualify: false, isDisqualify: false },
      { id: '3', text: 'Opción 3', isQualify: false, isDisqualify: false }
    ]
  },
  navigation_flow: {
    type: 'navigation_flow',
    title: 'Nueva Pregunta',
    required: true,
    showConditionally: false,
    deviceFrame: false,
    files: []
  },
  preference_test: {
    type: 'preference_test',
    title: 'Nueva Pregunta',
    required: true, 
    showConditionally: false,
    deviceFrame: false,
    files: []
  }
};

// Definición local de preguntas predeterminadas según las imágenes Figma
const DEFAULT_QUESTIONS: Question[] = [
  {
    id: '3.1',
    type: 'short_text',
    title: '¿Cuál es tu primera impresión sobre la navegación del sitio?',
    required: true,
    showConditionally: false,
    deviceFrame: false
  },
  {
    id: '3.2',
    type: 'long_text',
    title: 'Describe detalladamente tu experiencia al intentar completar la tarea asignada.',
    required: true,
    showConditionally: false,
    deviceFrame: false
  },
  {
    id: '3.3',
    type: 'single_choice',
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
    type: 'multiple_choice',
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
    type: 'linear_scale',
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
    type: 'ranking',
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
    type: 'navigation_flow',
    title: 'Observa la siguiente imagen del flujo de navegación y describe cualquier problema que encuentres:',
    required: true,
    showConditionally: false,
    files: [],
    deviceFrame: true
  },
  {
    id: '3.8',
    type: 'preference_test',
    title: '¿Cuál de estos dos diseños prefieres y por qué?',
    required: true,
    showConditionally: false,
    files: [],
    deviceFrame: true
  }
];

// Corregir la definición de CognitiveTaskFormProps para incluir onSave
interface CognitiveTaskFormProps {
  className?: string;
  researchId?: string;
  onSave?: (data: any) => void;
}

/**
 * Hook personalizado para gestionar la lógica del formulario de tareas cognitivas
 */
export const useCognitiveTaskForm = (researchId?: string): UseCognitiveTaskFormResult => {
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

  // Función para guardar archivos en localStorage
  const saveFilesToLocalStorage = useCallback((questions: Question[]) => {
    if (!researchId) return;
    
    try {
      // Generar un objeto con archivos organizados por pregunta
      const filesMap: Record<string, any[]> = {};
      
      questions.forEach(question => {
        if (question.files && question.files.length > 0) {
          filesMap[question.id] = question.files;
        }
      });
      
      // Almacenar en localStorage
      const storageKey = `cognitive_task_temp_files_${researchId}`;
      localStorage.setItem(storageKey, JSON.stringify(filesMap));
      
      console.log('[useCognitiveTaskForm] Archivos guardados temporalmente en localStorage');
    } catch (error) {
      console.error('[useCognitiveTaskForm] Error al guardar archivos en localStorage:', error);
    }
  }, [researchId]);

  // Mutación para guardar datos
  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: async (data: CognitiveTaskFormData) => {
      if (!isAuthenticated) {
        throw new Error('No autenticado: Se requiere un token de autenticación');
      }

      try {
        console.log('[useCognitiveTaskForm] Guardando datos:', data);
        
        // Usar la nueva API que decide internamente entre crear o actualizar
        return await cognitiveTaskFixedAPI.createOrUpdateByResearchId(
          researchId || '', // Aseguramos que researchId no sea undefined
          data
        ).send();
      } catch (error: any) {
        console.error('[useCognitiveTaskForm] Error al guardar:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('[useCognitiveTaskForm] Datos guardados con éxito:', data);
      
      if (data && data.id) {
        setCognitiveTaskId(data.id);
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

  // Cargar datos desde localStorage si existen
  useEffect(() => {
    if (researchId) {
      // Intentar recuperar archivos guardados temporalmente
      const storageKey = `cognitive_task_temp_files_${researchId}`;
      const savedFilesJson = localStorage.getItem(storageKey);
      
      if (savedFilesJson) {
        try {
          const savedFiles = JSON.parse(savedFilesJson);
          console.log('[useCognitiveTaskForm] Recuperando archivos temporales de localStorage:', savedFiles);
          
          // Actualizar el estado con los archivos recuperados
          setFormData(prevData => {
            const updatedQuestions = prevData.questions.map(question => {
              // Buscar archivos para esta pregunta en particular
              const questionFiles = savedFiles[question.id] || [];
              
              if (questionFiles.length > 0) {
                // Combinar archivos existentes con los recuperados, evitando duplicados
                const existingFileIds = question.files?.map(f => f.id) || [];
                const newFiles = questionFiles.filter(f => !existingFileIds.includes(f.id));
                
                return {
                  ...question,
                  files: [...(question.files || []), ...newFiles]
                };
              }
              
              return question;
            });
            
            return {
              ...prevData,
              questions: updatedQuestions
            };
          });
        } catch (error) {
          console.error('[useCognitiveTaskForm] Error al recuperar archivos de localStorage:', error);
        }
      }
    }
  }, [researchId]);

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
      const tempFile = {
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
                    files: q.files?.map(f => 
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
          const updatedFormData = {
            ...prevData,
            questions: prevData.questions.map(q =>
              q.id === questionId
                ? {
                    ...q,
                    files: q.files 
                      ? q.files.map(f => f.id === tempFileId ? { ...uploadedFile, isLoading: false, progress: 100 } : f)
                      : [uploadedFile]
                  }
                : q
            )
          };
          
          // Guardar en localStorage para persistencia temporal
          saveFilesToLocalStorage(updatedFormData.questions);
          
          return updatedFormData;
        });
        
        toast.success(`Archivo subido exitosamente: ${file.name}`);
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
                files: q.files?.filter(f => !f.isLoading)
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
  }, [researchId, showModal, saveFilesToLocalStorage]);

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
                    files: q.files?.map(f => 
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
                files: q.files?.filter(f => !f.isLoading)
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
      // Buscar el archivo a eliminar para obtener su clave S3
      const question = formData.questions.find(q => q.id === questionId);
      const file = question?.files?.find(f => f.id === fileId);
      
      if (file && file.s3Key) {
        // Llamar al servicio para eliminar el archivo
        await s3Service.deleteFile(file.s3Key);
        
        // Eliminar el archivo del estado local
        setFormData(prevData => {
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
        
        toast.success('Archivo eliminado exitosamente');
      }
    } catch (error) {
      console.error('[useCognitiveTaskForm] Error al eliminar archivo:', error);
      toast.error('Error al eliminar archivo');
    }
  }, [formData.questions]);

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
    const errors: Record<string, string> = {};
    
    // Validar researchId
    if (!researchId) {
      errors.researchId = 'El ID de investigación es obligatorio';
    }
    
    // Validar que haya al menos una pregunta
    if (!formData.questions || formData.questions.length === 0) {
      errors.questions = 'Debe agregar al menos una pregunta';
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
        hasFiles: question.files?.length > 0,
        hasChoices: question.choices?.length > 0
      });
      
      // Validar título
      if (!question.title?.trim()) {
        errors[`question_${index}_title`] = 'El título de la pregunta es obligatorio';
      }
      
      // Validar opciones para preguntas de elección
      if (['single_choice', 'multiple_choice', 'ranking'].includes(question.type)) {
        if (!question.choices || question.choices.length === 0) {
          errors[`question_${index}_choices`] = 'Debe agregar al menos una opción';
        } else {
          // Validar que cada opción tenga texto
          question.choices.forEach((choice, choiceIndex) => {
            if (!choice.text?.trim()) {
              errors[`question_${index}_choice_${choiceIndex}`] = 'El texto de la opción es obligatorio';
            }
          });
        }
      }
      
      // Validar configuración de escala para preguntas de escala lineal
      if (question.type === 'linear_scale' && question.scaleConfig) {
        const { startValue, endValue } = question.scaleConfig;
        
        // Validar valores inicial y final
        if (startValue === undefined || startValue === null) {
          errors[`question_${index}_scale_start`] = 'El valor inicial de la escala es obligatorio';
        }
        
        if (endValue === undefined || endValue === null) {
          errors[`question_${index}_scale_end`] = 'El valor final de la escala es obligatorio';
        }
        
        if (startValue !== undefined && endValue !== undefined && startValue >= endValue) {
          errors[`question_${index}_scale`] = 'El valor inicial debe ser menor que el valor final';
        }
      }
      
      // Validar preguntas que requieren archivos
      if (['navigation_flow', 'preference_test'].includes(question.type)) {
        if (!question.files || question.files.length === 0) {
          errors[`question_${index}_files`] = 'Debe subir al menos un archivo';
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

    // Procesar datos para enviar y asegurarse de que no hay propiedades inválidas
    const dataToSave = {
      ...formData,
      metadata: {
        version: '1.0.0',
        updatedAt: new Date().toISOString()
      }
    };
    
    // Preparar los datos antes de enviar:
    // 1. Eliminar propiedades temporales en los archivos que no deben ir al backend
    const cleanedData = {
      ...dataToSave,
      questions: dataToSave.questions.map(question => {
        // Crear una copia de la pregunta
        const cleanQuestion = { ...question };
        
        // Limpiar archivos si existen
        if (cleanQuestion.files && cleanQuestion.files.length > 0) {
          cleanQuestion.files = cleanQuestion.files.map(file => {
            // Solo mantener propiedades necesarias para el backend
            return {
              id: file.id,
              name: file.name,
              size: file.size,
              type: file.type,
              url: file.url,
              s3Key: file.s3Key
            };
          });
        }
        
        // Retornar pregunta limpia
        return cleanQuestion;
      })
    };
    
    console.log('Datos limpiados para enviar:', cleanedData);
    
    // Verificar si hay errores de validación
    const isValid = validateForm();
    
    // Mostrar modal con JSON en lugar de guardar directamente
    // Incluso si hay errores de validación, mostramos el modal JSON
    showJsonModal(cleanedData, 'save');
    
    // Solo mostramos la alerta de validación pero permitimos ver el JSON
    if (!isValid) {
      toast.error('Hay errores de validación, pero puedes ver el JSON que se enviaría');
    }
  }, [isAuthenticated, showModal, validateForm, formData, showJsonModal]);

  // Función para continuar con la acción después de mostrar el JSON
  const continueWithAction = useCallback(() => {
    closeJsonModal();
    
    if (pendingAction === 'save') {
      // Ejecutar la mutación para guardar
      try {
        const dataToSaveObj = JSON.parse(jsonToSend);
        
        // Validaciones adicionales antes de enviar
        const dataPrepared = {
          ...dataToSaveObj,
          // Asegurarnos de que researchId esté presente
          researchId: researchId || dataToSaveObj.researchId,
          // Limpiar preguntas con archivos para asegurar que tienen s3Key
          questions: dataToSaveObj.questions.map(question => {
            // Si la pregunta tiene archivos, debemos asegurarnos de que tienen s3Key
            if (['navigation_flow', 'preference_test'].includes(question.type) && 
                question.files && question.files.length > 0) {
              
              // Filtrar solo archivos válidos con s3Key
              const validFiles = question.files.filter(file => 
                file && file.s3Key && file.url && !file.url.startsWith('blob:')
              );
              
              return {
                ...question,
                files: validFiles
              };
            }
            
            return question;
          })
        };
        
        console.log('[useCognitiveTaskForm] Enviando datos validados al backend:', dataPrepared);
        mutate(dataPrepared);
      } catch (error) {
        console.error('[useCognitiveTaskForm] Error al procesar JSON:', error);
        toast.error('Error al procesar los datos del formulario');
      }
    } else if (pendingAction === 'preview') {
      // Mostrar mensaje de previsualización
      showModal({
        title: 'Información',
        message: SUCCESS_MESSAGES.PREVIEW_COMING_SOON,
        type: 'info'
      });
      
      toast.success(SUCCESS_MESSAGES.PREVIEW_COMING_SOON);
    }
  }, [jsonToSend, pendingAction, mutate, showModal, closeJsonModal, researchId]);

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