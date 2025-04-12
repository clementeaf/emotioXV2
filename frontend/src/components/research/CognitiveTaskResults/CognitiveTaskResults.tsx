'use client';

import React from 'react';
import { cognitiveTaskQuestion, cognitiveTaskQuestion2 } from './mockData';
import { singleChoiceQuestionData, multipleChoiceQuestionData, linearScaleQuestionData } from './mockChoiceData';
import { rankingQuestionData } from './mockRankingData';
import { CognitiveTaskHeader, QuestionContainer, NavigationTestResults } from './components';

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

  // URL de la imagen para la pregunta de multiple choice y escala lineal
  const questionImageUrl = "https://images.unsplash.com/photo-1533134486753-c833f0ed4866?q=80&w=1920&auto=format&fit=crop";

  return (
    <div className="space-y-6">
      {/* Título común para todas las preguntas */}
      <CognitiveTaskHeader title="2.0.- Cognitive task" />
      
      {/* Pregunta 3.1 - Short Text */}
      <QuestionContainer 
        questionId="3.1.-Question"
        questionType="Short Text question"
        conditionalityDisabled={true}
        required={true}
        hasNewData={true}
        viewType="sentiment"
        sentimentData={cognitiveTaskQuestion}
        onFilter={handleFilter}
        onUpdate={handleUpdate}
      />

      {/* Pregunta 3.2 - Long Text */}
      <QuestionContainer 
        questionId="3.2.-Question"
        questionType="Long Text question"
        conditionalityDisabled={true}
        required={true}
        hasNewData={true}
        viewType="sentiment"
        sentimentData={cognitiveTaskQuestion2}
        initialActiveTab="themes"
        themeImageSrc={themeImageUrl}
        onFilter={handleFilter}
        onUpdate={handleUpdate}
      />

      {/* Pregunta 3.3 - Single Choice */}
      <QuestionContainer 
        questionId="3.3.-Question"
        questionType="Single Choice question"
        conditionalityDisabled={true}
        viewType="choice"
        choiceData={singleChoiceQuestionData}
        onFilter={handleFilter}
      />

      {/* Pregunta 3.4 - Multiple Choice */}
      <QuestionContainer 
        questionId="3.4.-Question"
        questionType="Multiple Choice question"
        conditionalityDisabled={true}
        required={true}
        viewType="choice"
        choiceData={multipleChoiceQuestionData}
        choiceImageSrc={questionImageUrl}
        onFilter={handleFilter}
      />

      {/* Pregunta 3.5 - Linear Scale */}
      <QuestionContainer 
        questionId="3.5.-Question"
        questionType="Linear Scale question"
        conditionalityDisabled={true}
        required={true}
        viewType="choice"
        choiceData={linearScaleQuestionData}
        choiceImageSrc={questionImageUrl}
        onFilter={handleFilter}
      />

      {/* Pregunta 3.6 - Ranking */}
      <QuestionContainer 
        questionId="3.6.-Question"
        questionType="Ranking question"
        conditionalityDisabled={true}
        required={true}
        viewType="ranking"
        rankingData={rankingQuestionData}
        onFilter={handleFilter}
      />
      
      {/* Navigation Test - 3.7 */}
      <NavigationTestResults 
        questionId="3.7.-Navigation Test"
        questionType="Navigation Test"
        conditionalityDisabled={true}
        required={true}
      />
    </div>
  );
}; 