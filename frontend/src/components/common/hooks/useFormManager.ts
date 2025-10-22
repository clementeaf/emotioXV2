import { useCallback, useState } from 'react';

/**
 * Hook genérico para gestión de formularios
 * Extraído de patrones repetidos en research hooks
 */
export interface ErrorModalData {
  type: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface UseFormManagerResult<T> {
  formData: T;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  validationErrors: ValidationErrors;
  isExisting: boolean;
  existingItem: any | null;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  confirmModalVisible: boolean;
  handleChange: (field: keyof T, value: any) => void;
  handleSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handlePreview: () => void;
  closeModal: () => void;
  showConfirmModal: () => void;
  closeConfirmModal: () => void;
  confirmDelete: () => Promise<void>;
  showErrorModal: (error: ErrorModalData) => void;
}

export interface UseFormManagerOptions<T> {
  initialFormData: T;
  onSave: (data: T) => Promise<void>;
  onDelete?: () => Promise<void>;
  onPreview?: () => void;
  validateForm?: (data: T) => ValidationErrors;
  existingItem?: any | null;
}

/**
 * Hook genérico para gestión de formularios
 * Centraliza la lógica común de formularios en research
 */
export const useFormManager = <T extends Record<string, any>>({
  initialFormData,
  onSave,
  onDelete,
  onPreview,
  validateForm,
  existingItem = null
}: UseFormManagerOptions<T>): UseFormManagerResult<T> => {
  const [formData, setFormData] = useState<T>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const isExisting = !!existingItem;

  const handleChange = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field as string]) {
      setValidationErrors(prev => ({
        ...prev,
        [field as string]: ''
      }));
    }
  }, [validationErrors]);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Validate form if validator provided
      if (validateForm) {
        const errors = validateForm(formData);
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          return;
        }
      }
      
      await onSave(formData);
      setValidationErrors({});
    } catch (error) {
      showErrorModal({
        type: 'error',
        title: 'Error al guardar',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsSaving(false);
    }
  }, [formData, onSave, validateForm]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete();
    } catch (error) {
      showErrorModal({
        type: 'error',
        title: 'Error al eliminar',
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete]);

  const handlePreview = useCallback(() => {
    if (onPreview) {
      onPreview();
    }
  }, [onPreview]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setModalError(null);
  }, []);

  const showConfirmModal = useCallback(() => {
    setConfirmModalVisible(true);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModalVisible(false);
  }, []);

  const confirmDelete = useCallback(async () => {
    await handleDelete();
    setConfirmModalVisible(false);
  }, [handleDelete]);

  const showErrorModal = useCallback((error: ErrorModalData) => {
    setModalError(error);
    setModalVisible(true);
  }, []);

  return {
    formData,
    isLoading,
    isSaving,
    isDeleting,
    validationErrors,
    isExisting,
    existingItem,
    modalError,
    modalVisible,
    confirmModalVisible,
    handleChange,
    handleSave,
    handleDelete,
    handlePreview,
    closeModal,
    showConfirmModal,
    closeConfirmModal,
    confirmDelete,
    showErrorModal
  };
};
