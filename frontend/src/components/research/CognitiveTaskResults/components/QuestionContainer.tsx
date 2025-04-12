'use client';

import React from 'react';
import { QuestionInfo, MainContent, ChoiceResults } from './';
import { CognitiveTaskQuestion } from '../types';
import { AnalysisTabType } from './AnalysisTabs';
import { ChoiceQuestionData } from './ChoiceResults';

// Tipo de visualización para la pregunta
export type QuestionViewType = 'sentiment' | 'choice';

interface QuestionContainerProps {
  questionId: string;
  questionType: string;
  conditionalityDisabled: boolean;
  required?: boolean;
  hasNewData?: boolean;
  viewType: QuestionViewType;
  // Datos específicos según el tipo de visualización
  sentimentData?: CognitiveTaskQuestion;
  choiceData?: ChoiceQuestionData;
  // Props específicos para la visualización de sentimiento
  initialActiveTab?: AnalysisTabType;
  themeImageSrc?: string;
  // Props específicos para la visualización de choice
  choiceImageSrc?: string;
  // Handlers para eventos
  onFilter?: () => void;
  onUpdate?: () => void;
}

export function QuestionContainer({
  questionId,
  questionType,
  conditionalityDisabled,
  required = false,
  hasNewData = false,
  viewType,
  sentimentData,
  choiceData,
  initialActiveTab,
  themeImageSrc,
  choiceImageSrc,
  onFilter,
  onUpdate
}: QuestionContainerProps) {
  return (
    <div className="w-full bg-white rounded-lg border border-neutral-200 mb-6">
      {/* Sección de pregunta y estado */}
      <QuestionInfo
        questionId={questionId}
        questionType={questionType}
        conditionalityDisabled={conditionalityDisabled}
        required={required}
        hasNewData={hasNewData}
        onFilter={onFilter}
        onUpdate={onUpdate}
      />

      {/* Contenido principal según el tipo de visualización */}
      {viewType === 'sentiment' && sentimentData && (
        <MainContent 
          data={sentimentData}
          initialActiveTab={initialActiveTab}
          themeImageSrc={themeImageSrc}
        />
      )}

      {viewType === 'choice' && choiceData && (
        <ChoiceResults 
          data={choiceData}
          imageSrc={choiceImageSrc}
        />
      )}
    </div>
  );
} 