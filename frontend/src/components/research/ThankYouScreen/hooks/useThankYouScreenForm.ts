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
      // Abrir una nueva ventana con la previsualización real
      try {
        const dataToPreview = JSON.parse(jsonToSend);
        const previewWindow = window.open('', '_blank');
        
        if (previewWindow) {
          // Crear el HTML para la previsualización
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
                  background-color: ${dataToPreview.backgroundColor || '#ffffff'};
                }
                
                .thank-you-container {
                  max-width: 800px;
                  width: 100%;
                  padding: 40px 20px;
                  border-radius: 8px;
                  background-color: ${dataToPreview.backgroundColor || '#ffffff'};
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.03);
                }
                
                .thank-you-title {
                  font-size: 32px;
                  font-weight: 700;
                  margin-bottom: 24px;
                  color: ${dataToPreview.textColor || '#111827'};
                }
                
                .thank-you-message {
                  font-size: 18px;
                  line-height: 1.6;
                  color: ${dataToPreview.textColor || '#4b5563'};
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
                  ${dataToPreview.logoUrl ? `<img src="${dataToPreview.logoUrl}" alt="Logo" class="logo">` : ''}
                  
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
          toast.success('Se ha abierto la previsualización en una nueva ventana');
        } else {
          // Si no se pudo abrir la ventana (bloqueador de pop-ups, etc.)
          showModal({
            title: 'No se pudo abrir la previsualización',
            message: 'Parece que su navegador ha bloqueado la ventana emergente. Por favor, permita las ventanas emergentes para este sitio e inténtelo de nuevo.',
            type: 'error'
          });
          
          toast.error('No se pudo abrir la ventana de previsualización');
        }
      } catch (error) {
        console.error('[ThankYouScreenForm] Error al generar la previsualización:', error);
        
        showModal({
          title: ERROR_MESSAGES.PREVIEW_ERROR,
          message: 'Error al generar la previsualización. Por favor, inténtelo de nuevo.',
          type: 'error'
        });
        
        toast.error('Error al generar la previsualización');
      }
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
      const formDataObj = JSON.parse(jsonToSend);
      
      // Crear HTML para el modal
      const modalHtml = `
        <div id="jsonPreviewModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
          <div style="background: white; border-radius: 12px; max-width: 90%; width: 650px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.2); overflow: hidden;">
            <!-- Cabecera del modal -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; background-color: #f8fafc;">
              <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #334155;">Vista previa de la configuración</h2>
              <button id="closeJsonModal" style="background: transparent; border: none; cursor: pointer; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #555555; transition: all 0.2s; font-size: 24px;">&times;</button>
            </div>
            
            <div style="padding: 24px; overflow-y: auto; flex-grow: 1;">
              <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">
                Revise la configuración de la pantalla de agradecimiento antes de ${pendingAction === 'save' ? 'guardar' : 'previsualizar'}.
              </p>
              
              <!-- Sección de previsualización -->
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                <!-- Barra de título de la previsualización -->
                <div style="background: #f1f5f9; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">
                  <h3 style="margin: 0; font-size: 14px; font-weight: 500; color: #64748b;">Vista previa de pantalla</h3>
                </div>
                
                <!-- Contenido principal -->
                <div style="padding: 20px; background: #ffffff;">
                  <!-- Simulación de pantalla de agradecimiento -->
                  <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 30px; background-color: ${formDataObj.backgroundColor || '#f9fafb'}; text-align: center; max-width: 500px; margin: 0 auto;">
                    ${formDataObj.logoUrl ? `<img src="${formDataObj.logoUrl}" alt="Logo" style="max-height: 60px; margin-bottom: 20px;">` : ''}
                    <h2 style="font-size: 24px; font-weight: 700; color: ${formDataObj.textColor || '#111827'}; margin-bottom: 16px;">
                      ${formDataObj.title || 'Título no configurado'}
                    </h2>
                    <p style="font-size: 16px; line-height: 1.5; color: ${formDataObj.textColor || '#4b5563'}; margin-bottom: 24px; white-space: pre-line;">
                      ${formDataObj.message || 'Mensaje no configurado'}
                    </p>
                    ${formDataObj.redirectUrl ? `
                    <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
                      Al finalizar, se redirigirá a: <span style="font-family: monospace; color: #3b82f6;">${formDataObj.redirectUrl}</span>
                    </p>
                    ` : ''}
                  </div>
                </div>
              </div>
              
              <!-- Detalles de la configuración -->
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                <div style="background: #f1f5f9; padding: 10px 16px; border-bottom: 1px solid #e2e8f0;">
                  <h3 style="margin: 0; font-size: 14px; font-weight: 500; color: #64748b;">Detalles de la configuración</h3>
                </div>
                <div style="padding: 16px;">
                  <div style="display: grid; grid-template-columns: 140px 1fr; gap: 10px; align-items: center;">
                    <div style="font-size: 14px; color: #64748b;">Estado:</div>
                    <div style="font-size: 14px; color: #334155;">
                      <span style="display: inline-flex; align-items: center; font-weight: 500;">
                        <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 6px; background-color: ${formDataObj.isEnabled ? '#22c55e' : '#ef4444'};"></span>
                        ${formDataObj.isEnabled ? 'Habilitada' : 'Deshabilitada'}
                      </span>
                    </div>
                    
                    <div style="font-size: 14px; color: #64748b;">Título:</div>
                    <div style="font-size: 14px; color: #334155; font-weight: 500;">${formDataObj.title || '[No configurado]'}</div>
                    
                    <div style="font-size: 14px; color: #64748b;">Redirección:</div>
                    <div style="font-size: 14px; color: #334155;">
                      ${formDataObj.redirectUrl 
                        ? `<span style="word-break: break-all; font-family: monospace; font-size: 12px; background: #f8fafc; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">${formDataObj.redirectUrl}</span>` 
                        : '<span style="color: #94a3b8; font-style: italic;">Sin redirección</span>'}
                    </div>
                    
                    <div style="font-size: 14px; color: #64748b;">ID:</div>
                    <div style="font-size: 14px; color: #64748b; font-family: monospace; font-size: 12px;">
                      ${formDataObj.id || '[Nueva configuración]'}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Mensaje de confirmación -->
              <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px;">
                <div style="display: flex; gap: 12px; align-items: start;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <div>
                    <p style="margin: 0 0 8px; color: #0369a1; font-size: 14px; font-weight: 500;">Información</p>
                    <p style="margin: 0; color: #0c4a6e; font-size: 13px;">
                      ${pendingAction === 'save' 
                        ? 'Al hacer clic en "Guardar", estos ajustes se aplicarán a la pantalla de agradecimiento de su investigación.' 
                        : 'Al hacer clic en "Previsualizar", podrá ver cómo se mostrará la pantalla a los participantes.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Acciones del modal -->
            <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px; background: #f8fafc;">
              <button id="cancelJsonAction" style="background: white; color: #475569; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 16px; font-weight: 500; cursor: pointer; font-size: 14px; transition: all 0.2s;">
                Cancelar
              </button>
              <button id="continueJsonAction" style="background: #3f51b5; color: white; border: none; border-radius: 6px; padding: 10px 16px; font-weight: 500; cursor: pointer; font-size: 14px; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
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
      
      // Añadir hover effects
      const closeButton = document.getElementById('closeJsonModal');
      if (closeButton) {
        closeButton.addEventListener('mouseover', () => {
          closeButton.style.backgroundColor = '#f1f5f9';
          closeButton.style.color = '#0f172a';
        });
        closeButton.addEventListener('mouseout', () => {
          closeButton.style.backgroundColor = 'transparent';
          closeButton.style.color = '#555555';
        });
      }
      
      const cancelButton = document.getElementById('cancelJsonAction');
      if (cancelButton) {
        cancelButton.addEventListener('mouseover', () => {
          cancelButton.style.backgroundColor = '#f1f5f9';
        });
        cancelButton.addEventListener('mouseout', () => {
          cancelButton.style.backgroundColor = 'white';
        });
      }
      
      const continueButton = document.getElementById('continueJsonAction');
      if (continueButton) {
        continueButton.addEventListener('mouseover', () => {
          continueButton.style.backgroundColor = '#303f9f';
        });
        continueButton.addEventListener('mouseout', () => {
          continueButton.style.backgroundColor = '#3f51b5';
        });
      }
      
      // Función para manejar la acción de continuar
      const handleContinueAction = () => {
        if (document.body.contains(modalContainer)) {
          document.body.removeChild(modalContainer);
        }
        // Asegurarse de que continueWithAction se ejecute después de eliminar el modal
        setTimeout(() => {
          continueWithAction();
        }, 10);
      };
      
      // Función para manejar la acción de cancelar
      const handleCancelAction = () => {
        if (document.body.contains(modalContainer)) {
          document.body.removeChild(modalContainer);
        }
        closeJsonModal();
      };
      
      // Configurar eventos
      document.getElementById('closeJsonModal')?.addEventListener('click', handleCancelAction);
      
      document.getElementById('cancelJsonAction')?.addEventListener('click', handleCancelAction);
      
      document.getElementById('continueJsonAction')?.addEventListener('click', handleContinueAction);
      
      // También permitir cerrar haciendo clic fuera del modal
      modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer.firstChild) {
          handleCancelAction();
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