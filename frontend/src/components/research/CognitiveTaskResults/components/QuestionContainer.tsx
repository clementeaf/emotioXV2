'use client';

import { CognitiveTaskQuestion } from '../types';
import { NavigationFlowData } from './NavigationFlow/types';
import { AnalysisTabType } from './AnalysisTabs';
import { ChoiceQuestionData } from './ChoiceResults';
import { ImageSelectionData } from './ImageSelectionResults';
import { LinearScaleData } from './LinearScaleResults';
import { PreferenceTestData } from './PreferenceTestResults';
import { RankingQuestionData } from './RankingResults';
import { RatingData } from './RatingResults';

import {
  ChoiceResults,
  ImageSelectionResults,
  LinearScaleResults,
  MainContent,
  NavigationFlowResults,
  PreferenceTestResults,
  QuestionInfo,
  RankingResults,
  RatingResults
} from './';

// Tipo de visualización para la pregunta
export type QuestionViewType = 'sentiment' | 'choice' | 'ranking' | 'linear_scale' | 'rating' | 'preference' | 'image_selection' | 'navigation_flow';

interface QuestionContainerProps {
  questionId: string;
  questionText: string; // Agregar el título real de la pregunta
  questionType: string;
  conditionalityDisabled: boolean;
  required?: boolean;
  hasNewData?: boolean;
  viewType: QuestionViewType;
  // Datos específicos según el tipo de visualización
  sentimentData?: CognitiveTaskQuestion;
  choiceData?: ChoiceQuestionData;
  rankingData?: RankingQuestionData;
  linearScaleData?: LinearScaleData;
  ratingData?: RatingData;
  preferenceTestData?: PreferenceTestData;
  imageSelectionData?: ImageSelectionData;
  navigationFlowData?: NavigationFlowData;
  // Props específicos para la visualización de sentimiento
  initialActiveTab?: AnalysisTabType;
  themeImageSrc?: string;
  // Props específicos para la visualización de choice
  choiceImageSrc?: string;

}

export function QuestionContainer({
  questionId,
  questionText,
  questionType,
  conditionalityDisabled,
  required = false,
  hasNewData = false,
  viewType,
  sentimentData,
  choiceData,
  rankingData,
  linearScaleData,
  ratingData,
  preferenceTestData,
  imageSelectionData,
  navigationFlowData,
  initialActiveTab,
  themeImageSrc,
  choiceImageSrc
}: QuestionContainerProps) {
  // DEBUG: Log datos recibidos
  console.log(`[QuestionContainer] Renderizando pregunta ${questionId}:`, {
    viewType,
    hasSentimentData: !!sentimentData,
    hasChoiceData: !!choiceData,
    hasRankingData: !!rankingData,
    hasLinearScaleData: !!linearScaleData,
    hasPreferenceTestData: !!preferenceTestData,
    hasNavigationFlowData: !!navigationFlowData,
    hasNewData
  });
  
  return (
    <div className="w-full bg-white rounded-lg border border-neutral-200 mb-6">
      {/* Sección de pregunta y estado */}
      <QuestionInfo
        questionId={questionId}
        questionText={questionText}
        questionType={questionType}
        conditionalityDisabled={conditionalityDisabled}
        required={required}
        hasNewData={hasNewData}
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

      {viewType === 'ranking' && rankingData && (
        <RankingResults
          data={rankingData}
        />
      )}

      {viewType === 'linear_scale' && linearScaleData && (
        <LinearScaleResults
          data={linearScaleData}
        />
      )}

      {viewType === 'rating' && ratingData && (
        <RatingResults
          data={ratingData}
        />
      )}

      {viewType === 'preference' && preferenceTestData && (
        <PreferenceTestResults
          data={preferenceTestData}
        />
      )}

      {viewType === 'image_selection' && imageSelectionData && (
        <ImageSelectionResults
          data={imageSelectionData}
        />
      )}

      {viewType === 'navigation_flow' && (
        <NavigationFlowResults
          researchId={questionId}
          data={navigationFlowData}
        />
      )}
    </div>
  );
}
