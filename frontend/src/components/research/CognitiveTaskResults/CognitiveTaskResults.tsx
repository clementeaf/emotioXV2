'use client';

import React from 'react';
import { CognitiveTaskHeader, NavigationTestResults } from './components';

export const CognitiveTaskResults: React.FC = () => {
  const handleFilter = () => {
    // console.log('Filtrar resultados');
  };

  const handleUpdate = () => {
    // console.log('Actualizar datos');
  };

  // TODO: Integrar fetch de datos reales desde la API/backend
  // const data = useCognitiveTaskResults();

  return (
    <div className="space-y-6">
      {/* Título común para todas las preguntas */}
      <CognitiveTaskHeader title="2.0.- Cognitive task" />

      {/* TODO: Renderizar preguntas dinámicamente usando datos reales */}
      {/* Ejemplo de uso:
      <QuestionContainer
        questionId={question.id}
        questionType={question.type}
        ...otrosProps
      />
      */}

      {/* Navigation Test - 3.7 (mantener si no depende de mock data) */}
      <NavigationTestResults
        questionId="3.7.-Navigation Test"
        questionType="Navigation Test"
        conditionalityDisabled={true}
        required={true}
      />
    </div>
  );
};
