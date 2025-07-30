'use client';

import { useCognitiveTaskResults } from '@/hooks/useCognitiveTaskResults';
import { useParams } from 'next/navigation';
import React from 'react';
import { Filters } from '../../research/SmartVOCResults/Filters';
import {
  CognitiveTaskHeader,
  CognitiveTaskResultsSkeleton,
  ErrorState,
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
    return <CognitiveTaskResultsSkeleton />;
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

  // Debug logs
  console.log('[CognitiveTaskResults] 📊 Processed data:', processedData);
  console.log('[CognitiveTaskResults] 📊 Has data:', hasData);
  console.log('[CognitiveTaskResults] 📊 Loading:', isLoading);

  // Usar datos reales procesados del hook
  const questions = processedData.map((data, index) => {
    // Mapear tipos de pregunta cognitiva a tipos de visualización
    const getViewType = (questionType: string) => {
      switch (questionType) {
        case 'cognitive_short_text':
        case 'cognitive_long_text':
          return 'sentiment';
        case 'cognitive_single_choice':
        case 'cognitive_multiple_choice':
          return 'choice';
        case 'cognitive_ranking':
          return 'ranking';
        case 'cognitive_linear_scale':
          return 'linear_scale';
        case 'cognitive_preference_test':
          return 'preference';
        case 'cognitive_image_selection':
          return 'image_selection';
        case 'cognitive_navigation_flow':
          return 'navigation_flow';
        default:
          return 'sentiment';
      }
    };

    // Mapear tipos de pregunta a tipos de visualización
    const getQuestionType = (questionType: string) => {
      switch (questionType) {
        case 'cognitive_short_text':
          return 'short_text';
        case 'cognitive_long_text':
          return 'long_text';
        case 'cognitive_single_choice':
          return 'single_choice';
        case 'cognitive_multiple_choice':
          return 'multiple_choice';
        case 'cognitive_ranking':
          return 'ranking';
        case 'cognitive_linear_scale':
          return 'linear_scale';
        case 'cognitive_preference_test':
          return 'preference_test';
        case 'cognitive_image_selection':
          return 'image_selection';
        case 'cognitive_navigation_flow':
          return 'navigation_flow';
        default:
          return 'short_text';
      }
    };

    return {
      key: `question-${data.questionId}`,
      questionId: data.questionId,
      questionType: getQuestionType(data.questionType),
      questionText: data.questionText,
      required: true,
      conditionalityDisabled: true,
      hasNewData: data.totalResponses > 0,
      viewType: getViewType(data.questionType),
      sentimentData: data.sentimentData ? {
        id: data.questionId,
        questionNumber: data.questionId,
        questionText: data.questionText,
        questionType: getQuestionType(data.questionType),
        required: true,
        conditionalityDisabled: true,
        sentimentResults: data.sentimentData.responses.map((resp, index) => {
          const sentimentResult = {
            id: resp.id || `sentiment-${data.questionId}-${index}`,
            text: resp.text,
            mood: resp.sentiment === 'positive' ? 'Positive' : resp.sentiment === 'negative' ? 'Negative' : 'Neutral',
            selected: false
          };

          // Debug log para cada resultado de sentimiento
          console.log(`[CognitiveTaskResults] 🎯 SentimentResult ${index}:`, sentimentResult);

          return sentimentResult;
        }),
        themes: data.sentimentData.themes || [],
        keywords: data.sentimentData.keywords || [],
        sentimentAnalysis: data.sentimentData.analysis || { text: '', actionables: [] }
      } : undefined,

      // Debug log para cada pregunta
      ...(data.sentimentData && {
        _debug: {
          questionId: data.questionId,
          responsesCount: data.sentimentData.responses.length,
          responses: data.sentimentData.responses.slice(0, 3) // Primeras 3 respuestas para debug
        }
      }),
      choiceData: data.choiceData,

      // Debug log para choice data
      ...(data.choiceData && {
        _choiceDebug: {
          questionId: data.questionId,
          optionsCount: data.choiceData.options.length,
          options: data.choiceData.options,
          totalResponses: data.choiceData.totalResponses
        }
      }),
      rankingData: data.rankingData,
      linearScaleData: data.linearScaleData,
      ratingData: data.ratingData,
      preferenceTestData: data.preferenceTestData,
      imageSelectionData: data.imageSelectionData,
      navigationFlowData: data.navigationFlowData,
      initialActiveTab: 'sentiment' as const,
      themeImageSrc: '',
    };
  });

  // Debug log final
  console.log('[CognitiveTaskResults] 📊 Questions processed:', questions.map(q => ({
    questionId: q.questionId,
    questionType: q.questionType,
    hasSentimentData: !!q.sentimentData,
    sentimentResultsCount: q.sentimentData?.sentimentResults?.length || 0,
    hasChoiceData: !!q.choiceData,
    choiceDataOptions: q.choiceData?.options?.length || 0,
    choiceDataTotalResponses: q.choiceData?.totalResponses || 0,
    hasRankingData: !!q.rankingData,
    hasLinearScaleData: !!q.linearScaleData,
    hasPreferenceTestData: !!q.preferenceTestData,
    hasNavigationFlowData: !!q.navigationFlowData
  })));

  return (
    <div className="flex gap-8">
      <div className="flex-1 space-y-8">
        <CognitiveTaskHeader title="2.0.- Cognitive task" />
        {questions.map((q) => (
          <QuestionContainer
            key={q.key}
            questionId={q.questionId}
            questionType={q.questionType}
            conditionalityDisabled={q.conditionalityDisabled}
            required={q.required}
            hasNewData={q.hasNewData}
            viewType={q.viewType}
            sentimentData={q.sentimentData}
            choiceData={q.choiceData}
            rankingData={q.rankingData}
            linearScaleData={q.linearScaleData}
            ratingData={q.ratingData}
            preferenceTestData={q.preferenceTestData}
            imageSelectionData={q.imageSelectionData}
            navigationFlowData={q.navigationFlowData}
            initialActiveTab={q.initialActiveTab}
            themeImageSrc={q.themeImageSrc}
            onFilter={handleFilter}
            onUpdate={handleUpdate}
          />
        ))}
      </div>
      <div className="w-80 shrink-0 mt-[52px]">
        <Filters researchId={questions[0]?.questionId || ''} />
      </div>
    </div>
  );
};
