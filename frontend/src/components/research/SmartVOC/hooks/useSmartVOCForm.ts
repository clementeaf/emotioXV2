import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SmartVOCFormData } from 'shared/interfaces/smart-voc.interface';

import { useAuth } from '@/providers/AuthProvider';


import { QuestionType } from 'shared/interfaces/question-types.enum';
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

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  // Logging solo en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      //   isAuthenticated,
      //   hasToken: !!token,
      //   researchId,
      //   authLoading
      // });
    }
  }, [isAuthenticated, token, researchId, authLoading]);

  // Efecto para actualizar formData cuando lleguen datos de la API
  useEffect(() => {
    //   hasData: !!smartVocData,
    //   isNotFound: smartVocData && 'notFound' in smartVocData ? smartVocData.notFound : false,
    //   dataType: typeof smartVocData,
    //   questionCount: smartVocData && 'questions' in smartVocData && Array.isArray(smartVocData.questions) ? smartVocData.questions.length : 'No es array'
    // });

    if (smartVocData && !('notFound' in smartVocData) && smartVocData.questions && smartVocData.questions.length > 0) {
      // Solo actualizar si hay preguntas reales de la API (configuración existente)

      // Actualizar formData con los datos cargados, preservando configuraciones por defecto
      setFormData({
        researchId: smartVocData.researchId || researchId,
        questions: smartVocData.questions.map(q => {
          // Preservar configuración por defecto para CSAT si no está definida
          if (q.type === QuestionType.SMARTVOC_CSAT && (!q.config || !q.config.type)) {
            return {
              ...q,
              config: {
                ...q.config,
                type: 'stars',
                companyName: q.config?.companyName || ''
              }
            };
          }
          // Preservar configuración por defecto para NEV si no está definida
          if (q.type === QuestionType.SMARTVOC_NEV && (!q.config || !q.config.type)) {
            return {
              ...q,
              config: {
                ...q.config,
                type: 'emojis',
                companyName: q.config?.companyName || ''
              }
            };
          }
          // Preservar configuración por defecto para CES si no está definida
          if (q.type === QuestionType.SMARTVOC_CES && (!q.config || !q.config.scaleRange)) {
            return {
              ...q,
              config: {
                ...q.config,
                type: 'scale',
                scaleRange: { start: 1, end: 5 },
                startLabel: q.config?.startLabel || '',
                endLabel: q.config?.endLabel || ''
              }
            };
          }
          // Preservar configuración por defecto para NPS si no está definida
          if (q.type === QuestionType.SMARTVOC_NPS && (!q.config || !q.config.companyName)) {
            return {
              ...q,
              config: {
                ...q.config,
                type: 'scale',
                scaleRange: q.config?.scaleRange || { start: 0, end: 10 },
                startLabel: q.config?.startLabel || '',
                endLabel: q.config?.endLabel || '',
                companyName: q.config?.companyName || ''
              }
            };
          }
          return q;
        }) || [],
        randomizeQuestions: smartVocData.randomizeQuestions || false,
        smartVocRequired: smartVocData.smartVocRequired !== undefined ? smartVocData.smartVocRequired : true,
        metadata: smartVocData.metadata || {
          createdAt: new Date().toISOString(),
          estimatedCompletionTime: '5-10'
        }
      });


      // Extraer y configurar el ID si existe
      const responseWithId = smartVocData as SmartVOCFormData & { id?: string };


      if (responseWithId?.id) {
        setSmartVocId(responseWithId.id);
      } else {
      }
    } else if (smartVocData && 'notFound' in smartVocData && smartVocData.notFound) {
      // No hacer nada - mantener las preguntas plantilla para que el usuario pueda empezar a trabajar
      setIsEmpty(true);
    } else {
    }
  }, [smartVocData, researchId, setFormData, setSmartVocId]);

  // Función para manejar el guardado
  const handleSave = useCallback(async () => {
    const editedQuestions = filterEditedQuestions(formData.questions);

    // Fix: Copiar type desde config si falta
    const fixedQuestions = editedQuestions.map(q => ({
      ...q,
      type: q.type || (q.config && q.config.type) || '',
    }));

    // Añadir una validación inicial: no enviar si no hay preguntas editadas
    if (fixedQuestions.length === 0) {
      toast.error('No has configurado ninguna pregunta. Añade contenido a al menos una pregunta para poder guardar.');
      return;
    }

    // Validación dura: abortar si alguna pregunta no tiene type
    const missingType = fixedQuestions.find((q, idx) => !q.type);
    if (missingType) {
      toast.error('Hay preguntas sin tipo definido. Corrige antes de guardar.');
      return;
    }

    // Ahora, validar solo las preguntas que se van a guardar
    const errors = validateForm(fixedQuestions, formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const errorMessages = Object.values(errors).join('\n');
      toast.error(`Por favor, corrige los siguientes errores:\n\n${errorMessages}`, {
        duration: 5000 // Aumentar duración para que se pueda leer
      });
      return;
    }

    // Función helper para mapear tipos SmartVOC al ENUM
    const getSmartVOCQuestionType = (type: string): string => {
      if (!type || typeof type !== 'string') {
        return 'smartvoc_unknown';
      }
      // Si el tipo ya es un valor del enum, lo devolvemos tal cual
      if (Object.values(QuestionType).includes(type as QuestionType)) {
        return type;
      }
      switch (type.toUpperCase()) {
        case 'CSAT': return QuestionType.SMARTVOC_CSAT;
        case 'CES': return QuestionType.SMARTVOC_CES;
        case 'CV': return QuestionType.SMARTVOC_CV;
        case 'NEV': return QuestionType.SMARTVOC_NEV;
        case 'NPS': return QuestionType.SMARTVOC_NPS;
        case 'VOC': return QuestionType.SMARTVOC_VOC;
        default: return `smartvoc_${type}`;
      }
    };

    // ENRIQUECER TODAS LAS PREGUNTAS ANTES DE ENVIAR
    const cleanedData: SmartVOCFormData = {
      ...formData,
      questions: fixedQuestions.map((q, idx) => {
        if (!q.type) {
        }
        return {
          ...q,
          questionKey: getSmartVOCQuestionType(q.type),
          type: q.type as any, // Cast para evitar conflictos de tipos
          description: q.description || q.title,
          required: q.type !== QuestionType.SMARTVOC_VOC,
        };
      }),
    };

      cleanedData,
      smartVocId,
      questions: cleanedData.questions.map(q => ({
        id: q.id,
        type: q.type,
        config: q.config
      }))
    });

    saveMutation.mutate({ ...cleanedData, smartVocId });
  }, [formData, filterEditedQuestions, validateForm, setValidationErrors, saveMutation, smartVocId]);

  // Abre el modal de confirmación
  const handleDelete = useCallback(() => {
    setDeleteModalOpen(true);
  }, []);

  // Ejecuta la eliminación
  const confirmDelete = useCallback(async () => {
    setDeleteModalOpen(false); // Cierra el modal primero
    try {
      // La mutación se encarga de invalidar la query y el useEffect actualizará el estado
      await deleteMutation.mutateAsync();
      resetToDefaultQuestions();

      // 🔧 AGREGADO: Resetear smartVocId para que el componente vuelva al estado "nuevo"
      setSmartVocId(null);

    } catch (error: unknown) {
      // El hook de mutación ya muestra un toast/modal en caso de error
    }
  }, [deleteMutation, resetToDefaultQuestions, setSmartVocId]);

  // Función para manejar la previsualización
  const handlePreview = useCallback(() => {
    toast('La funcionalidad de vista previa estará disponible próximamente.');
  }, []);

  return {
    formData,
    questions: formData.questions,
    smartVocId,
    validationErrors,
    isLoading: isLoading || authLoading,
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
    isExisting: !!smartVocId,
    isDeleteModalOpen,
    confirmDelete,
    closeDeleteModal: () => setDeleteModalOpen(false),
    isEmpty
  };
};
