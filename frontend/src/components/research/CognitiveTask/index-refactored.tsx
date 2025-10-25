import React from 'react';
import { DynamicForm } from '@/components/common/DynamicForm';
import { getCognitiveTaskSchema } from './schema';
import { FieldMapper } from './FieldMapper';

interface CognitiveTaskFormProps {
  className?: string;
  researchId: string;
  onSave?: (data: any) => void;
}

/**
 * Componente principal del formulario Cognitive Task
 * Usa el componente genérico DynamicForm
 */
export const CognitiveTaskForm: React.FC<CognitiveTaskFormProps> = ({
  className,
  researchId,
  onSave
}) => {
  return (
    <DynamicForm
      className={className}
      questionKey="cognitive_task"
      getSchema={getCognitiveTaskSchema}
      title="Preguntas Cognitive Task"
      contentKey="cognitiveTaskContent"
      researchId={researchId}
      onSave={onSave}
      estimatedCompletionTime="10-15"
      FieldMapper={FieldMapper}
    />
  );
};
