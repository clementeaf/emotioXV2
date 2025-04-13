import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../providers/AuthProvider';
import { welcomeScreenService } from '../../../../services/welcomeScreen.service';
import { WelcomeScreenData, ErrorModalData } from '../types';

// Definiciones de tipo necesarias
interface WelcomeScreenResponse {
  data?: WelcomeScreenData;
  error?: string;
  notFound?: boolean;
  unauthorized?: boolean;
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
  generateHtmlPreview: () => void;
  isExisting: boolean;
  closeErrorModal: () => void;
  continueWithAction: () => void;
}

// Constantes simuladas
const DEFAULT_WELCOME_SCREEN_CONFIG: WelcomeScreenData = {
  isEnabled: true,
  title: '',
  message: '',
  startButtonText: '',
  researchId: ''
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
  const [formData, setFormData] = useState<WelcomeScreenData>({ 
    ...DEFAULT_WELCOME_SCREEN_CONFIG,
    researchId 
  });
  const [welcomeScreenId, setWelcomeScreenId] = useState<string | null>(null);
  const [realWelcomeScreenId, setRealWelcomeScreenId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);
  const [jsonToSend, setJsonToSend] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'save' | 'preview' | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [existingScreen, setExistingScreen] = useState<WelcomeScreenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Verificar existencia de welcomeScreen
  const { data: welcomeScreenData, isLoading: isLoadingData } = useQuery({
    queryKey: ['welcomeScreen', researchId],
    queryFn: async () => {
      console.log('🔍 Verificando welcomeScreen existente para researchId:', researchId);
      try {
        const data = await welcomeScreenService.getByResearchId(researchId);
        console.log('📦 Datos obtenidos:', data);
        return data;
      } catch (error) {
        console.error('❌ Error al verificar welcomeScreen:', error);
        return null;
      }
    },
    retry: false
  });

  // Inicializar/actualizar datos cuando se obtiene respuesta
  useEffect(() => {
    if (!isLoadingData) {
      if (welcomeScreenData) {
        console.log('✅ WelcomeScreen encontrado, inicializando formulario con datos existentes');
        setExistingScreen(welcomeScreenData);
        setFormData(welcomeScreenData);
      } else {
        console.log('ℹ️ No se encontró WelcomeScreen, usando configuración por defecto');
        setExistingScreen(null);
        setFormData({ ...DEFAULT_WELCOME_SCREEN_CONFIG, researchId });
      }
      setIsLoading(false);
    }
  }, [welcomeScreenData, isLoadingData, researchId]);

  // Validar formulario
  const validateForm = useCallback(() => {
    const errors: {[key: string]: string} = {};
    
    if (formData.isEnabled) {
      if (!formData.title?.trim()) errors.title = 'El título es obligatorio';
      if (!formData.message?.trim()) errors.message = 'El mensaje es obligatorio';
      if (!formData.startButtonText?.trim()) errors.startButtonText = 'El texto del botón es obligatorio';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Manejar cambios en el formulario
  const handleChange = useCallback((field: keyof WelcomeScreenData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value ?? ''
    }));
  }, []);

  // Guardar cambios
  const handleSave = useCallback(async () => {
    try {
      if (!validateForm()) {
        toast.error('Por favor, corrija los errores en el formulario');
        return;
      }

      setIsSaving(true);
      console.log('💾 Guardando welcomeScreen...');
      console.log('Estado actual:', existingScreen ? 'Actualizando existente' : 'Creando nuevo');

      let savedData;
      if (existingScreen) {
        console.log('📝 PUT - Actualizando welcomeScreen existente');
        savedData = await welcomeScreenService.update(researchId, formData);
        toast.success('WelcomeScreen actualizado correctamente');
      } else {
        console.log('✨ POST - Creando nuevo welcomeScreen');
        savedData = await welcomeScreenService.create(formData);
        toast.success('WelcomeScreen creado correctamente');
      }

      setExistingScreen(savedData);
      setFormData(savedData);
      
    } catch (error: any) {
      console.error('❌ Error al guardar:', error);
      toast.error(error.message || 'Error al guardar los cambios');
      setModalError({
        title: 'Error al guardar',
        message: error.message || 'Ocurrió un error al guardar los cambios',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  }, [researchId, formData, existingScreen, validateForm]);

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
  }, [showJsonPreview, jsonToSend, pendingAction, closeJsonModal, validationErrors]);

  // Función para la vista previa HTML
  const generateHtmlPreview = useCallback(() => {
    try {
      // Aquí se generaría el HTML real de la vista previa
      // Por simplicidad, solo mostraremos un mensaje
      window.open(`/preview/welcome-screen?id=${welcomeScreenId || ''}`, '_blank');
    } catch (error) {
      console.error('Error al generar vista previa HTML:', error);
      toast.error('Error al generar vista previa');
    }
  }, [welcomeScreenId]);

  // Verificar si existe un welcomeScreen para este researchId
  const checkExistingWelcomeScreen = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Verificando welcomeScreen existente para researchId:', researchId);
      
      const existing = await welcomeScreenService.getByResearchId(researchId);
      
      if (existing) {
        console.log('✅ WelcomeScreen encontrado:', existing);
        setExistingScreen(existing);
        setFormData(existing);
      } else {
        console.log('ℹ️ No se encontró WelcomeScreen existente');
        setExistingScreen(null);
      }
    } catch (error) {
      console.error('❌ Error al verificar welcomeScreen:', error);
      toast.error('Error al cargar datos existentes');
    } finally {
      setIsLoading(false);
    }
  }, [researchId]);

  // Cargar datos existentes al montar el componente
  useEffect(() => {
    checkExistingWelcomeScreen();
  }, [checkExistingWelcomeScreen]);

  const closeErrorModal = () => {
    setModalError(null);
  };

  const continueWithAction = () => {
    // Implementa la lógica para continuar con la acción
  };

  return {
    formData,
    welcomeScreenId,
    realWelcomeScreenId,
    validationErrors,
    isLoading: isLoading || isLoadingData,
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
    generateHtmlPreview,
    isExisting: !!existingScreen,
    closeErrorModal,
    continueWithAction,
  };
}; 