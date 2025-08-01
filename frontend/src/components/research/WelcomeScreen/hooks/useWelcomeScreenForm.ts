import { useWelcomeScreenData } from '@/hooks/useWelcomeScreenData';
import { useCallback, useEffect, useState } from 'react';

import { welcomeScreenService } from '@/services/welcomeScreen.service';
import { WelcomeScreenRecord, WelcomeScreenFormData as WelcomeScreenServiceData } from '../../../../../../shared/interfaces/welcome-screen.interface';
import {
  ErrorModalData,
  UseWelcomeScreenFormResult,
  ValidationErrors,
} from '../types';

// Elimina la interfaz extendida y usa WelcomeScreenServiceData para formData
// Cambia el tipo de formData y setFormData
const INITIAL_FORM_DATA: WelcomeScreenServiceData = {
  isEnabled: true,
  title: '',
  message: '',
  startButtonText: '',
  metadata: {
    version: '1.0.0',
    lastUpdated: new Date(),
    lastModifiedBy: 'user'
  }
};

export const useWelcomeScreenForm = (researchId: string): UseWelcomeScreenFormResult => {

  const actualResearchId = researchId === 'current' ? '' : researchId;
  const [formData, setFormData] = useState<WelcomeScreenServiceData>(INITIAL_FORM_DATA);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [isEmpty, setIsEmpty] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Usar el hook centralizado para obtener datos
  const { data: existingScreen, isLoading, error } = useWelcomeScreenData(actualResearchId);

  // Procesar datos cuando cambien
  useEffect(() => {
    if (!actualResearchId) {
      setFormData({ ...INITIAL_FORM_DATA }); // No agregues researchId ni questionKey
      setIsEmpty(true);
      return;
    }

    if (existingScreen) {
      const formDataToSet: WelcomeScreenServiceData = {
        isEnabled: existingScreen.isEnabled ?? true,
        title: existingScreen.title ?? '',
        message: existingScreen.message ?? '',
        startButtonText: existingScreen.startButtonText ?? '',
        metadata: {
          version: existingScreen.metadata?.version || '1.0.0',
          lastUpdated: existingScreen.metadata?.lastUpdated || new Date(),
          lastModifiedBy: existingScreen.metadata?.lastModifiedBy || 'user'
        }
      };
      setFormData(formDataToSet);
      setIsEmpty(false);
    } else {
      setFormData({ ...INITIAL_FORM_DATA }); // No agregues researchId ni questionKey
      setIsEmpty(true);
    }

    // Manejar errores - solo mostrar error si hay un error real (no 404)
    if (error && !existingScreen && !error.message?.includes('WELCOME_SCREEN_NOT_FOUND')) {
      setModalError({
        title: 'Error',
        message: 'No se pudo cargar la configuración de la pantalla de bienvenida.',
        type: 'error'
      });
      setModalVisible(true);
    }
  }, [existingScreen, actualResearchId, error]);

  // Eliminar este useEffect ya que ahora usamos el hook centralizado
  // useEffect(() => {
  //   fetchData();
  // }, [fetchData, refetchTrigger]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (!formData.title) { errors.title = 'El título es requerido'; }
    if (!formData.message) { errors.message = 'El mensaje es requerido'; }
    if (!formData.startButtonText) { errors.startButtonText = 'El texto del botón es requerido'; }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Corrige el tipo de handleChange para que coincida con la interfaz pública
  const handleChange = useCallback((field: string | number | symbol, value: any): void => {
    setFormData((prev: WelcomeScreenServiceData) => ({
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

  const handleSubmit = async () => {
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
      // formData ya solo contiene los campos válidos de WelcomeScreenFormData
      const dataToSubmit = formData;

      let resultRecord: WelcomeScreenRecord;

      if (existingScreen?.id && actualResearchId) {
        resultRecord = await welcomeScreenService.updateForResearch(
          actualResearchId,
          existingScreen.id,
          dataToSubmit
        );
      } else if (actualResearchId) {
        if (!actualResearchId) throw new Error('No hay researchId válido para guardar.');
        // Combinar los datos para crear
        const payload = {
          ...INITIAL_FORM_DATA,
          ...dataToSubmit
        };
        resultRecord = await welcomeScreenService.createForResearch(
          actualResearchId,
          payload
        );
      } else {
        throw new Error('No hay researchId válido para guardar.');
      }

      const formDataFromResult: WelcomeScreenServiceData = {
        isEnabled: resultRecord.isEnabled ?? true,
        title: resultRecord.title ?? '',
        message: resultRecord.message ?? '',
        startButtonText: resultRecord.startButtonText ?? '',
        metadata: {
          version: resultRecord.metadata?.version || '1.0.0',
          lastUpdated: resultRecord.metadata?.lastUpdated || new Date(),
          lastModifiedBy: resultRecord.metadata?.lastModifiedBy || 'user'
        }
      };

      setFormData(formDataFromResult);
      setRefetchTrigger(prev => prev + 1);
      // setExistingScreen(resultRecord); // Ya no es necesario, el hook centralizado maneja esto
      setModalError({
        title: 'Éxito',
        message: 'Pantalla de bienvenida guardada correctamente.',
        type: 'info'
      });
      setModalVisible(true);

    } catch (error) {
      console.error('Error saving welcome screen:', error);
      setModalError({
        title: 'Error al Guardar',
        message: `No se pudo guardar la pantalla de bienvenida: ${error instanceof Error ? error.message : String(error)}`,
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
      const { title, message, startButtonText } = formData;
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
            button { background-color: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px; }
            button:hover { background-color: #0056b3; }
            .badge { position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; font-size: 12px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="badge">Vista Previa</div>
          <div class="container">
            <h1>${title}</h1>
            <div class="message">${message.replace(/\n/g, '<br>')}</div>
            <button>${startButtonText}</button>
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
      await welcomeScreenService.delete(actualResearchId, existingScreen.id);
      setFormData({ ...INITIAL_FORM_DATA }); // No agregues researchId ni questionKey
      setModalError({
        title: 'Eliminado',
        message: 'La pantalla de bienvenida fue eliminada correctamente.',
        type: 'success' as any
      });
      setModalVisible(true);
      setIsEmpty(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'No se pudo eliminar la pantalla de bienvenida.';
      setModalError({
        title: 'Error al eliminar',
        message: errorMessage,
        type: 'error'
      });
      setModalVisible(true);
    } finally {
      setIsDeleting(false);
    }
  }, [existingScreen, actualResearchId, setFormData, setModalError, setModalVisible]);

  const closeModal = () => {
    setModalVisible(false);
    setModalError(null);
  };

  return {
    formData,
    setFormData,
    validationErrors,
    isLoading,
    isSaving,
    existingScreen: existingScreen || null,
    modalError,
    modalVisible,
    handleChange,
    handleSubmit,
    handlePreview,
    closeModal,
    isEmpty,
    handleDelete,
    isDeleting,
    showDelete: !!(existingScreen?.id),
  };
};
