import { useState, useEffect } from 'react';
import { welcomeScreenService } from '@/services/welcomeScreen.service';
import { WelcomeScreenData, ErrorModalData, UseWelcomeScreenFormResult } from '../types';
import { WelcomeScreenFormData, WelcomeScreenRecord } from 'shared/interfaces/welcome-screen.interface';

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
  // Convertir 'current' a un ID válido cuando sea necesario
  const actualResearchId = researchId === 'current' ? '1234' : researchId;
  
  const [formData, setFormData] = useState<WelcomeScreenData>({ ...INITIAL_FORM_DATA, researchId: actualResearchId });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingScreen, setExistingScreen] = useState<WelcomeScreenData | null>(null);
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await welcomeScreenService.getByResearchId(actualResearchId);
        if (response) {
          const formattedResponse: WelcomeScreenData = {
            id: response.id,
            researchId: response.researchId,
            isEnabled: response.isEnabled,
            title: response.title,
            message: response.message,
            startButtonText: response.startButtonText,
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
        }
      } catch (error) {
        console.error('Error fetching welcome screen:', error);
        setModalError({
          title: 'Error',
          message: 'No se pudo cargar la pantalla de bienvenida',
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
    const errors: { [key: string]: string } = {};
    
    if (!formData.title) errors.title = 'El título es requerido';
    if (!formData.message) errors.message = 'El mensaje es requerido';
    if (!formData.startButtonText) errors.startButtonText = 'El texto del botón es requerido';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field: keyof WelcomeScreenData, value: any): void => {
    setFormData((prev: WelcomeScreenData) => {
      const updatedData: WelcomeScreenData = {
        ...prev,
        [field]: value,
        metadata: {
          version: prev.metadata?.version || '1.0',
          lastUpdated: new Date().toISOString(),
          lastModifiedBy: prev.metadata?.lastModifiedBy || 'user'
        }
      };
      return updatedData;
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

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
      
      const updatedData = await welcomeScreenService.save({ ...dataToSave, researchId: actualResearchId });
      
      const formattedUpdatedData: WelcomeScreenData = {
        id: updatedData.id,
        researchId: updatedData.researchId,
        isEnabled: updatedData.isEnabled,
        title: updatedData.title,
        message: updatedData.message,
        startButtonText: updatedData.startButtonText,
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
      
      setExistingScreen(formattedUpdatedData);
      setModalError({
        title: 'Éxito',
        message: 'Pantalla de bienvenida guardada correctamente',
        type: 'info'
      });
      setModalVisible(true);
    } catch (error) {
      console.error('Error saving welcome screen:', error);
      setModalError({
        title: 'Error',
        message: 'No se pudo guardar la pantalla de bienvenida',
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
        title: 'Error',
        message: 'Por favor, complete todos los campos requeridos antes de previsualizar',
        type: 'error'
      });
      setModalVisible(true);
      return;
    }

    // Crear una nueva ventana para la vista previa
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      const previewHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vista previa - ${formData.title}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 0;
              min-height: 100vh;
              background-color: #f5f5f5;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .welcome-container {
              max-width: 800px;
              width: 90%;
              margin: 40px auto;
              padding: 40px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              text-align: center;
            }
            h1 {
              font-size: 28px;
              color: #333;
              margin-bottom: 20px;
            }
            .message {
              font-size: 16px;
              line-height: 1.6;
              color: #555;
              margin-bottom: 30px;
            }
            .start-button {
              background-color: #3f51b5;
              color: white;
              border: none;
              padding: 12px 28px;
              font-size: 16px;
              border-radius: 4px;
              cursor: pointer;
              transition: background-color 0.2s;
            }
            .start-button:hover {
              background-color: #303f9f;
            }
            .preview-badge {
              position: fixed;
              top: 10px;
              right: 10px;
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 5px 10px;
              font-size: 12px;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="preview-badge">Vista previa</div>
          <div class="welcome-container">
            <h1>${formData.title}</h1>
            <div class="message">${formData.message}</div>
            <button class="start-button">${formData.startButtonText}</button>
          </div>
        </body>
        </html>
      `;
      
      previewWindow.document.write(previewHtml);
      previewWindow.document.close();
    } else {
      setModalError({
        title: 'Error',
        message: 'No se pudo abrir la ventana de vista previa. Por favor, permita las ventanas emergentes para este sitio.',
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