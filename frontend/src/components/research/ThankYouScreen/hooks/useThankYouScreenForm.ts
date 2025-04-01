import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  ThankYouScreenFormData,
  ThankYouScreenConfig,
  ValidationErrors,
  ErrorModalData,
  DEFAULT_THANK_YOU_SCREEN_CONFIG,
  DEFAULT_THANK_YOU_SCREEN_VALIDATION,
  UseThankYouScreenFormResult
} from '../types';
import { thankYouScreenFixedAPI } from '@/lib/thank-you-screen-api';
import { 
  QUERY_KEYS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES 
} from '../constants';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Hook personalizado para gestionar la lógica del formulario de pantalla de agradecimiento
 */
export const useThankYouScreenForm = (researchId: string): UseThankYouScreenFormResult => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ThankYouScreenFormData>({
    ...DEFAULT_THANK_YOU_SCREEN_CONFIG,
    researchId
  });
  const [thankYouScreenId, setThankYouScreenId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const { isAuthenticated, token } = useAuth();

  // Handlers para el modal
  const closeModal = () => setModalVisible(false);
  const showModal = (errorData: ErrorModalData) => {
    setModalError(errorData);
    setModalVisible(true);
  };

  // Validar URL
  const isValidUrl = (url: string): boolean => {
    return DEFAULT_THANK_YOU_SCREEN_VALIDATION.redirectUrl.pattern.test(url);
  };

  // Consulta para obtener datos existentes
  const { data: thankYouScreenData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.THANK_YOU_SCREEN, researchId],
    queryFn: async () => {
      try {
        if (!isAuthenticated || !token) {
          return { data: null, error: true, message: 'No autenticado' };
        }

        console.log(`[useThankYouScreenForm] Buscando configuración existente para investigación: ${researchId}`);
        const response = await thankYouScreenFixedAPI.getByResearchId(researchId).send();
        console.log('[useThankYouScreenForm] Respuesta de API:', response);
        return response;
      } catch (error: any) {
        console.error('[useThankYouScreenForm] Error al obtener datos:', error);
        let errorMessage = ERROR_MESSAGES.FETCH_ERROR;
        
        // Si es error 404, es normal (no hay configuración previa)
        if (error?.statusCode === 404 || error?.message?.includes('404')) {
          console.log('[useThankYouScreenForm] No se encontró configuración existente - esto es normal para una nueva investigación');
          return { data: null, notFound: true };
        }
        
        return { data: null, error: true, message: errorMessage };
      }
    },
    enabled: !!researchId && isAuthenticated,
    retry: (failureCount, error: any) => {
      // No reintentar si el error es 404
      if (error?.message?.includes('404')) {
        return false;
      }
      // Para otros errores, permitir hasta 2 reintentos
      return failureCount < 2;
    },
    retryDelay: 1000, // Esperar 1 segundo entre reintentos
    staleTime: 60000, // Mantener los datos frescos durante 1 minuto
    refetchOnWindowFocus: false
  });

  // Mutación para guardar datos
  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: async (data: ThankYouScreenFormData) => {
      try {
        if (!isAuthenticated || !token) {
          throw new Error('No autenticado: Se requiere un token de autenticación');
        }
        
        console.log('[useThankYouScreenForm] Datos a guardar:', JSON.stringify(data, null, 2));
        
        if (thankYouScreenId) {
          console.log(`[useThankYouScreenForm] Actualizando Pantalla de Agradecimiento con ID: ${thankYouScreenId}`);
          return await thankYouScreenFixedAPI.update(thankYouScreenId, data).send();
        } else {
          console.log('[useThankYouScreenForm] Creando nueva Pantalla de Agradecimiento');
          return await thankYouScreenFixedAPI.create(data).send();
        }
      } catch (error: any) {
        console.error('[useThankYouScreenForm] Error al guardar:', error);
        throw error;
      }
    },
    onSuccess: (response) => {
      console.log('[useThankYouScreenForm] Respuesta de guardado:', response);
      
      if (response && response.id) {
        setThankYouScreenId(response.id);
        console.log('[useThankYouScreenForm] ID establecido:', response.id);
      }
      
      // Invalidamos la query para recargar datos
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.THANK_YOU_SCREEN, researchId] });
      
      // Mostrar mensaje de éxito
      toast.success(SUCCESS_MESSAGES.SAVE_SUCCESS);
    },
    onError: (error: any) => {
      console.error('[useThankYouScreenForm] Error en mutación:', error);
      
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
    if (thankYouScreenData && thankYouScreenData.data) {
      const existingData = thankYouScreenData.data;
      console.log('[useThankYouScreenForm] Datos recibidos:', existingData);
      
      // Actualizar ID
      if (existingData.id) {
        setThankYouScreenId(existingData.id);
        console.log('[useThankYouScreenForm] ID de Thank You Screen encontrado:', existingData.id);
      }
      
      // Actualizar formData con los valores existentes
      setFormData({
        ...DEFAULT_THANK_YOU_SCREEN_CONFIG,
        ...existingData,
        researchId
      });
    } else {
      console.log('[useThankYouScreenForm] No hay datos existentes, usando configuración por defecto');
      setFormData({
        ...DEFAULT_THANK_YOU_SCREEN_CONFIG,
        researchId
      });
      setThankYouScreenId(null);
    }
  }, [thankYouScreenData, researchId]);

  // Función para manejar cambios en los campos del formulario
  const handleChange = (field: keyof ThankYouScreenConfig, value: any) => {
    // Limpiar error de validación al cambiar el campo
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!researchId) {
      errors.researchId = ERROR_MESSAGES.VALIDATION_ERRORS.RESEARCH_ID_REQUIRED;
      console.log('[useThankYouScreenForm] Error de validación: ID de investigación requerido');
    }
    
    // Solo validar título y mensaje si la pantalla está habilitada
    if (formData.isEnabled) {
      // Validar título
      if (!formData.title.trim()) {
        errors.title = ERROR_MESSAGES.VALIDATION_ERRORS.TITLE_REQUIRED;
      } else if (formData.title.length < DEFAULT_THANK_YOU_SCREEN_VALIDATION.title.minLength) {
        errors.title = ERROR_MESSAGES.VALIDATION_ERRORS.TITLE_TOO_SHORT.replace(
          '{min}', 
          DEFAULT_THANK_YOU_SCREEN_VALIDATION.title.minLength.toString()
        );
      } else if (formData.title.length > DEFAULT_THANK_YOU_SCREEN_VALIDATION.title.maxLength) {
        errors.title = ERROR_MESSAGES.VALIDATION_ERRORS.TITLE_TOO_LONG.replace(
          '{max}', 
          DEFAULT_THANK_YOU_SCREEN_VALIDATION.title.maxLength.toString()
        );
      }
      
      // Validar mensaje
      if (!formData.message.trim()) {
        errors.message = ERROR_MESSAGES.VALIDATION_ERRORS.MESSAGE_REQUIRED;
      } else if (formData.message.length < DEFAULT_THANK_YOU_SCREEN_VALIDATION.message.minLength) {
        errors.message = ERROR_MESSAGES.VALIDATION_ERRORS.MESSAGE_TOO_SHORT.replace(
          '{min}', 
          DEFAULT_THANK_YOU_SCREEN_VALIDATION.message.minLength.toString()
        );
      } else if (formData.message.length > DEFAULT_THANK_YOU_SCREEN_VALIDATION.message.maxLength) {
        errors.message = ERROR_MESSAGES.VALIDATION_ERRORS.MESSAGE_TOO_LONG.replace(
          '{max}', 
          DEFAULT_THANK_YOU_SCREEN_VALIDATION.message.maxLength.toString()
        );
      }
      
      // Validar URL de redirección (solo si se proporciona)
      if (formData.redirectUrl && formData.redirectUrl.trim() !== '') {
        if (!isValidUrl(formData.redirectUrl)) {
          errors.redirectUrl = ERROR_MESSAGES.VALIDATION_ERRORS.INVALID_URL;
        }
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar formulario
  const handleSave = () => {
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
      mutate({ ...formData, researchId });
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
  };

  // Previsualizar formulario
  const handlePreview = () => {
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
  };

  return {
    formData,
    thankYouScreenId,
    validationErrors,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    handleChange,
    handleSave,
    handlePreview,
    validateForm,
    closeModal
  };
}; 