import { useCallback } from 'react';
import { EyeTrackingFormData, EyeTrackingAreaOfInterest } from 'shared/interfaces/eye-tracking.interface';

// Función para generar un ID único
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Función para detectar si dos áreas se superponen
const areasOverlap = (area1: EyeTrackingAreaOfInterest, area2: EyeTrackingAreaOfInterest): boolean => {
  const rect1 = area1.region;
  const rect2 = area2.region;

  return !(
    rect1.x + rect1.width <= rect2.x ||  // rect1 está completamente a la izquierda de rect2
    rect2.x + rect2.width <= rect1.x ||  // rect2 está completamente a la izquierda de rect1
    rect1.y + rect1.height <= rect2.y || // rect1 está completamente arriba de rect2
    rect2.y + rect2.height <= rect1.y    // rect2 está completamente arriba de rect1
  );
};

// Función para obtener todas las superposiciones en un conjunto de áreas
const findOverlappingAreas = (areas: EyeTrackingAreaOfInterest[]): Array<{area1: EyeTrackingAreaOfInterest, area2: EyeTrackingAreaOfInterest}> => {
  const overlaps: Array<{area1: EyeTrackingAreaOfInterest, area2: EyeTrackingAreaOfInterest}> = [];

  for (let i = 0; i < areas.length; i++) {
    for (let j = i + 1; j < areas.length; j++) {
      if (areasOverlap(areas[i], areas[j])) {
        overlaps.push({ area1: areas[i], area2: areas[j] });
      }
    }
  }

  return overlaps;
};

interface UseEyeTrackingAreasProps {
  formData: EyeTrackingFormData;
  setFormData: React.Dispatch<React.SetStateAction<EyeTrackingFormData>>;
}

interface UseEyeTrackingAreasReturn {
  addAreaOfInterest: () => void;
  removeAreaOfInterest: (id: string) => void;
  updateAreaOfInterest: (id: string, fieldPath: string, value: string | number) => void;
  getOverlappingAreas: () => Array<{area1: EyeTrackingAreaOfInterest, area2: EyeTrackingAreaOfInterest}>;
  hasOverlaps: () => boolean;
  getAreaOverlaps: (areaId: string) => EyeTrackingAreaOfInterest[];
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
  const updateAreaOfInterest = useCallback((id: string, fieldPath: string, value: string | number) => {
    setFormData((prevData: EyeTrackingFormData) => {
      const newAreas = [...prevData.areasOfInterest.areas];
      const areaIndex = newAreas.findIndex(a => a.id === id);
      
      if (areaIndex === -1) {return prevData;}
      
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

  // Función para obtener todas las superposiciones actuales
  const getOverlappingAreas = useCallback(() => {
    return findOverlappingAreas(formData.areasOfInterest.areas);
  }, [formData.areasOfInterest.areas]);

  // Función para verificar si hay alguna superposición
  const hasOverlaps = useCallback(() => {
    return getOverlappingAreas().length > 0;
  }, [getOverlappingAreas]);

  // Función para obtener qué áreas se superponen con un área específica
  const getAreaOverlaps = useCallback((areaId: string) => {
    const targetArea = formData.areasOfInterest.areas.find(area => area.id === areaId);
    if (!targetArea) return [];

    const overlapping: EyeTrackingAreaOfInterest[] = [];
    formData.areasOfInterest.areas.forEach(area => {
      if (area.id !== areaId && areasOverlap(targetArea, area)) {
        overlapping.push(area);
      }
    });

    return overlapping;
  }, [formData.areasOfInterest.areas]);

  return {
    addAreaOfInterest,
    removeAreaOfInterest,
    updateAreaOfInterest,
    getOverlappingAreas,
    hasOverlaps,
    getAreaOverlaps
  };
} 