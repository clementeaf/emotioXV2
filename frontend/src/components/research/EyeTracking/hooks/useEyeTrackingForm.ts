import { useState, useCallback, useRef } from 'react';
import { EyeTrackingFormData, EyeTrackingConfig, DEFAULT_EYE_TRACKING_CONFIG, EyeTrackingStimulus } from 'shared/interfaces/eye-tracking.interface';
import { eyeTrackingFixedAPI } from '@/lib/eye-tracking-api';
import { useFileUpload } from '@/hooks';
import { useErrorLog } from '@/components/utils/ErrorLogger';
import { toast } from 'react-hot-toast';

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
  handleSave: () => Promise<EyeTrackingFormData | null>;
  handleFileUploaderComplete: (fileData: { fileUrl: string; key: string }) => void;
  validateStimuliData: () => boolean;
}

export function useEyeTrackingForm({ 
  researchId, 
  onSave 
}: UseEyeTrackingFormProps): UseEyeTrackingFormReturn {
  // Sistema de logs
  const logger = useErrorLog();
  
  // Estados principales
  const [activeTab, setActiveTab] = useState('setup');
  const [formData, setFormData] = useState<EyeTrackingFormData>({
    ...DEFAULT_EYE_TRACKING_CONFIG,
    researchId
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [eyeTrackingId, setEyeTrackingId] = useState<string | null>(null);
  
  // Referencias para evitar bucles de actualización
  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  
  // Hook para subir archivos (solo el hook, no usamos el estado directamente)
  const { uploadFile } = useFileUpload();
  
  // Función para actualizar una propiedad anidada en formData
  const updateFormData = useCallback((path: string, value: any) => {
    setFormData(prevData => {
      const newData = { ...prevData };
      const pathArray = path.split('.');
      let current: any = newData;
      
      // Navegar a la propiedad anidada
      for (let i = 0; i < pathArray.length - 1; i++) {
        if (!current[pathArray[i]]) {
          current[pathArray[i]] = {};
        }
        current = current[pathArray[i]];
      }
      
      // Actualizar el valor
      current[pathArray[pathArray.length - 1]] = value;
      return newData;
    });
  }, []);
  
  // Función para actualizar configuraciones específicas
  const handleConfigChange = useCallback((key: keyof EyeTrackingConfig, value: boolean | number) => {
    updateFormData(`config.${key}`, value);
  }, [updateFormData]);
  
  // Función para manejar cargas de archivos
  const handleFileUpload = useCallback((files: FileList) => {
    if (!researchId) {
      toast.error('Se requiere ID de investigación para cargar archivos');
      return;
    }
    
    setIsUploading(true);
    
    // Convertir FileList a Array para procesamiento
    const fileArray = Array.from(files);
    const totalFiles = fileArray.length;
    let processedFiles = 0;
    let errorCount = 0;
    
    // Procesamiento temporal para mostrar vistas previas inmediatas
    const tempStimuli: EyeTrackingStimulus[] = fileArray.map((file, index) => ({
      id: generateId(),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileUrl: URL.createObjectURL(file), // URL temporal para vista previa
      order: formDataRef.current.stimuli.items.length + index + 1
    }));
    
    // Actualizar estado con URLs temporales para mostrar vista previa inmediata
    setFormData((prevData) => ({
      ...prevData,
      stimuli: {
        ...prevData.stimuli,
        items: [...prevData.stimuli.items, ...tempStimuli]
      }
    }));
    
    // Procesar carga real a S3 en segundo plano
    const uploadPromises = fileArray.map(async (file, index) => {
      const stimulus = tempStimuli[index];
      
      try {
        // Usar la función uploadFile del hook
        const result = await uploadFile(file, researchId, 'eye-tracking-stimuli');
        
        // Actualizar el estímulo con la URL real de S3
        setFormData((prevData) => {
          const updatedItems = [...prevData.stimuli.items];
          const itemIndex = updatedItems.findIndex(item => item.id === stimulus.id);
          
          if (itemIndex !== -1) {
            updatedItems[itemIndex] = {
              ...updatedItems[itemIndex],
              fileUrl: result.fileUrl,
              s3Key: result.key
            };
          }
          
          return {
            ...prevData,
            stimuli: {
              ...prevData.stimuli,
              items: updatedItems
            }
          };
        });
        
        processedFiles++;
        
        // Mostrar progreso de carga
        if (processedFiles + errorCount === totalFiles) {
          setIsUploading(false);
          if (errorCount === 0) {
            toast.success(`${totalFiles} estímulos cargados correctamente`);
          } else {
            toast.error(`${processedFiles} estímulos cargados con ${errorCount} errores`);
          }
        }
        
        return true;
      } catch (error) {
        logger.error('[EyeTrackingForm] Error al cargar archivo:', error);
        errorCount++;
        
        // Actualizar el estado para indicar error en este estímulo
        setFormData((prevData) => {
          const updatedItems = [...prevData.stimuli.items];
          const itemIndex = updatedItems.findIndex(item => item.id === stimulus.id);
          
          if (itemIndex !== -1) {
            updatedItems[itemIndex] = {
              ...updatedItems[itemIndex],
              error: true,
              errorMessage: error instanceof Error ? error.message : 'Error desconocido'
            };
          }
          
          return {
            ...prevData,
            stimuli: {
              ...prevData.stimuli,
              items: updatedItems
            }
          };
        });
        
        if (processedFiles + errorCount === totalFiles) {
          setIsUploading(false);
          toast.error(`Error al cargar algunos estímulos: ${errorCount} errores`);
        }
        
        return false;
      }
    });
    
    // En caso de error general con todas las cargas
    Promise.all(uploadPromises).catch(() => {
      setIsUploading(false);
      toast.error('Error al cargar los estímulos');
    });
  }, [researchId, uploadFile, logger]);
  
  // Manejador para el componente FileUploader
  const handleFileUploaderComplete = useCallback((fileData: { fileUrl: string; key: string }) => {
    logger.debug('handleFileUploaderComplete llamado con datos:', fileData);
    
    if (!fileData || !fileData.fileUrl || !fileData.key) {
      logger.error('Datos de archivo incompletos recibidos en handleFileUploaderComplete');
      return;
    }
    
    // Extraer información del nombre del archivo
    const fileName = fileData.key.split('/').pop() || 'archivo.jpg';
    const fileType = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Crear un nuevo estímulo
    const newStimulus: EyeTrackingStimulus = {
      id: generateId(),
      fileName: fileName,
      fileUrl: fileData.fileUrl,
      fileType: fileType,
      s3Key: fileData.key,
      fileSize: 0,
      order: formDataRef.current.stimuli.items.length + 1
    };
    
    // Actualizar el array de estímulos de forma segura
    setFormData(prevData => ({
      ...prevData,
      stimuli: {
        ...prevData.stimuli,
        items: [...prevData.stimuli.items, newStimulus]
      }
    }));
    
    return newStimulus;
  }, [logger]);
  
  // Eliminar un estímulo
  const removeStimulus = useCallback((id: string) => {
    setFormData(prevData => ({
      ...prevData,
      stimuli: {
        ...prevData.stimuli,
        items: prevData.stimuli.items.filter(item => item.id !== id)
      }
    }));
  }, []);
  
  // Añadir un área de interés
  const addAreaOfInterest = useCallback(() => {
    const newId = generateId();
    
    setFormData(prevData => {
      // Asegurarnos que areasOfInterest existe y tiene la estructura correcta
      const areasOfInterest = prevData.areasOfInterest || {
        enabled: true,
        areas: []
      };
      
      return {
        ...prevData,
        areasOfInterest: {
          ...areasOfInterest,
          areas: [
            ...areasOfInterest.areas,
            {
              id: newId,
              name: `Área ${areasOfInterest.areas.length + 1}`,
              stimulusId: '',
              region: { x: 0, y: 0, width: 100, height: 100 }
            }
          ]
        }
      };
    });
  }, []);
  
  // Eliminar un área de interés
  const removeAreaOfInterest = useCallback((id: string) => {
    setFormData(prevData => {
      // Asegurarnos que areasOfInterest existe y tiene la estructura correcta
      const areasOfInterest = prevData.areasOfInterest || {
        enabled: true,
        areas: []
      };
      
      return {
        ...prevData,
        areasOfInterest: {
          ...areasOfInterest,
          areas: areasOfInterest.areas.filter(area => area.id !== id)
        }
      };
    });
  }, []);
  
  // Función para validar que todos los estímulos tienen correctamente los datos
  const validateStimuliData = useCallback(() => {
    logger.debug('useEyeTrackingForm.validateStimuliData - Validando estímulos...');
    
    const currentFormData = formDataRef.current;
    
    if (!currentFormData.stimuli || !Array.isArray(currentFormData.stimuli.items)) {
      logger.error('useEyeTrackingForm.validateStimuliData - No hay estímulos para validar');
      return false;
    }
    
    const items = currentFormData.stimuli.items;
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
  }, [logger]);
  
  // Función para guardar los datos
  const handleSave = useCallback(async (): Promise<EyeTrackingFormData | null> => {
    if (!researchId) {
      logger.error('No hay ID de investigación disponible para guardar');
      toast.error('Error: No se puede guardar sin ID de investigación');
      return null;
    }
    
    setIsSaving(true);
    
    try {
      // Preparar datos para guardar
      const dataToSave = formDataRef.current;
      
      // Verificar si hay imágenes temporales
      const tempItems = dataToSave.stimuli?.items?.filter(
        s => (s.fileUrl && s.fileUrl.startsWith('blob:')) || (!s.s3Key && s.fileUrl)
      ) || [];
      
      if (tempItems.length > 0) {
        toast.error('Hay imágenes sin procesar. Por favor espere a que se completen las cargas.');
        setIsSaving(false);
        return null;
      }
      
      // Enviar solicitud al backend
      let response;
      const api = eyeTrackingFixedAPI;
      
      if (eyeTrackingId) {
        // Actualizar existente
        response = await api.update(eyeTrackingId, dataToSave).send();
      } else {
        // Crear nuevo
        response = await api.create(dataToSave).send();
        
        if (response && response.id) {
          setEyeTrackingId(response.id);
        }
      }
      
      toast.success('Configuración guardada con éxito');
      
      // Llamar al callback
      if (onSave) {
        onSave(dataToSave);
      }
      
      // Devolver los datos guardados
      return dataToSave;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('Error al guardar configuración:', error);
      toast.error(`Error al guardar: ${errorMessage}`);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [researchId, eyeTrackingId, onSave, logger]);
  
  return {
    // Estado general del formulario
    formData,
    activeTab,
    setActiveTab,
    isSaving,
    isUploading,
    eyeTrackingId,
    
    // Manejadores de formulario general
    updateFormData,
    handleConfigChange,
    handleSave,
    
    // Manejadores de archivos
    handleFileUpload,
    handleFileUploaderComplete,
    removeStimulus,
    
    // Manejadores de áreas de interés
    addAreaOfInterest,
    removeAreaOfInterest,
    
    // Validador de datos
    validateStimuliData
  };
} 