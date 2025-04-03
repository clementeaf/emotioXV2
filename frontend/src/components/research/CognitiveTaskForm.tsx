'use client';

import React from 'react';
import { CognitiveTaskForm as OriginalForm } from './CognitiveTaskFormOriginal';
import { CognitiveTaskForm as ModularForm } from './CognitiveTask';
import { CognitiveTaskFormData } from 'shared/interfaces/cognitive-task.interface';

// Props para el componente principal
export interface CognitiveTaskFormProps {
  className?: string;
  researchId?: string;
  onSave?: (data: CognitiveTaskFormData) => void;
}

// Configuración para usar la versión original o la versión modular del formulario
// Establece esto como true para usar la versión original con todos los tipos de preguntas predefinidos
// o como false para usar la versión refactorizada modular
const useOriginalForm = true;

// Componente selector que decide qué implementación usar
export const CognitiveTaskForm: React.FC<CognitiveTaskFormProps> = (props) => {
  // Si useOriginalForm es true, usa la versión original, de lo contrario la versión modular
  if (useOriginalForm) {
    return <OriginalForm {...props} />;
  } else {
    return <ModularForm {...props} />;
  }
}; 