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
  startButtonText: ''
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
      startButtonText: '',
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
  const [formData, setFormData] = useState<WelcomeScreenData | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [existingScreen, setExistingScreen] = useState<WelcomeScreenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handlers para el modal
  const closeModal = useCallback(() => setModalVisible(false), []);

  // Verificar existencia de welcomeScreen
  const { data: welcomeScreenData, isLoading: isLoadingData } = useQuery({
    queryKey: ['welcomeScreen', researchId],
    queryFn: async () => {
      try {
        const data = await welcomeScreenService.getByResearchId(researchId);
        
        // Solo retornar datos si realmente existen y tienen un ID
        if (data && data.id) {
          return data;
        }
        
        // Si no hay datos, retornar null
        return null;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    retry: false
  });

  // Inicializar/actualizar datos cuando se obtiene respuesta
  useEffect(() => {
    if (!isLoadingData) {
      if (welcomeScreenData && welcomeScreenData.id) {
        const adaptedData = adaptRecordToFormData(welcomeScreenData);
        setExistingScreen(adaptedData);
        setFormData(adaptedData);
      } else {
        setExistingScreen(null);
        // Inicializar con la configuración por defecto
        setFormData({
          ...DEFAULT_WELCOME_SCREEN_CONFIG,
          researchId
        } as WelcomeScreenData);
      }
      setIsLoading(false);
    }
  }, [welcomeScreenData, isLoadingData, researchId]);

  // Validar formulario
  const validateForm = useCallback(() => {
    const errors: {[key: string]: string} = {};
    
    if (formData?.isEnabled) {
      if (!formData.title?.trim()) errors.title = 'El título es obligatorio';
      if (!formData.message?.trim()) errors.message = 'El mensaje es obligatorio';
      if (!formData.startButtonText?.trim()) errors.startButtonText = 'El texto del botón es obligatorio';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Manejar cambios en el formulario
  const handleChange = useCallback((field: keyof WelcomeScreenData, value: any) => {
    setFormData(prev => prev ? {
      ...prev,
      [field]: value ?? ''
    } : null);
  }, []);

  // Guardar cambios
  const handleSave = useCallback(async () => {
    if (!formData) {
      toast.error('No hay datos para guardar');
      return;
    }

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
            const toastId = toast.success('WelcomeScreen actualizado correctamente', { 
              id: loadingToastId,
              duration: 3000,
              style: {
                background: '#10b981',
                color: '#fff',
                fontWeight: 'bold'
              },
              icon: '✅'
            });
            
            // Hacer el toast clickeable
            const toastElement = document.getElementById(toastId);
            if (toastElement) {
              toastElement.style.cursor = 'pointer';
              toastElement.onclick = () => toast.dismiss(toastId);
            }
          } else {
            console.log('✨ POST - Creando nuevo welcomeScreen');
            savedData = await welcomeScreenService.create(formData);
            const toastId = toast.success('WelcomeScreen creado correctamente', { 
              id: loadingToastId,
              duration: 3000,
              style: {
                background: '#10b981',
                color: '#fff',
                fontWeight: 'bold'
              },
              icon: '✅'
            });
            
            // Hacer el toast clickeable
            const toastElement = document.getElementById(toastId);
            if (toastElement) {
              toastElement.style.cursor = 'pointer';
              toastElement.onclick = () => toast.dismiss(toastId);
            }
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
    if (!formData) {
      toast.error('No hay datos para previsualizar');
      return;
    }

    if (!validateForm()) {
      toast.error('Por favor, corrija los errores en el formulario');
      return;
    }

    try {
      // Crear una nueva ventana para la vista previa
      const previewWindow = window.open('', '_blank');
      
      if (previewWindow) {
        const previewHtml = `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vista previa - Pantalla de Bienvenida</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
                color: #333;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
              }
              
              .preview-badge {
                position: fixed;
                top: 12px;
                right: 12px;
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 100;
              }
              
              .header {
                background-color: #4f46e5;
                color: white;
                padding: 10px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              
              .header h1 {
                font-size: 16px;
                margin: 0;
                font-weight: 500;
              }
              
              .content {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 40px 20px;
                text-align: center;
                background-color: #ffffff;
              }
              
              .welcome-container {
                max-width: 800px;
                width: 100%;
                padding: 40px 20px;
                border-radius: 8px;
                background-color: #ffffff;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.03);
              }
              
              .welcome-title {
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 24px;
                color: #111827;
              }
              
              .welcome-message {
                font-size: 18px;
                line-height: 1.6;
                color: #4b5563;
                margin-bottom: 32px;
                white-space: pre-line;
              }
              
              .start-button {
                display: inline-block;
                padding: 12px 24px;
                font-size: 16px;
                font-weight: 500;
                color: #ffffff;
                background-color: #4f46e5;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                transition: background-color 0.2s;
              }
              
              .start-button:hover {
                background-color: #4338ca;
              }
              
              .footer {
                padding: 10px 20px;
                font-size: 12px;
                color: #9ca3af;
                text-align: center;
                background-color: #f9fafb;
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="preview-badge">Vista previa</div>
            
            <header class="header">
              <h1>Vista previa de la pantalla de bienvenida</h1>
              <button onclick="window.close()" style="background: none; border: none; color: white; cursor: pointer;">Cerrar</button>
            </header>
            
            <main class="content">
              <div class="welcome-container">
                <h1 class="welcome-title">${formData?.title || 'Título no configurado'}</h1>
                <div class="welcome-message">
                  ${formData?.message || 'Mensaje no configurado'}
                </div>
                <button class="start-button">
                  ${formData?.startButtonText || 'Comenzar'}
                </button>
              </div>
            </main>
            
            <footer class="footer">
              <p>Esta es una vista previa y puede no representar exactamente cómo se verá la pantalla real.</p>
            </footer>
          </body>
          </html>
        `;
        
        // Escribir el HTML en la nueva ventana
        previewWindow.document.write(previewHtml);
        previewWindow.document.close();
        
        // Notificar al usuario que se ha abierto la previsualización
        toast.success('Se ha abierto la previsualización en una nueva ventana', {
          duration: 5000,
          style: {
            background: '#F0F9FF',
            color: '#0C4A6E',
            padding: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          },
          icon: '🔍'
        });
      } else {
        // Si no se pudo abrir la ventana (bloqueador de pop-ups, etc.)
        toast.error('No se pudo abrir la ventana de previsualización. Por favor, permita las ventanas emergentes para este sitio.', {
          duration: 5000,
          style: {
            background: '#FEF2F2',
            color: '#991B1B',
            padding: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          },
          icon: '❌'
        });
      }
    } catch (error) {
      console.error('[WelcomeScreenForm] Error al generar la previsualización:', error);
      toast.error('Error al generar la vista previa', {
        duration: 5000,
        style: {
          background: '#FEF2F2',
          color: '#991B1B',
          padding: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        },
        icon: '❌'
      });
    }
  }, [formData, validateForm]);

  // Función para generar HTML preview
  const generateHtmlPreview = useCallback(() => {
    const html = `
      <html>
        <head>
          <title>Vista previa: ${formData?.title}</title>
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
          <h1>${formData?.title}</h1>
          <p>${formData?.message}</p>
          <button>${formData?.startButtonText}</button>
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
      const existing = await welcomeScreenService.getByResearchId(researchId);
      
      if (existing && existing.id) {
        setExistingScreen(adaptRecordToFormData(existing));
        setFormData(adaptRecordToFormData(existing));
      } else {
        setExistingScreen(null);
        setFormData(null);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setExistingScreen(null);
        setFormData(null);
      } else {
        throw error;
      }
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

  return {
    formData,
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
    isExisting: !!welcomeScreenData?.id,
    closeErrorModal,
    existingScreen
  };
}; 