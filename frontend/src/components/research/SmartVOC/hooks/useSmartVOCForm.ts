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
  const { mutate, isPending: isSaving } = useMutation({
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
      toast.success(SUCCESS_MESSAGES.SAVE_SUCCESS);
    },
    onError: (error: any) => {
      console.error('[SmartVOCForm] Error en mutación:', error);
      
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
    const errors: ValidationErrors = {};
    
    if (!researchId) {
      errors.researchId = ERROR_MESSAGES.VALIDATION_ERRORS.RESEARCH_ID_REQUIRED;
      console.log('[SmartVOCForm] Error de validación: ID de investigación requerido');
    }
    
    if (questions.length === 0) {
      errors.questions = ERROR_MESSAGES.VALIDATION_ERRORS.NO_QUESTIONS;
      console.log('[SmartVOCForm] Error de validación: No hay preguntas seleccionadas');
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
        
        // Asegurarnos de que el objeto tiene la estructura correcta
        console.log('[SmartVOCForm] Enviando datos al backend:', dataToSaveObj);
        
        // Si estamos usando la interfaz de la API que requiere questions, aseguramos que existe
        if (!dataToSaveObj.questions || !Array.isArray(dataToSaveObj.questions)) {
          console.error('[SmartVOCForm] Error: El objeto no tiene un array de preguntas válido');
          toast.error('Error en el formato de datos a enviar');
          return;
        }
        
        mutate(dataToSaveObj);
      } catch (error) {
        console.error('[SmartVOCForm] Error al procesar JSON:', error);
        toast.error('Error al procesar los datos del formulario');
      }
    } else if (pendingAction === 'preview') {
      // Mostrar mensaje de previsualización
      showModal({
        title: 'Información',
        message: SUCCESS_MESSAGES.PREVIEW_COMING_SOON,
        type: 'info'
      });
      
      toast.success(SUCCESS_MESSAGES.PREVIEW_COMING_SOON);
    }
  };

  // Guardar formulario (modificado para mostrar JSON primero)
  const handleSave = () => {
    if (!isAuthenticated) {
      showModal({
        title: 'Error de autenticación',
        message: 'No está autenticado. Por favor, inicie sesión para guardar la configuración.',
        type: 'error'
      });
      return;
    }
    
    if (validateForm()) {
      // Preparar datos para guardar
      // En lugar de solo indicadores booleanos, incluimos la configuración completa de las preguntas
      const dataToSave = {
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

  // Crear el elemento modal de JSON para mostrar el código
  useEffect(() => {
    // Solo crear el modal si se va a mostrar
    if (showJsonPreview && jsonToSend) {
      // Crear HTML para el modal
      const modalHtml = `
        <div id="jsonPreviewModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
          <div style="background: white; border-radius: 8px; max-width: 90%; width: 800px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.2); overflow: hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e5e7eb;">
              <h2 style="margin: 0; font-size: 18px; font-weight: 600;">JSON a enviar</h2>
              <button id="closeJsonModal" style="background: none; border: none; cursor: pointer; font-size: 20px; color: #6b7280;">&times;</button>
            </div>
            <div style="padding: 24px; overflow-y: auto; flex-grow: 1;">
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">
                Este es el JSON que se enviará al servidor. Revise los datos antes de continuar.
              </p>
              <pre style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; overflow: auto; max-height: 400px; font-family: monospace; font-size: 14px; white-space: pre-wrap; word-break: break-word;">${jsonToSend.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </div>
            <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px;">
              <button id="cancelJsonAction" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 16px; font-weight: 500; cursor: pointer;">Cancelar</button>
              <button id="continueJsonAction" style="background: #3f51b5; color: white; border: none; border-radius: 6px; padding: 8px 16px; font-weight: 500; cursor: pointer;">
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
      
      // Configurar eventos
      document.getElementById('closeJsonModal')?.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
        closeJsonModal();
      });
      
      document.getElementById('cancelJsonAction')?.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
        closeJsonModal();
      });
      
      document.getElementById('continueJsonAction')?.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
        continueWithAction();
      });
      
      // También permitir cerrar haciendo clic fuera del modal
      modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer.firstChild) {
          document.body.removeChild(modalContainer);
          closeJsonModal();
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
    closeJsonModal
  };
}; 