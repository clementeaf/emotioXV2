import { useState, useCallback } from 'react';
import { EyeTrackingFormData, EyeTrackingConfig } from 'shared/interfaces/eye-tracking.interface';
import { useEyeTrackingData } from './useEyeTrackingData';
import { useEyeTrackingFileUpload } from './useEyeTrackingFileUpload';
import { useEyeTrackingAreas } from './useEyeTrackingAreas';

// Función para generar un ID único
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export interface UseEyeTrackingFormProps {
  researchId: string;
  onSave?: (data: EyeTrackingFormData) => void;
}

export interface UseEyeTrackingFormReturn {
  formData: EyeTrackingFormData;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSaving: boolean;
  isUploading: boolean;
  eyeTrackingId: string | null;
  updateFormData: (path: string, value: any) => void;
  handleConfigChange: (key: keyof EyeTrackingConfig, value: boolean | number) => void;
  handleFileUpload: (files: FileList) => void;
  addAreaOfInterest: () => void;
  removeStimulus: (id: string) => void;
  removeAreaOfInterest: (id: string) => void;
  handleSave: () => Promise<void>;
  handleFileUploaderComplete: (fileData: { fileUrl: string; key: string }) => void;
}

export function useEyeTrackingForm({ 
  researchId, 
  onSave 
}: UseEyeTrackingFormProps): UseEyeTrackingFormReturn {
  // Tab state
  const [activeTab, setActiveTab] = useState('setup');
  
  // Obtener manejadores de datos primero
  const dataHook = useEyeTrackingData({
    researchId,
    onSave,
    isUploading: false // Valor inicial, se usará el real después
  });
  
  // Obtener manejadores para archivos con los datos reales
  const fileUploadHook = useEyeTrackingFileUpload({
    researchId,
    formData: dataHook.formData,
    setFormData: dataHook.setFormData
  });
  
  // Actualizar el dataHook con el isUploading correcto
  const { handleSave } = useEyeTrackingData({
    researchId,
    onSave,
    isUploading: fileUploadHook.isUploading
  });
  
  // Obtener manejadores para áreas de interés
  const areasHook = useEyeTrackingAreas({
    formData: dataHook.formData,
    setFormData: dataHook.setFormData
  });
  
  // Función para actualizar configuraciones específicas
  const handleConfigChange = useCallback((key: keyof EyeTrackingConfig, value: boolean | number) => {
    dataHook.updateFormData(`config.${key}`, value);
  }, [dataHook]);

  return {
    // Estado general del formulario
    formData: dataHook.formData,
    activeTab,
    setActiveTab,
    isSaving: dataHook.isSaving,
    isUploading: fileUploadHook.isUploading,
    eyeTrackingId: dataHook.eyeTrackingId,
    
    // Manejadores de formulario general
    updateFormData: dataHook.updateFormData,
    handleConfigChange,
    handleSave,
    
    // Manejadores de archivos
    handleFileUpload: fileUploadHook.handleFileUpload,
    handleFileUploaderComplete: fileUploadHook.handleFileUploaderComplete,
    removeStimulus: fileUploadHook.removeStimulus,
    
    // Manejadores de áreas de interés
    addAreaOfInterest: areasHook.addAreaOfInterest,
    removeAreaOfInterest: areasHook.removeAreaOfInterest
  };
} 