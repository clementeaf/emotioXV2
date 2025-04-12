'use client';

import React from 'react';
import { QuestionInfo, MainContent } from './';
import { CognitiveTaskQuestion } from '../types';
import { AnalysisTabType } from './AnalysisTabs';

interface QuestionContainerProps {
  questionId: string;
  questionType: string;
  conditionalityDisabled: boolean;
  required: boolean;
  hasNewData: boolean;
  data: CognitiveTaskQuestion;
  initialActiveTab?: AnalysisTabType;
  themeImageSrc?: string;
  onFilter?: () => void;
  onUpdate?: () => void;
}

export function QuestionContainer({
  questionId,
  questionType,
  conditionalityDisabled,
  required,
  hasNewData,
  data,
  initialActiveTab,
  themeImageSrc,
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

      {/* Contenido principal */}
      <MainContent 
        data={data}
        initialActiveTab={initialActiveTab}
        themeImageSrc={themeImageSrc}
      />
    </div>
  );
} 