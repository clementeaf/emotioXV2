import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  SmartVOCFormData,
  SmartVOCFormResponse
} from 'shared/interfaces/smart-voc.interface';
import { 
  ErrorModalData, 
  ValidationErrors, 
  DEFAULT_QUESTIONS, 
  SmartVOCQuestion
} from '../types';
import { smartVocFixedAPI } from '@/lib/smart-voc-api';
import { 
  QUERY_KEYS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES
} from '../constants';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Hook personalizado para gestionar la lógica del formulario SmartVOC
 */
export const useSmartVOCForm = (researchId: string) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SmartVOCFormData>({ 
    researchId,
    questions: [...DEFAULT_QUESTIONS],
    randomizeQuestions: false,
    smartVocRequired: true,
    metadata: {
      createdAt: new Date().toISOString(),
      estimatedCompletionTime: '5-10'
    }
  });
  const [smartVocId, setSmartVocId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const { user, token, authLoading } = useAuth();
  const isAuthenticated = !!user && !!token;

  // Añadimos logs de depuración para la autenticación
  useEffect(() => {
    console.log('[SmartVOCForm] Estado de autenticación:', { 
      isAuthenticated, 
      tokenExists: !!token,
      userExists: !!user,
      tokenLength: token ? token.length : 0,
      researchId,
      authLoading
    });

    // Verificamos el token en localStorage
    if (typeof window !== 'undefined') {
      const localToken = localStorage.getItem('token');
      const sessionToken = sessionStorage.getItem('token');
      
      console.log('[SmartVOCForm] Tokens almacenados:', {
        localStorageToken: localToken ? `${localToken.substring(0, 15)}...` : null,
        sessionStorageToken: sessionToken ? `${sessionToken.substring(0, 15)}...` : null,
        contextToken: token ? `${token.substring(0, 15)}...` : null
      });
    }
  }, [isAuthenticated, token, user, researchId, authLoading]);

  // Estados para el modal de confirmación JSON
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);
  const [jsonToSend, setJsonToSend] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'save' | 'preview' | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Handlers para el modal
  const closeModal = useCallback(() => setModalVisible(false), []);
  const showModal = useCallback((errorData: ErrorModalData) => {
    setModalError(errorData);
    setModalVisible(true);
  }, []);

  // Consulta para obtener datos existentes
  const { data: smartVocData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.SMART_VOC, researchId],
    queryFn: async () => {
      try {
        if (!isAuthenticated || !token) {
          console.error('[SmartVOCForm] No hay autenticación para realizar la consulta', {
            isAuthenticated,
            hasToken: !!token,
            tokenFirstChars: token ? token.substring(0, 10) : 'no-token'
          });
          throw new Error('No autenticado');
        }

        // Intenta recuperar el token de localStorage como último recurso
        let currentToken = token;
        if (!currentToken && typeof window !== 'undefined') {
          const localStorageToken = localStorage.getItem('token');
          if (localStorageToken) {
            currentToken = localStorageToken;
            console.log('[SmartVOCForm] Recuperado token de localStorage como último recurso');
          }
        }

        if (!currentToken) {
          console.error('[SmartVOCForm] No se pudo recuperar un token válido');
          throw new Error('No se pudo recuperar un token válido');
        }

        console.log(`[SmartVOCForm] Buscando configuración existente para investigación: ${researchId}`);
        const response = await smartVocFixedAPI.getByResearchId(researchId);
        console.log('[SmartVOCForm] Respuesta de API:', response);
        return response;
      } catch (error: any) {
        console.error('[SmartVOCForm] Error al obtener datos:', error);
        
        if (error?.statusCode === 404) {
          console.log('[SmartVOCForm] No se encontró configuración existente - esto es normal para una nueva investigación');
          return { notFound: true };
        }
        
        throw error;
      }
    },
    enabled: !!researchId && isAuthenticated && !authLoading,
    refetchOnWindowFocus: false
  });

  // Mutación para guardar datos
  const { mutate } = useMutation({
    mutationFn: async (data: SmartVOCFormData): Promise<SmartVOCFormData> => {
      if (!isAuthenticated || !token) {
        throw new Error('No autenticado');
      }
      
      // Crear una copia limpia de los datos
      const cleanedData = {
        ...data,
        questions: data.questions.map((q: SmartVOCQuestion) => {
          const { instructions, config, ...restOfQuestion } = q; // Separar config
          const cleanedConfig = { ...config }; // Copiar config
          
          // Si companyName existe y está vacío en config, eliminarlo
          if (cleanedConfig.companyName === '') {
            delete cleanedConfig.companyName;
          }
          
          // Devolver la pregunta CON instructions y con config limpia
          return { ...restOfQuestion, instructions, config: cleanedConfig }; 
        })
      };
      // NO eliminamos metadata, volvemos a la versión anterior

      console.log('[SmartVOCForm] Datos limpios (sin instructions, companyName vacío eliminado) a guardar:', JSON.stringify(cleanedData, null, 2));
      
      if (smartVocId) {
        console.log(`[SmartVOCForm] Actualizando Smart VOC con ID: ${smartVocId}`);
        return await smartVocFixedAPI.update(smartVocId, cleanedData); // Usar cleanedData
      } else {
        console.log('[SmartVOCForm] Creando nuevo Smart VOC');
        return await smartVocFixedAPI.create(cleanedData); // Usar cleanedData
      }
    },
    onSuccess: (response: SmartVOCFormData) => {
      const responseWithId = response as SmartVOCFormData & { id?: string }; 
      if (responseWithId?.id) {
        setSmartVocId(responseWithId.id);
      } else {
        console.warn('[SmartVOCForm] No se encontró ID en la respuesta onSuccess directa. Invalidando query.');
      }
      
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SMART_VOC, researchId] });
      
      toast.success(smartVocId ? SUCCESS_MESSAGES.UPDATE_SUCCESS : SUCCESS_MESSAGES.CREATE_SUCCESS, {
        duration: 4000,
        style: {
          background: '#10b981',
          color: '#fff',
          fontWeight: 'bold'
        },
        icon: '✅'
      });
      
      setIsSaving(false);
    },
    onError: (error: any, variables: SmartVOCFormData, context: any) => {
      // Log detallado del formData que causó el error
      console.error('[SmartVOCForm] Error al guardar. Datos enviados:', JSON.stringify(variables, null, 2));
      
      showModal({
        title: ERROR_MESSAGES.SAVE_ERROR,
        message: error.message || 'Ocurrió un error al guardar la configuración',
        type: 'error'
      });
      
      toast.error(ERROR_MESSAGES.SAVE_ERROR, {
        duration: 5000,
        style: {
          background: '#ef4444',
          color: '#fff',
          fontWeight: 'bold'
        },
        icon: '❌'
      });
      
      setIsSaving(false);
    }
  });

  // Efecto para cargar datos existentes
  useEffect(() => {
    const dataFromQuery = smartVocData;
            
    // Asegurarse que dataFromQuery no es null/undefined y no es el objeto {notFound: true}
    if (dataFromQuery && typeof dataFromQuery === 'object' && !('notFound' in dataFromQuery)) { 
      // Ahora TypeScript sabe que dataFromQuery es SmartVOCFormData
      const existingData = dataFromQuery as SmartVOCFormData;
      console.log("[SmartVOCForm] Cargando datos existentes:", existingData);

      // Intentamos setear el smartVocId si existe en los datos cargados (como propiedad 'id')
      const dataWithId = existingData as SmartVOCFormData & { id?: string };
      if (dataWithId.id) {
        setSmartVocId(dataWithId.id);
      }

      // Actualizar formData con los datos existentes
      setFormData(prev => ({
        ...prev,
        ...existingData,
        researchId, // Asegurar que researchId se mantenga
        questions: existingData.questions?.length > 0 ? existingData.questions : [...DEFAULT_QUESTIONS],
        metadata: {
          ...(prev.metadata || {}),
          ...(existingData.metadata || {}),
          updatedAt: new Date().toISOString()
        }
      }));
    } else if (!isLoading) { 
        // Caso notFound, null, undefined o error durante la carga inicial
        console.log("[SmartVOCForm] No se encontraron datos existentes o hubo un error, usando defaults.");
        // Resetear a los valores por defecto manteniendo researchId
        setFormData({
          researchId,
          questions: [...DEFAULT_QUESTIONS],
          randomizeQuestions: false,
          smartVocRequired: true,
          metadata: {
            createdAt: new Date().toISOString(),
            estimatedCompletionTime: '5-10'
          }
        });
        setSmartVocId(null);
    }
  }, [smartVocData, researchId, isLoading]);

  // Función para actualizar una pregunta específica
  const updateQuestion = useCallback((id: string, updates: Partial<SmartVOCQuestion>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    }));
  }, []);

  // Función para actualizar configuraciones generales
  const updateSettings = useCallback((updates: Partial<Pick<SmartVOCFormData, 'randomizeQuestions' | 'smartVocRequired'>>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Función para añadir una nueva pregunta
  const addQuestion = useCallback((newQuestion: SmartVOCQuestion) => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  }, []);

  // Función para eliminar una pregunta
  const removeQuestion = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  }, []);

  // Función para validar el formulario
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};
    
    if (!formData.questions || formData.questions.length === 0) {
      errors.questions = 'Debe incluir al menos una pregunta';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.questions]);

  // Función para manejar el guardado
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      showModal({
        title: 'Error de Validación',
        message: 'Por favor, corrija los errores antes de guardar',
        type: 'error'
      });
      return;
    }

    setIsSaving(true);
    mutate(formData);
  }, [formData, mutate, validateForm, showModal]);

  // Función para manejar la previsualización
  const handlePreview = useCallback(() => {
    if (!validateForm()) {
      showModal({
        title: 'Error de Validación',
        message: 'Por favor, corrija los errores antes de previsualizar',
        type: 'error'
      });
      return;
    }

    setJsonToSend(JSON.stringify(formData, null, 2));
    setShowJsonPreview(true);
    setPendingAction('preview');
  }, [formData, validateForm, showModal]);

  // Función para cerrar el modal JSON
  const closeJsonModal = useCallback(() => {
    setShowJsonPreview(false);
    setPendingAction(null);
  }, []);

  // Función para continuar con la acción pendiente
  const continueWithAction = useCallback(() => {
    if (pendingAction === 'save') {
      handleSave();
    }
    closeJsonModal();
  }, [pendingAction, handleSave, closeJsonModal]);

  return {
    formData,
    questions: formData.questions,
    smartVocId,
    validationErrors,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    updateQuestion,
    updateSettings,
    addQuestion,
    removeQuestion,
    handleSave,
    handlePreview,
    validateForm,
    closeModal,
    showJsonPreview,
    closeJsonModal,
    jsonToSend,
    pendingAction,
    continueWithAction,
    isExisting: !!smartVocId
  };
}; 