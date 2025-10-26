import React, { useState, useCallback } from 'react';
import { DynamicForm } from '@/components/common/DynamicForm';
import { FieldMapper } from './FieldMapper';
import { STUDY_CONFIG_SECTIONS } from './schema.types';

interface StudyConfigProps {
  researchId: string;
  initialData?: any;
  onSave?: (data: any) => void;
  estimatedCompletionTime?: string;
}

export const StudyConfig: React.FC<StudyConfigProps> = ({
  researchId,
  initialData,
  onSave,
  estimatedCompletionTime = '5-10'
}) => {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  
  // Convertir initialData a formato de secciones
  const sections = Object.keys(STUDY_CONFIG_SECTIONS).map(sectionKey => {
    const section = STUDY_CONFIG_SECTIONS[sectionKey];
    const sectionData = initialData?.[sectionKey] || {};
    
    return {
      id: section.id,
      title: section.displayName,
      description: section.description,
      ...sectionData
    };
  });

  const getSchema = useCallback((sectionId: string) => {
    return STUDY_CONFIG_SECTIONS[sectionId];
  }, []);

  return (
      <DynamicForm
        questionKey="study_config"
        researchId={researchId}
        title="Configuración de Estudio"
        FieldMapper={FieldMapper}
        onSave={onSave}
        estimatedCompletionTime={estimatedCompletionTime}
        getSchema={getSchema}
        contentKey="study_config"
      />
  );
};
