import { useState, useEffect, useCallback } from 'react';
import { welcomeScreenService } from '@/services/welcomeScreen.service';
import { WelcomeScreenData, ErrorModalData, UseWelcomeScreenFormResult, ValidationErrors } from '../types';
import { WelcomeScreenFormData } from 'shared/interfaces/welcome-screen.interface';

// Valor inicial con cadenas vacías para campos de texto
const INITIAL_FORM_DATA: WelcomeScreenData = {
  researchId: '',
  isEnabled: true,
  title: '',
  message: '',
  startButtonText: '',
  metadata: {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    lastModifiedBy: 'user'
  }
};

export const useWelcomeScreenForm = (researchId: string): UseWelcomeScreenFormResult => {
  // Convertir 'current' a un ID válido cuando sea necesario (revisar esta lógica si aplica)
  const actualResearchId = researchId === 'current' ? '' : researchId; // Usar '' si es current y no hay ID real

  const [formData, setFormData] = useState<WelcomeScreenData>({ ...INITIAL_FORM_DATA, researchId: actualResearchId });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingScreen, setExistingScreen] = useState<WelcomeScreenData | null>(null);
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // Iniciar carga
      // No resetear aquí, esperar a la respuesta
      try {
        if (!actualResearchId) {
          // Si no hay researchId real, no buscar y usar valores iniciales
          console.log('No researchId provided, using initial form data.');
          setFormData({ ...INITIAL_FORM_DATA, researchId: '' });
          setExistingScreen(null);
          setIsLoading(false);
          return;
        }

        const response = await welcomeScreenService.getByResearchId(actualResearchId);

        if (response && response.id) { // Verificar que la respuesta no sea null y tenga ID
          console.log('Fetched existing data:', response);
          const formattedResponse: WelcomeScreenData = {
            id: response.id,
            researchId: response.researchId,
            isEnabled: response.isEnabled ?? true, // Valor por defecto si es null/undefined
            title: response.title ?? '', // Usar '' si es null/undefined
            message: response.message ?? '', // Usar '' si es null/undefined
            startButtonText: response.startButtonText ?? '', // Usar '' si es null/undefined
            createdAt: response.createdAt instanceof Date ? response.createdAt.toISOString() : response.createdAt,
            updatedAt: response.updatedAt instanceof Date ? response.updatedAt.toISOString() : response.updatedAt,
            metadata: {
              version: response.metadata?.version || '1.0',
              lastUpdated: response.metadata?.lastUpdated instanceof Date ?
                response.metadata.lastUpdated.toISOString() :
                response.metadata?.lastUpdated || new Date().toISOString(),
              lastModifiedBy: response.metadata?.lastModifiedBy || 'user'
            }
          };
          setFormData(formattedResponse);
          setExistingScreen(formattedResponse);
        } else {
          // No hay datos existentes, usar valores iniciales asegurando cadenas vacías
          console.log('No existing data found, using initial form data.');
          setFormData({ ...INITIAL_FORM_DATA, researchId: actualResearchId });
          setExistingScreen(null);
        }
      } catch (error) {
        console.error('Error fetching welcome screen:', error);
        // Mantener los valores iniciales en caso de error
        setFormData({ ...INITIAL_FORM_DATA, researchId: actualResearchId });
        setExistingScreen(null);
        setModalError({
          title: 'Error',
          message: 'No se pudo cargar la configuración de la pantalla de bienvenida.',
          type: 'error'
        });
        setModalVisible(true);
      } finally {
        setIsLoading(false); // Finalizar carga
      }
    };

    fetchData();
  }, [actualResearchId]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (!formData.title) errors.title = 'El título es requerido';
    if (!formData.message) errors.message = 'El mensaje es requerido';
    if (!formData.startButtonText) errors.startButtonText = 'El texto del botón es requerido';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = useCallback((field: keyof WelcomeScreenData, value: any): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      metadata: {
        ...(prev.metadata || INITIAL_FORM_DATA.metadata),
        lastUpdated: new Date().toISOString(),
        lastModifiedBy: 'user'
      }
    }));
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
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
      const dataToSave: WelcomeScreenFormData = {
        isEnabled: formData.isEnabled,
        title: formData.title,
        message: formData.message,
        startButtonText: formData.startButtonText,
        metadata: {
          version: formData.metadata?.version || '1.0',
          lastUpdated: new Date(),
          lastModifiedBy: formData.metadata?.lastModifiedBy || 'user'
        }
      };

      const payload = {
        ...dataToSave,
        researchId: actualResearchId,
        id: existingScreen?.id
      };

      console.log('Saving welcome screen with payload:', payload);
      const updatedData = await welcomeScreenService.save(payload);

      const formattedUpdatedData: WelcomeScreenData = {
        id: updatedData.id,
        researchId: updatedData.researchId,
        isEnabled: updatedData.isEnabled ?? true,
        title: updatedData.title ?? '',
        message: updatedData.message ?? '',
        startButtonText: updatedData.startButtonText ?? '',
        createdAt: updatedData.createdAt instanceof Date ? updatedData.createdAt.toISOString() : updatedData.createdAt,
        updatedAt: updatedData.updatedAt instanceof Date ? updatedData.updatedAt.toISOString() : updatedData.updatedAt,
        metadata: {
          version: updatedData.metadata?.version || '1.0',
          lastUpdated: updatedData.metadata?.lastUpdated instanceof Date ?
            updatedData.metadata.lastUpdated.toISOString() :
            updatedData.metadata?.lastUpdated || new Date().toISOString(),
          lastModifiedBy: updatedData.metadata?.lastModifiedBy || 'user'
        }
      };

      setFormData(formattedUpdatedData);
      setExistingScreen(formattedUpdatedData);

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
    existingScreen,
    modalError,
    modalVisible,
    handleChange,
    handleSubmit,
    handlePreview,
    closeModal
  };
};