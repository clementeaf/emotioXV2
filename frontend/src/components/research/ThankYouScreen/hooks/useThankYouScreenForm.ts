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
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);
  const [jsonToSend, setJsonToSend] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'save' | 'preview' | null>(null);

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

  // Función para mostrar el modal con JSON
  const showJsonModal = (json: any, action: 'save' | 'preview') => {
    setJsonToSend(JSON.stringify(json, null, 2));
    setPendingAction(action);
    setShowJsonPreview(true);
  };

  // Función para cerrar el modal JSON
  const closeJsonModal = () => {
    setShowJsonPreview(false);
    setPendingAction(null);
  };

  // Función para continuar con la acción después de mostrar el JSON
  const continueWithAction = () => {
    closeJsonModal();
    
    if (pendingAction === 'save') {
      // Ejecutar la mutación para guardar
      try {
        const dataToSaveObj = JSON.parse(jsonToSend);
        console.log('[ThankYouScreenForm] Enviando datos al backend:', dataToSaveObj);
        mutate(dataToSaveObj);
      } catch (error) {
        console.error('[ThankYouScreenForm] Error al procesar JSON:', error);
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
  };

  // Guardar formulario (modificado para mostrar JSON primero)
  const handleSave = () => {
    if (!isAuthenticated) {
      showModal({
        title: 'Error de autenticación',
        message: 'No está autenticado. Por favor, inicie sesión para guardar la pantalla de agradecimiento.',
        type: 'error'
      });
      return;
    }
    
    if (validateForm()) {
      // Preparar datos para enviar
      const dataToSave: ThankYouScreenFormData = {
        ...formData,
        researchId,
        metadata: {
          version: '1.0.0',
          updatedAt: new Date().toISOString()
        }
      };
      
      // Mostrar modal con JSON en lugar de guardar directamente
      showJsonModal(dataToSave, 'save');
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

  // Previsualizar formulario (modificado para mostrar JSON primero)
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
    
    // Preparar datos para previsualizar
    const dataToPreview = {
      ...formData,
      researchId,
      metadata: {
        version: '1.0.0',
        updatedAt: new Date().toISOString()
      }
    };
    
    // Mostrar modal con JSON
    showJsonModal(dataToPreview, 'preview');
  };

  // Crear el elemento modal de JSON para mostrar el código
  useEffect(() => {
    // Solo crear el modal si se va a mostrar
    if (showJsonPreview && jsonToSend) {
      // Crear HTML para el modal
      const modalHtml = `
        <div id="jsonPreviewModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
          <div style="background: white; border-radius: 8px; max-width: 90%; width: 800px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.2); overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
              <h2 style="margin: 0; font-size: 18px; font-weight: 600;">JSON a enviar</h2>
              <button id="closeJsonModal" style="background: none; border: none; cursor: pointer; font-size: 20px; color: #6b7280;">&times;</button>
            </div>
            <div style="padding: 24px; overflow-y: auto; flex-grow: 1;">
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">
                Este es el JSON que se enviará al servidor. Revise los datos antes de continuar.
              </p>
              <pre style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; overflow: auto; max-height: 400px; font-family: monospace; font-size: 14px; white-space: pre-wrap; word-break: break-word;">${jsonToSend.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </div>
            <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px;">
              <button id="cancelJsonAction" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 16px; font-weight: 500; cursor: pointer;">Cancelar</button>
              <button id="continueJsonAction" style="background: #3f51b5; color: white; border: none; border-radius: 6px; padding: 8px 16px; font-weight: 500; cursor: pointer;">
                ${pendingAction === 'save' ? 'Guardar' : 'Previsualizar'}
              </button>
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
      
      document.getElementById('continueJsonAction')?.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
        continueWithAction();
      });
      
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
  }, [showJsonPreview, jsonToSend, pendingAction]);

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
    closeModal,
    showJsonPreview,
    closeJsonModal
  };
}; 