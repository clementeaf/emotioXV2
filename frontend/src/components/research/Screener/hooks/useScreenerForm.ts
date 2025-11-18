/**
 * Hook para gestionar el formulario de Screener
 */

import { useState, useEffect, useCallback } from 'react';
import { useScreenerData } from '@/api/domains/screener';
import type { ScreenerFormData } from '@/api/domains/screener/screener.types';

export interface ValidationErrors {
  [key: string]: string;
}

export interface ErrorModalData {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

export interface UseScreenerFormResult {
  formData: ScreenerFormData;
  isLoading: boolean;
  isSaving: boolean;
  validationErrors: ValidationErrors;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  isDeleteModalOpen: boolean;
  handleChange: (field: keyof ScreenerFormData, value: unknown) => void;
  handleSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
  confirmDelete: () => Promise<void>;
  closeModal: () => void;
  closeDeleteModal: () => void;
}

const INITIAL_FORM_DATA: ScreenerFormData = {
  researchId: '',
  isEnabled: false,
  title: '',
  description: '',
  questions: []
};

export const useScreenerForm = (researchId: string): UseScreenerFormResult => {
  const actualResearchId = researchId === 'current' ? '' : researchId;

  const {
    data: existingData,
    isLoading,
    createScreener,
    updateScreener,
    deleteScreener,
    isCreating,
    isUpdating,
    isDeleting
  } = useScreenerData(actualResearchId);

  const [formData, setFormData] = useState<ScreenerFormData>(INITIAL_FORM_DATA);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);

  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (!actualResearchId) {
      setFormData({ ...INITIAL_FORM_DATA, researchId: '' });
      return;
    }

    if (existingData) {
      setFormData({
        researchId: existingData.researchId,
        isEnabled: existingData.isEnabled,
        title: existingData.title,
        description: existingData.description,
        questions: existingData.questions || []
      });
      setHasBeenSaved(true);
    } else if (!hasBeenSaved) {
      setFormData({ ...INITIAL_FORM_DATA, researchId: actualResearchId });
    }
  }, [existingData, actualResearchId, hasBeenSaved]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.title.trim()) {
      errors.title = 'El título es requerido';
    }

    if (!formData.description.trim()) {
      errors.description = 'La descripción es requerida';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = useCallback((field: keyof ScreenerFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const handleSave = async () => {
    if (!validateForm()) {
      setModalError({
        title: 'Campos incompletos',
        message: 'Por favor, complete todos los campos requeridos.',
        type: 'warning'
      });
      setModalVisible(true);
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        researchId: actualResearchId
      };

      if (existingData && actualResearchId) {
        await updateScreener(dataToSubmit);
      } else if (actualResearchId) {
        await createScreener(dataToSubmit);
      } else {
        throw new Error('No hay researchId válido para guardar.');
      }

      setHasBeenSaved(true);
    } catch (error) {
      setModalError({
        title: 'Error al Guardar',
        message: `No se pudo guardar Screener: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      });
      setModalVisible(true);
    }
  };

  const handleDelete = async () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!existingData || !actualResearchId) return;

    try {
      await deleteScreener();
      setFormData({ ...INITIAL_FORM_DATA, researchId: actualResearchId });
      setHasBeenSaved(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo eliminar Screener.';
      setModalError({
        title: 'Error al eliminar',
        message: errorMessage,
        type: 'error'
      });
      setModalVisible(true);
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalError(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  return {
    formData,
    isLoading,
    isSaving,
    validationErrors,
    modalError,
    modalVisible,
    isDeleteModalOpen,
    handleChange,
    handleSave,
    handleDelete,
    confirmDelete,
    closeModal,
    closeDeleteModal
  };
};

