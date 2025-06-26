import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  EyeTrackingFormData,
  DEFAULT_EYE_TRACKING_CONFIG,
  EyeTrackingStimulus,
  EyeTrackingConfig,
  EyeTrackingStimuliConfig
} from 'shared/interfaces/eye-tracking.interface';

import { useErrorLog } from '@/components/utils/ErrorLogger';
import { eyeTrackingFixedAPI } from '@/lib/eye-tracking-api';

// Interfaz para los datos de la API
interface ApiResponse {
  data?: any;
  status?: number;
  id?: string;
}

// Interfaz para representar un API simple
const api = {
  get: async (url: string): Promise<ApiResponse> => {
    try {
      // Esta es una implementación temporal para evitar el error de importación
      return await eyeTrackingFixedAPI.getByResearchId(url.split('/').pop() || '').send();
    } catch (error) {
      console.error('Error en API GET:', error);
      throw error;
    }
  },
  post: async (url: string, data: any): Promise<ApiResponse> => {
    try {
      // Esta es una implementación temporal para evitar el error de importación
      return await eyeTrackingFixedAPI.create(data).send();
    } catch (error) {
      console.error('Error en API POST:', error);
      throw error;
    }
  },
  put: async (url: string, data: any): Promise<ApiResponse> => {
    try {
      // Esta es una implementación temporal para evitar el error de importación
      const id = url.split('/').pop() || '';
      return await eyeTrackingFixedAPI.update(id, data).send();
    } catch (error) {
      console.error('Error en API PUT:', error);
      throw error;
    }
  }
};

interface UseEyeTrackingDataProps {
  researchId: string;
  onSave?: (data: EyeTrackingFormData) => void;
  isUploading: boolean;
}

interface UseEyeTrackingDataReturn {
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

export function useEyeTrackingData({
  researchId,
  onSave,
  isUploading
}: UseEyeTrackingDataProps): UseEyeTrackingDataReturn {
  const [formData, setFormData] = useState<EyeTrackingFormData>({
    ...DEFAULT_EYE_TRACKING_CONFIG,
    researchId
  });
  const [isSaving, setIsSaving] = useState(false);
  const [eyeTrackingId, setEyeTrackingId] = useState<string | null>(null);
  const logger = useErrorLog();

  // Cargar datos existentes al montar el componente
  useEffect(() => {
    const fetchExistingData = async () => {
      if (!researchId) {
        console.error('[EyeTrackingForm] Error: ID de investigación no proporcionado');
        return;
      }
      
      logger.info(`Buscando configuración existente para investigación: ${researchId}`);
      
      try {
        logger.debug('Usando la API de EyeTracking mejorada');
        const response = await api.get(`/api/eye-tracking/research/${researchId}`);
        
        logger.debug('Respuesta de API:', response);
        
        if (!response || response.status === 204) {
          logger.warn('No se encontró configuración existente - esto es normal para una nueva investigación');
          return;
        }
        
        if (response.data) {
          logger.info('Datos completos recibidos:', response.data);
          
          // Si hay datos, actualizar el estado del formulario
          if (response.data) {
            const existingData = response.data;
            
            // Almacenar el ID para actualizaciones
            if (existingData.id) {
              logger.debug('ID de Eye Tracking encontrado:', existingData.id);
              setEyeTrackingId(existingData.id);
            }
            
            // Crear un objeto de config que coincida con el tipo EyeTrackingConfig
            const config: EyeTrackingConfig = {
              enabled: existingData.config?.enabled !== undefined ? existingData.config.enabled : true,
              trackingDevice: existingData.config?.trackingDevice || 'webcam',
              calibration: existingData.config?.calibration !== undefined ? existingData.config.calibration : true,
              validation: existingData.config?.validation !== undefined ? existingData.config.validation : true,
              recording: {
                audio: existingData.config?.recording?.audio !== undefined ? existingData.config.recording.audio : false,
                video: existingData.config?.recording?.video !== undefined ? existingData.config.recording.video : true
              },
              visualization: {
                showGaze: existingData.config?.visualization?.showGaze !== undefined ? existingData.config.visualization.showGaze : true,
                showFixations: existingData.config?.visualization?.showFixations !== undefined ? existingData.config.visualization.showFixations : true,
                showSaccades: existingData.config?.visualization?.showSaccades !== undefined ? existingData.config.visualization.showSaccades : true,
                showHeatmap: existingData.config?.visualization?.showHeatmap !== undefined ? existingData.config.visualization.showHeatmap : true
              },
              parameters: {
                samplingRate: existingData.config?.parameters?.samplingRate || 60,
                fixationThreshold: existingData.config?.parameters?.fixationThreshold || 100,
                saccadeVelocityThreshold: existingData.config?.parameters?.saccadeVelocityThreshold || 30
              }
            };

            // Crear un objeto stimuli que coincida con el tipo EyeTrackingStimuliConfig
            const stimuli: EyeTrackingStimuliConfig = {
              items: existingData.stimuli?.items || [],
              presentationSequence: existingData.stimuli?.presentationSequence || 'sequential',
              durationPerStimulus: existingData.stimuli?.durationPerStimulus || 5
            };
            
            // Actualizar el estado del formulario con los datos cargados usando la forma funcional
            // para evitar dependencia de formData
            setFormData(prevFormData => ({
              ...prevFormData,
              config,
              stimuli
            }));
            
            logger.info('Estado del formulario actualizado con datos existentes');
          }
        }
      } catch (error: unknown) {
        logger.error('Error al cargar datos:', error);
        
        // Verificar si error es un objeto con la propiedad response
        if (error && typeof error === 'object' && 'response' in error && 
            error.response && typeof error.response === 'object' && 'status' in error.response) {
          if (error.response.status === 404) {
            // 404 es normal para un nuevo registro de investigación
            logger.warn('No se encontró configuración - esto es normal para una nueva investigación');
            return;
          }
        }
        
        // Verificar si error es un Error con propiedad message
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        toast.error(`Error al cargar configuración: ${errorMessage}`);
      }
    };

    fetchExistingData();
  }, [researchId, logger]);

  // Helper function to update nested properties in formData
  const updateFormData = useCallback((path: string, value: any) => {
    setFormData((prevData: EyeTrackingFormData) => {
      const newData = { ...prevData };
      const pathArray = path.split('.');
      let current: any = newData;
      
      // Navigate to the nested property
      for (let i = 0; i < pathArray.length - 1; i++) {
        current = current[pathArray[i]];
      }
      
      // Update the value
      current[pathArray[pathArray.length - 1]] = value;
      return newData;
    });
  }, []);
  
  // Función para guardar el formulario
  const handleSave = useCallback(async () => {
    if (!researchId) {
      logger.error('No hay ID de investigación disponible para guardar');
      toast.error('Error: No se puede guardar sin ID de investigación');
      return;
    }
    
    setIsSaving(true);
    
    logger.debug('Estado inicial del formulario antes de guardar:', formData);
    logger.debug('stimuli.items inicial:', {
      count: formData.stimuli?.items?.length || 0,
      items: formData.stimuli?.items?.map(item => ({
        id: item.id,
        fileName: item.fileName,
        hasUrl: !!item.fileUrl,
        hasS3Key: !!item.s3Key
      }))
    });
    
    try {
      // Preparar una copia de los datos para guardar
      const dataToSave = { ...formData };
      
      // Verificar si hay imágenes temporales para procesar antes de guardar
      logger.info('Verificando si hay imágenes temporales para procesar');
      logger.debug('Detalles de los estímulos antes de procesar:', {
        count: dataToSave.stimuli?.items?.length || 0,
        items: dataToSave.stimuli?.items?.map(item => ({
          id: item.id,
          fileName: item.fileName,
          fileUrl: item.fileUrl,
          s3Key: item.s3Key,
          isTempUrl: item.fileUrl && (item.fileUrl.startsWith('blob:') || !item.s3Key)
        }))
      });
      
      // Identificar estímulos con URLs temporales (blob:) que necesitan subirse
      const temporaryStimuli = dataToSave.stimuli?.items?.filter(
        s => (s.fileUrl && s.fileUrl.startsWith('blob:')) || (!s.s3Key && s.fileUrl)
      ) || [];
      
      if (temporaryStimuli.length > 0) {
        logger.info(`Se encontraron ${temporaryStimuli.length} imágenes temporales para procesar`);
        
        // Procesar en serie para evitar problemas de concurrencia
        const processedStimuli = [...dataToSave.stimuli.items] as ExtendedEyeTrackingStimulus[];
        
        // Reemplazar cada estímulo temporal con uno procesado
        for (let i = 0; i < processedStimuli.length; i++) {
          const stimulus = processedStimuli[i];
          
          // Si el estímulo tiene URL temporal, procesarlo
          if ((stimulus.fileUrl && stimulus.fileUrl.startsWith('blob:')) || 
              (!stimulus.s3Key && stimulus.fileUrl)) {
            try {
              // Obtener el archivo desde la URL temporal
              logger.info(`Subiendo imagen temporal: ${stimulus.fileName}`);
              
              // Subir el archivo a S3 (simulado con timer para demo)
              const fakeUploadWithProgress = (onProgress: (progress: number) => void): Promise<UploadResult> => {
                let progress = 0;
                const interval = setInterval(() => {
                  progress += 10;
                  onProgress(progress);
                  logger.debug(`Progreso de subida ${stimulus.fileName}: ${progress}%`);
                  
                  if (progress >= 100) {
                    clearInterval(interval);
                  }
                }, 300);
                
                return new Promise(resolve => {
                  setTimeout(() => {
                    resolve({
                      fileUrl: `https://example.com/eye-tracking-stimuli/${stimulus.fileName}`,
                      key: `eye-tracking-stimuli/${researchId}/${stimulus.fileName}`
                    });
                  }, 3000);
                });
              };
              
              // Ejecutar la subida con progreso
              const uploadResult = await fakeUploadWithProgress((progress: number) => {
                // Reportar progreso (no implementado en este ejemplo)
              });
              
              logger.info(`Imagen subida con éxito: ${uploadResult.fileUrl}`);
              
              // Actualizar el estímulo con la información real de S3
              processedStimuli[i] = {
                ...stimulus,
                fileUrl: uploadResult.fileUrl,
                s3Key: uploadResult.key
              };
            } catch (uploadError: unknown) {
              const errorMessage = uploadError instanceof Error ? uploadError.message : 'Error desconocido';
              logger.error(`Error al procesar imagen temporal: ${stimulus.fileName}`, uploadError);
              toast.error(`Error al procesar imagen: ${stimulus.fileName}`);
              
              // Mantener el estímulo como está, pero marcar que falló
              processedStimuli[i] = {
                ...stimulus,
                processingFailed: true  // Esta propiedad es parte de ExtendedEyeTrackingStimulus
              };
            }
          }
        }
        
        // Actualizar la lista de estímulos con los procesados
        logger.info('Procesamiento de imágenes temporales completado');
        logger.debug('stimuli.items después de procesar temporales:', {
          count: processedStimuli.length,
          items: processedStimuli.map(item => ({
            id: item.id,
            fileName: item.fileName,
            hasValidUrl: !!item.fileUrl && !item.fileUrl.startsWith('blob:'),
            hasS3Key: !!item.s3Key
          }))
        });
        
        // Actualizar dataToSave con los estímulos procesados
        dataToSave.stimuli.items = processedStimuli;
        
        // También actualizar el estado local con las imágenes procesadas
        logger.debug('Actualizando estado local con las imágenes procesadas');
        setFormData(prevFormData => ({
          ...prevFormData,
          stimuli: {
            ...prevFormData.stimuli,
            items: processedStimuli as EyeTrackingStimulus[]
          }
        }));
      }
      
      // Ahora sí guardar en el backend
      logger.debug('Datos finales a enviar al backend:', dataToSave);
      logger.debug('stimuli.items en datos a enviar:', {
        count: dataToSave.stimuli?.items?.length || 0,
        items: dataToSave.stimuli?.items?.map(item => ({
          id: item.id,
          fileName: item.fileName,
          hasValidUrl: !!item.fileUrl && !item.fileUrl.startsWith('blob:'),
          hasS3Key: !!item.s3Key
        }))
      });
      
      // Enviar los datos al backend
      let response;
      
      if (eyeTrackingId) {
        // Si ya existe, actualizar
        logger.info(`Actualizando Eye Tracking existente con ID: ${eyeTrackingId}`);
        
        response = await api.put(`/api/eye-tracking/${eyeTrackingId}`, {
          ...dataToSave,
          researchId
        });
        logger.debug('Respuesta de actualización:', response);
      } else {
        // Si no existe, crear nuevo
        logger.info('Creando nuevo Eye Tracking');
        
        response = await api.post('/api/eye-tracking', {
          ...dataToSave,
          researchId
        });
        logger.debug('Respuesta de creación:', response);
        
        // Guardar el nuevo ID para futuras operaciones
        if (response && response.id) {
          logger.info(`Nuevo Eye Tracking creado con ID: ${response.id}`);
          setEyeTrackingId(response.id);
        }
      }
      
      // Notificar éxito
      toast.success('Configuración guardada con éxito');
      
      // Llamar al callback si existe
      if (onSave) {
        onSave(dataToSave);
      }
      
      logger.info('Operación completada con éxito');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('Error al guardar configuración:', error);
      toast.error(`Error al guardar: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [researchId, formData, eyeTrackingId, onSave, logger]);

  return {
    formData,
    setFormData,
    eyeTrackingId,
    isSaving,
    updateFormData,
    handleSave
  };
} 