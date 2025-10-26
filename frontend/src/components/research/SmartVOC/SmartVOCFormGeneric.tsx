import React from 'react';
// import { DynamicQuestionForm } from '../shared'; // Módulo eliminado

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
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-yellow-800">SmartVOCFormGeneric - DynamicQuestionForm eliminado, usar SmartVOCForm con DynamicForm</p>
    </div>
  );
};
