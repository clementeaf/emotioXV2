'use client';

import { useCognitiveTaskResults } from '@/hooks/useCognitiveTaskResults';
import { useParams } from 'next/navigation';
import React from 'react';
import {
  CognitiveTaskHeader,
  ErrorState,
  LoadingState,
  QuestionContainer
} from './components';

interface CognitiveTaskResultsProps {
  researchId?: string;
}

export const CognitiveTaskResults: React.FC<CognitiveTaskResultsProps> = ({ researchId: propResearchId }) => {
  const params = useParams();
  const researchId = propResearchId || params?.research as string || params?.id as string;

  const {
    loadingState,
    error,
    participantResponses,
    processedData,
    refetch,
    isLoading,
    isError,
    isSuccess,
    hasData
  } = useCognitiveTaskResults(researchId);

  const handleFilter = () => {
    // console.log('Filtrar resultados');
  };

  const handleUpdate = () => {
    refetch();
  };

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <CognitiveTaskHeader title="2.0.- Cognitive task" />
        <LoadingState message="Cargando resultados de tareas cognitivas..." />
      </div>
    );
  }

  // Mostrar error
  if (isError && error) {
    return (
      <div className="space-y-6">
        <CognitiveTaskHeader title="2.0.- Cognitive task" />
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  // Preguntas de ejemplo (puedes reemplazar por datos reales en el futuro)
  const questions = [
    {
      key: 'question-3-1',
      questionId: '3.1',
      questionType: 'short_text' as const,
      questionText: '¿Cuál es tu color favorito?',
      required: true,
      conditionalityDisabled: true,
      hasNewData: true,
      sentimentResults: [],
      themes: [],
      keywords: [],
      sentimentAnalysis: { text: '', actionables: [] },
    },
    {
      key: 'question-3-2',
      questionId: '3.2',
      questionType: 'long_text' as const,
      questionText: 'Describe una experiencia memorable.',
      required: true,
      conditionalityDisabled: true,
      hasNewData: true,
      sentimentResults: [],
      themes: [],
      keywords: [],
      sentimentAnalysis: { text: '', actionables: [] },
    },
    {
      key: 'question-3-3',
      questionId: '3.3',
      questionType: 'multiple_choice' as const, // Usar el tipo permitido
      questionText: 'Pregunta de selección única.',
      required: false,
      conditionalityDisabled: true,
      hasNewData: false,
      // Estructura lista para datos reales
    },
    {
      key: 'question-3-4',
      questionId: '3.4',
      questionType: 'multiple_choice' as const,
      questionText: 'Pregunta de selección múltiple.',
      required: true,
      conditionalityDisabled: true,
      hasNewData: false,
      // Estructura lista para datos reales
    },
    {
      key: 'question-3-5',
      questionId: '3.5',
      questionType: 'rating' as const,
      questionText: 'Pregunta de escala lineal.',
      required: true,
      conditionalityDisabled: true,
      hasNewData: false,
      // Estructura lista para datos reales
    },
    {
      key: 'question-3-6',
      questionId: '3.6',
      questionType: 'rating' as const, // Usar tipo permitido
      questionText: 'Pregunta de ranking.',
      required: true,
      conditionalityDisabled: true,
      hasNewData: false,
      // Estructura lista para datos reales
    },
    {
      key: 'question-3-7',
      questionId: '3.7',
      questionType: 'rating' as const, // Usar tipo permitido
      questionText: 'Navigation Test.',
      required: true,
      conditionalityDisabled: true,
      hasNewData: false,
      // Estructura lista para datos reales
    },
    {
      key: 'question-3-7-detail',
      questionId: '3.7-detail',
      questionType: 'rating' as const, // Usar tipo permitido
      questionText: 'Navigation Task Result (detalle de paso).',
      required: true,
      conditionalityDisabled: true,
      hasNewData: false,
      // Estructura lista para datos reales
    },
  ];

  return (
    <div className="space-y-8">
      <CognitiveTaskHeader title="2.0.- Cognitive task" />
      {questions.map((q) => (
        <QuestionContainer
          key={q.key}
          questionId={q.questionId}
          questionType={q.questionType}
          conditionalityDisabled={q.conditionalityDisabled}
          required={q.required}
          hasNewData={q.hasNewData}
          viewType="sentiment"
          sentimentData={{
            id: q.questionId,
            questionNumber: q.questionId,
            questionText: q.questionText,
            questionType: q.questionType,
            required: q.required,
            conditionalityDisabled: q.conditionalityDisabled,
            sentimentResults: q.sentimentResults,
            themes: q.themes,
            keywords: q.keywords,
            sentimentAnalysis: q.sentimentAnalysis
          }}
          initialActiveTab="sentiment"
          themeImageSrc={''}
          onFilter={() => { }}
          onUpdate={() => { }}
        />
      ))}
    </div>
  );
};
