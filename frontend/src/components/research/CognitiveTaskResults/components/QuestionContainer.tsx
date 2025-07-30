'use client';

import { CognitiveTaskQuestion } from '../types';

import { NavigationFlowData } from '../types';
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
  // Estado de carga
  isLoading?: boolean;
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
  rankingData,
  linearScaleData,
  ratingData,
  preferenceTestData,
  imageSelectionData,
  navigationFlowData,
  initialActiveTab,
  themeImageSrc,
  choiceImageSrc,
  isLoading = false
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
      />

      {/* Contenido principal según el tipo de visualización */}
      {viewType === 'sentiment' && (
        isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ) : sentimentData ? (
          <MainContent
            data={sentimentData}
            initialActiveTab={initialActiveTab}
            themeImageSrc={themeImageSrc}
          />
        ) : (
          <div className="p-6 text-center text-gray-500">No hay datos de sentimiento disponibles</div>
        )
      )}

      {viewType === 'choice' && (
        isLoading ? (
          <div className="p-6">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ) : choiceData ? (
          <ChoiceResults
            data={choiceData}
            imageSrc={choiceImageSrc}
          />
        ) : (
          <div className="p-6 text-center text-gray-500">No hay datos de opciones disponibles</div>
        )
      )}

      {viewType === 'ranking' && (
        isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ) : rankingData ? (
          <RankingResults
            data={rankingData}
          />
        ) : (
          <div className="p-6 text-center text-gray-500">No hay datos de ranking disponibles</div>
        )
      )}

      {viewType === 'linear_scale' && (
        isLoading ? (
          <div className="p-6">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ) : linearScaleData ? (
          <LinearScaleResults
            data={linearScaleData}
          />
        ) : (
          <div className="p-6 text-center text-gray-500">No hay datos de escala lineal disponibles</div>
        )
      )}

      {viewType === 'rating' && (
        isLoading ? (
          <div className="p-6">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ) : ratingData ? (
          <RatingResults
            data={ratingData}
          />
        ) : (
          <div className="p-6 text-center text-gray-500">No hay datos de rating disponibles</div>
        )
      )}

      {viewType === 'preference' && (
        isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
              <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ) : preferenceTestData ? (
          <PreferenceTestResults
            data={preferenceTestData}
          />
        ) : (
          <div className="p-6 text-center text-gray-500">No hay datos de preferencias disponibles</div>
        )
      )}

      {viewType === 'image_selection' && (
        isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : imageSelectionData ? (
          <ImageSelectionResults
            data={imageSelectionData}
          />
        ) : (
          <div className="p-6 text-center text-gray-500">No hay datos de selección de imágenes disponibles</div>
        )
      )}

      {viewType === 'navigation_flow' && (
        isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ) : navigationFlowData ? (
          <NavigationFlowResults
            data={navigationFlowData}
          />
        ) : (
          <div className="p-6 text-center text-gray-500">No hay datos de flujo de navegación disponibles</div>
        )
      )}
    </div>
  );
}
