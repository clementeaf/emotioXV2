import { useState, useEffect } from 'react';
import { toastHelpers } from '@/utils/toast';
import { apiClient } from '@/api/config/axios';

interface WelcomeScreenData {
  title: string;
  message: string;
  startButtonText: string;
  isEnabled: boolean;
}

interface ErrorModalData {
  type: 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

interface UseWelcomeScreenResult {
  formData: WelcomeScreenData;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  existingScreen: any | null;
  modalError: ErrorModalData | null;
  modalVisible: boolean;
  confirmModalVisible: boolean;
  handleChange: (field: keyof WelcomeScreenData, value: string | boolean) => void;
  handleSubmit: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handlePreview: () => void;
  closeModal: () => void;
  showConfirmModal: () => void;
  closeConfirmModal: () => void;
  confirmDelete: () => Promise<void>;
}

export const useWelcomeScreen = (researchId: string): UseWelcomeScreenResult => {
  const [formData, setFormData] = useState<WelcomeScreenData>({
    title: '',
    message: '',
    startButtonText: '',
    isEnabled: true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [existingScreen, setExistingScreen] = useState<any | null>(null);
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // Cargar datos existentes
  useEffect(() => {
    if (!researchId) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/research/${researchId}/welcome-screen`);
        const data = response.data;
        setFormData({
          title: data.title || '',
          message: data.message || '',
          startButtonText: data.startButtonText || '',
          isEnabled: data.isEnabled ?? true
        });
        setExistingScreen(data);
      } catch (error) {
        console.error('Error loading welcome screen:', error);
        // Si no existe, mantener valores por defecto
        setExistingScreen(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [researchId]);

  const handleChange = (field: keyof WelcomeScreenData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.message || !formData.startButtonText) {
      toastHelpers.error('Por favor completa todos los campos');
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.post(`/research/${researchId}/welcome-screen`, {
        researchId,
        questionKey: 'WELCOME_SCREEN',
        ...formData
      });
      
      const savedData = response.data;
      setFormData(prev => ({
        ...prev,
        ...savedData
      }));
      setExistingScreen(savedData);
      toastHelpers.saveSuccess('Pantalla de bienvenida');
    } catch (error) {
      console.error('Error saving welcome screen:', error);
      toastHelpers.error('Error al guardar la pantalla de bienvenida');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingScreen || !existingScreen.id) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/research/${researchId}/welcome-screen`);
      setFormData({
        title: '',
        message: '',
        startButtonText: '',
        isEnabled: true
      });
      setExistingScreen(null);
      toastHelpers.deleteSuccess('Pantalla de bienvenida');
    } catch (error) {
      console.error('Error deleting welcome screen:', error);
      setModalError({
        title: 'Error al eliminar',
        message: 'No se pudo eliminar la pantalla de bienvenida',
        type: 'error'
      });
      setModalVisible(true);
    } finally {
      setIsDeleting(false);
    }
  };

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

  const handlePreview = () => {
    if (!formData.title || !formData.message || !formData.startButtonText) {
      toastHelpers.error('Por favor completa todos los campos antes de previsualizar');
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
      toastHelpers.error('No se pudo abrir la ventana de vista previa');
    }
  };

  return {
    formData,
    isLoading,
    isSaving,
    isDeleting,
    existingScreen,
    modalError,
    modalVisible,
    confirmModalVisible,
    handleChange,
    handleSubmit,
    handleDelete,
    handlePreview,
    closeModal,
    showConfirmModal,
    closeConfirmModal,
    confirmDelete
  };
};
