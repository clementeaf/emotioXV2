'use client';

import { useParams } from 'next/navigation';
import React from 'react';
import { useCognitiveTaskResponses } from '@/hooks/useCognitiveTaskResponses';
import { Filters } from '../../research/SmartVOCResults/Filters';
import {
  CognitiveTaskHeader,
  ErrorState,
  QuestionContainer
} from './components';
import type { CognitiveTaskQuestion } from './types';
import type { ChoiceQuestionData } from './components/ChoiceResults';
import type { RankingQuestionData } from './components/RankingResults';
import type { LinearScaleData } from './components/LinearScaleResults';
import type { PreferenceTestData } from './components/PreferenceTestResults';
import type { RatingData } from './components/RatingResults';
import type { ImageSelectionData } from './components/ImageSelectionResults';
import type { NavigationFlowData } from './components/NavigationFlow/types';
import type { AnalysisTabType } from './components/AnalysisTabs';
import type {
  ResearchConfigQuestionWithFiles,
} from './types/data-processing';
import {
  getViewType,
  getQuestionType,
} from './utils/question-type-mapper';
import {
  createProcessedDataIndex,
  findProcessedDataForQuestion
} from './utils/processed-data-index';
import {
  transformSentimentData,
  transformChoiceData,
  transformLinearScaleData,
  transformRankingData,
  transformPreferenceTestData,
  transformNavigationFlowData
} from './utils/data-transformers';
import { createQuestionsFromConfig } from './utils/question-builder';

interface CognitiveTaskResultsProps {
  researchId?: string;
}

export interface ResearchConfig {
  questions?: ResearchConfigQuestionWithFiles[];
  [key: string]: unknown;
}

export interface FinalQuestionData {
  key: string;
  questionId: string;
  questionType: string;
  questionText: string;
  required: boolean;
  conditionalityDisabled: boolean;
  hasNewData: boolean;
  viewType: 'sentiment' | 'choice' | 'ranking' | 'linear_scale' | 'preference' | 'image_selection' | 'navigation_flow';
  sentimentData?: CognitiveTaskQuestion;
  choiceData?: ChoiceQuestionData;
  rankingData?: RankingQuestionData;
  linearScaleData?: LinearScaleData;
  ratingData?: RatingData;
  preferenceTestData?: PreferenceTestData;
  imageSelectionData?: ImageSelectionData;
  navigationFlowData?: NavigationFlowData;
  initialActiveTab?: AnalysisTabType;
  themeImageSrc?: string;
  choiceImageSrc?: string;
}

export const CognitiveTaskResults: React.FC<CognitiveTaskResultsProps> = ({ researchId: propResearchId }) => {
  const params = useParams();
  const researchId = React.useMemo(() => {
    return propResearchId || params?.research as string || params?.id as string || null;
  }, [propResearchId, params?.research, params?.id]);

  const {
    researchConfig,
    processedData,
    isLoading,
    isError,
    error,
    refetch
  } = useCognitiveTaskResponses(researchId);

  const processedDataIndex = React.useMemo(() => {
    return createProcessedDataIndex(processedData);
  }, [processedData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CognitiveTaskHeader title="2.0.- Cognitive task" />
        <div className="flex items-center justify-center p-8">
          <div className="text-neutral-500">Cargando resultados...</div>
        </div>
      </div>
    );
  }

  if (isError && error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return (
      <div className="space-y-6">
        <CognitiveTaskHeader title="2.0.- Cognitive task" />
        <ErrorState error={errorMessage} onRetry={refetch} />
      </div>
    );
  }

  let finalQuestions;

  const config = (researchConfig as unknown) as ResearchConfig | null;
  
  if (config?.questions) {
    finalQuestions = config.questions.map((question: ResearchConfigQuestionWithFiles) => {
      const questionType = (question.type as string) || '';
      
      const processedDataForQuestion = findProcessedDataForQuestion(
        processedDataIndex,
        question.id,
        questionType
      );

      // Aplicar transformaciones de datos usando funciones helper
      const transformedSentimentData = transformSentimentData(processedDataForQuestion, question);
      const transformedChoiceData = transformChoiceData(processedDataForQuestion, question);
      const transformedLinearScaleData = transformLinearScaleData(processedDataForQuestion, question);
      const transformedRankingData = transformRankingData(processedDataForQuestion, question);
      const transformedPreferenceTestData = transformPreferenceTestData(
        processedDataForQuestion,
        question,
        researchConfig
      );
      const transformedNavigationFlowData = transformNavigationFlowData(
        processedDataForQuestion,
        question,
        researchConfig,
        researchId
      );

      const questionData = {
        key: `question-${question.id}`,
        questionId: question.id,
        questionType: getQuestionType(question.type),
        questionText: question.title || question.description || `Pregunta ${question.id}`,
        required: question.required || false,
        conditionalityDisabled: question.showConditionally || false,
        hasNewData: processedDataForQuestion ? (processedDataForQuestion.totalResponses || 0) > 0 : false,
        viewType: getViewType(question.type),
        sentimentData: transformedSentimentData,
        choiceData: transformedChoiceData,
        rankingData: transformedRankingData,
        linearScaleData: transformedLinearScaleData,
        ratingData: processedDataForQuestion?.ratingData as RatingData | undefined,
        preferenceTestData: transformedPreferenceTestData,
        imageSelectionData: processedDataForQuestion?.imageSelectionData as ImageSelectionData | undefined,
        navigationFlowData: transformedNavigationFlowData,
        initialActiveTab: 'sentiment' as const,
        themeImageSrc: '',
      };
      
      return questionData;
    });
  } else {
    finalQuestions = createQuestionsFromConfig(researchConfig);
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1 space-y-6">
        {finalQuestions.map((q: FinalQuestionData) => (
          <QuestionContainer
            key={q.key}
            questionId={q.questionId}
            questionText={q.questionText}
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
          />
        ))}
      </div>
      {researchId ? (
        <Filters researchId={researchId} />
      ) : (
        <div className="w-80 shrink-0">
          <div className="p-4 border border-neutral-200 rounded-lg bg-white">
            <div className="text-sm text-neutral-500 italic text-center py-8">
              No se pudo obtener el ID de investigación
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
