'use client';

import React from 'react';
import { cognitiveTaskQuestion } from './mockData';
import { CognitiveTaskContainer } from './components';

export const CognitiveTaskResults: React.FC = () => {
  const handleFilter = () => {
    console.log('Filtrar resultados');
  };

  const handleUpdate = () => {
    console.log('Actualizar datos');
  };

  return (
    <CognitiveTaskContainer 
      title="2.0.- Cognitive task"
      questionId="3.1.-Question"
      questionType="Short Text question"
      conditionalityDisabled={true}
      required={true}
      hasNewData={true}
      data={cognitiveTaskQuestion}
      onFilter={handleFilter}
      onUpdate={handleUpdate}
    />
  );
}; 