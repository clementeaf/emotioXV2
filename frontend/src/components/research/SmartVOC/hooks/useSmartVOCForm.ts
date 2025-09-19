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
    isDeleting,
    modalError,
    modalVisible,
    closeModal,
    showModal,
    refetch
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

  // Efecto para cargar datos existentes siguiendo patrón ThankYouScreen/WelcomeScreen
  useEffect(() => {
    const actualResearchId = researchId === 'current' ? '' : researchId;

    if (!actualResearchId) {
      setIsEmpty(true);
      return;
    }

    if (smartVocData) {
      // Actualizar formData con datos existentes
      setFormData({
        researchId: actualResearchId,
        questions: smartVocData.questions || [],
        randomizeQuestions: smartVocData.randomizeQuestions ?? false,
        smartVocRequired: smartVocData.smartVocRequired ?? true,
        metadata: smartVocData.metadata || {
          createdAt: new Date().toISOString(),
          estimatedCompletionTime: '5-10'
        }
      });

      setIsEmpty(false);

      // Configurar ID si existe
      const responseWithId = smartVocData as SmartVOCFormData & { id?: string };
      if (responseWithId?.id) {
        setSmartVocId(responseWithId.id);
      }
    } else if (!isLoading) {
      // No hay datos y no está cargando - mantener estado actual (no interferir con delete manual)
      setIsEmpty(true);
    }
  }, [smartVocData, researchId, isLoading, setFormData, setSmartVocId]);

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
    const missingType = fixedQuestions.find(q => !q.type);
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
      questions: fixedQuestions.map(q => {
        return {
          ...q,
          questionKey: getSmartVOCQuestionType(q.type),
          type: q.type, // Type is already QuestionType
          description: q.description || q.title,
          required: q.type !== QuestionType.SMARTVOC_VOC,
        };
      }),
    };

    try {
      await saveMutation.mutateAsync(cleanedData);
    } catch (error) {
      // Error already handled by mutation hook
    }
  }, [formData, filterEditedQuestions, validateForm, setValidationErrors, saveMutation, smartVocId]);

  // Abre el modal de confirmación
  const handleDelete = useCallback(() => {
    setDeleteModalOpen(true);
  }, []);

  // Ejecuta la eliminación
  const confirmDelete = useCallback(async () => {
    setDeleteModalOpen(false); // Cierra el modal primero
    try {
      // Reset COMPLETO del formData al estado inicial PRIMERO
      setSmartVocId(null);
      setIsEmpty(true);
      const actualResearchId = researchId === 'current' ? '' : researchId;
      setFormData({
        researchId: actualResearchId,
        questions: [
          {
            id: QuestionType.SMARTVOC_CSAT,
            type: QuestionType.SMARTVOC_CSAT,
            title: '',
            description: '',
            instructions: '',
            showConditionally: false,
            config: {
              type: 'stars',
              companyName: ''
            }
          },
          {
            id: QuestionType.SMARTVOC_CES,
            type: QuestionType.SMARTVOC_CES,
            title: '',
            description: '',
            instructions: '',
            showConditionally: false,
            config: {
              type: 'scale',
              scaleRange: { start: 1, end: 5 },
              startLabel: '',
              endLabel: ''
            }
          },
          {
            id: QuestionType.SMARTVOC_CV,
            type: QuestionType.SMARTVOC_CV,
            title: '',
            description: '',
            instructions: '',
            showConditionally: false,
            config: {
              type: 'scale',
              scaleRange: { start: 1, end: 5 },
              startLabel: '',
              endLabel: ''
            }
          },
          {
            id: QuestionType.SMARTVOC_NEV,
            type: QuestionType.SMARTVOC_NEV,
            title: '',
            description: '',
            instructions: '',
            showConditionally: false,
            config: {
              type: 'emojis',
              companyName: ''
            }
          },
          {
            id: QuestionType.SMARTVOC_NPS,
            type: QuestionType.SMARTVOC_NPS,
            title: '',
            description: '',
            instructions: '',
            showConditionally: false,
            config: {
              type: 'scale',
              scaleRange: { start: 0, end: 10 },
              startLabel: '',
              endLabel: '',
              companyName: ''
            }
          },
          {
            id: QuestionType.SMARTVOC_VOC,
            type: QuestionType.SMARTVOC_VOC,
            title: '',
            description: '',
            instructions: '',
            showConditionally: false,
            config: {
              type: 'text'
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

      // DESPUÉS eliminar del servidor
      await deleteMutation.mutateAsync();

    } catch (error: unknown) {
      // El hook de mutación ya muestra un toast/modal en caso de error
    }
  }, [deleteMutation, setFormData, setSmartVocId, researchId]);

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
