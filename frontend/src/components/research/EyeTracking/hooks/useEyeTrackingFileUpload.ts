import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useFileUpload } from '@/hooks';
import { EyeTrackingFormData, EyeTrackingStimulus } from 'shared/interfaces/eye-tracking.interface';

// Función para generar un ID único
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

interface UseEyeTrackingFileUploadProps {
  researchId: string;
  formData: EyeTrackingFormData;
  setFormData: React.Dispatch<React.SetStateAction<EyeTrackingFormData>>;
}

interface UseEyeTrackingFileUploadReturn {
  isUploading: boolean;
  handleFileUpload: (files: FileList) => void;
  handleFileUploaderComplete: (fileData: { fileUrl: string; key: string }) => void;
  removeStimulus: (id: string) => void;
}

export function useEyeTrackingFileUpload({
  researchId,
  formData,
  setFormData
}: UseEyeTrackingFileUploadProps): UseEyeTrackingFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  
  // Inicializar el hook de carga de archivos al nivel superior (correcto)
  const { uploadFile } = useFileUpload();

  // Función para manejar la carga de archivos
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
      order: formData.stimuli.items.length + index + 1
    }));
    
    // Actualizar estado con URLs temporales para mostrar vista previa inmediata
    setFormData((prevData: EyeTrackingFormData) => ({
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
        // Usar la función uploadFile del hook inicializado arriba
        const result = await uploadFile(file, researchId, 'eye-tracking-stimuli');
        
        // Actualizar el estímulo con la URL real de S3
        setFormData((prevData: EyeTrackingFormData) => {
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
        console.error('[EyeTrackingForm] Error al cargar archivo:', error);
        errorCount++;
        
        // Actualizar el estado para indicar error en este estímulo
        setFormData((prevData: EyeTrackingFormData) => {
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
  }, [formData.stimuli.items.length, researchId, setFormData, uploadFile]);
  
  // Función para manejar la carga completada desde el componente FileUploader
  const handleFileUploaderComplete = useCallback((fileData: { fileUrl: string; key: string }) => {
    // Añadir el archivo subido a los estímulos
    setFormData((prevData: EyeTrackingFormData) => {
      const newStimulus: EyeTrackingStimulus = {
        id: generateId(),
        fileName: fileData.key.split('/').pop() || 'archivo',
        fileType: fileData.key.split('.').pop() || 'image',
        fileSize: 0, // No tenemos este dato después de la subida
        fileUrl: fileData.fileUrl,
        s3Key: fileData.key,
        order: prevData.stimuli.items.length + 1
      };
      
      return {
        ...prevData,
        stimuli: {
          ...prevData.stimuli,
          items: [...prevData.stimuli.items, newStimulus]
        }
      };
    });
    
    toast.success('Estímulo cargado correctamente');
  }, [setFormData]);
  
  // Remove a stimulus
  const removeStimulus = useCallback((id: string) => {
    setFormData((prevData: EyeTrackingFormData) => ({
      ...prevData,
      stimuli: {
        ...prevData.stimuli,
        items: prevData.stimuli.items.filter((item: EyeTrackingStimulus) => item.id !== id)
      }
    }));
  }, [setFormData]);

  return {
    isUploading,
    handleFileUpload,
    handleFileUploaderComplete,
    removeStimulus
  };
} 