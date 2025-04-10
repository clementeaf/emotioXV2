import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '../../../../config/api-client';
import { useAuth } from '../../../../providers/AuthProvider';
import { WelcomeScreenRecord, welcomeScreenService } from '../../../../services/welcomeScreenService';

// Definiciones de tipo necesarias (simuladas si las originales no están disponibles)
interface WelcomeScreenData {
  id?: string;
  researchId?: string;
  isEnabled: boolean;
  title: string;
  message: string;
  startButtonText: string;
  [key: string]: any; // Para permitir propiedades adicionales
}

interface WelcomeScreenResponse {
  data?: WelcomeScreenData;
  error?: string;
  notFound?: boolean;
  unauthorized?: boolean;
}

interface ErrorModalData {
  title: string;
  message: string | React.ReactNode;
  type: 'error' | 'info' | 'success';
}

interface UseWelcomeScreenFormResult {
  formData: WelcomeScreenData;
  welcomeScreenId: string | null;
  realWelcomeScreenId: string | null;
  validationErrors: { [key: string]: string };
  isLoading: boolean;
  isSaving: boolean;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  handleChange: (field: keyof WelcomeScreenData, value: any) => void;
  handleSave: () => void;
  handlePreview: () => void;
  validateForm: () => boolean;
  closeModal: () => void;
  showJsonPreview: boolean;
  closeJsonModal: () => void;
  jsonToSend: string;
  pendingAction: 'save' | 'preview' | null;
  continueWithAction: () => void;
}

// Constantes simuladas
const DEFAULT_WELCOME_SCREEN_CONFIG: WelcomeScreenData = {
  isEnabled: true,
  title: '',
  message: '',
  startButtonText: ''
};

const QUERY_KEYS = {
  WELCOME_SCREEN: 'welcomeScreen'
};

const ERROR_MESSAGES = {
  VALIDATION_ERRORS: {
    TITLE_REQUIRED: 'El título es obligatorio',
    MESSAGE_REQUIRED: 'El mensaje es obligatorio',
    BUTTON_TEXT_REQUIRED: 'El texto del botón es obligatorio'
  }
};

// Definición de tipo para función onSuccess
type SuccessCallback = (data: any) => void;

/**
 * Hook personalizado para gestionar la lógica del formulario de pantalla de bienvenida
 */
export const useWelcomeScreenForm = (
  researchId: string, 
  onSuccess?: SuccessCallback
): UseWelcomeScreenFormResult => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<WelcomeScreenData>({ ...DEFAULT_WELCOME_SCREEN_CONFIG });
  const [welcomeScreenId, setWelcomeScreenId] = useState<string | null>(null);
  const [realWelcomeScreenId, setRealWelcomeScreenId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const { isAuthenticated, token } = useAuth();
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);
  const [jsonToSend, setJsonToSend] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'save' | 'preview' | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // Handlers para el modal
  const closeModal = useCallback(() => setModalVisible(false), []);
  const showModal = useCallback((errorData: ErrorModalData) => {
    setModalError(errorData);
    setModalVisible(true);
  }, []);

  // Función para cerrar el modal JSON
  const closeJsonModal = useCallback(() => {
    setShowJsonPreview(false);
    setPendingAction(null);
    setJsonToSend('');
    
    console.log('[useWelcomeScreenForm] Modal JSON cerrado');
  }, []);

  // Mutaciones para crear y actualizar (movidas antes de su uso)
  const createMutation = useMutation({
    mutationFn: async (data: WelcomeScreenData) => {
      try {
        // Asegurar que data tiene el researchId correcto
        const dataWithResearchId = {
          ...data,
          researchId: data.researchId || researchId
        };
        
        // Eliminar cualquier ID que pueda haber en los datos
        // ya que el backend asignará uno nuevo
        delete dataWithResearchId.id;
        
        console.log('Datos para crear nueva pantalla:', JSON.stringify(dataWithResearchId, null, 2));
        
        // Utilizar el servicio directamente
        return await welcomeScreenService.create(dataWithResearchId);
      } catch (createError: any) {
        console.error('Error al crear welcomeScreen:', createError);
        console.error('Detalles del error:', JSON.stringify(createError, null, 2));
        
        throw {
          statusCode: createError.response?.status || 500,
          message: createError.message || 'Error al crear la pantalla de bienvenida'
        };
      }
    },
    onSuccess: (data) => {
      console.log('WelcomeScreen creada exitosamente:', data);
      toast.success('Pantalla de bienvenida creada con éxito');
      
      // Invalidar la consulta para recargar los datos
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WELCOME_SCREEN, researchId] });
      
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: any) => {
      console.error('Error al crear WelcomeScreen:', error);
      
      const errorMessage = error.message || 'Error al crear. Por favor, inténtelo de nuevo.';
      toast.error(errorMessage);
      
      showModal({
        title: 'Error al crear',
        message: errorMessage,
        type: 'error'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: WelcomeScreenData) => {
      try {
        // Asegurar que researchId está presente
        if (!data.researchId) {
          data.researchId = researchId;
        }
        
        // Imprimir información para debugging
        console.log('[DEBUG] Método utilizado: welcomeScreenService.createOrUpdateForResearch');
        console.log('[DEBUG] Research ID:', data.researchId);
        console.log('[DEBUG] Datos enviados:', JSON.stringify(data, null, 2));
        
        // Utilizar createOrUpdateForResearch directamente
        // Esta función maneja internamente tanto la creación como la actualización
        const result = await welcomeScreenService.createOrUpdateForResearch(data.researchId, data);
        console.log('[DEBUG] Resultado exitoso:', result);
        return result;
      } catch (updateError: any) {
        console.error('[ERROR] Error al actualizar welcomeScreen:', updateError);
        console.error('[ERROR] Detalles del error:', JSON.stringify(updateError, null, 2));
        
        throw {
          statusCode: updateError.response?.status || 500,
          message: updateError.message || 'Error al actualizar la pantalla de bienvenida'
        };
      }
    },
    onSuccess: (data) => {
      console.log('WelcomeScreen actualizada exitosamente:', data);
      toast.success('Pantalla de bienvenida actualizada con éxito');
      
      // Invalidar la consulta para recargar los datos
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WELCOME_SCREEN, researchId] });
      
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: any) => {
      console.error('Error al actualizar WelcomeScreen:', error);
      
      const errorMessage = error.message || 'Error al actualizar. Por favor, inténtelo de nuevo.';
      toast.error(errorMessage);
      
      showModal({
        title: 'Error al actualizar',
        message: errorMessage,
        type: 'error'
      });
    }
  });

  // Función para mostrar el modal con JSON
  const showJsonModal = useCallback((json: any, action: 'save' | 'preview') => {
    try {
      // Validar que el JSON sea válido
      const stringifiedJson = JSON.stringify(json, null, 2);
      JSON.parse(stringifiedJson); // Verificar que sea un JSON válido
      
      if (Object.keys(validationErrors).length > 0) {
        showModal({
          title: 'Errores de validación',
          message: 'Por favor, corrija los errores de validación antes de continuar.',
          type: 'error'
        });
        return;
      }
      
      setJsonToSend(stringifiedJson);
      setPendingAction(action);
      setShowJsonPreview(true);
      
      console.log(`[useWelcomeScreenForm] Mostrando modal JSON para acción: ${action}`);
      console.log('[useWelcomeScreenForm] JSON válido:', stringifiedJson);
    } catch (error) {
      console.error('[useWelcomeScreenForm] Error al procesar JSON:', error);
      showModal({
        title: 'Error al procesar datos',
        message: 'Los datos no tienen un formato JSON válido. Por favor, revise la estructura de los datos.',
        type: 'error'
      });
    }
  }, [showModal, validationErrors]);

  // Función para continuar con la acción después de mostrar el JSON
  const continueWithAction = useCallback(() => {
    closeJsonModal();
    
    if (pendingAction === 'save') {
      // Ejecutar la mutación para guardar
      try {
        // Parsear el JSON que se mostró en el modal
        const dataToSaveObj = JSON.parse(jsonToSend);
        
        // Verificar campos requeridos
        if (!dataToSaveObj.title && dataToSaveObj.isEnabled) {
          throw new Error('El título es obligatorio cuando la pantalla está habilitada');
        }
        
        if (!dataToSaveObj.message && dataToSaveObj.isEnabled) {
          throw new Error('El mensaje es obligatorio cuando la pantalla está habilitada');
        }
        
        if (!dataToSaveObj.startButtonText && dataToSaveObj.isEnabled) {
          throw new Error('El texto del botón es obligatorio cuando la pantalla está habilitada');
        }
        
        // Asegurar que la estructura de datos es correcta
        const cleanData = {
          title: dataToSaveObj.title || '',
          message: dataToSaveObj.message || '',
          startButtonText: dataToSaveObj.startButtonText || '',
          isEnabled: dataToSaveObj.isEnabled === undefined ? true : dataToSaveObj.isEnabled,
          researchId: dataToSaveObj.researchId || researchId,
          // Otros campos opcionales
          ...(dataToSaveObj.subtitle && { subtitle: dataToSaveObj.subtitle }),
          ...(dataToSaveObj.logoUrl && { logoUrl: dataToSaveObj.logoUrl }),
          ...(dataToSaveObj.backgroundImageUrl && { backgroundImageUrl: dataToSaveObj.backgroundImageUrl }),
          ...(dataToSaveObj.backgroundColor && { backgroundColor: dataToSaveObj.backgroundColor }),
          ...(dataToSaveObj.textColor && { textColor: dataToSaveObj.textColor }),
          ...(dataToSaveObj.theme && { theme: dataToSaveObj.theme }),
          ...(dataToSaveObj.disclaimer && { disclaimer: dataToSaveObj.disclaimer }),
          ...(dataToSaveObj.customCss && { customCss: dataToSaveObj.customCss })
        };
        
        console.log('[DEBUG-SAVE] Datos limpios para guardar:', JSON.stringify(cleanData, null, 2));
        console.log('[DEBUG-SAVE] ID real de la pantalla para actualización:', realWelcomeScreenId);
        console.log('[DEBUG-SAVE] ID de la pantalla para UI:', welcomeScreenId);
        
        // Actualización lógica de guardado
        if (realWelcomeScreenId) {
          // Si ya existe un ID real, actualizar usando ese ID
          console.log(`[DEBUG-SAVE] Actualización: Actualizando configuración existente ID real: ${realWelcomeScreenId}`);
          console.log('[DEBUG-SAVE] Invocando updateMutation.mutate con los datos limpios');
          
          // Asegurar que el ID está correctamente establecido
          const updateData = {
            ...cleanData,
            id: realWelcomeScreenId // Usar explícitamente el ID real
          };
          
          console.log('[DEBUG-SAVE] Datos finales para actualización:', JSON.stringify(updateData, null, 2));
          updateMutation.mutate(updateData);
        } else {
          // Si no existe un ID real, crear uno nuevo
          console.log('[DEBUG-SAVE] Creación: Creando nueva configuración');
          console.log('[DEBUG-SAVE] Invocando createMutation.mutate con los datos limpios');
          createMutation.mutate(cleanData);
        }
      } catch (error) {
        console.error('[ERROR-SAVE] Error al procesar JSON:', error);
        toast.error('Error al procesar los datos del formulario');
        
        // Mostrar error detallado
        showModal({
          title: 'Error de procesamiento',
          message: error instanceof Error ? error.message : 'Ocurrió un error inesperado al procesar los datos',
          type: 'error'
        });
      }
    } else if (pendingAction === 'preview') {
      // Para la acción de preview, el componente JsonPreviewModal se encarga de mostrar la vista previa
      // en una nueva ventana, así que aquí solo necesitamos cerrar el modal
      console.log('[useWelcomeScreenForm] Cerrando modal después de previsualizar');
    }
  }, [jsonToSend, pendingAction, updateMutation, createMutation, showModal, closeJsonModal, researchId, realWelcomeScreenId]);

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
        console.error('Error al obtener welcomeScreen:', error);
        
        // Clasificar el error
        if (error.response?.status === 404) {
          console.log('No se encontró welcomeScreen (404)');
          return { data: null, notFound: true };
        }
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Error de autenticación en welcomeScreen');
          return { data: null, error: 'Error de autenticación', unauthorized: true };
        }
        
        console.log('Error genérico en welcomeScreen:', error.message || 'Error desconocido');
        return { 
          data: null, 
          error: error.message || 'Error al obtener datos de la pantalla de bienvenida'
        };
      }
    },
    enabled: !!researchId && isAuthenticated,
    retry: 1
  });

  // Calculamos si estamos guardando actualmente (eliminada la redeclaración)
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Inicializar datos del formulario desde la respuesta de la API
  useEffect(() => {
    if (welcomeScreenData) {
      console.log('Procesando datos de WelcomeScreen recibidos:', welcomeScreenData);
      
      // Si hay un error o no se encontró, usamos valores por defecto
      if (welcomeScreenData.error || welcomeScreenData.notFound) {
        console.log('Error o no encontrado:', welcomeScreenData.error || 'notFound');
        setFormData({ ...DEFAULT_WELCOME_SCREEN_CONFIG });
        setWelcomeScreenId(null);
        setRealWelcomeScreenId(null);
      }
      // Si hay datos válidos
      else if (welcomeScreenData.data) {
        console.log('Datos válidos encontrados para WelcomeScreen');
        
        // Tipado seguro para los datos
        const typedData = welcomeScreenData as WelcomeScreenResponse;
        
        // Guardar el ID real para uso posterior
        if (typedData.data && typedData.data.id) {
          setRealWelcomeScreenId(typedData.data.id);
          console.log('ID real guardado:', typedData.data.id);
        }
        
        // Crear un objeto seguro con valores por defecto para null/undefined
        const safeData: WelcomeScreenData = {
          ...DEFAULT_WELCOME_SCREEN_CONFIG,
          id: typedData.data?.id,
          researchId: researchId,
          isEnabled: typedData.data?.isEnabled !== undefined ? typedData.data.isEnabled : DEFAULT_WELCOME_SCREEN_CONFIG.isEnabled,
          title: typedData.data?.title || '',
          message: typedData.data?.message || '',
          startButtonText: typedData.data?.startButtonText || ''
        };
        
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
            id: typedData.data?.id // Mantener ID real para la actualización
          };
          
          console.log('Estableciendo nueva formData con defaults y isEnabled=true:', newFormData);
          setFormData(newFormData);
        } else {
          console.log('Configuración normal con datos, estableciendo formData:', safeData);
          setFormData(safeData);
          
          // Solo establecemos el ID si es una configuración real/significativa
          if (typedData.data && typedData.data.id && typeof typedData.data.id === 'string' && typedData.data.id.trim() !== '') {
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
  }, [welcomeScreenData, researchId]);

  // Gestionar cambios en los campos del formulario
  const handleChange = useCallback((field: keyof WelcomeScreenData, value: any) => {
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
  }, [validationErrors]);

  // Validar formulario
  const validateForm = useCallback((): boolean => {
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
  }, [formData]);

  // Manejar guardado del formulario
  const handleSave = useCallback(() => {
    if (!validateForm()) {
      // Mostrar mensaje de error
      toast.error('Por favor, corrija los errores antes de guardar');
      return;
    }

    // Crear objeto con los datos a enviar
    const dataToSave = {
      ...formData,
      metadata: {
        version: '1.0.0',
        updatedAt: new Date().toISOString()
      }
    };

    // Mostrar modal con JSON para confirmar antes de guardar
    showJsonModal(dataToSave, 'save');

  }, [formData, validateForm, showJsonModal]);

  // Manejar previsualización del formulario
  const handlePreview = useCallback(() => {
    if (!validateForm()) {
      // Mostrar mensaje de error
      toast.error('Por favor, corrija los errores antes de previsualizar');
      return;
    }

    // Crear objeto con los datos para previsualizar
    const dataToPreview = {
      ...formData,
      metadata: {
        version: '1.0.0',
        updatedAt: new Date().toISOString()
      }
    };

    // Mostrar modal con JSON directamente (sin pasar por "showJsonModal")
    // para que funcione igual que en CognitiveTasks
    try {
      const stringifiedJson = JSON.stringify(dataToPreview, null, 2);
      setJsonToSend(stringifiedJson);
      setPendingAction('preview');
      setShowJsonPreview(true);
      
      console.log('[useWelcomeScreenForm] Mostrando modal JSON para vista previa');
      console.log('[useWelcomeScreenForm] JSON para vista previa:', stringifiedJson);
    } catch (error) {
      console.error('[useWelcomeScreenForm] Error al procesar JSON para vista previa:', error);
      toast.error('Error al procesar los datos para vista previa');
    }
  }, [formData, validateForm]);

  // Efecto para crear el modal JSON
  useEffect(() => {
    // Este efecto ya no es necesario porque usamos el componente JsonPreviewModal
    // que ya incluye toda la funcionalidad necesaria
    return () => {};
  }, [showJsonPreview, jsonToSend, pendingAction, continueWithAction, closeJsonModal, validationErrors]);

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
    closeModal,
    showJsonPreview,
    closeJsonModal,
    jsonToSend,
    pendingAction,
    continueWithAction
  };
}; 