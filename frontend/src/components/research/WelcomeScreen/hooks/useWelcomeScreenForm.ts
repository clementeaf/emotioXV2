import { useState, useEffect, useCallback } from 'react';
import welcomeScreenService from '@/services/welcomeScreenService';
import {
  WelcomeScreenData,
  ErrorModalData,
  UseWelcomeScreenFormResult,
  ValidationErrors,
} from '../types';

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
      setIsLoading(true);
      try {
        if (!actualResearchId) {
          // Si no hay researchId real, no buscar y usar valores iniciales
          console.log('No researchId provided, using initial form data.');
          setFormData({ ...INITIAL_FORM_DATA, researchId: '' });
          setExistingScreen(null);
          setIsLoading(false);
          return;
        }

        const response: WelcomeScreenData | null = await welcomeScreenService.getByResearchId(actualResearchId);

        // ----> LOG DE DEPURACIÓN <----
        console.log('[DEBUG] Datos recibidos de getByResearchId:', response);
        if (response) {
          console.log(`[DEBUG] ID Recibido: ${response.id}, Research ID Recibido: ${response.researchId}`);
        }
        // ---------------------------

        if (response && response.id) {
          console.log('Fetched existing data:', response);
          const formattedResponse: WelcomeScreenData = {
            id: response.id,
            researchId: response.researchId,
            isEnabled: response.isEnabled ?? true,
            title: response.title ?? '',
            message: response.message ?? '',
            startButtonText: response.startButtonText ?? '',
            subtitle: response.subtitle ?? '',
            logoUrl: response.logoUrl ?? '',
            backgroundImageUrl: response.backgroundImageUrl ?? '',
            backgroundColor: response.backgroundColor ?? '',
            textColor: response.textColor ?? '',
            theme: response.theme ?? '',
            disclaimer: response.disclaimer ?? '',
            customCss: response.customCss ?? '',
            createdAt: typeof response.createdAt === 'string' ? response.createdAt : undefined,
            updatedAt: typeof response.updatedAt === 'string' ? response.updatedAt : undefined,
            metadata: {
              version: response.metadata?.version || '1.0',
              lastUpdated: typeof response.metadata?.lastUpdated === 'string' 
                ? response.metadata.lastUpdated 
                : new Date().toISOString(),
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
        setIsLoading(false);
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
        version: prev.metadata?.version || '1.0',
        lastUpdated: new Date().toISOString(),
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
      const dataToSubmit = { ...formData };

      let resultRecord: WelcomeScreenData & { id: string; createdAt: string; updatedAt: string };

      if (existingScreen?.id && actualResearchId) {
        console.log(`[DEBUG] Intentando actualizar:
          Research ID: ${actualResearchId}
          Screen ID: ${existingScreen.id}
          Datos:`, dataToSubmit);
        
        console.log(`Llamando a updateForResearch con screenId: ${existingScreen.id}`);
        const { id, createdAt, updatedAt, researchId: formResearchId, ...updatePayload } = dataToSubmit;
        resultRecord = await welcomeScreenService.updateForResearch(
          actualResearchId,
          existingScreen.id,
          updatePayload
        );
      } else if (actualResearchId) {
        console.log(`[DEBUG] Intentando crear:
          Research ID: ${actualResearchId}
          Datos:`, dataToSubmit);
        
        console.log(`Llamando a createForResearch para researchId: ${actualResearchId}`);
        const { id, createdAt, updatedAt, ...createPayloadBase } = dataToSubmit;
        const createPayload: WelcomeScreenData = {
          ...createPayloadBase,
          researchId: actualResearchId
        };
        resultRecord = await welcomeScreenService.createForResearch(
          actualResearchId,
          createPayload
        );
      } else {
        throw new Error('No hay researchId válido para guardar.');
      }

      const formattedResponseData: WelcomeScreenData = {
        id: resultRecord.id,
        researchId: resultRecord.researchId,
        isEnabled: resultRecord.isEnabled ?? true,
        title: resultRecord.title ?? '',
        message: resultRecord.message ?? '',
        startButtonText: resultRecord.startButtonText ?? '',
        subtitle: resultRecord.subtitle ?? '',
        logoUrl: resultRecord.logoUrl ?? '',
        backgroundImageUrl: resultRecord.backgroundImageUrl ?? '',
        backgroundColor: resultRecord.backgroundColor ?? '',
        textColor: resultRecord.textColor ?? '',
        theme: resultRecord.theme ?? '',
        disclaimer: resultRecord.disclaimer ?? '',
        customCss: resultRecord.customCss ?? '',
        createdAt: typeof resultRecord.createdAt === 'string' ? resultRecord.createdAt : undefined,
        updatedAt: typeof resultRecord.updatedAt === 'string' ? resultRecord.updatedAt : undefined,
        metadata: {
          version: resultRecord.metadata?.version || '1.0',
          lastUpdated: typeof resultRecord.metadata?.lastUpdated === 'string' 
            ? resultRecord.metadata.lastUpdated 
            : new Date().toISOString(),
          lastModifiedBy: resultRecord.metadata?.lastModifiedBy || 'user'
        }
      };

      setFormData(formattedResponseData);
      setExistingScreen(formattedResponseData);

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