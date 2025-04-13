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

      // Preparar datos para enviar
      const dataToSave = {
        ...formData,
        researchId,
        metadata: {
          version: '1.0.0',
          updatedAt: new Date().toISOString()
        }
      };

      // Crear modal de confirmación con DOM nativo
      const confirmModalContainer = document.createElement('div');
      confirmModalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto p-6 relative">
            <button id="closeConfirmModal" style="background: none; border: none; cursor: pointer; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #6b7280; border-radius: 50%; transition: all 0.2s; position: absolute; right: 16px; top: 16px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div class="mb-5">
              <h3 class="text-lg font-bold text-gray-900 mb-2">Confirmar Acción</h3>
              <p class="text-gray-600">¿Estás seguro que deseas guardar esta pantalla de bienvenida?</p>
            </div>
            
            <div class="text-left mb-6">
              <p class="text-sm font-medium text-gray-700 mb-2">Resumen de la configuración:</p>
              <ul class="pl-5 space-y-1 text-sm text-gray-600 list-disc">
                <li><span class="font-medium">Título:</span> ${dataToSave.title}</li>
                <li><span class="font-medium">Estado:</span> ${dataToSave.isEnabled ? 'Habilitada' : 'Deshabilitada'}</li>
                <li><span class="font-medium">Mensaje:</span> ${dataToSave.message}</li>
                <li><span class="font-medium">Texto del botón:</span> ${dataToSave.startButtonText}</li>
              </ul>
            </div>
            
            <div class="flex gap-3 justify-end">
              <button id="cancelSaveButton" class="px-4 py-2 border rounded-md text-gray-600 bg-white hover:bg-gray-50 transition-colors duration-200">
                Cancelar
              </button>
              <button id="confirmSaveButton" class="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200">
                ${existingScreen ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      `;

      // Añadir estilos al modal
      const style = document.createElement('style');
      style.innerHTML = `
        #closeConfirmModal:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
      `;
      confirmModalContainer.appendChild(style);

      // Añadir el modal al DOM
      document.body.appendChild(confirmModalContainer);

      // Evento para cerrar el modal
      document.getElementById('closeConfirmModal')?.addEventListener('click', () => {
        document.body.removeChild(confirmModalContainer);
      });

      // Evento para cancelar
      document.getElementById('cancelSaveButton')?.addEventListener('click', () => {
        document.body.removeChild(confirmModalContainer);
      });

      // Evento para confirmar y guardar
      document.getElementById('confirmSaveButton')?.addEventListener('click', async () => {
        document.body.removeChild(confirmModalContainer);
        
        // Mostrar indicador de carga
        const loadingToastId = toast.loading('Guardando pantalla de bienvenida...', {
          duration: Infinity,
          style: {
            background: '#F0F9FF',
            color: '#0C4A6E',
            padding: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          },
          icon: '⏳'
        });

        try {
          setIsSaving(true);
          console.log('💾 Guardando welcomeScreen...');
          console.log('Estado actual:', existingScreen ? 'Actualizando existente' : 'Creando nuevo');

          let savedData;
          if (existingScreen) {
            console.log('📝 PUT - Actualizando welcomeScreen existente');
            savedData = await welcomeScreenService.update(researchId, formData);
            toast.success('WelcomeScreen actualizado correctamente', { id: loadingToastId });
          } else {
            console.log('✨ POST - Creando nuevo welcomeScreen');
            savedData = await welcomeScreenService.create(formData);
            toast.success('WelcomeScreen creado correctamente', { id: loadingToastId });
          }

          setExistingScreen(adaptRecordToFormData(savedData));
          setFormData(adaptRecordToFormData(savedData));
          
        } catch (error: unknown) {
          console.error('❌ Error al guardar:', error);
          const errorMessage = error instanceof Error ? error.message : 'Error al guardar los cambios';
          toast.error(errorMessage, { id: loadingToastId });
          setModalError({
            title: 'Error al guardar',
            message: errorMessage,
            type: 'error'
          });
        } finally {
          setIsSaving(false);
        }
      });
      
      // Cerrar modal al hacer clic fuera
      confirmModalContainer.addEventListener('click', (e) => {
        if (e.target === confirmModalContainer.firstChild) {
          document.body.removeChild(confirmModalContainer);
        }
      });

    } catch (error: unknown) {
      console.error('Error al preparar guardado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al preparar la pantalla de bienvenida para guardar';
      toast.error(errorMessage);
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