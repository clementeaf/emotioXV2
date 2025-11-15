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
  getSimplifiedQuestionType
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

interface CognitiveTaskResultsProps {
  researchId?: string;
}

interface ResearchConfig {
  questions?: ResearchConfigQuestionWithFiles[];
  [key: string]: unknown;
}

interface FinalQuestionData {
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

  const createQuestionsFromConfig = () => {
    const fallbackConfig = (researchConfig as unknown) as ResearchConfig | null;
    if (!fallbackConfig?.questions) {
      return [
        {
          key: 'question-cognitive_short_text',
          questionId: 'cognitive_short_text',
          questionType: 'short_text' as const,
          questionText: 'Pregunta breve',
          required: false,
          conditionalityDisabled: false,
          hasNewData: false,
          viewType: 'sentiment' as const,
          sentimentData: undefined,
          choiceData: undefined,
          rankingData: undefined,
          linearScaleData: undefined,
          ratingData: undefined,
          preferenceTestData: undefined,
          imageSelectionData: undefined,
          navigationFlowData: undefined,
          initialActiveTab: 'sentiment' as const,
          themeImageSrc: '',
        },
        {
          key: 'question-cognitive_long_text',
          questionId: 'cognitive_long_text',
          questionType: 'long_text' as const,
          questionText: 'Crees que podría mejorar?',
          required: false,
          conditionalityDisabled: false,
          hasNewData: false,
          viewType: 'sentiment' as const,
          sentimentData: undefined,
          choiceData: undefined,
          rankingData: undefined,
          linearScaleData: undefined,
          ratingData: undefined,
          preferenceTestData: undefined,
          imageSelectionData: undefined,
          navigationFlowData: undefined,
          initialActiveTab: 'sentiment' as const,
          themeImageSrc: '',
        },
        {
          key: 'question-cognitive_single_choice',
          questionId: 'cognitive_single_choice',
          questionType: 'multiple_choice' as const,
          questionText: 'Cual de estos colores prefieres?',
          required: false,
          conditionalityDisabled: false,
          hasNewData: false,
          viewType: 'choice' as const,
          sentimentData: undefined,
          choiceData: undefined,
          rankingData: undefined,
          linearScaleData: undefined,
          ratingData: undefined,
          preferenceTestData: undefined,
          imageSelectionData: undefined,
          navigationFlowData: undefined,
          initialActiveTab: 'sentiment' as const,
          themeImageSrc: '',
        },
        {
          key: 'question-cognitive_multiple_choice',
          questionId: 'cognitive_multiple_choice',
          questionType: 'multiple_choice' as const,
          questionText: 'Cual de estas opciones prefieres?',
          required: false,
          conditionalityDisabled: false,
          hasNewData: false,
          viewType: 'choice' as const,
          sentimentData: undefined,
          choiceData: undefined,
          rankingData: undefined,
          linearScaleData: undefined,
          ratingData: undefined,
          preferenceTestData: undefined,
          imageSelectionData: undefined,
          navigationFlowData: undefined,
          initialActiveTab: 'sentiment' as const,
          themeImageSrc: '',
        },
        {
          key: 'question-cognitive_linear_scale',
          questionId: 'cognitive_linear_scale',
          questionType: 'rating' as const,
          questionText: 'Califica a la marca',
          required: false,
          conditionalityDisabled: false,
          hasNewData: false,
          viewType: 'linear_scale' as const,
          sentimentData: undefined,
          choiceData: undefined,
          rankingData: undefined,
          linearScaleData: undefined,
          ratingData: undefined,
          preferenceTestData: undefined,
          imageSelectionData: undefined,
          navigationFlowData: undefined,
          initialActiveTab: 'sentiment' as const,
          themeImageSrc: '',
        },
        {
          key: 'question-cognitive_ranking',
          questionId: 'cognitive_ranking',
          questionType: 'ranking' as const,
          questionText: 'Cual es tu mayor preferencia',
          required: false,
          conditionalityDisabled: false,
          hasNewData: false,
          viewType: 'ranking' as const,
          sentimentData: undefined,
          choiceData: undefined,
          rankingData: undefined,
          linearScaleData: undefined,
          ratingData: undefined,
          preferenceTestData: undefined,
          imageSelectionData: undefined,
          navigationFlowData: undefined,
          initialActiveTab: 'sentiment' as const,
          themeImageSrc: '',
        },
        {
          key: 'question-cognitive_navigation_flow',
          questionId: 'cognitive_navigation_flow',
          questionType: 'rating' as const,
          questionText: 'Flujo de navegación',
          required: false,
          conditionalityDisabled: false,
          hasNewData: false,
          viewType: 'navigation_flow' as const,
          sentimentData: undefined,
          choiceData: undefined,
          rankingData: undefined,
          linearScaleData: undefined,
          ratingData: undefined,
          preferenceTestData: undefined,
          imageSelectionData: undefined,
          navigationFlowData: undefined,
          initialActiveTab: 'sentiment' as const,
          themeImageSrc: '',
        },
        {
          key: 'question-cognitive_preference_test',
          questionId: 'cognitive_preference_test',
          questionType: 'preference_test' as const,
          questionText: 'Cual de estas imagenes te parece mas adecuada?',
          required: false,
          conditionalityDisabled: false,
          hasNewData: false,
          viewType: 'preference' as const,
          sentimentData: undefined,
          choiceData: undefined,
          rankingData: undefined,
          linearScaleData: undefined,
          ratingData: undefined,
          preferenceTestData: undefined,
          imageSelectionData: undefined,
          navigationFlowData: undefined,
          initialActiveTab: 'sentiment' as const,
          themeImageSrc: '',
        }
      ];
    }

    if (!fallbackConfig?.questions) return [];
    
    return fallbackConfig.questions.map((question: ResearchConfigQuestionWithFiles) => {
      return {
        key: `question-${question.id}`,
        questionId: question.id,
        questionType: getSimplifiedQuestionType(question.type),
        questionText: question.title || question.description || `Pregunta ${question.id}`,
        required: question.required || false,
        conditionalityDisabled: question.showConditionally || false,
        hasNewData: false,
        viewType: getViewType(question.type),
        sentimentData: undefined,
        choiceData: undefined,
        rankingData: undefined,
        linearScaleData: undefined,
        ratingData: undefined,
        preferenceTestData: undefined,
        imageSelectionData: undefined,
        navigationFlowData: undefined,
        initialActiveTab: 'sentiment' as const,
        themeImageSrc: '',
      };
    });
  };

  let finalQuestions;

  const config = (researchConfig as unknown) as ResearchConfig | null;
  
  if (config?.questions) {
    finalQuestions = config.questions.map((question: ResearchConfigQuestionWithFiles) => {
      const questionType = (question.type as string) || '';
      
      // Usar índice optimizado para búsqueda O(1) en lugar de O(n)
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
    finalQuestions = createQuestionsFromConfig();
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
        <Filters researchId={researchId || ''} />
    </div>
  );
};
