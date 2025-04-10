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
      
      // Eliminamos el toast de éxito ya que se maneja en handleSave con el loadingToastId
    },
    onError: (error: any) => {
      console.error('[useThankYouScreenForm] Error en mutación:', error);
      
      // Mostrar mensaje de error con el modal - mantenemos este modal para manejo de errores
      showModal({
        title: ERROR_MESSAGES.SAVE_ERROR,
        message: error.message || 'Ocurrió un error al guardar la configuración',
        type: 'error'
      });
      
      // Mostrar error en toast
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

  // Guardar formulario (modificado para mostrar DOM modal)
  const handleSave = () => {
    if (!isAuthenticated) {
      showModal({
        title: 'Error de autenticación',
        message: 'No está autenticado. Por favor, inicie sesión para guardar la pantalla de agradecimiento.',
        type: 'error'
      });
      return;
    }
    
    if (!validateForm()) {
      // Crear un mensaje con la lista de errores
      const errorMessageText = 'Errores: ' + Object.values(validationErrors).join(', ');
      
      showModal({
        title: ERROR_MESSAGES.SAVE_ERROR,
        message: errorMessageText,
        type: 'error'
      });
      
      toast.error('Por favor corrija los errores antes de guardar', {
        duration: 5000,
        style: {
          background: '#FEF2F2',
          color: '#991B1B',
          padding: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        },
        icon: '⚠️'
      });
      return;
    }

    try {
      // Preparar datos para enviar
      const dataToSave: ThankYouScreenFormData = {
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
              <p class="text-gray-600">¿Estás seguro que deseas guardar esta pantalla de agradecimiento?</p>
            </div>
            
            <div class="text-left mb-6">
              <p class="text-sm font-medium text-gray-700 mb-2">Resumen de la configuración:</p>
              <ul class="pl-5 space-y-1 text-sm text-gray-600 list-disc">
                <li><span class="font-medium">Título:</span> ${dataToSave.title}</li>
                <li><span class="font-medium">Estado:</span> ${dataToSave.isEnabled ? 'Habilitada' : 'Deshabilitada'}</li>
                ${dataToSave.redirectUrl ? 
                  `<li><span class="font-medium">URL de redirección:</span> ${dataToSave.redirectUrl}</li>` : 
                  '<li><span class="font-medium">URL de redirección:</span> <span class="italic">No configurada</span></li>'
                }
              </ul>
            </div>
            
            <div class="flex gap-3 justify-end">
              <button id="cancelSaveButton" class="px-4 py-2 border rounded-md text-gray-600 bg-white hover:bg-gray-50 transition-colors duration-200">
                Cancelar
              </button>
              <button id="confirmSaveButton" class="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200">
                Guardar
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
      document.getElementById('confirmSaveButton')?.addEventListener('click', () => {
        document.body.removeChild(confirmModalContainer);
        
        // Mostrar indicador de carga y mensaje de guardando
        const loadingToastId = toast.loading('Guardando pantalla de agradecimiento...', {
          duration: Infinity, // Que no desaparezca automáticamente
          style: {
            background: '#F0F9FF',
            color: '#0C4A6E',
            padding: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          },
          icon: '⏳'
        });
        
        // Ejecutar la mutación para guardar
        mutate(dataToSave, {
          onSuccess: (response) => {
            // Actualizar ID si se creó un nuevo registro
            if (response && response.id) {
              setThankYouScreenId(response.id);
            }
            
            // Invalidar consulta para recargar datos
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.THANK_YOU_SCREEN, researchId] });
            
            // Actualizar mensaje de toast a éxito
            toast.success(thankYouScreenId ? 'Pantalla de agradecimiento actualizada exitosamente' : 'Pantalla de agradecimiento creada exitosamente', { 
              id: loadingToastId,
              duration: 4000,
              style: {
                background: '#10b981',
                color: '#fff',
                fontWeight: 'bold'
              },
              icon: '✅'
             });
          },
          onError: (error: any) => {
            console.error('[ThankYouScreenForm] Error en mutación:', error);
            
            let errorMsg = 'Error al guardar la pantalla de agradecimiento';
            if (error.message) {
              errorMsg += `: ${error.message}`;
            }
            
            // Actualizar mensaje de toast a error
            toast.error(errorMsg, { 
              id: loadingToastId,
              duration: 5000,
              style: {
                background: '#FEF2F2',
                color: '#991B1B',
                padding: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              },
              icon: '❌'
            });
           
            // Mostrar modal de error
            showModal({
              title: ERROR_MESSAGES.SAVE_ERROR,
              message: errorMsg,
              type: 'error'
            });
          }
        });
      });
      
      // Cerrar modal al hacer clic fuera de él
      confirmModalContainer.addEventListener('click', (e) => {
        if (e.target === confirmModalContainer.firstChild) {
          document.body.removeChild(confirmModalContainer);
        }
      });
    } catch (error) {
      console.error('[ThankYouScreenForm] Error al preparar guardado:', error);
      toast.error('Error al preparar la pantalla de agradecimiento para guardar', {
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
  };

  // Previsualizar formulario (también actualizado con toasts mejorados)
  const handlePreview = () => {
    if (!validateForm()) {
      // Crear un mensaje con la lista de errores
      const errorMessageText = 'Errores: ' + Object.values(validationErrors).join(', ');
      
      showModal({
        title: ERROR_MESSAGES.PREVIEW_ERROR,
        message: errorMessageText,
        type: 'error'
      });
      
      toast.error('Por favor corrija los errores antes de previsualizar', {
        duration: 5000,
        style: {
          background: '#FEF2F2',
          color: '#991B1B',
          padding: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        },
        icon: '⚠️'
      });
      return;
    }
    
    try {
      // Preparar datos para previsualizar
      const dataToPreview = {
        ...formData,
        researchId,
        metadata: {
          version: '1.0.0',
          updatedAt: new Date().toISOString()
        }
      };
      
      // Abrir una nueva ventana con la previsualización real
        const previewWindow = window.open('', '_blank');
        
        if (previewWindow) {
        // Crear el HTML para la previsualización (código existente)
          const previewHtml = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Vista previa - Pantalla de Agradecimiento</title>
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
                
                .thank-you-container {
                  max-width: 800px;
                  width: 100%;
                  padding: 40px 20px;
                  border-radius: 8px;
                background-color: #ffffff;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.03);
                }
                
                .thank-you-title {
                  font-size: 32px;
                  font-weight: 700;
                  margin-bottom: 24px;
                color: #111827;
                }
                
                .thank-you-message {
                  font-size: 18px;
                  line-height: 1.6;
                color: #4b5563;
                  margin-bottom: 32px;
                  white-space: pre-line;
                }
                
                .logo {
                  max-height: 80px;
                  margin-bottom: 24px;
                }
                
                .redirect-info {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 1px solid rgba(0, 0, 0, 0.1);
                  font-size: 14px;
                  color: #6b7280;
                }
                
                .redirect-url {
                  font-family: monospace;
                  color: #3b82f6;
                  margin-top: 8px;
                  padding: 8px 12px;
                  background-color: #f8fafc;
                  border-radius: 4px;
                  border: 1px solid #e2e8f0;
                  display: inline-block;
                  word-break: break-all;
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
                <h1>Vista previa de la pantalla de agradecimiento</h1>
                <button onclick="window.close()" style="background: none; border: none; color: white; cursor: pointer;">Cerrar</button>
              </header>
              
              <main class="content">
                <div class="thank-you-container">
                  <h1 class="thank-you-title">${dataToPreview.title || 'Título no configurado'}</h1>
                  
                  <div class="thank-you-message">
                    ${dataToPreview.message || 'Mensaje no configurado'}
                  </div>
                  
                  ${dataToPreview.redirectUrl ? `
                  <div class="redirect-info">
                    <p>Al finalizar, el participante será redirigido a:</p>
                    <div class="redirect-url">${dataToPreview.redirectUrl}</div>
                  </div>
                  ` : ''}
                </div>
              </main>
              
              <footer class="footer">
                <p>Esta es una vista previa y puede no representar exactamente cómo se verá la pantalla real.</p>
              </footer>
            </body>
            </html>
          `;
          
          // Escribir el HTML en la nueva ventana y cerrarla para finalizar la carga
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
          showModal({
            title: 'No se pudo abrir la previsualización',
            message: 'Parece que su navegador ha bloqueado la ventana emergente. Por favor, permita las ventanas emergentes para este sitio e inténtelo de nuevo.',
            type: 'error'
          });
          
        toast.error('No se pudo abrir la ventana de previsualización', {
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
        console.error('[ThankYouScreenForm] Error al generar la previsualización:', error);
        
        showModal({
          title: ERROR_MESSAGES.PREVIEW_ERROR,
          message: 'Error al generar la previsualización. Por favor, inténtelo de nuevo.',
          type: 'error'
        });
        
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