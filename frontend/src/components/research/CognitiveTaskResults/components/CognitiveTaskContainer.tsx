'use client';

import React from 'react';
import { CognitiveTaskHeader, QuestionInfo, MainContent } from './';
import { CognitiveTaskQuestion } from '../types';

interface CognitiveTaskContainerProps {
  title: string;
  questionId: string;
  questionType: string;
  conditionalityDisabled: boolean;
  required: boolean;
  hasNewData: boolean;
  data: CognitiveTaskQuestion;
  onFilter?: () => void;
  onUpdate?: () => void;
}

export function CognitiveTaskContainer({
  title,
  questionId,
  questionType,
  conditionalityDisabled,
  required,
  hasNewData,
  data,
  onFilter,
  onUpdate
}: CognitiveTaskContainerProps) {
  return (
    <div className="w-full bg-white rounded-lg border border-neutral-200">
      {/* Encabezado con título */}
      <CognitiveTaskHeader title={title} />

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
      <MainContent data={data} />
    </div>
  );
} 