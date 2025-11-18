/**
 * Hook para gestionar el formulario de Implicit Association
 */

import { useState, useEffect, useCallback } from 'react';
import { useImplicitAssociationData } from '@/api/domains/implicit-association';
import type { ImplicitAssociationFormData, Target, Attribute } from '@/api/domains/implicit-association/implicit-association.types';
import { v4 as uuidv4 } from 'uuid';

export interface ValidationErrors {
  [key: string]: string;
}

export interface ErrorModalData {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

export interface UseImplicitAssociationFormResult {
  formData: ImplicitAssociationFormData;
  isLoading: boolean;
  isSaving: boolean;
  validationErrors: ValidationErrors;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  isDeleteModalOpen: boolean;
  handleTargetChange: (targetId: string, updates: Partial<Target>) => void;
  handleFileUpload: (targetId: string, files: FileList) => void;
  handleFileDelete: (targetId: string, fileId: string) => void;
  handleAttributeChange: (attributeId: string, name: string) => void;
  handleAddAttribute: () => void;
  handleRemoveAttribute: (attributeId: string) => void;
  handleIsRequiredChange: (isRequired: boolean) => void;
  handleExerciseInstructionsChange: (instructions: string) => void;
  handleTestInstructionsChange: (instructions: string) => void;
  handleTestConfigurationChange: (configuration: string) => void;
  handleShowResultsChange: (showResults: boolean) => void;
  handleSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
  confirmDelete: () => Promise<void>;
  closeModal: () => void;
  closeDeleteModal: () => void;
}

const INITIAL_FORM_DATA: ImplicitAssociationFormData = {
  researchId: '',
  isRequired: false,
  targets: [
    {
      id: 'target-1',
      title: '',
      description: 'You can use an image or a name for this.',
      type: 'file-upload',
      required: false,
      showConditionally: false,
      deviceFrame: false,
      files: [],
      hitZones: []
    }
  ],
  attributes: [
    { id: uuidv4(), order: 1, name: '' },
    { id: uuidv4(), order: 2, name: '' }
  ],
  exerciseInstructions: '',
  testInstructions: '',
  testConfiguration: '',
  showResults: false
};

export const useImplicitAssociationForm = (researchId: string): UseImplicitAssociationFormResult => {
  const actualResearchId = researchId === 'current' ? '' : researchId;

  const {
    data: existingData,
    isLoading,
    createImplicitAssociation,
    updateImplicitAssociation,
    deleteImplicitAssociation,
    isCreating,
    isUpdating,
    isDeleting
  } = useImplicitAssociationData(actualResearchId);

  const [formData, setFormData] = useState<ImplicitAssociationFormData>(INITIAL_FORM_DATA);
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
        isRequired: existingData.isRequired,
        targets: existingData.targets || INITIAL_FORM_DATA.targets,
        attributes: existingData.attributes || INITIAL_FORM_DATA.attributes,
        exerciseInstructions: existingData.exerciseInstructions || '',
        testInstructions: existingData.testInstructions || '',
        testConfiguration: existingData.testConfiguration || '',
        showResults: existingData.showResults || false,
        metadata: existingData.metadata
      });
      setHasBeenSaved(true);
    } else if (!hasBeenSaved) {
      setFormData({ ...INITIAL_FORM_DATA, researchId: actualResearchId });
    }
  }, [existingData, actualResearchId, hasBeenSaved]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (formData.targets.length === 0) {
      errors.targets = 'Debe tener al menos un target';
    }

    formData.targets.forEach((target, index) => {
      if (!target.title.trim() && target.files.length === 0) {
        errors[`target_${index}`] = 'El target debe tener un título o una imagen';
      }
    });

    if (formData.attributes.length < 2) {
      errors.attributes = 'Debe tener al menos 2 atributos';
    }

    formData.attributes.forEach((attribute, index) => {
      if (!attribute.name.trim()) {
        errors[`attribute_${index}`] = 'El nombre del atributo es requerido';
      }
    });

    if (!formData.testConfiguration) {
      errors.testConfiguration = 'Debe seleccionar una configuración de prueba';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTargetChange = useCallback((targetId: string, updates: Partial<Target>) => {
    setFormData(prev => {
      const updatedTargets = prev.targets.map(target =>
        target.id === targetId ? { ...target, ...updates } : target
      );

      const currentTarget = updatedTargets.find(t => t.id === targetId);
      const isCurrentTargetComplete = currentTarget &&
        (currentTarget.title.trim() !== '' || currentTarget.files.length > 0);

      const shouldAddNewTarget =
        isCurrentTargetComplete &&
        updatedTargets.length < 5 &&
        targetId === `target-${updatedTargets.length}`;

      if (shouldAddNewTarget) {
        const newTarget: Target = {
          id: `target-${updatedTargets.length + 1}`,
          title: '',
          description: 'You can use an image or a name for this.',
          type: 'file-upload',
          required: false,
          showConditionally: false,
          deviceFrame: false,
          files: [],
          hitZones: []
        };
        return { ...prev, targets: [...updatedTargets, newTarget] };
      }

      return { ...prev, targets: updatedTargets };
    });
  }, []);

  const handleFileUpload = useCallback((targetId: string, files: FileList) => {
    const fileArray = Array.from(files).map(file => ({
      id: uuidv4(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: '',
      s3Key: ''
    }));

    handleTargetChange(targetId, { files: fileArray });
  }, [handleTargetChange]);

  const handleFileDelete = useCallback((targetId: string, fileId: string) => {
    setFormData(prev => ({
      ...prev,
      targets: prev.targets.map(target =>
        target.id === targetId
          ? { ...target, files: target.files.filter(f => f.id !== fileId) }
          : target
      )
    }));
  }, []);

  const handleAttributeChange = useCallback((attributeId: string, name: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map(attr =>
        attr.id === attributeId ? { ...attr, name } : attr
      )
    }));
  }, []);

  const handleAddAttribute = useCallback(() => {
    setFormData(prev => {
      const newAttribute: Attribute = {
        id: uuidv4(),
        order: prev.attributes.length + 1,
        name: ''
      };
      return { ...prev, attributes: [...prev.attributes, newAttribute] };
    });
  }, []);

  const handleRemoveAttribute = useCallback((attributeId: string) => {
    setFormData(prev => {
      if (prev.attributes.length <= 2) return prev;
      return {
        ...prev,
        attributes: prev.attributes
          .filter(attr => attr.id !== attributeId)
          .map((attr, index) => ({ ...attr, order: index + 1 }))
      };
    });
  }, []);

  const handleIsRequiredChange = useCallback((isRequired: boolean) => {
    setFormData(prev => ({ ...prev, isRequired }));
  }, []);

  const handleExerciseInstructionsChange = useCallback((instructions: string) => {
    setFormData(prev => ({ ...prev, exerciseInstructions: instructions }));
  }, []);

  const handleTestInstructionsChange = useCallback((instructions: string) => {
    setFormData(prev => ({ ...prev, testInstructions: instructions }));
  }, []);

  const handleTestConfigurationChange = useCallback((configuration: string) => {
    setFormData(prev => ({ ...prev, testConfiguration: configuration }));
  }, []);

  const handleShowResultsChange = useCallback((showResults: boolean) => {
    setFormData(prev => ({ ...prev, showResults }));
  }, []);

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
        await updateImplicitAssociation(dataToSubmit);
      } else if (actualResearchId) {
        await createImplicitAssociation(dataToSubmit);
      } else {
        throw new Error('No hay researchId válido para guardar.');
      }

      setHasBeenSaved(true);
    } catch (error) {
      setModalError({
        title: 'Error al Guardar',
        message: `No se pudo guardar Implicit Association: ${error instanceof Error ? error.message : String(error)}`,
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
      await deleteImplicitAssociation();
      setFormData({ ...INITIAL_FORM_DATA, researchId: actualResearchId });
      setHasBeenSaved(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo eliminar Implicit Association.';
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
    handleTargetChange,
    handleFileUpload,
    handleFileDelete,
    handleAttributeChange,
    handleAddAttribute,
    handleRemoveAttribute,
    handleIsRequiredChange,
    handleExerciseInstructionsChange,
    handleTestInstructionsChange,
    handleTestConfigurationChange,
    handleShowResultsChange,
    handleSave,
    handleDelete,
    confirmDelete,
    closeModal,
    closeDeleteModal
  };
};

