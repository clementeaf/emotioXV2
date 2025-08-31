import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  DEFAULT_EYE_TRACKING_CONFIG,
  EyeTrackingConfig,
  EyeTrackingFormData,
  EyeTrackingStimuliConfig,
  EyeTrackingStimulus
} from 'shared/interfaces/eye-tracking.interface';

import { useErrorLog } from '@/components/utils/ErrorLogger';
import { useEyeTrackingData } from '@/hooks/useEyeTrackingData';
import { eyeTrackingFixedAPI } from '@/lib/eye-tracking-api';

// Interfaz para los datos de la API
interface ApiResponse {
  data?: any;
  status?: number;
  id?: string;
  uploadUrl?: string;
  fileUrl?: string;
  key?: string;
}

// Interfaz para representar un API simple
const api = {
  get: async (url: string): Promise<ApiResponse> => {
    try {
      return await eyeTrackingFixedAPI.getByResearchId(url.split('/').pop() || '').send();
    } catch (error) {
      throw error;
    }
  },
  post: async (url: string, data: any): Promise<ApiResponse> => {
    try {
      return await eyeTrackingFixedAPI.create(data).send();
    } catch (error) {
      throw error;
    }
  },
  put: async (url: string, data: any): Promise<ApiResponse> => {
    try {
      const id = url.split('/').pop() || '';
      return await eyeTrackingFixedAPI.update(id, data).send();
    } catch (error) {
      throw error;
    }
  }
};

interface UseEyeTrackingFormDataProps {
  researchId: string;
  onSave?: (data: EyeTrackingFormData) => void;
  isUploading: boolean;
}

interface UseEyeTrackingFormDataReturn {
  formData: EyeTrackingFormData;
  setFormData: React.Dispatch<React.SetStateAction<EyeTrackingFormData>>;
  eyeTrackingId: string | null;
  isSaving: boolean;
  updateFormData: (path: string, value: any) => void;
  handleSave: () => Promise<void>;
}

// Extendemos la interfaz para manejar los campos adicionales que necesitamos
interface ExtendedEyeTrackingStimulus extends EyeTrackingStimulus {
  processingFailed?: boolean;
  error?: boolean;
  errorMessage?: string;
}

// Tipo de resultado de la carga de archivos
interface UploadResult {
  fileUrl: string;
  key: string;
}

export function useEyeTrackingFormData({
  researchId,
  onSave,
  isUploading
}: UseEyeTrackingFormDataProps): UseEyeTrackingFormDataReturn {
  const [formData, setFormData] = useState<EyeTrackingFormData>({
    ...DEFAULT_EYE_TRACKING_CONFIG,
    researchId
  });
  const [isSaving, setIsSaving] = useState(false);
  const [eyeTrackingId, setEyeTrackingId] = useState<string | null>(null);
  const logger = useErrorLog();

  // Usar el hook centralizado para obtener datos de eye-tracking
  const { data: eyeTrackingData, isLoading: isLoadingEyeTracking } = useEyeTrackingData(researchId, {
    type: 'build'
  });

  // Cargar datos cuando cambie la respuesta del hook centralizado
  useEffect(() => {
    if (isLoadingEyeTracking) return;

    if (!eyeTrackingData) {
      logger.warn('No se encontró configuración existente - esto es normal para una nueva investigación');
      return;
    }

    if (eyeTrackingData.build || eyeTrackingData.recruit) {
      logger.info('Datos completos recibidos:', eyeTrackingData);

      // Priorizar datos build si existen, sino usar recruit
      const buildData = eyeTrackingData.build;
      const recruitData = eyeTrackingData.recruit;

      // Almacenar el ID para actualizaciones (priorizar build)
      const id = buildData?.id || recruitData?.id;
      if (id) {
        logger.debug('ID de Eye Tracking encontrado:', id);
        setEyeTrackingId(id);
      }

      // Mapear datos build a EyeTrackingFormData si existen
      if (buildData) {
        // Crear configuración a partir de los datos build
        const config: EyeTrackingConfig = {
          enabled: true,
          trackingDevice: 'webcam',
          calibration: buildData.calibration?.validationEnabled || true,
          validation: buildData.calibration?.validationEnabled || true,
          recording: {
            audio: false,
            video: true
          },
          visualization: {
            showGaze: true,
            showFixations: true,
            showSaccades: true,
            showHeatmap: true
          },
          parameters: {
            samplingRate: buildData.settings.sampleRate || 60,
            fixationThreshold: 100,
            saccadeVelocityThreshold: 30
          }
        };

        // Mapear stimuli de build a EyeTrackingStimuliConfig
        const mappedStimuli = buildData.stimuli.map((stimulus: any) => ({
          id: stimulus.id,
          fileName: `stimulus_${stimulus.order}`,
          fileType: stimulus.type,
          fileSize: 0,
          fileUrl: stimulus.url,
          order: stimulus.order,
          s3Key: undefined
        }));

        const stimuli: EyeTrackingStimuliConfig = {
          items: mappedStimuli,
          presentationSequence: 'sequential',
          durationPerStimulus: buildData.settings.duration || 5
        };

        // Actualizar el estado del formulario con los datos build mapeados
        setFormData(prevFormData => ({
          ...prevFormData,
          config,
          stimuli
        }));

        logger.info('Estado del formulario actualizado con datos build existentes');
      } else {
        // Solo tenemos datos recruit, usar valores por defecto
        logger.info('Solo datos recruit disponibles, usando configuración por defecto');
      }
    }
  }, [eyeTrackingData, isLoadingEyeTracking, logger]);

  // Helper function to update nested properties in formData
  const updateFormData = useCallback((path: string, value: any) => {
    setFormData((prevData: EyeTrackingFormData) => {
      const newData = { ...prevData };
      const pathArray = path.split('.');
      let current: any = newData;

      // Navigate to the nested property
      for (let i = 0; i < pathArray.length - 1; i++) {
        if (!current[pathArray[i]]) {
          current[pathArray[i]] = {};
        }
        current = current[pathArray[i]];
      }

      // Update the value
      current[pathArray[pathArray.length - 1]] = value;
      return newData;
    });
  }, []);

  // Handle save function
  const handleSave = useCallback(async () => {
    if (!researchId) {
      toast.error('Se requiere un ID de investigación para guardar');
      return;
    }

    if (isUploading) {
      toast.error('Espera a que termine la carga de archivos antes de guardar');
      return;
    }

    setIsSaving(true);
    try {
      logger.info('Guardando configuración de EyeTracking...');

      let response;
      if (eyeTrackingId) {
        // Update existing configuration
        response = await api.put(`/research/${researchId}/eye-tracking`, {
          id: eyeTrackingId,
          ...formData
        });
      } else {
        // Create new configuration
        response = await api.post(`/research/${researchId}/eye-tracking`, {
          ...formData
        });
      }

      if (response && response.id) {
        setEyeTrackingId(response.id);
        toast.success('Configuración guardada correctamente');

        if (onSave) {
          onSave(formData);
        }
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error: any) {
      logger.error('Error al guardar:', error);
      toast.error(`Error al guardar: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsSaving(false);
    }
  }, [researchId, formData, eyeTrackingId, isUploading, onSave, logger]);

  return {
    formData,
    setFormData,
    eyeTrackingId,
    isSaving,
    updateFormData,
    handleSave
  };
}
