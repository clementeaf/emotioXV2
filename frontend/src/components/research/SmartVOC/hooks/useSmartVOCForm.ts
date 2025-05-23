import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { SmartVOCFormData } from 'shared/interfaces/smart-voc.interface';
import { 
  ErrorModalData, 
  ValidationErrors, 
  DEFAULT_QUESTIONS, 
  SmartVOCQuestion
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
export const useSmartVOCForm = (researchId: string) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SmartVOCFormData>({ 
    researchId,
    questions: [...DEFAULT_QUESTIONS],
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

  // Añadimos logs de depuración para la autenticación
  useEffect(() => {
    console.log('[SmartVOCForm] Estado de autenticación:', { 
      isAuthenticated, 
      tokenExists: !!token,
      userExists: !!user,
      tokenLength: token ? token.length : 0,
      researchId,
      authLoading
    });

    // Verificamos el token en localStorage
    if (typeof window !== 'undefined') {
      const localToken = localStorage.getItem('token');
      const sessionToken = sessionStorage.getItem('token');
      
      console.log('[SmartVOCForm] Tokens almacenados:', {
        localStorageToken: localToken ? `${localToken.substring(0, 15)}...` : null,
        sessionStorageToken: sessionToken ? `${sessionToken.substring(0, 15)}...` : null,
        contextToken: token ? `${token.substring(0, 15)}...` : null
      });
    }
  }, [isAuthenticated, token, user, researchId, authLoading]);

  // Consulta para obtener datos existentes
  const { data: smartVocData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.SMART_VOC, researchId],
    queryFn: async () => {
      try {
        if (!isAuthenticated || !token) {
          console.error('[SmartVOCForm] No hay autenticación para realizar la consulta', {
            isAuthenticated,
            hasToken: !!token,
            tokenFirstChars: token ? token.substring(0, 10) : 'no-token'
          });
          throw new Error('No autenticado');
        }

        // Intenta recuperar el token de localStorage como último recurso
        let currentToken = token;
        if (!currentToken && typeof window !== 'undefined') {
          const localStorageToken = localStorage.getItem('token');
          if (localStorageToken) {
            currentToken = localStorageToken;
            console.log('[SmartVOCForm] Recuperado token de localStorage como último recurso');
          }
        }

        if (!currentToken) {
          console.error('[SmartVOCForm] No se pudo recuperar un token válido');
          throw new Error('No se pudo recuperar un token válido');
        }

        console.log(`[SmartVOCForm] Buscando configuración existente para investigación: ${researchId}`);
        const response = await smartVocFixedAPI.getByResearchId(researchId);
        console.log('[SmartVOCForm] Respuesta de API:', response);
        return response;
      } catch (error: any) {
        console.error('[SmartVOCForm] Error al obtener datos:', error);
        
        if (error?.statusCode === 404) {
          console.log('[SmartVOCForm] No se encontró configuración existente - esto es normal para una nueva investigación');
          return { notFound: true };
        }
        
        throw error;
      }
    },
    enabled: !!researchId && isAuthenticated && !authLoading,
    refetchOnWindowFocus: false
  });

  // Mutación para guardar datos
  const { mutate } = useMutation({
    mutationFn: async (data: SmartVOCFormData): Promise<SmartVOCFormData> => {
      if (!isAuthenticated || !token) {
        throw new Error('No autenticado');
      }
      
      // Crear una copia limpia de los datos, seleccionando solo los campos de la interfaz
      const cleanedData: SmartVOCFormData = {
        researchId: data.researchId,
        randomizeQuestions: data.randomizeQuestions,
        smartVocRequired: data.smartVocRequired,
        metadata: data.metadata, // Incluir metadata si existe
        questions: data.questions.map((q: SmartVOCQuestion) => {
          const { instructions, config, ...restOfQuestion } = q; 
          const cleanedConfig = { ...config }; 
          
          if (cleanedConfig.companyName === '') {
            delete cleanedConfig.companyName;
          }
          
          // Mantener instructions
          return { ...restOfQuestion, instructions, config: cleanedConfig }; 
        })
      };

      console.log('[SmartVOCForm] Datos limpios a guardar:', JSON.stringify(cleanedData, null, 2));
      
      if (smartVocId) {
        console.log(`[SmartVOCForm] Actualizando Smart VOC con ID: ${smartVocId}`);
        return await smartVocFixedAPI.update(smartVocId, cleanedData);
      } else {
        console.log('[SmartVOCForm] Creando nuevo Smart VOC');
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

  // Efecto para cargar datos existentes
  useEffect(() => {
    const dataFromQuery = smartVocData;
            
    // Asegurarse que dataFromQuery no es null/undefined y no es el objeto {notFound: true}
    if (dataFromQuery && typeof dataFromQuery === 'object' && !('notFound' in dataFromQuery)) { 
      // Ahora TypeScript sabe que dataFromQuery es SmartVOCFormData
      const existingData = dataFromQuery as SmartVOCFormData;
      console.log("[SmartVOCForm] Cargando datos existentes:", existingData);

      // Intentamos setear el smartVocId si existe en los datos cargados (como propiedad 'id')
      const dataWithId = existingData as SmartVOCFormData & { id?: string };
      if (dataWithId.id) {
        setSmartVocId(dataWithId.id);
      }

      // Actualizar formData con los datos existentes
      setFormData(prev => ({
        ...prev,
        ...existingData,
        researchId, // Asegurar que researchId se mantenga
        questions: existingData.questions?.length > 0 ? existingData.questions : [...DEFAULT_QUESTIONS],
        metadata: {
          ...(prev.metadata || {}),
          ...(existingData.metadata || {}),
          updatedAt: new Date().toISOString()
        }
      }));
    } else if (!isLoading) { 
        // Caso notFound, null, undefined o error durante la carga inicial
        console.log("[SmartVOCForm] No se encontraron datos existentes o hubo un error, usando defaults.");
        // Resetear a los valores por defecto manteniendo researchId
        setFormData({
          researchId,
          questions: [...DEFAULT_QUESTIONS],
          randomizeQuestions: false,
          smartVocRequired: true,
          metadata: {
            createdAt: new Date().toISOString(),
            estimatedCompletionTime: '5-10'
          }
        });
        setSmartVocId(null);
    }
  }, [smartVocData, researchId, isLoading]);

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
            <h4>${index + 1}. ${q.title} ${q.required ? '<span style="color: red;">*</span>' : ''}</h4>
            ${q.description ? `<p style="font-size: 0.9em; color: #555;">${q.description}</p>` : ''}
            <p><strong>Tipo:</strong> ${q.type}</p>
            ${q.instructions ? `<p style="font-style: italic; color: #777;">Instrucciones: ${q.instructions}</p>` : ''}
            <p><strong>Config:</strong> <pre style="font-size: 0.8em; background: #f8f8f8; padding: 5px;">${JSON.stringify(q.config, null, 2)}</pre></p>
            {/* Aquí podrías renderizar un input/control básico según q.type */}
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