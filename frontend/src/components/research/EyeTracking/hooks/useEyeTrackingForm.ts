import { useState, useCallback, useEffect } from 'react';
import { EyeTrackingFormData, EyeTrackingConfig } from 'shared/interfaces/eye-tracking.interface';
import { useEyeTrackingData } from './useEyeTrackingData';
import { useEyeTrackingFileUpload } from './useEyeTrackingFileUpload';
import { useEyeTrackingAreas } from './useEyeTrackingAreas';
import { useErrorLog } from '@/components/utils/ErrorLogger';

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
  validateStimuliData: () => boolean;
}

export function useEyeTrackingForm({ 
  researchId, 
  onSave 
}: UseEyeTrackingFormProps): UseEyeTrackingFormReturn {
  // Sistema de logs
  const logger = useErrorLog();
  
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

  // Función para validar que todos los estímulos tienen correctamente los datos
  const validateStimuliData = useCallback(() => {
    logger.debug('useEyeTrackingForm.validateStimuliData - Validando estímulos...');
    
    if (!dataHook.formData.stimuli || !Array.isArray(dataHook.formData.stimuli.items)) {
      logger.error('useEyeTrackingForm.validateStimuliData - No hay estímulos para validar');
      return false;
    }
    
    const items = dataHook.formData.stimuli.items;
    logger.debug('useEyeTrackingForm.validateStimuliData - Número de estímulos:', items.length);
    
    if (items.length === 0) {
      // No hay estímulos, es válido pero advertimos
      logger.warn('useEyeTrackingForm.validateStimuliData - No hay estímulos');
      return true;
    }
    
    // Verificar cada estímulo
    let isValid = true;
    const invalidItems: Array<{id: string, reason: string}> = [];
    
    items.forEach((item, index) => {
      if (!item.id) {
        logger.error(`useEyeTrackingForm.validateStimuliData - Estímulo ${index} sin ID`);
        isValid = false;
        invalidItems.push({id: `unknown-${index}`, reason: 'Sin ID'});
      }
      
      if (!item.fileUrl) {
        logger.error(`useEyeTrackingForm.validateStimuliData - Estímulo ${index} (${item.id}) sin fileUrl`);
        isValid = false;
        invalidItems.push({id: item.id, reason: 'Sin URL'});
      }
      
      if (!item.s3Key) {
        logger.error(`useEyeTrackingForm.validateStimuliData - Estímulo ${index} (${item.id}) sin s3Key`);
        isValid = false;
        invalidItems.push({id: item.id, reason: 'Sin clave S3'});
      }
    });
    
    if (!isValid) {
      logger.error('useEyeTrackingForm.validateStimuliData - Estímulos inválidos:', invalidItems);
    } else {
      logger.debug('useEyeTrackingForm.validateStimuliData - Todos los estímulos son válidos');
    }
    
    return isValid;
  }, [dataHook.formData.stimuli, logger]);

  // Verificar la consistencia de los datos cuando cambia el estado
  useEffect(() => {
    if (dataHook.formData.stimuli && Array.isArray(dataHook.formData.stimuli.items) && 
        dataHook.formData.stimuli.items.length > 0) {
      logger.debug('useEyeTrackingForm - Estímulos actualizados:', {
        count: dataHook.formData.stimuli.items.length,
        items: dataHook.formData.stimuli.items.map(item => ({
          id: item.id,
          fileName: item.fileName,
          hasFileUrl: !!item.fileUrl,
          hasS3Key: !!item.s3Key
        }))
      });
      validateStimuliData();
    }
  }, [dataHook.formData.stimuli, validateStimuliData, logger]);

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
    removeAreaOfInterest: areasHook.removeAreaOfInterest,
    
    // Validador de datos
    validateStimuliData
  };
} 