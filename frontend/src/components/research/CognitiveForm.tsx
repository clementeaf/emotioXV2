'use client';

/**
 * Archivo principal que exporta el componente CognitiveTaskForm
 * Este archivo se mantiene para compatibilidad pero usa la interfaz compartida
 */

import { CognitiveTaskFormData } from 'shared/interfaces/cognitive-task.interface';

import { CognitiveTaskForm as CognitiveTaskFormComponent } from './CognitiveTaskForm';

// Tipos para las props del componente
interface CognitiveTaskFormProps {
  className?: string;
  researchId?: string;
  onSave?: (data: CognitiveTaskFormData) => void;
}

// Re-exportar el componente con el mismo nombre para mantener compatibilidad
export const CognitiveTaskForm = CognitiveTaskFormComponent;

// También exportar como default para que sea compatible con ambos tipos de importación
export default CognitiveTaskForm; 