import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { welcomeScreenService } from '../../../../services/welcomeScreen.service';
import { 
  WelcomeScreenData, 
  ErrorModalData,
  UseWelcomeScreenFormResult
} from '../types';

// Definiciones de tipo necesarias
interface WelcomeScreenResponse {
  data?: WelcomeScreenData;
  error?: string;
  notFound?: boolean;
  unauthorized?: boolean;
}

// Constantes
const DEFAULT_WELCOME_SCREEN_CONFIG: Partial<WelcomeScreenData> = {
  isEnabled: true,
  title: '',
  message: '',
  startButtonText: 'Start Research'
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

// Función auxiliar para convertir datos del backend al formato del estado local
const adaptRecordToFormData = (record: any): WelcomeScreenData => {
  if (!record) {
    return {
      isEnabled: true,
      title: '',
      message: '',
      startButtonText: 'Start Research',
      researchId: ''
    };
  }
  
  return {
    id: record.id,
    researchId: record.researchId,
    isEnabled: record.isEnabled,
    title: record.title,
    message: record.message,
    startButtonText: record.startButtonText,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    // Convertir metadata si existe
    metadata: record.metadata ? {
      version: record.metadata.version,
      lastUpdated: record.metadata.lastUpdated instanceof Date 
        ? record.metadata.lastUpdated.toISOString() 
        : record.metadata.lastUpdated,
      lastModifiedBy: record.metadata.lastModifiedBy
    } : undefined
  };
};

/**
 * Hook personalizado para gestionar la lógica del formulario de pantalla de bienvenida
 */
export const useWelcomeScreenForm = (
  researchId: string, 
  onSuccess?: SuccessCallback
): UseWelcomeScreenFormResult => {
  const [formData, setFormData] = useState<WelcomeScreenData>({
    isEnabled: DEFAULT_WELCOME_SCREEN_CONFIG.isEnabled || true,
    title: DEFAULT_WELCOME_SCREEN_CONFIG.title || '',
    message: DEFAULT_WELCOME_SCREEN_CONFIG.message || '',
    startButtonText: DEFAULT_WELCOME_SCREEN_CONFIG.startButtonText || 'Start Research',
    researchId
  });
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
        setExistingScreen(adaptRecordToFormData(welcomeScreenData));
        setFormData(adaptRecordToFormData(welcomeScreenData));
      } else {
        console.log('ℹ️ No se encontró WelcomeScreen, usando configuración por defecto');
        setExistingScreen(null);
        setFormData({ 
          isEnabled: DEFAULT_WELCOME_SCREEN_CONFIG.isEnabled || true,
          title: DEFAULT_WELCOME_SCREEN_CONFIG.title || '',
          message: DEFAULT_WELCOME_SCREEN_CONFIG.message || '',
          startButtonText: DEFAULT_WELCOME_SCREEN_CONFIG.startButtonText || 'Start Research',
          researchId 
        });
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

      setExistingScreen(adaptRecordToFormData(savedData));
      setFormData(adaptRecordToFormData(savedData));
      
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
      toast.error('Por favor, corrija los errores en el formulario');
      return;
    }

    setJsonToSend(JSON.stringify(formData, null, 2));
    setShowJsonPreview(true);
    setPendingAction('preview');
  }, [formData, validateForm]);

  // Función para generar HTML preview
  const generateHtmlPreview = useCallback(() => {
    const html = `
      <html>
        <head>
          <title>Vista previa: ${formData.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              text-align: center;
            }
            h1 {
              margin-bottom: 20px;
            }
            p {
              margin-bottom: 30px;
              line-height: 1.6;
            }
            button {
              background-color: #4285f4;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              font-size: 16px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <h1>${formData.title}</h1>
          <p>${formData.message}</p>
          <button>${formData.startButtonText}</button>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    URL.revokeObjectURL(url);
  }, [formData]);

  // Verificar si existe un welcomeScreen para este researchId
  const checkExistingWelcomeScreen = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Verificando welcomeScreen existente para researchId:', researchId);
      
      const existing = await welcomeScreenService.getByResearchId(researchId);
      
      if (existing) {
        console.log('✅ WelcomeScreen encontrado:', existing);
        setExistingScreen(adaptRecordToFormData(existing));
        setFormData(adaptRecordToFormData(existing));
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
    if (pendingAction === 'save') {
      handleSave();
    } else if (pendingAction === 'preview') {
      generateHtmlPreview();
    }
    setShowJsonPreview(false);
    setPendingAction(null);
  };

  return {
    formData,
    welcomeScreenId: null,
    realWelcomeScreenId: null,
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