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
  const [formData, setFormData] = useState<WelcomeScreenData>({ ...INITIAL_FORM_DATA, researchId });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingScreen, setExistingScreen] = useState<WelcomeScreenData | null>(null);
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await welcomeScreenService.getByResearchId(researchId);
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
  }, [researchId]);

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
      
      const updatedData = await welcomeScreenService.save({ ...dataToSave, researchId });
      
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
    closeModal
  };
};