import React from 'react';
import { DynamicForm } from '@/components/common/DynamicForm';
import { getSmartVOCSchema } from './schema';
import { FieldMapper } from './FieldMapper';

interface SmartVOCFormProps {
  className?: string;
  researchId: string;
  onSave?: (data: any) => void;
}

/**
 * Componente principal del formulario SmartVOC
 * Usa el componente genérico DynamicForm
 */
export const SmartVOCForm: React.FC<SmartVOCFormProps> = ({
  className,
  researchId,
  onSave
}) => {
  return (
    <DynamicForm
      className={className}
      questionKey="smartvoc"
      getSchema={getSmartVOCSchema}
      title="Preguntas SmartVOC"
      contentKey="smartVocContent"
      researchId={researchId}
      onSave={onSave}
      estimatedCompletionTime="5-10"
      FieldMapper={FieldMapper}
    />
  );
};