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
  const {
    data: existingData,
    isLoading,
    updateData,
    createData,
    deleteData,
    isCreating,
    isUpdating
  } = apiHook(actualResearchId);

  // Estado local para UI (modales, etc.)
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Estado local para el formulario
  const [formData, setFormData] = useState<Record<string, unknown>>(
    existingData || { ...getInitialDataByQuestionKey(questionKey), researchId: actualResearchId }
  );
  const isSaving = isCreating || isUpdating;

  // Sincronizar con datos existentes cuando cambien
  useEffect(() => {
    if (existingData) {
      setFormData(existingData);
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

      if (existingData && actualResearchId) {
        // Actualizar existente
        await updateData(dataToSubmit);
      } else if (actualResearchId) {
        // Crear nuevo
        await createData(dataToSubmit);
      } else {
        throw new Error('No hay researchId válido para guardar.');
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
    if (!existingData || !actualResearchId) return;
    
    try {
      await deleteData();
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

  // Función para actualizar una pregunta específica
  const updateQuestion = useCallback((questionId: string, data: any) => {
    const questions = (formData.questions as any[]) || [];
    if (!questions) return;
    
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
  };
};

