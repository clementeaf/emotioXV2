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
  const [realWelcomeScreenId, setRealWelcomeScreenId] = useState<string | null>(null);
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
        
        // Verificar si la respuesta realmente contiene datos válidos
        if (response && response.data) {
          console.log('Datos de welcomeScreen obtenidos:', response.data);
          // Asegurarse de que existe un ID válido
          if (!response.data.id || (typeof response.data.id === 'string' && response.data.id.trim() === '')) {
            console.log('Los datos obtenidos no tienen un ID válido, tratando como notFound');
            return { data: null, notFound: true };
          }
          return response;
        } else {
          console.log('No se encontraron datos de welcomeScreen');
          return { data: null, notFound: true };
        }
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
          console.log('Error 404: No existe configuración para esta investigación');
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
        
        // Usar ID real si existe, incluso si la UI muestra como nuevo
        const idToUse = realWelcomeScreenId || welcomeScreenId;
        
        if (idToUse) {
          console.log('Actualizando WelcomeScreen con ID:', idToUse);
          try {
            return await apiClient.put(
              'welcomeScreen',
              'update',
              data,
              { id: idToUse }
            );
          } catch (updateError: any) {
            // Si el error es 404 (registro no encontrado), intentar crear uno nuevo
            if (updateError?.statusCode === 404 || 
                (updateError?.data?.error && updateError.data.error.includes('WELCOME_SCREEN_NOT_FOUND'))) {
              console.log('WelcomeScreen no encontrada en update, creando nueva');
              setWelcomeScreenId(null);
              setRealWelcomeScreenId(null);
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
            console.log('Error desconocido al actualizar, intentando crear nuevo registro');
            setWelcomeScreenId(null);
            setRealWelcomeScreenId(null);
            return await createNewRecord(data);
          }
        } else {
          // Creación normal sin ID previo
          console.log('Creando nueva WelcomeScreen (sin ID previo)');
          setWelcomeScreenId(null);
          setRealWelcomeScreenId(null);
          return await createNewRecord(data);
        }
      } catch (error: any) {
        // Propagar el error para que lo maneje onError
        throw error;
      }
    },
    onSuccess: (response) => {
      const responseData = response.data;
      
      // Verificar si es creación o actualización
      const isNewRecord = !welcomeScreenId && !realWelcomeScreenId;
      
      // Actualizamos el ID si es una creación y existe ID
      if (responseData && responseData.id) {
        // Si era una configuración "vacía" que tratamos como nueva, pero realmente 
        // estábamos actualizando, mantenemos el comportamiento de UI como nueva
        if (!welcomeScreenId && realWelcomeScreenId) {
          // Mantener welcomeScreenId como null para UI, pero actualizar el ID real
          console.log('Se actualizó configuración tratada como nueva. Manteniendo UI como nueva pero guardando ID real:', responseData.id);
          setRealWelcomeScreenId(responseData.id);
        } else {
          // Comportamiento normal: actualizar ambos IDs
          setWelcomeScreenId(responseData.id);
          setRealWelcomeScreenId(responseData.id);
          console.log(`WelcomeScreen ${isNewRecord ? 'creada' : 'actualizada'} con ID:`, responseData.id);
        }
      }
      
      // Invalidamos la query para recargar datos
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WELCOME_SCREEN, researchId] });
      
      // Mostrar mensaje apropiado
      toast.success(isNewRecord 
        ? 'Configuración guardada correctamente' 
        : 'Configuración actualizada correctamente');
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
      
      if (typedData.data && typedData.data.id) {
        // Guardar el ID real para futuras actualizaciones
        if (typedData.data.id && typeof typedData.data.id === 'string' && typedData.data.id.trim() !== '') {
          setRealWelcomeScreenId(typedData.data.id);
          console.log('ID real guardado:', typedData.data.id);
        }

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
        
        // Verificamos si es una configuración "vacía" (deshabilitada y sin datos importantes)
        const isEmptyConfig = 
          safeData.isEnabled === false && 
          (!safeData.title || safeData.title.trim() === '') &&
          (!safeData.message || safeData.message.trim() === '');
          
        if (isEmptyConfig) {
          console.log('Configuración vacía detectada. Tratando como nueva configuración');
          
          // Para la UI, tratamos como nueva config (cambia el texto del botón)
          setWelcomeScreenId(null);
          
          // Creamos un nuevo objeto con valores por defecto pero manteniendo el ID real
          const newFormData = {
            ...DEFAULT_WELCOME_SCREEN_CONFIG,
            id: typedData.data.id // Mantener ID real para la actualización
          };
          
          console.log('Estableciendo nueva formData con defaults y isEnabled=true:', newFormData);
          setFormData(newFormData);
        } else {
          console.log('Configuración normal con datos, estableciendo formData:', safeData);
          setFormData(safeData);
          
          // Solo establecemos el ID si es una configuración real/significativa
          if (typedData.data.id && typeof typedData.data.id === 'string' && typedData.data.id.trim() !== '') {
            setWelcomeScreenId(typedData.data.id);
            console.log('WelcomeScreen significativa encontrada con ID:', typedData.data.id);
          } else {
            setWelcomeScreenId(null);
            console.log('WelcomeScreen sin ID válido, estableciendo a null');
          }
        }
      } else {
        // Si no hay datos o no hay ID, usar valores por defecto
        console.log('No se encontró configuración de WelcomeScreen, usando valores por defecto');
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
    
    // Validación del campo isEnabled (siempre debe existir)
    if (formData.isEnabled === undefined || formData.isEnabled === null) {
      errors.isEnabled = 'El estado de habilitación es requerido';
      console.log('Error de validación: isEnabled es undefined o null');
    }
    
    // Solo validamos título y mensaje si está habilitada la pantalla
    if (formData.isEnabled) {
      // Validación de título
      if (!formData.title) {
        errors.title = ERROR_MESSAGES.VALIDATION_ERRORS.TITLE_REQUIRED;
        console.log('Error de validación: título vacío');
      } else if (formData.title.trim() === '') {
        errors.title = 'El título no puede estar vacío';
        console.log('Error de validación: título solo con espacios');
      }
      
      // Validación de mensaje
      if (!formData.message) {
        errors.message = ERROR_MESSAGES.VALIDATION_ERRORS.MESSAGE_REQUIRED;
        console.log('Error de validación: mensaje vacío');
      } else if (formData.message.trim() === '') {
        errors.message = 'El mensaje no puede estar vacío';
        console.log('Error de validación: mensaje solo con espacios');
      }
      
      // Validación de texto del botón
      if (!formData.startButtonText) {
        errors.startButtonText = ERROR_MESSAGES.VALIDATION_ERRORS.BUTTON_TEXT_REQUIRED;
        console.log('Error de validación: texto del botón vacío');
      } else if (formData.startButtonText.trim() === '') {
        errors.startButtonText = 'El texto del botón no puede estar vacío';
        console.log('Error de validación: texto del botón solo con espacios');
      }
    }
    
    // Imprimimos los errores encontrados para depuración
    if (Object.keys(errors).length > 0) {
      console.log('Errores de validación encontrados:', errors);
    } else {
      console.log('Formulario validado correctamente');
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
    realWelcomeScreenId,
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