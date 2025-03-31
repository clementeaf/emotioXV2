import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { eyeTrackingFixedAPI } from '@/lib/eye-tracking-api';
import s3Service from '@/services/s3Service';
import {
  EyeTrackingFormData,
  DEFAULT_EYE_TRACKING_CONFIG,
  EyeTrackingStimulus
} from 'shared/interfaces/eye-tracking.interface';

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

  // Cargar datos existentes al montar el componente
  useEffect(() => {
    const fetchExistingData = async () => {
      if (!researchId) {
        console.error('[EyeTrackingForm] Error: ID de investigación no proporcionado');
        return;
      }
      
      console.log(`[EyeTrackingForm] Buscando configuración existente para investigación: ${researchId}`);
      
      try {
        console.log('[EyeTrackingForm] Usando la API de EyeTracking mejorada');
        const response = await eyeTrackingFixedAPI.getByResearchId(researchId).send();
        
        console.log('[EyeTrackingForm] Respuesta de API:', response);
        
        if (!response || !response.data) {
          console.log('[EyeTrackingForm] No se encontró configuración existente - esto es normal para una nueva investigación');
          return;
        }
        
        // Mostrar toda la respuesta en el log para depuración
        console.log('[EyeTrackingForm] Datos completos recibidos:', JSON.stringify(response.data, null, 2));
        
        // Extraer datos de la respuesta
        const existingData = response.data;
        
        if (existingData.id) {
          setEyeTrackingId(existingData.id);
          console.log('[EyeTrackingForm] ID de Eye Tracking encontrado:', existingData.id);
        }
        
        // Asegurarse de que ningún campo necesario sea undefined
        const safeData = {
          ...DEFAULT_EYE_TRACKING_CONFIG,  // Base de valores por defecto
          ...existingData,                 // Datos recibidos
          researchId: researchId           // Garantizar que researchId siempre está presente
        };
        
        // Asegurar que las estructuras anidadas estén completas
        if (!safeData.stimuli) safeData.stimuli = DEFAULT_EYE_TRACKING_CONFIG.stimuli;
        if (!safeData.stimuli.items) safeData.stimuli.items = [];
        if (!safeData.areasOfInterest) safeData.areasOfInterest = DEFAULT_EYE_TRACKING_CONFIG.areasOfInterest;
        if (!safeData.areasOfInterest.areas) safeData.areasOfInterest.areas = [];
        if (!safeData.config) safeData.config = DEFAULT_EYE_TRACKING_CONFIG.config;
        
        // Actualizar estado con datos seguros
        setFormData(safeData);
        
        toast.success('Configuración de Eye Tracking cargada correctamente');
      } catch (error) {
        console.log('[EyeTrackingForm] Error al cargar datos:', error);
        
        // Detectar si es un error 401 (autenticación)
        if (error instanceof Error && error.message.includes('401')) {
          console.error('[EyeTrackingForm] Error de autenticación:', error);
          toast.error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
          return;
        }
        
        // Para errores 404, los tratamos como normales (simplemente no hay datos aún)
        if (error instanceof Error && error.message.includes('404')) {
          console.log('[EyeTrackingForm] No se encontró configuración - esto es normal para una nueva investigación');
          // No mostrar error al usuario, esto es normal en el flujo
        } else {
          // Otros errores
          toast.error(`Error al cargar la configuración: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }
    };

    fetchExistingData();
  }, [researchId]);

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
    // Verificar si hay cargas pendientes
    if (isUploading) {
      toast.error('Hay cargas pendientes. Por favor, espere a que se completen.');
      return;
    }
    
    setIsSaving(true);
    try {
      // Verificar si hay imágenes temporales (File o Blob) que necesiten ser subidas a S3
      let hasTemporaryImages = false;
      let updatedFormData = { ...formData };
      
      // Verificar si hay estímulos que necesitan ser procesados
      if (formData.stimuli && formData.stimuli.items.length > 0) {
        console.log('[EyeTrackingForm] Verificando si hay imágenes temporales para procesar');
        
        // Verificar si algún estímulo tiene una URL temporal (blob:) o no tiene s3Key
        const temporaryStimuli = formData.stimuli.items.filter(
          stimulus => 
            (stimulus.fileUrl && stimulus.fileUrl.startsWith('blob:')) || 
            (!stimulus.s3Key && stimulus.fileUrl)
        );
        
        if (temporaryStimuli.length > 0) {
          hasTemporaryImages = true;
          console.log(`[EyeTrackingForm] Se encontraron ${temporaryStimuli.length} imágenes temporales para procesar`);
          
          // Convertir las URLs temporales a archivos y subirlos a S3
          const updatedItems: EyeTrackingStimulus[] = [];
          
          // Procesamos cada estímulo uno por uno
          for (const stimulus of formData.stimuli.items) {
            // Si es una URL temporal, necesitamos procesarla
            if ((stimulus.fileUrl && stimulus.fileUrl.startsWith('blob:')) || 
                (!stimulus.s3Key && stimulus.fileUrl)) {
              try {
                // Obtener el blob desde la URL temporal
                const response = await fetch(stimulus.fileUrl);
                const blob = await response.blob();
                
                // Crear un archivo desde el blob
                const file = new File([blob], stimulus.fileName || 'imagen.jpg', { 
                  type: stimulus.fileType || 'image/jpeg' 
                });
                
                console.log(`[EyeTrackingForm] Subiendo imagen temporal: ${stimulus.fileName}`);
                
                // Subir a S3 y obtener la URL permanente
                const uploadResult = await s3Service.uploadFile({
                  file,
                  researchId,
                  folder: 'eye-tracking-stimuli',
                  progressCallback: (progress) => {
                    console.log(`[EyeTrackingForm] Progreso de subida ${stimulus.fileName}: ${progress}%`);
                  }
                });
                
                // Añadir el estímulo con la URL y clave de S3
                updatedItems.push({
                  ...stimulus,
                  fileUrl: uploadResult.fileUrl,
                  s3Key: uploadResult.key
                });
                
                console.log(`[EyeTrackingForm] Imagen subida con éxito: ${uploadResult.fileUrl}`);
              } catch (error) {
                console.error(`[EyeTrackingForm] Error al subir imagen: ${stimulus.fileName}`, error);
                toast.error(`Error al subir imagen: ${stimulus.fileName}`);
                
                // Añadir el estímulo con información de error
                updatedItems.push({
                  ...stimulus,
                  error: true,
                  errorMessage: error instanceof Error ? error.message : 'Error al subir imagen'
                });
              }
            } else {
              // Si no es una URL temporal, mantener el estímulo sin cambios
              updatedItems.push(stimulus);
            }
          }
          
          // Actualizar el formData con los estímulos procesados
          updatedFormData = {
            ...updatedFormData,
            stimuli: {
              ...updatedFormData.stimuli,
              items: updatedItems
            }
          };
          
          console.log('[EyeTrackingForm] Procesamiento de imágenes temporales completado');
        }
      }
      
      // Si hubo cambios en las imágenes, actualizar el estado local
      if (hasTemporaryImages) {
        setFormData(updatedFormData);
      }
      
      // Asegurar que researchId esté presente en los datos
      const dataToSave = {
        ...updatedFormData,
        researchId: researchId.trim()
      };
      
      console.log('[EyeTrackingForm] Datos a guardar:', JSON.stringify(dataToSave, null, 2));
      
      let response;
      
      // Si ya existe un ID, actualizar
      if (eyeTrackingId) {
        console.log(`[EyeTrackingForm] Actualizando Eye Tracking existente con ID: ${eyeTrackingId}`);
        try {
          response = await eyeTrackingFixedAPI.update(eyeTrackingId, dataToSave).send();
          console.log('[EyeTrackingForm] Respuesta de actualización:', JSON.stringify(response, null, 2));
        } catch (updateError) {
          console.error('[EyeTrackingForm] Error al actualizar:', updateError);
          throw updateError;
        }
      } else {
        // Si no, crear nuevo
        console.log('[EyeTrackingForm] Creando nuevo Eye Tracking');
        try {
          response = await eyeTrackingFixedAPI.create(dataToSave).send();
          console.log('[EyeTrackingForm] Respuesta de creación:', JSON.stringify(response, null, 2));
          
          // Actualizar el ID si es nuevo
          if (response && response.id) {
            setEyeTrackingId(response.id);
            console.log(`[EyeTrackingForm] Nuevo Eye Tracking creado con ID: ${response.id}`);
          } else {
            console.warn('[EyeTrackingForm] Se creó el Eye Tracking pero no se recibió un ID en la respuesta');
          }
        } catch (createError) {
          console.error('[EyeTrackingForm] Error al crear:', createError);
          throw createError;
        }
      }
      
      console.log('[EyeTrackingForm] Operación completada con éxito');
      toast.success('Configuración de seguimiento ocular guardada correctamente');
      
      // Llamar al callback si existe
      if (onSave) {
        onSave(updatedFormData);
      }
    } catch (error) {
      console.error('[EyeTrackingForm] Error al guardar:', error);
      
      // Manejar error de autenticación
      if (error instanceof Error && error.message.includes('401')) {
        toast.error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
        return;
      }
      
      // Manejar otros errores
      toast.error(`Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSaving(false);
    }
  }, [eyeTrackingId, formData, isUploading, onSave, researchId]);

  return {
    formData,
    setFormData,
    eyeTrackingId,
    isSaving,
    updateFormData,
    handleSave
  };
} 