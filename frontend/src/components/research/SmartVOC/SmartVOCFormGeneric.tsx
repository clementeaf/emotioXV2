import React from 'react';
import { DynamicQuestionForm } from '../shared';

interface SmartVOCFormGenericProps {
  researchId: string;
  className?: string;
  onSave?: (data: any) => void;
}

/**
 * Componente Smart VOC refactorizado usando el sistema genérico
 * Reemplaza la implementación anterior con el hook dinámico
 */
export const SmartVOCFormGeneric: React.FC<SmartVOCFormGenericProps> = ({
  researchId,
  className,
  onSave
}) => {
  console.log('🚀 SmartVOCFormGeneric cargado - Sistema genérico activo');
  
  return (
    <DynamicQuestionForm
      moduleType="smart-voc"
      researchId={researchId}
      className={className}
      onSave={onSave}
      educationalContentKey="smartVocContent"
    />
  );
};
