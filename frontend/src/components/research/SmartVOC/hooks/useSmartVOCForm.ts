import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  SmartVOCFormData,
  SmartVOCQuestion
} from 'shared/interfaces/smart-voc.interface';
import { ErrorModalData, ValidationErrors, DEFAULT_QUESTIONS } from '../types';
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
  const [questions, setQuestions] = useState<SmartVOCQuestion[]>([...DEFAULT_QUESTIONS]);
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
    mutationFn: async (data: SmartVOCFormData) => {
      if (!isAuthenticated || !token) {
        throw new Error('No autenticado');
      }
      
      console.log('[SmartVOCForm] Datos a guardar:', JSON.stringify(data, null, 2));
      
      if (smartVocId) {
        console.log(`[SmartVOCForm] Actualizando Smart VOC con ID: ${smartVocId}`);
        return await smartVocFixedAPI.update(smartVocId, data);
      } else {
        console.log('[SmartVOCForm] Creando nuevo Smart VOC');
        return await smartVocFixedAPI.create(data);
      }
    },
    onSuccess: (response) => {
      if (response?.data?.id) {
        setSmartVocId(response.data.id);
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
    onError: (error: any) => {
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
    if (smartVocData?.data?.data) {
      const existingData = smartVocData.data.data;
      
      if (smartVocData.data.id) {
        setSmartVocId(smartVocData.data.id);
      }

      setFormData({
        ...existingData,
        researchId,
        metadata: {
          ...existingData.metadata,
          updatedAt: new Date().toISOString()
        }
      });
      
      if (existingData.questions?.length > 0) {
        setQuestions(existingData.questions);
      }
    }
  }, [smartVocData, researchId]);

  // Función para actualizar una pregunta específica
  const updateQuestion = useCallback((id: string, updates: Partial<SmartVOCQuestion>) => {
    setQuestions(prevQuestions => 
      prevQuestions.map(q => q.id === id ? { ...q, ...updates } : q)
    );
    
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
  const addQuestion = useCallback(() => {
    const newQuestion: SmartVOCQuestion = {
      id: `q_${Date.now()}`,
      type: 'VOC',
      title: 'Nueva Pregunta',
      description: '¿Cuál es tu opinión?',
      required: true,
      showConditionally: false,
      config: {
        type: 'text'
      }
    };

    setQuestions(prev => [...prev, newQuestion]);
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  }, []);

  // Función para eliminar una pregunta
  const removeQuestion = useCallback((id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
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
    questions,
    formData,
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