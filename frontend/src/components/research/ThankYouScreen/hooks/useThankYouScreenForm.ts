import { useCallback, useEffect, useState } from 'react';
import { useThankYouScreenData } from '@/hooks/useThankYouScreenData';
import { ThankYouScreenModel } from '@/shared/interfaces/thank-you-screen.interface';
import { toastHelpers } from '@/utils/toast';
import {
  ErrorModalData,
  UseThankYouScreenFormResult,
  ValidationErrors,
  ThankYouScreenFormData,
} from '../types';

// Initial form data
const INITIAL_FORM_DATA: ThankYouScreenFormData = {
  isEnabled: true,
  title: '',
  message: '',
  redirectUrl: '',
  questionKey: 'THANK_YOU_SCREEN',
  metadata: {
    version: '1.0.0',
    lastUpdated: new Date(),
    lastModifiedBy: 'user'
  }
};

export const useThankYouScreenForm = (researchId: string): UseThankYouScreenFormResult => {
  const actualResearchId = researchId === 'current' ? '' : researchId;

  // Usar el hook centralizado para obtener datos y operaciones
  const {
    data: existingScreen,
    isLoading,
    error,
    updateThankYouScreen,
    createThankYouScreen,
    deleteThankYouScreen
  } = useThankYouScreenData(actualResearchId);

  const [formData, setFormData] = useState<ThankYouScreenFormData>(INITIAL_FORM_DATA);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasBeenSaved, setHasBeenSaved] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // Procesar datos cuando cambien
  useEffect(() => {
    if (!actualResearchId) {
      setFormData({ ...INITIAL_FORM_DATA });
      setIsEmpty(true);
      return;
    }

    if (existingScreen) {
      const formDataToSet: ThankYouScreenFormData = {
        isEnabled: existingScreen.isEnabled ?? true,
        title: existingScreen.title ?? '',
        message: existingScreen.message ?? '',
        redirectUrl: existingScreen.redirectUrl ?? '',
        questionKey: 'THANK_YOU_SCREEN',
        metadata: {
          version: existingScreen.metadata?.version || '1.0.0',
          lastUpdated: existingScreen.metadata?.lastUpdated || new Date(),
          lastModifiedBy: existingScreen.metadata?.lastModifiedBy || 'user'
        }
      };
      setFormData(formDataToSet);
      setIsEmpty(false);
      setHasBeenSaved(true);
    } else if (!hasBeenSaved) {
      setFormData({ ...INITIAL_FORM_DATA });
      setIsEmpty(true);
    }

    // Manejar errores - solo mostrar error si hay un error real (no 404)
    if (error && !existingScreen && !error.message?.includes('THANK_YOU_SCREEN_NOT_FOUND')) {
      setModalError({
        title: 'Error',
        message: 'No se pudo cargar la configuración de la pantalla de agradecimiento.',
        type: 'error'
      });
      setModalVisible(true);
    }
  }, [existingScreen, actualResearchId, error]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (!formData.title) { errors.title = 'El título es requerido'; }
    if (!formData.message) { errors.message = 'El mensaje es requerido'; }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = useCallback((field: string | number | symbol, value: string | boolean): void => {
    setFormData((prev: ThankYouScreenFormData) => ({
      ...prev,
      [field]: value,
      metadata: {
        ...(prev.metadata || INITIAL_FORM_DATA.metadata),
        version: prev.metadata?.version || '1.0.0',
        lastUpdated: new Date(),
        lastModifiedBy: prev.metadata?.lastModifiedBy || 'user'
      }
    }));
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof ValidationErrors];
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

    setIsSaving(true);
    try {
      const dataToSubmit = formData;
      let resultRecord: ThankYouScreenModel;

      if (existingScreen?.id && actualResearchId) {
        // Actualizar existente usando hook centralizado
        resultRecord = await updateThankYouScreen(actualResearchId, {
          ...dataToSubmit,
          researchId: actualResearchId
        });
      } else if (actualResearchId) {
        // Crear nuevo usando hook centralizado
        const payload = {
          ...INITIAL_FORM_DATA,
          ...dataToSubmit,
          researchId: actualResearchId
        };
        resultRecord = await createThankYouScreen(payload);
      } else {
        throw new Error('No hay researchId válido para guardar.');
      }

      const formDataFromResult: ThankYouScreenFormData = {
        isEnabled: resultRecord.isEnabled ?? true,
        title: resultRecord.title ?? '',
        message: resultRecord.message ?? '',
        redirectUrl: resultRecord.redirectUrl ?? '',
        questionKey: 'THANK_YOU_SCREEN',
        metadata: {
          version: resultRecord.metadata?.version || '1.0.0',
          lastUpdated: resultRecord.metadata?.lastUpdated || new Date(),
          lastModifiedBy: resultRecord.metadata?.lastModifiedBy || 'user'
        }
      };

      setFormData(formDataFromResult);
      setHasBeenSaved(true);
      setIsEmpty(false);

      // Usar toast en lugar de modal para éxito
      toastHelpers.saveSuccess('Pantalla de agradecimiento');

    } catch (error) {
      setModalError({
        title: 'Error al Guardar',
        message: `No se pudo guardar la pantalla de agradecimiento: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      });
      setModalVisible(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (!validateForm()) {
      setModalError({
        title: 'Campos incompletos',
        message: 'Por favor, complete todos los campos requeridos antes de previsualizar.',
        type: 'warning'
      });
      setModalVisible(true);
      return;
    }

    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      const { title, message } = formData;
      const previewHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vista previa - ${title}</title>
          <style>
            body { font-family: sans-serif; margin: 40px; background-color: #f4f4f4; display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 80px); }
            .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 600px; width: 90%; }
            h1 { color: #333; margin-bottom: 15px; }
            .message { color: #555; line-height: 1.6; margin-bottom: 25px; white-space: pre-wrap; }
            .badge { position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; font-size: 12px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="badge">Vista Previa</div>
          <div class="container">
            <h1>${title}</h1>
            <div class="message">${message.replace(/\n/g, '<br>')}</div>
          </div>
        </body>
        </html>
      `;
      previewWindow.document.write(previewHtml);
      previewWindow.document.close();
    } else {
      setModalError({
        title: 'Error de Vista Previa',
        message: 'No se pudo abrir la ventana de vista previa. Por favor, habilite las ventanas emergentes.',
        type: 'error'
      });
      setModalVisible(true);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!existingScreen?.id || !actualResearchId) return;
    setIsDeleting(true);
    try {
      await deleteThankYouScreen();
      setFormData({ ...INITIAL_FORM_DATA });
      setHasBeenSaved(false);
      setIsEmpty(true);

      // Usar toast en lugar de modal para éxito
      toastHelpers.deleteSuccess('Pantalla de agradecimiento');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo eliminar la pantalla de agradecimiento.';
      setModalError({
        title: 'Error al eliminar',
        message: errorMessage,
        type: 'error'
      });
      setModalVisible(true);
    } finally {
      setIsDeleting(false);
    }
  }, [existingScreen, actualResearchId, deleteThankYouScreen]);

  const closeModal = () => {
    setModalVisible(false);
    setModalError(null);
  };

  const showConfirmModal = () => {
    setConfirmModalVisible(true);
  };

  const closeConfirmModal = () => {
    setConfirmModalVisible(false);
  };

  const confirmDelete = async () => {
    await handleDelete();
    closeConfirmModal();
  };

  return {
    formData,
    thankYouScreenId: existingScreen?.id || null,
    validationErrors,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    handleChange,
    handleSave,
    handlePreview,
    validateForm,
    closeModal,
    isExisting: !!(existingScreen?.id),
    handleDelete,
    isDeleting,
    showDelete: !!(existingScreen?.id),
    confirmModalVisible,
    showConfirmModal,
    closeConfirmModal,
    confirmDelete,
  };
};