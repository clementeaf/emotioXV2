'use client';

import React from 'react';
import { cognitiveTaskQuestion } from './mockData';
import {
  CognitiveTaskHeader,
  QuestionInfo,
  MainContent
} from './components';

export const CognitiveTaskResults: React.FC = () => {
  const handleFilter = () => {
    console.log('Filtrar resultados');
  };

  const handleUpdate = () => {
    console.log('Actualizar datos');
  };

  return (
    <div className="w-full bg-white rounded-lg border border-neutral-200">
      {/* Encabezado con título */}
      <CognitiveTaskHeader title="2.0.- Cognitive task" />

      {/* Sección de pregunta y estado */}
      <QuestionInfo
        questionId="3.1.-Question"
        questionType="Short Text question"
        conditionalityDisabled={true}
        required={true}
        hasNewData={true}
        onFilter={handleFilter}
        onUpdate={handleUpdate}
      />

      {/* Contenido principal */}
      <MainContent data={cognitiveTaskQuestion} />
    </div>
  );
}; 