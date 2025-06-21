import { useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/providers/AuthProvider';

import { SmartVOCFormData } from 'shared/interfaces/smart-voc.interface';

import { SmartVOCQuestion } from '../types';
import { useSmartVOCMutations } from './useSmartVOCMutations';
import { useSmartVOCState } from './useSmartVOCState';
import { useSmartVOCValidation } from './useSmartVOCValidation';

/**
 * Hook principal para gestionar la lógica del formulario SmartVOC
 * Responsabilidad: Orquestar la composición de los otros hooks
 */
export const useSmartVOCForm = (researchId: string) => {
  const { user, token, authLoading } = useAuth();
  const isAuthenticated = !!user && !!token;

  // Componer los hooks especializados
  const {
    formData,
    setFormData,
    smartVocId,
    setSmartVocId,
    validationErrors,
    setValidationErrors,
    updateQuestion,
    updateSettings,
    addQuestion,
    removeQuestion,
    resetToDefaultQuestions
  } = useSmartVOCState(researchId);

  const {
    smartVocData,
    isLoading,
    saveMutation,
    isSaving,
    deleteMutation,
    modalError,
    modalVisible,
    closeModal
  } = useSmartVOCMutations(researchId, smartVocId || undefined);

  const { validateForm, filterEditedQuestions } = useSmartVOCValidation();

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
      console.log('[SmartVOCForm] No se encontró configuración existente, manteniendo preguntas plantilla');
      // No hacer nada - mantener las preguntas plantilla para que el usuario pueda empezar a trabajar
    } else {
      console.log('[SmartVOCForm] smartVocData es null/undefined o en estado de carga, manteniendo estado actual');
    }
  }, [smartVocData, researchId, setFormData, setSmartVocId]);

  // Función para manejar el guardado
  const handleSave = useCallback(async () => {
    const editedQuestions = filterEditedQuestions(formData.questions);

    // Añadir una validación inicial: no enviar si no hay preguntas editadas
    if (editedQuestions.length === 0) {
      toast.error('No has configurado ninguna pregunta. Añade contenido a al menos una pregunta para poder guardar.');
      return;
    }

    // Ahora, validar solo las preguntas que se van a guardar
    const errors = validateForm(editedQuestions, formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const errorMessages = Object.values(errors).join('\n');
      toast.error(`Por favor, corrige los siguientes errores:\n\n${errorMessages}`, {
        duration: 5000 // Aumentar duración para que se pueda leer
      });
      return;
    }

    const cleanedData: SmartVOCFormData = {
      ...formData,
      questions: editedQuestions.map((q) => ({
        ...q,
        description: q.description || q.title,
        required: q.type !== 'VOC',
      })),
    };

    saveMutation.mutate(cleanedData);
  }, [formData, filterEditedQuestions, validateForm, setValidationErrors, saveMutation]);

  // Función para eliminar datos SmartVOC
  const handleDelete = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync();

      // Limpiar el estado local y restaurar preguntas por defecto
      setSmartVocId(null);
      resetToDefaultQuestions();
    } catch (error: unknown) {
      // El error ya se maneja en la mutación
      console.error('[SmartVOCForm] Error en handleDelete:', error);
    }
  }, [deleteMutation, setSmartVocId, resetToDefaultQuestions]);

  // Función para manejar la previsualización
  const handlePreview = useCallback(() => {
    toast('La funcionalidad de vista previa estará disponible próximamente.');
  }, []);

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
    handleDelete,
    validateForm: (questionsToValidate: SmartVOCQuestion[]) => validateForm(questionsToValidate, formData),
    closeModal,
    isExisting: !!smartVocId
  };
};
