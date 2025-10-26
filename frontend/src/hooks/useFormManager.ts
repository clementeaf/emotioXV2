/**
 * Hook Universal para Gestión de Formularios
 * Maneja de forma agnóstica todos los formularios del sistema
 */

import { useState, useCallback, useEffect } from 'react';
import { toastHelpers } from '@/utils/toast';
import { getInitialDataByQuestionKey } from '@/utils/initial-form-data';
import type { ErrorModalData, UseFormManagerResult } from './useFormManager.types';
import { getApiHookByQuestionKey } from '@/utils/form-manager-mapping';
import { validateFormWithConfig } from '@/utils/validation-config';
import { getFormNameByQuestionKey } from '@/utils/form-names';
import { buildErrorMessage } from '@/utils/error-helpers';

/**
 * Hook universal para gestión de formularios
 * @param questionKey - Identificador único del tipo de formulario
 * @param researchId - ID de la investigación
 * @returns Objeto con funciones y estados agnósticos
 */
export const useFormManager = (questionKey: string, researchId: string): UseFormManagerResult => {
  const actualResearchId = researchId === 'current' ? '' : researchId;

  // Obtener el hook de API apropiado basado en questionKey
  const apiHook = getApiHookByQuestionKey(questionKey);
  
  // Usar el hook de API dinámicamente
  const apiResult = apiHook(actualResearchId);
  
  // Extraer propiedades con valores por defecto para compatibilidad
  const {
    data: existingData,
    isLoading,
    // Mapear diferentes nombres de funciones a nombres estándar
    updateData = apiResult?.updateScreenForm || apiResult?.updateSmartVOC || apiResult?.updateCognitiveTask || null,
    createData = apiResult?.createScreenForm || apiResult?.createSmartVOC || apiResult?.createCognitiveTask || null,
    deleteData = apiResult?.deleteScreenForm || apiResult?.deleteSmartVOC || apiResult?.deleteCognitiveTask || null,
    updateModule = apiResult?.updateModule || null,
    isCreating = apiResult?.isCreating || false,
    isUpdating = apiResult?.isUpdating || false,
    isUpdatingModule = apiResult?.isUpdatingModule || false
  } = apiResult || {};

  // Estado local para UI (modales, etc.)
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Estado para rastrear cambios granulares
  const [modifiedQuestions, setModifiedQuestions] = useState<Set<string>>(new Set());

  // Estado local para el formulario
  const [formData, setFormData] = useState<Record<string, unknown>>(
    existingData || { ...getInitialDataByQuestionKey(questionKey), researchId: actualResearchId }
  );
  const isSaving = isCreating || isUpdating || isUpdatingModule;

  // Sincronizar con datos existentes cuando cambien
  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
      // Limpiar modificaciones cuando se cargan datos frescos
      setModifiedQuestions(new Set());
    }
  }, [existingData]);

  /**
   * Validación genérica basada en questionKey
   */
  const validateForm = useCallback((): boolean => {
    // Validación universal: verificar que hay datos
    if (!formData) {
      setModalError({
        title: 'Validación',
        message: 'No hay datos para validar',
        type: 'warning'
      });
      setModalVisible(true);
      return false;
    }

    // Usar utilidad de validación
    const { isValid, config } = validateFormWithConfig(questionKey, formData);
    
    if (!isValid && config) {
      setModalError({
        title: config.title || 'Validación',
        message: config.message,
        type: 'warning'
      });
      setModalVisible(true);
      return false;
    }

    return true;
  }, [formData, questionKey]);

  /**
   * Guardar datos de forma agnóstica
   */
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const dataToSubmit: Record<string, unknown> = {
        ...formData,
        researchId: actualResearchId
      };

      if (existingData && actualResearchId && updateData) {
        // Verificar si solo se modificó una pregunta y usar granular
        if (modifiedQuestions.size === 1 && updateModule && (questionKey === 'cognitive_task' || questionKey === 'smartvoc')) {
          const questionId = Array.from(modifiedQuestions)[0];
          const questions = (formData.questions as any[]) || [];
          const questionData = questions.find((q: any) => q.id === questionId);
          
          if (questionData) {
            console.log('🔄 Usando actualización granular para pregunta:', questionId);
            await updateModule({
              researchId: actualResearchId,
              moduleId: questionId,
              moduleData: questionData
            });
            // Limpiar modificaciones después del guardado exitoso
            setModifiedQuestions(new Set());
          } else {
            // Fallback a actualización completa
            console.log('⚠️ Pregunta no encontrada, usando actualización completa');
            if (questionKey.includes('screen')) {
              await updateData(actualResearchId, dataToSubmit);
            } else {
              await updateData(dataToSubmit);
            }
          }
        } else {
          // Actualización completa
          console.log('📦 Usando actualización completa');
          if (questionKey.includes('screen')) {
            // Para screen forms, pasar researchId como primer parámetro
            await updateData(actualResearchId, dataToSubmit);
          } else {
            // Para otros forms, pasar data directamente
            await updateData(dataToSubmit);
          }
        }
      } else if (actualResearchId && createData) {
        // Crear nuevo
        await createData(dataToSubmit);
      } else {
        throw new Error('No hay funciones de guardado disponibles o researchId válido.');
      }

      // Toast genérico basado en questionKey
      const formName = getFormNameByQuestionKey(questionKey);
      toastHelpers.saveSuccess(formName);

    } catch (error) {
      setModalError({
        title: 'Error al Guardar',
        message: `No se pudo guardar: ${buildErrorMessage(error)}`,
        type: 'error'
      });
      setModalVisible(true);
    }
  }, [validateForm, formData, actualResearchId, existingData, updateData, createData, questionKey]);

  /**
   * Vista previa de forma agnóstica
   */
  const handlePreview = useCallback(() => {
    if (!validateForm()) {
      setModalError({
        title: 'Campos incompletos',
        message: 'Por favor, complete todos los campos requeridos antes de previsualizar.',
        type: 'warning'
      });
      setModalVisible(true);
      return;
    }

    // TODO: Implementar vista previa genérica
    toastHelpers.error('Vista previa no implementada aún');
  }, [validateForm]);

  /**
   * Eliminar datos de forma agnóstica
   */
  const handleDelete = useCallback(async () => {
    setIsDeleteModalOpen(true);
  }, []);

  /**
   * Confirmar eliminación de forma agnóstica
   */
  const confirmDelete = useCallback(async () => {
    if (!existingData || !actualResearchId || !deleteData) return;
    
    try {
      if (questionKey.includes('screen')) {
        // Para screen forms, pasar researchId como parámetro
        await deleteData(actualResearchId);
      } else {
        // Para otros forms, llamar sin parámetros
        await deleteData();
      }
      const formName = getFormNameByQuestionKey(questionKey);
      toastHelpers.deleteSuccess(formName);
    } catch (error: unknown) {
      setModalError({
        title: 'Error al eliminar',
        message: buildErrorMessage(error),
        type: 'error'
      });
      setModalVisible(true);
    } finally {
      setIsDeleteModalOpen(false);
    }
  }, [existingData, actualResearchId, deleteData, questionKey]);

  /**
   * Cerrar modal de forma agnóstica
   */
  const closeModal = useCallback(() => {
    setModalVisible(false);
    setModalError(null);
  }, []);

  /**
   * Cerrar modal de eliminación de forma agnóstica
   */
  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
  }, []);

  // Función para actualizar una pregunta específica (solo local)
  const updateQuestion = useCallback((questionId: string, data: any) => {
    const questions = (formData.questions as any[]) || [];
    if (!questions) return;
    
    // Marcar pregunta como modificada
    setModifiedQuestions(prev => new Set(prev).add(questionId));
    
    // Actualizar estado local inmediatamente (sin enviar al backend)
    const updatedQuestions = questions.map((question: any) => {
      if (question.id === questionId) {
        return { ...question, ...data };
      }
      return question;
    });
    
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  }, [formData]);

  // Función para guardar una pregunta específica (granular inmediato)
  const saveQuestion = useCallback(async (questionId: string) => {
    if (!updateModule || !actualResearchId || !existingData) {
      throw new Error('No hay funciones de guardado granular disponibles');
    }

    const questions = (formData.questions as any[]) || [];
    const questionData = questions.find((q: any) => q.id === questionId);
    
    if (!questionData) {
      throw new Error(`Pregunta con ID ${questionId} no encontrada`);
    }

    try {
      console.log('🔄 Guardando pregunta individual:', questionId);
      await updateModule({
        researchId: actualResearchId,
        moduleId: questionId,
        moduleData: questionData
      });
      
      // Limpiar modificación después del guardado exitoso
      setModifiedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });

      const formName = getFormNameByQuestionKey(questionKey);
      toastHelpers.saveSuccess(`${formName} - Pregunta ${questionId}`);
    } catch (error) {
      console.error('Error guardando pregunta individual:', error);
      setModalError({
        title: 'Error al Guardar Pregunta',
        message: `No se pudo guardar la pregunta: ${buildErrorMessage(error)}`,
        type: 'error'
      });
      setModalVisible(true);
    }
  }, [updateModule, actualResearchId, existingData, formData, questionKey]);

  return {
    formData,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    handleSave,
    handlePreview,
    handleDelete,
    closeModal,
    isExisting: !!existingData,
    isDeleteModalOpen,
    confirmDelete,
    closeDeleteModal,
    updateQuestion,
    saveQuestion,
    modifiedQuestions: Array.from(modifiedQuestions),
  };
};

