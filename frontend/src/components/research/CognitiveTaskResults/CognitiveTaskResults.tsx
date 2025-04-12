'use client';

import React from 'react';
import { cognitiveTaskQuestion, cognitiveTaskQuestion2 } from './mockData';
import { CognitiveTaskHeader, QuestionContainer } from './components';

export const CognitiveTaskResults: React.FC = () => {
  const handleFilter = () => {
    console.log('Filtrar resultados');
  };

  const handleUpdate = () => {
    console.log('Actualizar datos');
  };

  // URL de la imagen de ejemplo para el análisis de temas
  // Esta imagen debe existir en tu proyecto o ser servida desde una URL pública
  const themeImageUrl = "https://images.unsplash.com/photo-1533134486753-c833f0ed4866?q=80&w=1920&auto=format&fit=crop";

  return (
    <div className="space-y-6">
      {/* Título común para todas las preguntas */}
      <CognitiveTaskHeader title="2.0.- Cognitive task" />
      
      {/* Pregunta 3.1 */}
      <QuestionContainer 
        questionId="3.1.-Question"
        questionType="Short Text question"
        conditionalityDisabled={true}
        required={true}
        hasNewData={true}
        data={cognitiveTaskQuestion}
        onFilter={handleFilter}
        onUpdate={handleUpdate}
      />

      {/* Pregunta 3.2 */}
      <QuestionContainer 
        questionId="3.2.-Question"
        questionType="Long Text question"
        conditionalityDisabled={true}
        required={true}
        hasNewData={true}
        data={cognitiveTaskQuestion2}
        initialActiveTab="themes"
        themeImageSrc={themeImageUrl}
        onFilter={handleFilter}
        onUpdate={handleUpdate}
      />
    </div>
  );
}; 