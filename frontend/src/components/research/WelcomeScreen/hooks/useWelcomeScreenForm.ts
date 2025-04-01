import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  WelcomeScreenData, 
  WelcomeScreenResponse, 
  DEFAULT_WELCOME_SCREEN_CONFIG,
  UseWelcomeScreenFormResult,
  ErrorModalData
} from '../types';
import { apiClient } from '../../../../config/api-client';
import { 
  QUERY_KEYS, 
  API_ENDPOINTS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES 
} from '../constants';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Hook personalizado para gestionar la lógica del formulario de pantalla de bienvenida
 */
export const useWelcomeScreenForm = (researchId: string): UseWelcomeScreenFormResult => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<WelcomeScreenData>({ ...DEFAULT_WELCOME_SCREEN_CONFIG });
  const [welcomeScreenId, setWelcomeScreenId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const { isAuthenticated, token } = useAuth();

  // Handlers para el modal
  const closeModal = () => setModalVisible(false);
  const showModal = (errorData: ErrorModalData) => {
    setModalError(errorData);
    setModalVisible(true);
  };

  // Consulta para obtener datos existentes
  const { data: welcomeScreenData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.WELCOME_SCREEN, researchId],
    queryFn: async () => {
      try {
        if (!isAuthenticated || !token) {
          return { data: null, error: 'No autenticado', unauthorized: true };
        }

        const response = await apiClient.get<any, any>(
          'welcomeScreen',
          'getByResearch',
          { researchId }
        );
        return response;
      } catch (error: any) {
        // Obtener mensaje de error detallado
        let errorMessage = ERROR_MESSAGES.FETCH_ERROR;
        
        if (error?.statusCode === 401) {
          errorMessage = 'No autorizado: Se requiere un token de autenticación para acceder a este recurso';
          showModal({
            title: 'Error de autenticación',
            message: 'Su sesión ha expirado o no está autenticado. Por favor, inicie sesión nuevamente.',
            type: 'error'
          });
          return { data: null, error: errorMessage, unauthorized: true };
        }
        
        if (error?.statusCode === 403) {
          errorMessage = 'No tiene permisos para acceder a esta investigación';
          showModal({
            title: 'Error de permisos',
            message: 'No tiene permisos para acceder a esta investigación. Por favor, verifique que tiene acceso a este recurso o contacte al administrador.',
            type: 'error'
          });
          return { data: null, error: errorMessage, forbidden: true };
        }
        
        if (error?.statusCode === 404) {
          // Error 404 es normal cuando no hay configuración previa
          // No mostramos error al usuario, simplemente retornamos notFound
          return { data: null, notFound: true };
        }
        
        // Si es un error 500 o relacionado con AWS, mostramos un mensaje de error
        if (error?.statusCode >= 500 || 
            (error?.message && (
              error.message.includes('AWS') || 
              error.message.includes('timeout') || 
              error.message.includes('network') ||
              error.message.includes('internal server')
            ))) {
          
          errorMessage = 'Error en el servicio de AWS. Por favor, intente más tarde.';
          showModal({
            title: ERROR_MESSAGES.FETCH_ERROR,
            message: 'Ha ocurrido un error en el servicio de AWS. Esta situación no está relacionada con la aplicación. Por favor, intente más tarde.',
            type: 'error'
          });
          return { data: null, error: errorMessage, awsError: true };
        }
        
        // Para otros errores, no mostramos modal pero retornamos datos vacíos
        if (error?.data?.message) {
          errorMessage = error.data.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        return { data: null, notFound: true, silentError: errorMessage };
      }
    },
    enabled: !!researchId && isAuthenticated,
    refetchOnWindowFocus: false
  });

  // Función para crear un nuevo registro
  const createNewRecord = async (data: WelcomeScreenData) => {
    return await apiClient.post<any, any, any>(
      'welcomeScreen',
      'create',
      {
        ...data,
        researchId
      }
    );
  };

  // Mutación para guardar datos
  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: async (data: WelcomeScreenData) => {
      try {
        if (!isAuthenticated || !token) {
          throw {
            statusCode: 401,
            message: 'No autorizado: Se requiere un token de autenticación'
          };
        }
        
        // Si tenemos ID, intentamos actualizar, de lo contrario creamos
        if (welcomeScreenId) {
          try {
            return await apiClient.put(
              'welcomeScreen',
              'update',
              data,
              { id: welcomeScreenId }
            );
          } catch (updateError: any) {
            // Si el error es 404 (registro no encontrado), intentar crear uno nuevo
            if (updateError?.statusCode === 404 || 
                (updateError?.data?.error && updateError.data.error.includes('WELCOME_SCREEN_NOT_FOUND'))) {
              setWelcomeScreenId(null); // Reiniciar el ID
              return await createNewRecord(data);
            }
            
            // Si el error es 403 (sin permisos), lo propagamos para mostrar mensaje claro
            if (updateError?.statusCode === 403 || 
                (updateError?.data?.error && updateError.data.error.includes('FORBIDDEN'))) {
              throw {
                statusCode: 403,
                message: 'No tiene permisos para modificar esta pantalla de bienvenida',
                data: updateError?.data
              };
            }
            
            // Si es un error de AWS o del servidor, lo propagamos con un mensaje específico
            if (updateError?.statusCode >= 500 || 
                (updateError?.message && (
                  updateError.message.includes('AWS') || 
                  updateError.message.includes('timeout') || 
                  updateError.message.includes('network') ||
                  updateError.message.includes('internal server')
                ))) {
              throw {
                statusCode: updateError.statusCode || 500,
                message: 'Error en el servicio de AWS. Por favor, intente más tarde.',
                isAwsError: true,
                data: updateError?.data
              };
            }
            
            // Si es otro tipo de error, intentamos crear un nuevo registro
            setWelcomeScreenId(null); // Reiniciar el ID
            return await createNewRecord(data);
          }
        } else {
          // Creación normal sin ID previo
          return await createNewRecord(data);
        }
      } catch (error: any) {
        // Propagar el error para que lo maneje onError
        throw error;
      }
    },
    onSuccess: (response) => {
      const responseData = response.data;
      
      // Actualizamos el ID si es una creación y existe ID
      if (responseData && responseData.id) {
        setWelcomeScreenId(responseData.id);
      }
      
      // Invalidamos la query para recargar datos
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WELCOME_SCREEN, researchId] });
      
      toast.success(SUCCESS_MESSAGES.SAVE_SUCCESS);
    },
    onError: (error: any) => {
      // Obtener mensaje detallado
      let errorMessage = ERROR_MESSAGES.SAVE_ERROR;
      let errorDetails = '';
      
      if (error?.statusCode === 401) {
        errorMessage = 'Su sesión ha expirado o no está autenticado';
        errorDetails = 'Se requiere un token de autorización para acceder a este recurso';
        
        // Mostrar mensaje especial para error de autenticación
        showModal({
          title: 'Error de autenticación',
          message: 'Su sesión ha expirado o no está autenticado. Por favor, inicie sesión nuevamente.',
          type: 'error'
        });
        
        return;
      }
      
      if (error?.statusCode === 403) {
        errorMessage = 'No tiene permisos para esta operación';
        errorDetails = 'No tiene los permisos necesarios para acceder a esta investigación';
        
        // Mostrar mensaje especial para error de permisos
        showModal({
          title: 'Error de permisos',
          message: 'No tiene permisos para modificar esta pantalla de bienvenida. Por favor, verifique sus permisos o contacte al administrador.',
          type: 'error'
        });
        
        return;
      }
      
      // Solo mostrar errores de AWS o del servidor
      if (error?.isAwsError || error?.statusCode >= 500 || 
          (error?.message && (
            error.message.includes('AWS') || 
            error.message.includes('timeout') || 
            error.message.includes('network') ||
            error.message.includes('internal server')
          ))) {
        
        if (error?.data?.message) {
          errorMessage = error.data.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        // Añadir detalles técnicos si están disponibles
        if (error?.statusCode) {
          errorDetails = `Código de error: ${error.statusCode}`;
        }
        
        if (error?.data?.details) {
          errorDetails += `\nDetalles: ${error.data.details}`;
        }
        
        showModal({
          title: ERROR_MESSAGES.SAVE_ERROR,
          message: 'Ha ocurrido un error en el servicio de AWS. Esta situación no está relacionada con la aplicación. Por favor, intente más tarde.',
          type: 'error'
        });
        
        toast.error('Error de AWS. Intente más tarde.');
        return;
      }
      
      // Para otros errores, intentar silenciosamente sin mostrar mensajes al usuario
    }
  });

  // Efecto para cargar datos existentes cuando estén disponibles
  useEffect(() => {
    if (welcomeScreenData) {
      // Verificar si los datos tienen la estructura esperada
      const typedData = welcomeScreenData as any;
      
      if (typedData.data) {
        // Asegurarnos de que todos los campos requeridos estén presentes
        const safeData = {
          ...DEFAULT_WELCOME_SCREEN_CONFIG, // Valores por defecto
          ...typedData.data as WelcomeScreenData // Datos reales
        };
        
        // Asegurar que ningún valor sea null o undefined
        Object.keys(safeData).forEach(key => {
          const typedKey = key as keyof WelcomeScreenData;
          // Verificamos si la propiedad existe en DEFAULT_WELCOME_SCREEN_CONFIG antes de usarla
          if (safeData[typedKey] === null || safeData[typedKey] === undefined) {
            if (typedKey === 'isEnabled') {
              safeData[typedKey] = DEFAULT_WELCOME_SCREEN_CONFIG.isEnabled;
            } else if (
              // Solo accedemos a propiedades que sabemos que existen
              typedKey in DEFAULT_WELCOME_SCREEN_CONFIG && 
              typeof DEFAULT_WELCOME_SCREEN_CONFIG[typedKey as keyof typeof DEFAULT_WELCOME_SCREEN_CONFIG] === 'string'
            ) {
              // Asegurarnos de que el valor es siempre un string
              const defaultValue = DEFAULT_WELCOME_SCREEN_CONFIG[typedKey as keyof typeof DEFAULT_WELCOME_SCREEN_CONFIG];
              safeData[typedKey] = typeof defaultValue === 'string' ? defaultValue : '';
            }
          }
        });
        
        setFormData(safeData);
        
        if (typedData.data.id) {
          setWelcomeScreenId(typedData.data.id);
        }
      } else if (typedData.notFound || typedData.silentError) {
        // Si es notFound o un error silencioso, usar valores por defecto
        setFormData({...DEFAULT_WELCOME_SCREEN_CONFIG}); // Asegurarnos de usar valores por defecto
        setWelcomeScreenId(null); // Asegurarse de reiniciar el ID si no se encuentra
      }
    }
  }, [welcomeScreenData]);

  // Gestionar cambios en los campos del formulario
  const handleChange = (field: keyof WelcomeScreenData, value: any) => {
    // Asegurarnos de no establecer valores undefined
    const safeValue = value === undefined ? '' : value;
    
    setFormData(prev => ({
      ...prev,
      [field]: safeValue
    }));
    
    // Limpiar error cuando el usuario hace cambios
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    
    // Solo validamos título y mensaje si está habilitada la pantalla
    if (formData.isEnabled) {
      if (!formData.title.trim()) {
        errors.title = ERROR_MESSAGES.VALIDATION_ERRORS.TITLE_REQUIRED;
      }
      
      if (!formData.message.trim()) {
        errors.message = ERROR_MESSAGES.VALIDATION_ERRORS.MESSAGE_REQUIRED;
      }
      
      if (!formData.startButtonText.trim()) {
        errors.startButtonText = ERROR_MESSAGES.VALIDATION_ERRORS.BUTTON_TEXT_REQUIRED;
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar formulario
  const handleSave = () => {
    if (!isAuthenticated) {
      showModal({
        title: 'Error de autenticación',
        message: 'No está autenticado. Por favor, inicie sesión para guardar la pantalla de bienvenida.',
        type: 'error'
      });
      return;
    }
    
    if (validateForm()) {
      mutate(formData);
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

  // Previsualizar pantalla de bienvenida
  const handlePreview = () => {
    if (!validateForm()) {
      // Crear un mensaje con la lista de errores
      const errorMessageText = 'Errores: ' + Object.values(validationErrors).join(', ');
      
      showModal({
        title: ERROR_MESSAGES.SAVE_ERROR,
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
    welcomeScreenId,
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