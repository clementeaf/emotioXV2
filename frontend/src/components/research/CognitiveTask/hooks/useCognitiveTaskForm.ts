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
  DEFAULT_COGNITIVE_TASK,
  UseCognitiveTaskFormResult,
  UploadedFile
} from '../types';
import { 
  QUERY_KEYS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES,
  QUESTION_TYPES,
  QUESTION_TEMPLATES
} from '../constants';
import { useAuth } from '@/providers/AuthProvider';
import { s3Service } from '@/services';

// TODO: Implementar un servicio real de API para tareas cognitivas
// Este es un mock temporal
const mockCognitiveTaskAPI = {
  getByResearchId: async (researchId: string) => {
    console.log(`[MOCK] Fetching cognitive task for research: ${researchId}`);
    // Simulamos que no existe el recurso
    return { data: null, notFound: true };
  },
  create: async (data: CognitiveTaskFormData) => {
    console.log(`[MOCK] Creating cognitive task:`, data);
    return { ...data, id: uuidv4() };
  },
  update: async (id: string, data: CognitiveTaskFormData) => {
    console.log(`[MOCK] Updating cognitive task ${id}:`, data);
    return { ...data, id };
  }
};

/**
 * Hook personalizado para gestionar la lógica del formulario de tareas cognitivas
 */
export const useCognitiveTaskForm = (researchId?: string): UseCognitiveTaskFormResult => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CognitiveTaskFormData>({
    ...DEFAULT_COGNITIVE_TASK,
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
        // Usar el mock por ahora, luego reemplazar con API real
        const response = await mockCognitiveTaskAPI.getByResearchId(researchId);
        console.log('[useCognitiveTaskForm] Respuesta de API:', response);
        return response;
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

  // Mutación para guardar datos
  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: async (data: CognitiveTaskFormData) => {
      try {
        if (!isAuthenticated || !token) {
          throw new Error('No autenticado: Se requiere un token de autenticación');
        }
        
        console.log('[useCognitiveTaskForm] Datos a guardar:', JSON.stringify(data, null, 2));
        
        // Usar el mock por ahora, luego reemplazar con API real
        if (cognitiveTaskId) {
          console.log(`[useCognitiveTaskForm] Actualizando Cognitive Task con ID: ${cognitiveTaskId}`);
          return await mockCognitiveTaskAPI.update(cognitiveTaskId, data);
        } else {
          console.log('[useCognitiveTaskForm] Creando nuevo Cognitive Task');
          return await mockCognitiveTaskAPI.create(data);
        }
      } catch (error: any) {
        console.error('[useCognitiveTaskForm] Error al guardar:', error);
        throw error;
      }
    },
    onSuccess: (response) => {
      console.log('[useCognitiveTaskForm] Respuesta de guardado:', response);
      
      if (response && response.id) {
        setCognitiveTaskId(response.id);
        console.log('[useCognitiveTaskForm] ID establecido:', response.id);
      }
      
      // Invalidamos la query para recargar datos
      if (researchId) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId] });
      }
      
      // Mostrar mensaje de éxito
      toast.success(SUCCESS_MESSAGES.SAVE_SUCCESS);
    },
    onError: (error: any) => {
      console.error('[useCognitiveTaskForm] Error en mutación:', error);
      
      // Mostrar mensaje de error
      showModal({
        title: ERROR_MESSAGES.SAVE_ERROR,
        message: error.message || 'Ocurrió un error al guardar la configuración',
        type: 'error'
      });
      
      toast.error(ERROR_MESSAGES.SAVE_ERROR);
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
      
      // Actualizar formData con los valores existentes
      setFormData({
        ...DEFAULT_COGNITIVE_TASK,
        ...existingData,
        researchId: researchId || ''
      });
    } else {
      console.log('[useCognitiveTaskForm] No hay datos existentes, usando configuración por defecto');
      setFormData({
        ...DEFAULT_COGNITIVE_TASK,
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
      setIsUploading(true);
      setUploadProgress(0);
      setCurrentFileIndex(0);
      setTotalFiles(1);
      
      // Convertir FileList a Array
      const file = files[0];
      
      console.log(`[useCognitiveTaskForm] Subiendo archivo: ${file.name}`);
      
      // Usar el servicio de S3 para subir el archivo
      const result = await s3Service.uploadFile({
        file,
        researchId,
        folder: 'cognitive-task-files',
        progressCallback: (progress) => {
          setUploadProgress(progress);
          console.log(`[useCognitiveTaskForm] Progreso de carga: ${progress}%`);
        }
      });
      
      if (result) {
        const uploadedFile: UploadedFile = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: result.fileUrl,
          s3Key: result.key
        };
        
        // Agregamos el archivo a la pregunta
        setFormData(prevData => ({
          ...prevData,
          questions: prevData.questions.map(q =>
            q.id === questionId
              ? {
                  ...q,
                  files: q.files ? [...q.files, uploadedFile] : [uploadedFile]
                }
              : q
          )
        }));
        
        toast.success(`Archivo subido exitosamente: ${file.name}`);
      }
    } catch (error) {
      console.error('[useCognitiveTaskForm] Error al subir archivo:', error);
      toast.error('Error al subir archivo');
      
      showModal({
        title: 'Error al subir archivo',
        message: error instanceof Error ? error.message : 'Ocurrió un error inesperado',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  }, [researchId, showModal]);

  // Función para manejar la carga de múltiples archivos
  const handleMultipleFilesUpload = useCallback(async (questionId: string, files: FileList) => {
    if (files.length === 0 || !researchId) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setCurrentFileIndex(0);
      setTotalFiles(files.length);
      
      // Convertir FileList a Array
      const fileArray = Array.from(files);
      const uploadedFiles: UploadedFile[] = [];
      
      // Procesar cada archivo en secuencia
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setCurrentFileIndex(i);
        
        console.log(`[useCognitiveTaskForm] Subiendo archivo ${i+1}/${fileArray.length}: ${file.name}`);
        
        // Usar el servicio de S3 para subir el archivo
        const result = await s3Service.uploadFile({
          file,
          researchId,
          folder: 'cognitive-task-files',
          progressCallback: (progress) => {
            setUploadProgress(progress);
            console.log(`[useCognitiveTaskForm] Progreso de carga (${i+1}/${fileArray.length}): ${progress}%`);
          }
        });
        
        if (result) {
          const uploadedFile: UploadedFile = {
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            url: result.fileUrl,
            s3Key: result.key
          };
          
          uploadedFiles.push(uploadedFile);
        }
      }
      
      // Una vez que todos los archivos se han cargado, actualizar la pregunta con los archivos
      if (uploadedFiles.length > 0) {
        setFormData(prevData => ({
          ...prevData,
          questions: prevData.questions.map(q =>
            q.id === questionId
              ? {
                  ...q,
                  files: q.files 
                    ? [...q.files, ...uploadedFiles]
                    : uploadedFiles
                }
              : q
          )
        }));
        
        toast.success(`${uploadedFiles.length} archivos subidos exitosamente`);
      }
    } catch (error) {
      console.error('[useCognitiveTaskForm] Error al subir archivos múltiples:', error);
      toast.error('Error al subir archivos');
      
      showModal({
        title: 'Error al subir archivos',
        message: error instanceof Error ? error.message : 'Ocurrió un error inesperado',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  }, [researchId, showModal]);

  // Función para eliminar un archivo
  const handleFileDelete = useCallback(async (questionId: string, fileId: string) => {
    try {
      // Buscar el archivo a eliminar para obtener su clave S3
      const question = formData.questions.find(q => q.id === questionId);
      const file = question?.files?.find(f => f.id === fileId);
      
      if (file && file.s3Key) {
        // Eliminar el archivo de S3
        await s3Service.deleteFile(file.s3Key);
        
        // Eliminar el archivo del estado local
        setFormData(prevData => ({
          ...prevData,
          questions: prevData.questions.map(q =>
            q.id === questionId && q.files
              ? {
                  ...q,
                  files: q.files.filter(f => f.id !== fileId)
                }
              : q
          )
        }));
        
        toast.success('Archivo eliminado exitosamente');
      }
    } catch (error) {
      console.error('[useCognitiveTaskForm] Error al eliminar archivo:', error);
      toast.error('Error al eliminar archivo');
    }
  }, [formData.questions]);

  // Función para agregar una nueva pregunta
  const handleAddQuestion = useCallback((type: QuestionType) => {
    const newQuestionId = uuidv4();
    
    // Obtener la plantilla para este tipo de pregunta
    const template = QUESTION_TEMPLATES[type];
    
    if (!template) {
      console.error(`[useCognitiveTaskForm] No hay plantilla para el tipo: ${type}`);
      return;
    }
    
    // Crear nueva pregunta basada en la plantilla
    const newQuestion: Question = {
      ...template,
      id: newQuestionId,
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

  // Validar formulario
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};
    
    if (!researchId) {
      errors.researchId = ERROR_MESSAGES.VALIDATION_ERRORS.RESEARCH_ID_REQUIRED;
      console.log('[useCognitiveTaskForm] Error de validación: ID de investigación requerido');
    }
    
    if (formData.questions.length === 0) {
      errors.questions = ERROR_MESSAGES.VALIDATION_ERRORS.NO_QUESTIONS;
      console.log('[useCognitiveTaskForm] Error de validación: No hay preguntas');
    }
    
    // Validar cada pregunta
    formData.questions.forEach((question, index) => {
      // Validar título
      if (!question.title.trim()) {
        errors[`question_${index}_title`] = ERROR_MESSAGES.VALIDATION_ERRORS.QUESTION_TITLE_REQUIRED;
      }
      
      // Validar según tipo de pregunta
      if (['single_choice', 'multiple_choice', 'ranking'].includes(question.type)) {
        if (!question.choices || question.choices.length === 0) {
          errors[`question_${index}_choices`] = ERROR_MESSAGES.VALIDATION_ERRORS.CHOICES_REQUIRED;
        } else {
          // Validar que las opciones tengan texto
          question.choices.forEach((choice, choiceIndex) => {
            if (!choice.text.trim()) {
              errors[`question_${index}_choice_${choiceIndex}`] = ERROR_MESSAGES.VALIDATION_ERRORS.CHOICE_TEXT_REQUIRED;
            }
          });
        }
      }
      
      // Validar escala lineal
      if (question.type === 'linear_scale') {
        if (!question.scaleConfig) {
          errors[`question_${index}_scale`] = 'La configuración de escala es obligatoria';
        } else {
          if (question.scaleConfig.startValue >= question.scaleConfig.endValue) {
            errors[`question_${index}_scale`] = 'El valor inicial debe ser menor que el valor final';
          }
        }
      }
      
      // Validar preguntas que requieren archivos
      if (['navigation_flow', 'preference_test'].includes(question.type)) {
        if (!question.files || question.files.length === 0) {
          errors[`question_${index}_files`] = ERROR_MESSAGES.VALIDATION_ERRORS.FILES_REQUIRED;
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, researchId]);

  // Guardar formulario
  const handleSave = useCallback(() => {
    if (!isAuthenticated) {
      showModal({
        title: ERROR_MESSAGES.AUTH_ERROR,
        message: 'No está autenticado. Por favor, inicie sesión para guardar la configuración.',
        type: 'error'
      });
      return;
    }
    
    if (validateForm()) {
      // Guardar los datos del formulario
      mutate({ ...formData, researchId: researchId || '' });
    } else {
      // Crear un mensaje con la lista de errores
      const errorMessageText = 'Errores: ' + Object.values(validationErrors).join(', ');
      
      showModal({
        title: ERROR_MESSAGES.SAVE_ERROR,
        message: errorMessageText,
        type: 'error'
      });
      
      toast.error('Por favor corrija los errores antes de guardar');
    }
  }, [formData, isAuthenticated, mutate, researchId, showModal, validateForm, validationErrors]);

  // Previsualizar formulario
  const handlePreview = useCallback(() => {
    if (!validateForm()) {
      // Crear un mensaje con la lista de errores
      const errorMessageText = 'Errores: ' + Object.values(validationErrors).join(', ');
      
      showModal({
        title: ERROR_MESSAGES.PREVIEW_ERROR,
        message: errorMessageText,
        type: 'error'
      });
      
      toast.error('Por favor corrija los errores antes de previsualizar');
      return;
    }
    
    // Aquí se implementaría la lógica de previsualización
    showModal({
      title: 'Información',
      message: SUCCESS_MESSAGES.PREVIEW_COMING_SOON,
      type: 'info'
    });
    
    toast.success(SUCCESS_MESSAGES.PREVIEW_COMING_SOON);
  }, [showModal, validateForm, validationErrors]);

  // Función para inicializar las preguntas por defecto
  const initializeDefaultQuestions = useCallback((defaultQuestions: Question[]) => {
    setFormData(prev => ({
      ...prev,
      questions: defaultQuestions
    }));
  }, []);

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
    initializeDefaultQuestions
  };
};

export default useCognitiveTaskForm; 