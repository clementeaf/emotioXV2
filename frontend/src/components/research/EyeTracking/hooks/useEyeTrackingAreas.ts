import { useCallback } from 'react';
import { EyeTrackingFormData, EyeTrackingAreaOfInterest } from 'shared/interfaces/eye-tracking.interface';

// Función para generar un ID único
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

interface UseEyeTrackingAreasProps {
  formData: EyeTrackingFormData;
  setFormData: React.Dispatch<React.SetStateAction<EyeTrackingFormData>>;
}

interface UseEyeTrackingAreasReturn {
  addAreaOfInterest: () => void;
  removeAreaOfInterest: (id: string) => void;
  updateAreaOfInterest: (id: string, fieldPath: string, value: any) => void;
}

export function useEyeTrackingAreas({
  formData,
  setFormData
}: UseEyeTrackingAreasProps): UseEyeTrackingAreasReturn {
  
  // Añadir una nueva área de interés
  const addAreaOfInterest = useCallback(() => {
    const newArea: EyeTrackingAreaOfInterest = {
      id: generateId(),
      name: `Area ${formData.areasOfInterest.areas.length + 1}`,
      region: { x: 100, y: 100, width: 200, height: 150 },
      stimulusId: formData.stimuli.items.length > 0 ? formData.stimuli.items[0].id : ''
    };
    
    setFormData((prevData: EyeTrackingFormData) => ({
      ...prevData,
      areasOfInterest: {
        ...prevData.areasOfInterest,
        areas: [...prevData.areasOfInterest.areas, newArea]
      }
    }));
  }, [formData.areasOfInterest.areas.length, formData.stimuli.items, setFormData]);
  
  // Eliminar un área de interés
  const removeAreaOfInterest = useCallback((id: string) => {
    setFormData((prevData: EyeTrackingFormData) => ({
      ...prevData,
      areasOfInterest: {
        ...prevData.areasOfInterest,
        areas: prevData.areasOfInterest.areas.filter((area: EyeTrackingAreaOfInterest) => area.id !== id)
      }
    }));
  }, [setFormData]);

  // Actualizar un campo específico de un área de interés
  const updateAreaOfInterest = useCallback((id: string, fieldPath: string, value: any) => {
    setFormData((prevData: EyeTrackingFormData) => {
      const newAreas = [...prevData.areasOfInterest.areas];
      const areaIndex = newAreas.findIndex(a => a.id === id);
      
      if (areaIndex === -1) return prevData;
      
      // Dividir la ruta del campo para navegación anidada
      const fieldParts = fieldPath.split('.');
      
      // Clonar el área para no mutar el estado directamente
      let updatedArea = { ...newAreas[areaIndex] };
      
      // Manejador para campos anidados (como 'region.x')
      if (fieldParts.length > 1 && fieldParts[0] === 'region') {
        const [parent, child] = fieldParts;
        updatedArea = {
          ...updatedArea,
          region: {
            ...updatedArea.region,
            [child]: value
          }
        };
      } else {
        // Campo simple como 'name'
        updatedArea = {
          ...updatedArea,
          [fieldPath]: value
        } as EyeTrackingAreaOfInterest;
      }
      
      // Actualizar el arreglo de áreas
      newAreas[areaIndex] = updatedArea;
      
      return {
        ...prevData,
        areasOfInterest: {
          ...prevData.areasOfInterest,
          areas: newAreas
        }
      };
    });
  }, [setFormData]);

  return {
    addAreaOfInterest,
    removeAreaOfInterest,
    updateAreaOfInterest
  };
} 