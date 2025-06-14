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
import type { FileInfo } from '../../CognitiveTaskFormHelpers';
import {
  cleanupErrorFiles,
  logFormDebugInfo
} from '../../CognitiveTaskFormHelpers';
import {
  QUERY_KEYS,
  SUCCESS_MESSAGES,
  UI_TEXTS
} from '../constants';
import type { ErrorModalData } from '../types';
import { ValidationErrors } from '../types';
import {
  debugQuestionsToSend, filterValidQuestions
} from '../utils/validateRequiredFields';
import { useCognitiveTaskFileUpload } from './useCognitiveTaskFileUpload';
import { useCognitiveTaskModals } from './useCognitiveTaskModals';
import { useCognitiveTaskState } from './useCognitiveTaskState';
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

  // <<< Definir mutate e isPending (isMutating) aquí >>>
  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: async (dataToSave: CognitiveTaskFormData): Promise<CognitiveTaskFormData> => {
      if (!researchId) throw new Error(VALIDATION_ERROR_MESSAGES.RESEARCH_ID_REQUIRED);

      // --- Inicio: Filtrar archivos pending-delete antes de enviar ---
      const questionsForPayload = dataToSave.questions.map(q => {
        if (!q.files) return q;
        // Filtrar solo los archivos que NO están pendientes de eliminar
        const keptFiles = (q.files as UIUploadedFile[]).filter(f => f.status !== 'pending-delete');
        // Limpiar el estado interno `status` antes de enviar al backend
        const cleanedFiles = keptFiles.map(({ status, isLoading, progress, error, questionId, ...rest }) => rest);
        return {
          ...q,
          files: cleanedFiles
        };
      });

      const payload: CognitiveTaskFormData = {
        ...dataToSave,
        questions: questionsForPayload
      };

      // Registrar ID antes de guardar
      logFormDebugInfo('pre-save', payload, null, {
        usingAPI: 'fixed',
        method: 'save', // Método unificado - create o update
        researchId
      });

      // Guardar usando el método save (create o update)
      try {
        // --- REFACTORIZADO: Usar método save API que usa PUT en lugar de crear o actualizar ---
        const result = await cognitiveTaskFixedAPI.save(researchId, payload);

        logFormDebugInfo('post-save-success', result);
        return result;
      } catch (error) {
        logFormDebugInfo('post-save-error', payload, error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('[useCognitiveTaskForm] Datos guardados (REAL):', data);
      window._lastMutationTimestamp = Date.now();
      const wasUpdating = !!cognitiveTaskId;
      if (data && (data as any).id) {
        setCognitiveTaskId((data as any).id);
      }
      if (researchId) {
        // Limpiar solo archivos eliminados del localStorage
        const storageKey = `cognitive_task_temp_files_${researchId}`;
        const savedFilesJson = localStorage.getItem(storageKey);
        if (savedFilesJson) {
          const savedFiles = JSON.parse(savedFilesJson);
          if (Array.isArray(data.questions)) {
            data.questions.forEach((q: any) => {
              if (Array.isArray(q.files)) {
                // Mantener solo los archivos que NO están pending-delete
                const validIds = q.files.map((f: any) => f.id);
                if (Array.isArray(savedFiles[q.id])) {
                  savedFiles[q.id] = savedFiles[q.id].filter((f: any) => validIds.includes(f.id));
                }
              }
            });
          }
          localStorage.setItem(storageKey, JSON.stringify(savedFiles));
          console.log('[useCognitiveTaskForm] Limpiando archivos eliminados del localStorage');
        }
      }
      modals.closeConfirmModal();
      modals.closeJsonModal();
      if (typeof onSave === 'function') { onSave(data); }
      modals.showModal({
        title: UI_TEXTS.MODAL.INFO_TITLE,
        message: wasUpdating ? SUCCESS_MESSAGES.UPDATED : SUCCESS_MESSAGES.CREATED,
        type: 'success'
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId] });
      queryClient.setQueryData([QUERY_KEYS.COGNITIVE_TASK, researchId], data);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId] });
      }, 1000);
      setFormData((prev: CognitiveTaskFormData) => ({
        ...prev,
        questions: cleanupErrorFiles(prev.questions)
      }));
    },
    onError: (error: any) => {
      console.error('[useCognitiveTaskForm] Error en mutación (REAL):', error);
      logFormDebugInfo('mutateError', formData, error);
      modals.closeConfirmModal();
      // Usar ApiError si está disponible
      const errorMessage = error instanceof ApiError ? error.message : (error.message || 'Error desconocido al guardar');
      modals.showModal({ title: 'Error de Guardado', message: errorMessage, type: 'error' });

      // --- Inicio: Revertir estado pending-delete en error ---
      setFormData((prev: CognitiveTaskFormData) => ({
        ...prev,
        questions: cleanupErrorFiles(prev.questions)
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
    setFormData((prev: CognitiveTaskFormData) => { // `prev` aquí representa el estado inicial o el anterior a la carga completa
      let finalQuestions: Question[] = [];
      let finalRandomize = false;
      let finalDataFromBackend: Partial<CognitiveTaskFormData> = {};

      // Log del estado actual para depuración
      logFormDebugInfo('effectStart',
        cognitiveTaskData || null,
        null,
        {
          hasLocalStorage: !!filesFromLocalStorage,
          localStorageKeys: filesFromLocalStorage ? Object.keys(filesFromLocalStorage) : []
        }
      );

      if (!cognitiveTaskData) {
        console.log('[useEffect Form Data] No hay datos backend o hubo error. Manteniendo preguntas por defecto.');
        // Si prev.questions está vacío, usar las preguntas originales (3.1-3.8), si no, mantener las preguntas existentes
        const defaultQuestions = [
          {
            id: '3.1',
            type: 'short_text' as QuestionType,
            title: '',
            description: '',
            required: false,
            showConditionally: false,
            deviceFrame: false,
            files: [],
            answerPlaceholder: ''
          },
          {
            id: '3.2',
            type: 'long_text' as QuestionType,
            title: '',
            required: false,
            showConditionally: false,
            deviceFrame: false,
            files: []
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
            deviceFrame: false,
            files: []
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
            deviceFrame: false,
            files: []
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
            deviceFrame: false,
            files: []
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
            deviceFrame: false,
            files: []
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
            description: '',
            required: false,
            showConditionally: false,
            files: [],
            deviceFrame: true
          }
        ];

        finalQuestions = prev.questions.length > 0 ? prev.questions as Question[] : defaultQuestions;
        finalRandomize = false;
        setCognitiveTaskId(null);
      } else {
        console.log('[useEffect Form Data] Hay datos backend. Fusionando con defaults y localStorage.');
        const existingData = cognitiveTaskData as CognitiveTaskFormData;
        finalDataFromBackend = existingData; // Guardar datos del backend
        finalRandomize = existingData.randomizeQuestions ?? false;
        setCognitiveTaskId((existingData as any).id || null);
        // Usar preguntas existentes directamente
        finalQuestions = existingData.questions || [];
      }

      // <<< FUSION FINAL DE ARCHIVOS >>>
      // Iterar sobre las preguntas finales (ya fusionadas con backend si aplica)
      finalQuestions = finalQuestions.map(question => {
        const backendFiles = (finalDataFromBackend.questions?.find((q: Question) => q.id === question.id)?.files || []) as ExtendedUploadedFile[];
        const localStorageFiles = filesFromLocalStorage ? (filesFromLocalStorage[question.id] || []) : [];

        // Combinar y eliminar duplicados por ID
        const allFilesMap = new Map<string, ExtendedUploadedFile>();

        // Prioridad a archivos del backend (más recientes/autoritativos)
        (backendFiles as (FileInfo | ExtendedUploadedFile)[]).forEach((file) => {
          if (file && (file as ExtendedUploadedFile).id && (file as ExtendedUploadedFile).name) {
            allFilesMap.set((file as ExtendedUploadedFile).id, file as ExtendedUploadedFile);
          } else {
            console.warn(`[useEffect Form Data] Archivo inválido en backend para pregunta ${question.id}:`, file);
          }
        });

        // Añadir archivos de localStorage solo si no existen ya (por ID)
        (localStorageFiles as (FileInfo | ExtendedUploadedFile)[]).forEach((file) => {
          if (file && (file as ExtendedUploadedFile).id && (file as ExtendedUploadedFile).name) {
            if (!allFilesMap.has((file as ExtendedUploadedFile).id)) {
              allFilesMap.set((file as ExtendedUploadedFile).id, file as ExtendedUploadedFile);
            }
          } else {
            console.warn(`[useEffect Form Data] Archivo inválido en localStorage para pregunta ${question.id}:`, file);
          }
        });

        // Filtrar y validar los archivos para asegurar integridad
        const validFiles = Array.from(allFilesMap.values())
          .filter((file: ExtendedUploadedFile) => {
            const isValid = file && file.id && file.name && file.size && (file.url || file.s3Key);
            if (!isValid) {
              console.warn(`[useEffect Form Data] Omitiendo archivo incompleto:`, file);
            }
            return isValid;
          })
          .map((file: ExtendedUploadedFile) => ({
            ...file,
            // Asegurar que ciertos campos obligatorios tengan valores por defecto si faltan
            url: file.url || `https://placehold.co/300x300/gray/white?text=${encodeURIComponent(file.name)}`,
            type: file.type || 'image/jpeg',
            status: (file as any).status || 'uploaded',
            s3Key: file.s3Key,
            hitZones: file.hitZones
          }));

        // Devolver la pregunta con la lista de archivos única y validada
        return {
          ...question,
          files: validFiles
        };
      });

      // Construir el estado final a devolver
      const finalState: CognitiveTaskFormData = {
        ...(prev || {}), // Usar prev como base MUY inicial si es necesario
        ...finalDataFromBackend, // Sobrescribir con datos del backend (ID, metadata, etc.)
        researchId: researchId || (finalDataFromBackend as any).researchId || '', // Asegurar researchId
        questions: finalQuestions, // Usar las preguntas con archivos correctamente fusionados
        randomizeQuestions: finalRandomize,
      };

      console.log('[useEffect Form Data] Estado FINAL a devolver:', JSON.stringify(finalState.questions.find(q=>q.id==='3.8')?.files?.map(f=>f.id), null, 2));
      logFormDebugInfo('effectEnd', finalState);
      finalState.questions = cleanupErrorFiles(finalState.questions);
      return finalState;
    });

  // Dependencias: Ejecutar cuando cambie la carga, los datos del backend, el researchId
  // o las funciones de los hooks hijos que usamos.
  }, [cognitiveTaskData, researchId, isLoading, setFormData, loadFilesFromLocalStorage]);

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

  // <<< Implementar handlePreview >>>
  const handlePreview = useCallback(() => {
    // Limpio archivos en error antes de validar
    setFormData((prev: CognitiveTaskFormData) => ({
      ...prev,
      questions: cleanupErrorFiles(prev.questions)
    }));
    if (validateCurrentForm()) {
        const previewData = JSON.parse(JSON.stringify(formData));
        const jsonData = JSON.stringify(previewData, null, 2);
        modals.showJsonModal(jsonData, 'preview');
    } else {
        // Mostrar un modal con el error de validación en lugar de un toast
        modals.showModal({
            title: 'Formulario Inválido',
            message: 'Por favor, corrija los errores antes de previsualizar.',
            type: 'warning'
        });
    }
  }, [formData, validateCurrentForm, modals, setFormData]);

  const handleSave = () => {
    // Limpio archivos en error antes de validar
    setFormData((prev: CognitiveTaskFormData) => ({
      ...prev,
      questions: cleanupErrorFiles(prev.questions)
    }));
    console.log(`[handleSave] Iniciando guardado. researchId: ${researchId}`);
    const errorsFound = validateCurrentForm(); // <<< Capturar errores o null
    const isValid = errorsFound === null; // <<< Determinar validez

    console.log(`[handleSave] Resultado de validateCurrentForm: ${isValid}`);
    // <<< Loguear los errores encontrados INMEDIATAMENTE
    console.log('[handleSave] Errores encontrados por validateCurrentForm:', errorsFound);

    // Mostrar el JSON que se va a enviar al backend
    const filteredData = filterValidQuestions(formData);
    const dataToSave = JSON.parse(JSON.stringify(filteredData));
    dataToSave.questions = dataToSave.questions.map((q: Question) => ({
      ...q,
      files: q.files?.map((f: UIUploadedFile) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
        url: f.url,
        s3Key: f.s3Key,
        hitZones: Array.isArray(f.hitZones)
          ? f.hitZones.map((hz: any, idx: number) => ({
              id: hz.id || `hz_${idx}_${Date.now()}`,
              name: hz.name || `Zona ${idx + 1}`,
              region: hz.region
                ? hz.region
                : {
                    x: hz.x ?? 0,
                    y: hz.y ?? 0,
                    width: hz.width ?? 0,
                    height: hz.height ?? 0,
                  },
              fileId: f.id,
              ...(hz.severity ? { severity: hz.severity } : {})
            }))
          : []
      })) as UploadedFile[] || []
    }));
    window.alert('JSON enviado al backend:\n' + JSON.stringify(dataToSave, null, 2));

    if (isValid) {
        // Llamar directamente a confirmAndSave en lugar de mostrar el modal de confirmación
        confirmAndSave();
    } else {
        // Mostrar modal de error en lugar de toast
        let errorMessage = 'Por favor, corrija los errores en el formulario.';

        // Si hay un error específico en las preguntas, usarlo en su lugar
        if (errorsFound && errorsFound.questions && Object.keys(errorsFound).length === 1) {
          errorMessage = errorsFound.questions;
        }

        modals.showModal({
            title: 'Formulario Inválido',
            message: errorMessage,
            type: 'warning'
        });
    }
  };

  const confirmAndSave = useCallback(() => {
      if (!formData) return; // Seguridad

      // Filtrar solo las preguntas que tienen todos los campos requeridos
      const filteredData = filterValidQuestions(formData);

      // Pasar una copia profunda para evitar mutaciones inesperadas si mutate tarda
      const dataToSave = JSON.parse(JSON.stringify(filteredData));
      // Limpiar archivos temporales antes de guardar
      dataToSave.questions = dataToSave.questions.map((q: Question) => ({
        ...q,
        files: q.files?.map((f: UIUploadedFile) => ({
          id: f.id,
          name: f.name,
          size: f.size,
          type: f.type,
          url: f.url,
          s3Key: f.s3Key,
          hitZones: Array.isArray(f.hitZones)
            ? f.hitZones.map((hz: any, idx: number) => ({
                id: hz.id || `hz_${idx}_${Date.now()}`,
                name: hz.name || `Zona ${idx + 1}`,
                region: hz.region
                  ? hz.region
                  : {
                      x: hz.x ?? 0,
                      y: hz.y ?? 0,
                      width: hz.width ?? 0,
                      height: hz.height ?? 0,
                    },
                fileId: f.id,
                ...(hz.severity ? { severity: hz.severity } : {})
              }))
            : []
        })) as UploadedFile[] || []
      }));

      if (process.env.NODE_ENV === 'development') {
        console.log("[ConfirmAndSave] Datos originales:", formData);
        console.log("[ConfirmAndSave] Datos filtrados:", filteredData);
        debugQuestionsToSend(formData);
      }

      console.log("[ConfirmAndSave] Datos listos para mutación:", dataToSave);
      mutate(dataToSave); // Llamar a la mutación
  }, [formData, mutate]);

  const cancelSave = useCallback(() => {
    modals.closeConfirmModal();
  }, [modals]);

  // Función para eliminar datos CognitiveTasks
  const handleDelete = useCallback(async () => {
    if (!window.confirm('⚠️ ¿Estás seguro de que quieres eliminar TODOS los datos de Cognitive Tasks de esta investigación?\n\nEsta acción no se puede deshacer.')) {
      return;
    }

    try {
      if (!researchId) {
        throw new Error('No se puede eliminar: falta research ID');
      }

      // Llamar a la API para eliminar
      await cognitiveTaskFixedAPI.deleteByResearchId(researchId);

      // Limpiar el estado local y restaurar preguntas por defecto (compatibles con interfaz compartida)
      setCognitiveTaskId(null);
      setFormData((prev: CognitiveTaskFormData) => ({
        ...prev,
        questions: [
          {
            id: 'short-text-default',
            type: 'short_text',
            title: 'Pregunta de texto corto',
            required: true,
            showConditionally: false,
            deviceFrame: false
          },
          {
            id: 'long-text-default',
            type: 'long_text',
            title: 'Pregunta de texto largo',
            required: true,
            showConditionally: false,
            deviceFrame: false
          },
          {
            id: 'single-choice-default',
            type: 'single_choice',
            title: 'Pregunta de opción única',
            required: true,
            showConditionally: false,
            deviceFrame: false,
            choices: [
              { id: '1', text: 'Opción 1' },
              { id: '2', text: 'Opción 2' },
              { id: '3', text: 'Opción 3' }
            ]
          },
          {
            id: 'multiple-choice-default',
            type: 'multiple_choice',
            title: 'Pregunta de opción múltiple',
            required: true,
            showConditionally: false,
            deviceFrame: false,
            choices: [
              { id: '1', text: 'Opción 1' },
              { id: '2', text: 'Opción 2' },
              { id: '3', text: 'Opción 3' }
            ]
          },
          {
            id: 'linear-scale-default',
            type: 'linear_scale',
            title: 'Pregunta de escala lineal',
            required: true,
            showConditionally: false,
            deviceFrame: false,
            scaleConfig: { startValue: 1, endValue: 5 }
          },
          {
            id: 'ranking-default',
            type: 'ranking',
            title: 'Pregunta de ranking',
            required: true,
            showConditionally: false,
            deviceFrame: false,
            choices: [
              { id: '1', text: 'Opción 1' },
              { id: '2', text: 'Opción 2' },
              { id: '3', text: 'Opción 3' }
            ]
          },
          {
            id: 'preference-test-default',
            type: 'preference_test',
            title: 'Pregunta de test de preferencia',
            required: true,
            showConditionally: false,
            deviceFrame: false,
            files: []
          }
        ]
      }));

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['cognitive-task', researchId] });

      modals.showModal({
        title: 'Éxito',
        message: 'Datos de Cognitive Tasks eliminados correctamente',
        type: 'success'
      });

    } catch (error: any) {
      console.error('[CognitiveTaskForm] Error al eliminar:', error);
      modals.showModal({
        title: 'Error',
        message: error.message || 'Error al eliminar los datos de Cognitive Tasks',
        type: 'error'
      });
    }
  }, [researchId, setCognitiveTaskId, setFormData, queryClient, modals]);

  // --- Retorno del Hook Principal ---
  console.log('[useCognitiveTaskForm] Estado FINAL formData (desde hook estado):',
    JSON.stringify(formData?.questions?.map((q: Question) => ({ id: q.id, type: q.type, title: q.title?.substring(0, 20) })) || [])
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
    showConfirmModal: modals.showConfirmModal,
    confirmAndSave,
    cancelSave,

    // Estado de carga (del hook)
    isUploading,
    uploadProgress,
    currentFileIndex,
    totalFiles,
    // <<< Añadir propiedades faltantes para los modales >>>
    modalError: modals.modalError,
    modalVisible: modals.modalVisible,
    closeModal: modals.closeModal,
    showJsonPreview: modals.showJsonPreview,
    closeJsonModal: modals.closeJsonModal,
    jsonToSend: modals.jsonToSend,
    pendingAction: modals.pendingAction,
    continueWithAction: (): void => { /* ... */ },
  };
};
