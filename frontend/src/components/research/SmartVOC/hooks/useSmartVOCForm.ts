import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { SmartVOCFormData } from 'shared/interfaces/smart-voc.interface';
import { 
  ErrorModalData, 
  ValidationErrors, 
  SmartVOCQuestion
} from '../types';
import { smartVocFixedAPI } from '@/lib/smart-voc-api';
import { 
  QUERY_KEYS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES
} from '../constants';
import { useAuth } from '@/providers/AuthProvider';
import { filterValidQuestions, debugQuestionsToSend } from '../utils/validateRequiredField';

/**
 * Hook personalizado para gestionar la lógica del formulario SmartVOC
 */
export const useSmartVOCForm = (researchId: string) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SmartVOCFormData>({ 
    researchId,
    questions: [
      {
        id: 'csat-default',
        type: 'CSAT',
        title: 'Satisfacción del Cliente (CSAT)',
        description: '¿Qué tan satisfecho estás con nuestro servicio?',
        instructions: 'Selecciona una puntuación del 1 al 5',
        showConditionally: false,
        config: {
          type: 'stars',
          companyName: ''
        }
      },
      {
        id: 'ces-default',
        type: 'CES',
        title: 'Esfuerzo del Cliente (CES)',
        description: '¿Qué tan fácil fue resolver tu consulta?',
        instructions: 'Evalúa el nivel de esfuerzo requerido',
        showConditionally: false,
        config: {
          type: 'scale',
          scaleRange: {
            start: 1,
            end: 7
          },
          startLabel: 'Muy difícil',
          endLabel: 'Muy fácil'
        }
      },
      {
        id: 'cv-default',
        type: 'CV',
        title: 'Valor Cognitivo (CV)',
        description: '¿Qué tan valiosa fue la información proporcionada?',
        instructions: 'Evalúa el valor de la información recibida',
        showConditionally: false,
        config: {
          type: 'scale',
          scaleRange: {
            start: 1,
            end: 5
          },
          startLabel: 'Sin valor',
          endLabel: 'Muy valioso'
        }
      },
      {
        id: 'nev-default',
        type: 'NEV',
        title: 'Valor Emocional Neto (NEV)',
        description: '¿Cómo te sentiste durante la experiencia?',
        instructions: 'Describe tu estado emocional',
        showConditionally: false,
        config: {
          type: 'emojis',
          companyName: ''
        }
      },
      {
        id: 'nps-default',
        type: 'NPS',
        title: 'Net Promoter Score (NPS)',
        description: '¿Qué tan probable es que recomiendes nuestro servicio?',
        instructions: 'Puntuación del 0 al 10',
        showConditionally: false,
        config: {
          type: 'scale',
          scaleRange: {
            start: 0,
            end: 10
          },
          companyName: '',
          startLabel: 'Nada probable',
          endLabel: 'Muy probable'
        }
      },
      {
        id: 'voc-default',
        type: 'VOC',
        title: 'Voz del Cliente (VOC)',
        description: '¿Tienes algún comentario adicional o sugerencia?',
        instructions: 'Comparte tus comentarios (opcional)',
        showConditionally: false,
        config: {
          type: 'text'
        }
      },
      {
        id: 'trust-default',
        type: 'CSAT',
        title: 'Nivel de Confianza',
        description: '¿Qué tan confiable consideras nuestro servicio?',
        instructions: 'Evalúa tu nivel de confianza',
        showConditionally: false,
        config: {
          type: 'scale',
          scaleRange: {
            start: 1,
            end: 5
          },
          startLabel: 'Nada confiable',
          endLabel: 'Muy confiable'
        }
      }
    ],
    randomizeQuestions: false,
    smartVocRequired: true,
    metadata: {
      createdAt: new Date().toISOString(),
      estimatedCompletionTime: '5-10'
    }
  });
  const [smartVocId, setSmartVocId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const { user, token, authLoading } = useAuth();
  const isAuthenticated = !!user && !!token;
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Restaurar Handlers para el modal de error
  const closeModal = useCallback(() => setModalVisible(false), []); 
  const showModal = useCallback((errorData: ErrorModalData) => {
    setModalError(errorData);
    setModalVisible(true);
  }, []); // Dependencias implícitas: setModalError, setModalVisible

  // Logging solo en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SmartVOCForm] Auth state:', { 
        isAuthenticated, 
        hasToken: !!token,
        researchId,
        authLoading
      });
    }
  }, [isAuthenticated, token, researchId, authLoading]);

  // Consulta para obtener datos existentes
  const { data: smartVocData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.SMART_VOC, researchId],
    queryFn: async () => {
      try {
        if (!isAuthenticated || !token) {
          throw new Error('No autenticado');
        }

        // Intenta recuperar el token de localStorage como último recurso
        let currentToken = token;
        if (!currentToken && typeof window !== 'undefined') {
          const localStorageToken = localStorage.getItem('token');
          if (localStorageToken) {
            currentToken = localStorageToken;
          }
        }

        if (!currentToken) {
          throw new Error('No se pudo recuperar un token válido');
        }

        const response = await smartVocFixedAPI.getByResearchId(researchId);
        return response;
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[SmartVOCForm] Error al obtener datos:', error);
        }
        
        if (error?.statusCode === 404) {
          return { notFound: true };
        }
        
        throw error;
      }
    },
    enabled: !!researchId && isAuthenticated && !authLoading,
    refetchOnWindowFocus: false
  });

  // Efecto para actualizar formData cuando lleguen datos de la API
  useEffect(() => {
    console.log('[SmartVOCForm] useEffect ejecutado:', { 
      hasData: !!smartVocData, 
      isNotFound: smartVocData && 'notFound' in smartVocData ? smartVocData.notFound : false,
      dataType: typeof smartVocData,
      questionCount: smartVocData && 'questions' in smartVocData && Array.isArray(smartVocData.questions) ? smartVocData.questions.length : 'No es array'
    });
    
    if (smartVocData && !('notFound' in smartVocData) && smartVocData.questions && smartVocData.questions.length > 0) {
      // Solo actualizar si hay preguntas reales de la API (configuración existente)
      console.log('[SmartVOCForm] Datos cargados desde API:', smartVocData);
      console.log('[SmartVOCForm] Preguntas encontradas:', smartVocData.questions?.length || 0);
      
      // Actualizar formData con los datos cargados
      setFormData({
        researchId: smartVocData.researchId || researchId,
        questions: smartVocData.questions || [],
        randomizeQuestions: smartVocData.randomizeQuestions || false,
        smartVocRequired: smartVocData.smartVocRequired !== undefined ? smartVocData.smartVocRequired : true,
        metadata: smartVocData.metadata || {
          createdAt: new Date().toISOString(),
          estimatedCompletionTime: '5-10'
        }
      });

      console.log('[SmartVOCForm] ✅ formData actualizado con', smartVocData.questions?.length || 0, 'preguntas desde API');

      // Extraer y configurar el ID si existe
      const responseWithId = smartVocData as SmartVOCFormData & { id?: string };
      if (responseWithId?.id) {
        setSmartVocId(responseWithId.id);
        console.log('[SmartVOCForm] SmartVOC ID configurado:', responseWithId.id);
      }
    } else if (smartVocData && 'notFound' in smartVocData && smartVocData.notFound) {
      console.log('[SmartVOCForm] No se encontró configuración existente, manteniendo preguntas por defecto');
      // No hacer nada - mantener las preguntas por defecto que se inicializaron en useState
    } else {
      console.log('[SmartVOCForm] smartVocData es null/undefined o en estado de carga, manteniendo estado actual');
    }
  }, [smartVocData, researchId]);

  // Mutación para guardar datos
  const { mutate } = useMutation({
    mutationFn: async (data: SmartVOCFormData): Promise<SmartVOCFormData> => {
      if (!isAuthenticated || !token) {
        throw new Error('No autenticado');
      }
      
      // Filtrar solo las preguntas que tienen todos los campos requeridos
      const filteredData = filterValidQuestions(data);
      
      // Crear una copia limpia de los datos, seleccionando solo los campos de la interfaz
      const cleanedData: SmartVOCFormData = {
        researchId: filteredData.researchId,
        randomizeQuestions: filteredData.randomizeQuestions,
        smartVocRequired: filteredData.smartVocRequired,
        metadata: filteredData.metadata, // Incluir metadata si existe
        questions: filteredData.questions.map((q: SmartVOCQuestion) => {
          const cleanedConfig = { ...q.config }; 
          
          if (cleanedConfig.companyName === '') {
            delete cleanedConfig.companyName;
          }
          
          // Asegurar que todos los campos necesarios se incluyan explícitamente
          return {
            id: q.id,
            type: q.type,
            title: q.title,
            description: q.description,
            instructions: q.instructions,
            showConditionally: q.showConditionally,
            config: cleanedConfig,
            ...(q.moduleResponseId && { moduleResponseId: q.moduleResponseId }) // Solo incluir si existe
          }; 
        })
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('[SmartVOCForm] Datos originales:', data);
        console.log('[SmartVOCForm] Datos filtrados a guardar:', cleanedData);
        debugQuestionsToSend(data);
      }
      
      if (smartVocId) {
        return await smartVocFixedAPI.update(smartVocId, cleanedData);
      } else {
        return await smartVocFixedAPI.create(cleanedData);
      }
    },
    onSuccess: (response: SmartVOCFormData) => {
      const responseWithId = response as SmartVOCFormData & { id?: string }; 
      if (responseWithId?.id) {
        setSmartVocId(responseWithId.id);
      } else {
        console.warn('[SmartVOCForm] No se encontró ID en la respuesta onSuccess directa. Invalidando query.');
      }
      
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SMART_VOC, researchId] });
      
      showModal({ 
        title: 'Éxito',
        message: smartVocId ? SUCCESS_MESSAGES.UPDATE_SUCCESS : SUCCESS_MESSAGES.CREATE_SUCCESS,
        type: 'info'
      });
      
      setIsSaving(false);
    },
    onError: (error: any, variables: SmartVOCFormData, context: any) => {
      // Log detallado del formData que causó el error
      console.error('[SmartVOCForm] Error al guardar. Datos enviados:', JSON.stringify(variables, null, 2));
      
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
      
      setIsSaving(false);
    }
  });

  // Función para actualizar una pregunta específica
  const updateQuestion = useCallback((id: string, updates: Partial<SmartVOCQuestion>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    }));
  }, []);

  // Función para actualizar configuraciones generales
  const updateSettings = useCallback((updates: Partial<Pick<SmartVOCFormData, 'randomizeQuestions' | 'smartVocRequired'>>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Función para añadir una nueva pregunta
  const addQuestion = useCallback((newQuestion: SmartVOCQuestion) => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  }, []);

  // Función para eliminar una pregunta
  const removeQuestion = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  }, []);

  // Función para validar el formulario
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};
    
    if (!formData.questions || formData.questions.length === 0) {
      errors.questions = 'Debe incluir al menos una pregunta';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.questions]);

  // Función para manejar el guardado (vuelve a guardar directamente)
  const handleSave = useCallback(async () => {
    console.log("[SmartVOCForm] handleSave iniciado (directo).");
    if (!validateForm()) {
      console.log("[SmartVOCForm] Validación fallida. Mostrando modal de error.");
      showModal({
        title: 'Error de Validación',
        message: 'Por favor, corrija los errores antes de guardar',
        type: 'error'
      });
      return;
    }

    console.log("[SmartVOCForm] Validación exitosa. Mutando...");
    setIsSaving(true);
    mutate(formData);
  }, [formData, mutate, validateForm, showModal]);

  // Función para manejar la previsualización
  const handlePreview = useCallback(() => {
    if (!validateForm()) {
      showModal({
        title: 'Error de Validación',
        message: 'Por favor, corrija los errores antes de previsualizar',
        type: 'error'
      });
      return;
    }

    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      const { questions, randomizeQuestions } = formData;
      // Generar HTML básico para la vista previa
      let questionsHtml = '';
      questions.forEach((q, index) => {
        questionsHtml += `
          <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 4px;">
            <h4>${index + 1}. ${q.title}</h4>
            ${q.description ? `<p style="font-size: 0.9em; color: #555;">${q.description}</p>` : ''}
            <div style="margin: 8px 0;">
              <span style="font-weight: bold;">Tipo:</span> ${q.type}
            </div>
            ${q.instructions ? `<p style="font-style: italic; color: #777;">Instrucciones: ${q.instructions}</p>` : ''}
            <details style="margin-top: 10px;">
              <summary style="cursor: pointer;">Ver configuración técnica</summary>
              <pre style="font-size: 0.8em; background: #f8f8f8; padding: 5px; margin-top: 5px;">${JSON.stringify(q.config, null, 2)}</pre>
            </details>
          </div>
        `;
      });

      const previewHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Vista Previa - SmartVOC</title>
          <style>
            body { font-family: sans-serif; margin: 20px; line-height: 1.6; }
            .container { max-width: 800px; margin: auto; background: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            h2, h4 { margin-top: 0; }
            pre { white-space: pre-wrap; word-wrap: break-word; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Vista Previa del Formulario SmartVOC</h2>
            <p><strong>Orden Aleatorio:</strong> ${randomizeQuestions ? 'Sí' : 'No'}</p>
            <hr style="margin: 20px 0;"/>
            ${questionsHtml}
          </div>
        </body>
        </html>
      `;
      previewWindow.document.write(previewHtml);
      previewWindow.document.close();
    } else {
      showModal({
        title: 'Error al Previsualizar',
        message: 'No se pudo abrir la ventana de vista previa. Asegúrese de que su navegador no bloquee las ventanas emergentes.',
        type: 'error'
      });
    }
  }, [formData, validateForm, showModal]);

  return {
    formData,
    questions: formData.questions,
    smartVocId,
    validationErrors,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    updateQuestion,
    updateSettings,
    addQuestion,
    removeQuestion,
    handleSave,
    handlePreview,
    validateForm,
    closeModal,
    isExisting: !!smartVocId
  };
}; 