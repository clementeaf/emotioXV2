'use client';

import React from 'react';
import { UICognitiveTaskFormData } from './CognitiveTask/types'; // Usar tipo local

import { CognitiveTaskForm as ModularForm } from './CognitiveTask';

// Props para el componente principal
export interface CognitiveTaskFormProps {
  className?: string;
  researchId?: string;
  onSave?: (data: UICognitiveTaskFormData) => void;
}

// Componente que usa la implementación modular del formulario
export const CognitiveTaskForm: React.FC<CognitiveTaskFormProps> = (props) => {
  return <ModularForm {...props} />;
};
