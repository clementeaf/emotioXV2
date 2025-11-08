import { useState, useEffect } from 'react';
import { toastHelpers } from '@/utils/toast';
import { useWelcomeScreenData } from '@/api/domains/welcome-screen';

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
  // Hook centralizado para obtener datos y operaciones CRUD
  const {
    data: existingScreen,
    isLoading,
    createWelcomeScreen,
    updateWelcomeScreen,
    deleteWelcomeScreen,
    isCreating,
    isUpdating,
    isDeleting
  } = useWelcomeScreenData(researchId);

  const [formData, setFormData] = useState<WelcomeScreenData>({
    title: '',
    message: '',
    startButtonText: '',
    isEnabled: true
  });
  
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // Cargar datos cuando cambie la respuesta del hook centralizado
  useEffect(() => {
    if (isLoading) return;

    if (!existingScreen) {
      // Si no existe, mantener valores por defecto
      setFormData({
        title: '',
        message: '',
        startButtonText: '',
        isEnabled: true
      });
      return;
    }

    // Actualizar formData con los datos existentes
    setFormData({
      title: existingScreen.title || '',
      message: existingScreen.message || '',
      startButtonText: existingScreen.startButtonText || '',
      isEnabled: existingScreen.isEnabled ?? true
    });
  }, [existingScreen, isLoading]);

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

    try {
      let savedData;
      if (existingScreen?.id) {
        // Actualizar existente usando hook centralizado
        savedData = await updateWelcomeScreen(researchId, formData);
      } else {
        // Crear nuevo usando hook centralizado
        savedData = await createWelcomeScreen(formData);
      }
      
      // Actualizar formData con los datos guardados
      setFormData({
        title: savedData.title || '',
        message: savedData.message || '',
        startButtonText: savedData.startButtonText || '',
        isEnabled: savedData.isEnabled ?? true
      });
      
      toastHelpers.saveSuccess('Pantalla de bienvenida');
    } catch (error) {
      console.error('Error saving welcome screen:', error);
      setModalError({
        title: 'Error al guardar',
        message: 'No se pudo guardar la pantalla de bienvenida',
        type: 'error'
      });
      setModalVisible(true);
    }
  };

  const handleDelete = async () => {
    if (!existingScreen || !existingScreen.id) return;

    try {
      await deleteWelcomeScreen();
      setFormData({
        title: '',
        message: '',
        startButtonText: '',
        isEnabled: true
      });
      toastHelpers.deleteSuccess('Pantalla de bienvenida');
    } catch (error) {
      console.error('Error deleting welcome screen:', error);
      setModalError({
        title: 'Error al eliminar',
        message: 'No se pudo eliminar la pantalla de bienvenida',
        type: 'error'
      });
      setModalVisible(true);
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

  // Usar estados del hook centralizado para isSaving e isDeleting
  const isSaving = isCreating || isUpdating;

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
