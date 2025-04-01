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
  const addQuestion = () => {
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

  // Guardar formulario
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
      const dataToSave: SmartVOCFormData = {
        ...formData,
        researchId,
        // Convertir las preguntas a formato de API
        CSAT: questions.some(q => q.type === 'CSAT'),
        CES: questions.some(q => q.type === 'CES'),
        CV: questions.some(q => q.type === 'CV'),
        NEV: questions.some(q => q.type === 'NEV'),
        NPS: questions.some(q => q.type === 'NPS'),
        VOC: questions.some(q => q.type === 'VOC')
      };
      
      mutate(dataToSave);
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

  // Previsualizar formulario
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
    
    // Aquí se implementaría la lógica de previsualización
    showModal({
      title: 'Información',
      message: SUCCESS_MESSAGES.PREVIEW_COMING_SOON,
      type: 'info'
    });
    
    toast.success(SUCCESS_MESSAGES.PREVIEW_COMING_SOON);
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
    closeModal
  };
}; 