'use client';

import { useCognitiveTaskResults } from '@/hooks/useCognitiveTaskResults';
import { useParams } from 'next/navigation';
import React from 'react';
import { Filters } from '../../research/SmartVOCResults/Filters';
import {
  CognitiveTaskHeader,
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
    researchConfig,
    refetch,
    isLoading,
    isError,
    isSuccess,
    hasData
  } = useCognitiveTaskResults(researchId);



  // Mostrar error
  if (isError && error) {
    return (
      <div className="space-y-6">
        <CognitiveTaskHeader title="2.0.- Cognitive task" />
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  // Crear preguntas desde la configuración real del backend
  const createQuestionsFromConfig = () => {
    if (!researchConfig?.questions) {
      // Fallback: crear preguntas temporales mientras se carga la configuración
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
          questionType: 'rating' as const,
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
          questionType: 'rating' as const,
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

    return researchConfig.questions.map((question: any) => {
      // Mapear tipos de pregunta cognitiva a tipos de visualización
      const getViewType = (questionType: string): 'sentiment' | 'choice' | 'ranking' | 'linear_scale' | 'preference' | 'image_selection' | 'navigation_flow' => {
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
      const getQuestionType = (questionType: string): 'short_text' | 'long_text' | 'multiple_choice' | 'rating' => {
        switch (questionType) {
          case 'cognitive_short_text':
            return 'short_text';
          case 'cognitive_long_text':
            return 'long_text';
          case 'cognitive_single_choice':
          case 'cognitive_multiple_choice':
            return 'multiple_choice';
          case 'cognitive_ranking':
          case 'cognitive_linear_scale':
          case 'cognitive_preference_test':
          case 'cognitive_image_selection':
          case 'cognitive_navigation_flow':
            return 'rating';
          default:
            return 'short_text';
        }
      };

      return {
        key: `question-${question.id}`,
        questionId: question.id,
        questionType: getQuestionType(question.type),
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

  // Usar datos procesados cuando estén disponibles, o las preguntas de configuración
  let finalQuestions;

  if (researchConfig?.questions) {
    // Siempre usar preguntas de configuración cuando estén disponibles
    finalQuestions = researchConfig.questions.map((question: any) => {
      // Mapear tipos de pregunta cognitiva a tipos de visualización
      const getViewType = (questionType: string): 'sentiment' | 'choice' | 'ranking' | 'linear_scale' | 'preference' | 'image_selection' | 'navigation_flow' => {
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
      const getQuestionType = (questionType: string): 'short_text' | 'long_text' | 'multiple_choice' | 'rating' => {
        switch (questionType) {
          case 'cognitive_short_text':
            return 'short_text';
          case 'cognitive_long_text':
            return 'long_text';
          case 'cognitive_single_choice':
          case 'cognitive_multiple_choice':
            return 'multiple_choice';
          case 'cognitive_ranking':
          case 'cognitive_linear_scale':
          case 'cognitive_preference_test':
          case 'cognitive_image_selection':
          case 'cognitive_navigation_flow':
            return 'rating';
          default:
            return 'short_text';
        }
      };

      // Buscar datos procesados correspondientes a esta pregunta
      // 🎯 FIX: Usar question.id para hacer match con el questionId del hook
      const processedDataForQuestion = processedData.find((data: any) => data.questionId === question.id);

      console.log('[CognitiveTaskResults] 🔍 Pregunta:', question.id, {
        questionTitle: question.title,
        questionKey: question.questionKey,
        processedDataForQuestion: processedDataForQuestion,
        choiceData: processedDataForQuestion?.choiceData,
        choiceOptions: processedDataForQuestion?.choiceData?.options
      });

      return {
        key: `question-${question.id}`,
        questionId: question.id,
        questionType: getQuestionType(question.type),
        questionText: question.title || question.description || `Pregunta ${question.id}`,
        required: question.required || false,
        conditionalityDisabled: question.showConditionally || false,
        hasNewData: processedDataForQuestion ? processedDataForQuestion.totalResponses > 0 : false,
        viewType: getViewType(question.type),
        sentimentData: processedDataForQuestion?.sentimentData,
        choiceData: processedDataForQuestion?.choiceData,
        rankingData: processedDataForQuestion?.rankingData,
        linearScaleData: processedDataForQuestion?.linearScaleData,
        ratingData: processedDataForQuestion?.ratingData,
        preferenceTestData: processedDataForQuestion?.preferenceTestData,
        imageSelectionData: processedDataForQuestion?.imageSelectionData,
        navigationFlowData: processedDataForQuestion?.navigationFlowData,
        initialActiveTab: 'sentiment' as const,
        themeImageSrc: '',
      };
    });
  } else {
    // Fallback con preguntas temporales
    finalQuestions = createQuestionsFromConfig();
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1 space-y-8">
        <CognitiveTaskHeader title="2.0.- Cognitive task" />

        {finalQuestions.map((q: any) => (
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
      <div className="w-80 shrink-0 mt-[52px]">
        <Filters researchId={propResearchId || ''} />
      </div>
    </div>
  );
};
