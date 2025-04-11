import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  SmartVOCQuestion,
  SmartVOCFormData,
  SmartVOCResponse,
  DEFAULT_SMART_VOC_CONFIG,
  DEFAULT_QUESTIONS,
  ErrorModalData,
  UseSmartVOCFormResult,
  ValidationErrors
} from '../types';
import { smartVocFixedAPI } from '@/lib/smart-voc-api';
import { 
  QUERY_KEYS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES 
} from '../constants';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Hook personalizado para gestionar la lógica del formulario SmartVOC
 */
export const useSmartVOCForm = (researchId: string): UseSmartVOCFormResult => {
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState<SmartVOCQuestion[]>([...DEFAULT_QUESTIONS]);
  const [formData, setFormData] = useState<SmartVOCFormData>({ 
    ...DEFAULT_SMART_VOC_CONFIG,
    researchId 
  });
  const [smartVocId, setSmartVocId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const { isAuthenticated, token } = useAuth();

  // Estados para el nuevo modal de confirmación JSON
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);
  const [jsonToSend, setJsonToSend] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'save' | 'preview' | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Handlers para el modal
  const closeModal = () => setModalVisible(false);
  const showModal = (errorData: ErrorModalData) => {
    setModalError(errorData);
    setModalVisible(true);
  };

  // Consulta para obtener datos existentes
  const { data: smartVocData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.SMART_VOC, researchId],
    queryFn: async () => {
      try {
        if (!isAuthenticated || !token) {
          return { data: null, error: true, message: 'No autenticado' };
        }

        console.log(`[SmartVOCForm] Buscando configuración existente para investigación: ${researchId}`);
        const response = await smartVocFixedAPI.getByResearchId(researchId).send();
        console.log('[SmartVOCForm] Respuesta de API:', response);
        return response;
      } catch (error: any) {
        console.error('[SmartVOCForm] Error al obtener datos:', error);
        let errorMessage = ERROR_MESSAGES.FETCH_ERROR;
        
        // Si es error 404, es normal (no hay configuración previa)
        if (error?.statusCode === 404) {
          console.log('[SmartVOCForm] No se encontró configuración existente - esto es normal para una nueva investigación');
          return { data: null, notFound: true };
        }
        
        return { data: null, error: true, message: errorMessage };
      }
    },
    enabled: !!researchId && isAuthenticated,
    refetchOnWindowFocus: false
  });

  // Mutación para guardar datos
  const { mutate } = useMutation({
    mutationFn: async (data: SmartVOCFormData) => {
      try {
        if (!isAuthenticated || !token) {
          throw new Error('No autenticado: Se requiere un token de autenticación');
        }
        
        console.log('[SmartVOCForm] Datos a guardar:', JSON.stringify(data, null, 2));
        
        if (smartVocId) {
          console.log(`[SmartVOCForm] Actualizando Smart VOC con ID: ${smartVocId}`);
          return await smartVocFixedAPI.update(smartVocId, data).send();
        } else {
          console.log('[SmartVOCForm] Creando nuevo Smart VOC');
          return await smartVocFixedAPI.create(data).send();
        }
      } catch (error: any) {
        console.error('[SmartVOCForm] Error al guardar:', error);
        throw error;
      }
    },
    onSuccess: (response) => {
      console.log('[SmartVOCForm] Respuesta de guardado:', response);
      
      if (response && response.id) {
        setSmartVocId(response.id);
        console.log('[SmartVOCForm] ID establecido:', response.id);
      }
      
      // Invalidamos la query para recargar datos
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SMART_VOC, researchId] });
      
      // Mostrar mensaje de éxito
      toast.success(SUCCESS_MESSAGES.SAVE_SUCCESS, {
        duration: 4000,
        style: {
          background: '#10b981',
          color: '#fff',
          fontWeight: 'bold'
        },
        icon: '✅'
      });
      
      // Asegurarse de que el estado isSaving se restablezca
      setTimeout(() => setIsSaving(false), 300);
    },
    onError: (error: any) => {
      console.error('[SmartVOCForm] Error en mutación:', error);
      
      // Mostrar mensaje de error
      showModal({
        title: ERROR_MESSAGES.SAVE_ERROR,
        message: error.message || 'Ocurrió un error al guardar la configuración',
        type: 'error'
      });
      
      toast.error(ERROR_MESSAGES.SAVE_ERROR, {
        duration: 5000,
        style: {
          background: '#ef4444',
          color: '#fff',
          fontWeight: 'bold'
        },
        icon: '❌'
      });
      
      // Asegurarse de que el estado isSaving se restablezca
      setTimeout(() => setIsSaving(false), 300);
    },
    onSettled: () => {
      // Garantizar que siempre se restablezca el estado de guardado
      setTimeout(() => setIsSaving(false), 300);
    }
  });

  // Efecto para cargar datos existentes cuando estén disponibles
  useEffect(() => {
    if (smartVocData && smartVocData.data) {
      const existingData = smartVocData.data;
      console.log('[SmartVOCForm] Datos recibidos:', existingData);
      
      // Actualizar ID
      if (existingData.id) {
        setSmartVocId(existingData.id);
        console.log('[SmartVOCForm] ID de Smart VOC encontrado:', existingData.id);
      }
      
      // Actualizar formData con los valores existentes
      setFormData({
        ...DEFAULT_SMART_VOC_CONFIG,
        ...existingData
      });
      
      // Crear lista de preguntas basada en las habilitadas
      const questionsConfig = {
        CSAT: existingData.CSAT || false,
        CES: existingData.CES || false,
        CV: existingData.CV || false,
        NEV: existingData.NEV || false,
        NPS: existingData.NPS || false,
        VOC: existingData.VOC || false,
      };
      
      const enabledQuestions = DEFAULT_QUESTIONS.filter(q => 
        questionsConfig[q.type as keyof typeof questionsConfig]
      );
      
      if (enabledQuestions.length > 0) {
        setQuestions(enabledQuestions);
        console.log('[SmartVOCForm] Preguntas habilitadas:', enabledQuestions.length);
      } else {
        // Si no hay preguntas habilitadas, usar todas por defecto
        console.log('[SmartVOCForm] No hay preguntas habilitadas, usando todas por defecto');
        setQuestions([...DEFAULT_QUESTIONS]);
      }
    } else {
      console.log('[SmartVOCForm] No hay datos existentes, usando configuración por defecto');
    }
  }, [smartVocData]);

  // Función para agregar una nueva pregunta
  const addQuestion = (customQuestion?: SmartVOCQuestion) => {
    // Si se proporciona una pregunta personalizada, usarla
    if (customQuestion) {
      setQuestions(prev => [...prev, customQuestion]);
      return;
    }
    
    // Lógica original para seleccionar automáticamente una pregunta no utilizada
    const unusedQuestions = DEFAULT_QUESTIONS.filter(
      defaultQ => !questions.some(q => q.type === defaultQ.type)
    );
    
    if (unusedQuestions.length === 0) {
      toast.error('Ya has añadido todos los tipos de preguntas disponibles');
      return;
    }
    
    setQuestions(prev => [...prev, {...unusedQuestions[0]}]);
  };

  // Función para eliminar una pregunta
  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  // Función para actualizar una pregunta
  const updateQuestion = (id: string, updates: Partial<SmartVOCQuestion>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  // Función para manejar cambios en las configuraciones generales
  const handleSettingChange = (setting: keyof SmartVOCFormData, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Validar formulario
  const validateForm = (): boolean => {
    // Limpiar errores previos
    setValidationErrors({});
    
    // Array para almacenar errores
    const errors: ValidationErrors = {};
    
    // Validar que hay al menos una pregunta seleccionada
    if (questions.length === 0) {
      errors.questions = ERROR_MESSAGES.VALIDATION_ERRORS.NO_QUESTIONS;
    }
    
    // Actualizar errores y retornar resultado
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
    setJsonToSend('');
  };

  // Función para continuar con la acción pendiente
  const continueWithAction = () => {
    closeJsonModal();
    
    if (pendingAction === 'preview') {
      // Para la previsualización, podríamos abrir una ventana con los datos o implementar otra lógica
      try {
        // Aquí podríamos implementar la lógica para mostrar una vista previa
        toast.success('Vista previa iniciada', {
          icon: '👁️',
          style: {
            background: '#3b82f6',
            color: '#fff'
          }
        });
        
        // Por ahora, solo mostramos un mensaje
        showModal({
          title: 'Vista previa',
          message: 'La funcionalidad de vista previa estará disponible próximamente',
          type: 'info'
        });
      } catch (error) {
        console.error('[SmartVOCForm] Error al generar vista previa:', error);
        toast.error('Error al generar vista previa');
      }
    }
  };

  // Función para guardar la configuración
  const handleSave = () => {
    try {
      // Si no está autenticado, mostrar error
      if (!isAuthenticated) {
        toast.error('Debe iniciar sesión para guardar configuración');
        return;
      }
      
      // Validar formulario primero
      if (!validateForm()) {
        toast.error('Por favor, corrija los errores en el formulario');
        return;
      }
      
      // Preparamos los datos para el backend asegurándonos de incluir los valores correctos para las preguntas
      const questionsConfig: Record<string, boolean> = {};
      const standardTypes = ['CSAT', 'CES', 'CV', 'NEV', 'NPS', 'VOC'];
      
      // Establecer todos los tipos estándar como false primero
      standardTypes.forEach(type => {
        questionsConfig[type] = false;
      });
      
      // Luego activar solo los que están en las preguntas seleccionadas
      questions.forEach(q => {
        if (standardTypes.includes(q.type)) {
          questionsConfig[q.type] = true;
        }
      });
      
      // Crear objeto final para enviar
      const dataToSave = {
        ...formData,
        ...questionsConfig,
        researchId
      };
      
      // Mostrar modal de confirmación
      const confirmModalContainer = document.createElement('div');
      confirmModalContainer.innerHTML = `
        <div style="position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background: white; border-radius: 12px; max-width: 90%; width: 550px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 8px 30px rgba(0,0,0,0.12); overflow: hidden; animation: fadeIn 0.2s ease-out;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f1f1;">
              <h2 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">Confirmar configuración</h2>
              <button id="closeConfirmModal" style="background: none; border: none; cursor: pointer; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #6b7280; border-radius: 50%; transition: background-color 0.2s; font-size: 24px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div style="padding: 24px; overflow-y: auto; max-height: 60vh;">
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px;">¿Estás seguro de que deseas guardar la siguiente configuración de SmartVOC?</p>
              
              <div style="margin-bottom: 24px;">
                <h3 style="font-size: 18px; margin: 0 0 12px; color: #111827; font-weight: 600;">Configuración general</h3>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                  <div style="padding: 8px 0; color: #4b5563; display: flex; align-items: center;">
                    ${formData.randomize ? 
                      `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4d7c0f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 12l2 2 6-6"></path>
                      </svg>
                      <span>Aleatorización de preguntas habilitada</span>` 
                      : 
                      `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                      <span>Aleatorización de preguntas deshabilitada</span>`
                    }
                  </div>
                  <div style="padding: 8px 0; color: #4b5563; display: flex; align-items: center;">
                    ${formData.requireAnswers ? 
                      `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4d7c0f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 12l2 2 6-6"></path>
                      </svg>
                      <span>Respuestas obligatorias habilitadas</span>` 
                      : 
                      `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                      <span>Respuestas obligatorias deshabilitadas</span>`
                    }
                  </div>
                </div>
              </div>

              <div style="margin-bottom: 24px;">
                <h3 style="font-size: 18px; margin: 0 0 12px; color: #111827; font-weight: 600;">Preguntas</h3>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                  ${questions.length > 0 ?
                    `<div style="padding: 8px 0; color: #4b5563; display: flex; align-items: center;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4d7c0f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 12l2 2 6-6"></path>
                      </svg>
                      <span>${questions.length} preguntas configuradas</span>
                    </div>
                    <div style="margin-top: 8px;">
                      <ul style="margin: 0; padding-left: 28px; color: #6b7280;">
                        ${questions.map(q => `<li style="margin-bottom: 4px;">${q.type} - ${q.title || 'Sin título'}</li>`).join('')}
                      </ul>
                    </div>`
                    :
                    `<div style="padding: 8px 0; color: #b91c1c; display: flex; align-items: center;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                      <span>No hay preguntas configuradas</span>
                    </div>`
                  }
                </div>
              </div>
            </div>
            <div style="padding: 20px 24px; border-top: 1px solid #f1f1f1; display: flex; justify-content: flex-end; gap: 12px;">
              <button id="cancelConfirmation" style="background: #f9fafb; color: #4b5563; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 20px; font-weight: 500; cursor: pointer; font-size: 16px; transition: all 0.2s;">
                Cancelar
              </button>
              <button id="confirmSave" style="background: #4f46e5; color: white; border: none; border-radius: 8px; padding: 10px 20px; font-weight: 500; cursor: pointer; font-size: 16px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
                Confirmar y guardar
              </button>
            </div>
          </div>
        </div>
        <style>
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.98); }
            to { opacity: 1; transform: scale(1); }
          }
          #closeConfirmModal:hover {
            background-color: #f3f4f6;
          }
          #cancelConfirmation:hover {
            background-color: #f3f4f6;
            border-color: #d1d5db;
          }
          #confirmSave:hover {
            background-color: #4338ca;
            box-shadow: 0 4px 6px rgba(79, 70, 229, 0.25);
          }
        </style>
      `;
      
      document.body.appendChild(confirmModalContainer);
      
      // Configurar eventos
      document.getElementById('closeConfirmModal')?.addEventListener('click', () => {
        document.body.removeChild(confirmModalContainer);
      });
      
      document.getElementById('cancelConfirmation')?.addEventListener('click', () => {
        document.body.removeChild(confirmModalContainer);
      });
      
      document.getElementById('confirmSave')?.addEventListener('click', () => {
        document.body.removeChild(confirmModalContainer);
        setIsSaving(true);
        
        // Ejecutar la mutación
        mutate(dataToSave);
      });
      
      // También permitir cerrar haciendo clic fuera del modal
      confirmModalContainer.addEventListener('click', (e) => {
        if (e.target === confirmModalContainer.firstChild) {
          document.body.removeChild(confirmModalContainer);
        }
      });
    } catch (error) {
      console.error('[SmartVOCForm] Error al preparar guardado:', error);
      toast.error('Error al preparar la configuración para guardar');
      setIsSaving(false);
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
    
    // Preparar datos para la previsualización incluyendo configuración completa
    const dataToPreview = {
      ...formData,
      researchId,
      // Añadimos el array completo de preguntas activas
      questions: questions,
      // Convertimos randomize y requireAnswers a los nombres de propiedades que espera la API
      randomizeQuestions: formData.randomize,
      smartVocRequired: formData.requireAnswers,
      // Añadimos metadata con timestamp para tracking
      metadata: {
        updatedAt: new Date().toISOString()
      }
    };
    
    // Mostrar modal con JSON
    showJsonModal(dataToPreview, 'preview');
  };

  return {
    questions,
    formData,
    smartVocId,
    validationErrors,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    updateQuestion,
    addQuestion,
    removeQuestion,
    handleSettingChange,
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