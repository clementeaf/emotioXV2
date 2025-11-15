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
import type { CognitiveTaskQuestion, ThemeResult, KeywordResult } from './types';
import type { ChoiceQuestionData } from './components/ChoiceResults';
import type { RankingQuestionData } from './components/RankingResults';
import type { LinearScaleData } from './components/LinearScaleResults';
import type { PreferenceTestData } from './components/PreferenceTestResults';
import type { RatingData } from './components/RatingResults';
import type { ImageSelectionData } from './components/ImageSelectionResults';
import type { NavigationFlowData } from './components/NavigationFlow/types';
import type { AnalysisTabType } from './components/AnalysisTabs';

interface CognitiveTaskResultsProps {
  researchId?: string;
}

interface ResearchConfigQuestion {
  id: string;
  type: string;
  title: string;
  description?: string;
  required?: boolean;
  showConditionally?: boolean;
  choices?: Array<{
    id: string;
    text: string;
    label?: string;
    isQualify?: boolean;
    isDisqualify?: boolean;
  }>;
  scaleConfig?: {
    startValue?: number;
    endValue?: number;
  };
  [key: string]: unknown;
}

interface ResearchConfig {
  questions?: ResearchConfigQuestion[];
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
    if (!researchConfig || !(researchConfig as any)?.questions) {
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

    const config = (researchConfig as unknown) as ResearchConfig | null;
    if (!config?.questions) return [];
    
    return config.questions.map((question: ResearchConfigQuestion) => {
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
      const getQuestionType = (questionType: string): 'short_text' | 'long_text' | 'multiple_choice' | 'rating' | 'preference_test' => {
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
            return 'rating';
          case 'cognitive_preference_test':
            return 'preference_test';
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

  let finalQuestions;

  const config = (researchConfig as unknown) as ResearchConfig | null;
  
  if (config?.questions) {
    finalQuestions = config.questions.map((question: ResearchConfigQuestion) => {
      const getViewType = (questionType: string): 'sentiment' | 'choice' | 'ranking' | 'linear_scale' | 'preference' | 'image_selection' | 'navigation_flow' => {
        const normalizedType = questionType.replace(/^cognitive_/, '').toLowerCase();
        
        switch (normalizedType) {
          case 'short_text':
          case 'long_text':
            return 'sentiment';
          case 'single_choice':
          case 'multiple_choice':
            return 'choice';
          case 'ranking':
            return 'ranking';
          case 'linear_scale':
            return 'linear_scale';
          case 'preference_test':
            return 'preference';
          case 'image_selection':
            return 'image_selection';
          case 'navigation_flow':
            return 'navigation_flow';
          default:
            const lowerType = questionType.toLowerCase();
            if (lowerType.includes('short_text') || lowerType.includes('long_text')) {
              return 'sentiment';
            }
            if (lowerType.includes('choice')) {
              return 'choice';
            }
            if (lowerType.includes('linear_scale')) {
              return 'linear_scale';
            }
            if (lowerType.includes('ranking')) {
              return 'ranking';
            }
            if (lowerType.includes('navigation_flow')) {
              return 'navigation_flow';
            }
            if (lowerType.includes('preference')) {
              return 'preference';
            }
            return 'sentiment';
        }
      };

      const getQuestionType = (questionType: string): string => {
        switch (questionType) {
          case 'cognitive_short_text':
            return 'cognitive_short_text';
          case 'cognitive_long_text':
            return 'cognitive_long_text';
          case 'cognitive_single_choice':
            return 'cognitive_single_choice';
          case 'cognitive_multiple_choice':
            return 'cognitive_multiple_choice';
          case 'cognitive_ranking':
            return 'cognitive_ranking';
          case 'cognitive_linear_scale':
            return 'cognitive_linear_scale';
          case 'cognitive_preference_test':
            return 'cognitive_preference_test';
          case 'cognitive_image_selection':
            return 'cognitive_image_selection';
          case 'cognitive_navigation_flow':
            return 'cognitive_navigation_flow';
          default:
            return questionType;
        }
      };

      const questionType = (question.type as string) || '';
      const normalizedType = questionType.replace(/^cognitive_/, '');
      const expectedQuestionKey = `cognitive_${normalizedType}`;
      
      const processedDataForQuestion = processedData.find((data) => {
        if (data.questionId === question.id) {
          return true;
        }
        
        if (data.questionKey === expectedQuestionKey) {
          return true;
        }
        
        if (data.questionKey === question.id) {
          return true;
        }
        
        if (data.questionKey && normalizedType && data.questionKey.toLowerCase().includes(normalizedType.toLowerCase())) {
          return true;
        }
        
        return false;
      });

      let transformedSentimentData: CognitiveTaskQuestion | undefined = undefined;
      if (processedDataForQuestion?.sentimentData) {
        const sentimentDataRaw = processedDataForQuestion.sentimentData as { responses: Array<{ text: string; participantId: string; timestamp: string }>; totalResponses: number };
        
        transformedSentimentData = {
          id: question.id,
          questionNumber: question.id,
          questionText: question.title || question.description || `Pregunta ${question.id}`,
          questionType: getQuestionType(question.type) as 'short_text' | 'long_text',
          required: question.required || false,
          conditionalityDisabled: question.showConditionally || false,
          sentimentResults: sentimentDataRaw.responses.map((r, index) => ({
            id: `${question.id}-${index}`,
            text: r.text || String(r.text || ''),
            sentiment: 'neutral' as const,
            selected: false,
            type: 'comment' as const
          })),
          sentimentAnalysis: {
            text: `Análisis de ${sentimentDataRaw.totalResponses} respuesta(s)`
          },
          themes: [],
          keywords: []
        };
      }

      let transformedChoiceData: ChoiceQuestionData | undefined = undefined;

      if (processedDataForQuestion?.choiceData) {
        const choiceDataRaw = processedDataForQuestion.choiceData as { choices: Array<{ id?: string; label: string; count: number; percentage: number }>; totalResponses: number };
        const configChoices = question.choices || [];
        const processedChoicesMap = new Map(
          choiceDataRaw.choices.map(c => [c.id || c.label, c])
        );
        
        configChoices.forEach((configChoice: { id?: string; text?: string; label?: string }) => {
          const choiceId = configChoice.id || '';
          const choiceText = configChoice.text || configChoice.label || '';
          const key = choiceId || choiceText;
          
          if (key && !processedChoicesMap.has(key)) {
            processedChoicesMap.set(key, {
              id: choiceId,
              label: choiceText,
              count: 0,
              percentage: 0
            });
          }
        });
        
        const orderedChoices = configChoices.length > 0
          ? configChoices.map((configChoice: { id?: string; text?: string; label?: string }, index: number) => {
              const choiceId = configChoice.id || '';
              const choiceText = configChoice.text || configChoice.label || '';
              const key = choiceId || choiceText;
              
              const processedChoice = processedChoicesMap.get(key) || {
                id: choiceId,
                label: choiceText,
                count: 0,
                percentage: 0
              };
              
              return {
                id: processedChoice.id || `${question.id}-choice-${index}`,
                text: processedChoice.label,
                count: processedChoice.count,
                percentage: processedChoice.percentage
              };
            })
          : Array.from(processedChoicesMap.values()).map((choice, index) => ({
              id: choice.id || `${question.id}-choice-${index}`,
              text: choice.label,
              count: choice.count,
              percentage: choice.percentage
            }));
        
        transformedChoiceData = {
          question: question.title || question.description || `Pregunta ${question.id}`,
          description: question.description,
          instructions: (question as any).instructions || (question as any).instruction || undefined,
          options: orderedChoices,
          totalResponses: choiceDataRaw.totalResponses,
          responseDuration: undefined
        };
      }

      let transformedLinearScaleData: LinearScaleData | undefined = undefined;

      if (processedDataForQuestion?.linearScaleData) {
        const linearScaleDataRaw = processedDataForQuestion.linearScaleData as { 
          values?: number[]; 
          responses?: Array<{ value: number; count: number }>;
          distribution?: Record<number, number>;
          scaleRange?: { start: number; end: number };
          average: number; 
          totalResponses: number 
        };
        
        const scaleRange = linearScaleDataRaw.scaleRange || 
          (question.scaleConfig ? { start: question.scaleConfig.startValue || 1, end: question.scaleConfig.endValue || 5 } : { start: 1, end: 5 });
        
        transformedLinearScaleData = {
          question: question.title || question.description || `Pregunta ${question.id}`,
          description: question.description,
          scaleRange,
          responses: linearScaleDataRaw.responses || [],
          distribution: linearScaleDataRaw.distribution || {},
          average: linearScaleDataRaw.average,
          totalResponses: linearScaleDataRaw.totalResponses
        };
      }

      let transformedRankingData: RankingQuestionData | undefined = undefined;

      if (processedDataForQuestion?.rankingData) {
        const rankingDataRaw = processedDataForQuestion.rankingData as { responses: Array<{ participantId: string; ranking: unknown; timestamp: string }>; totalResponses: number };
        const rankingMap: Record<string, { ranks: number[]; text: string }> = {};
        
        rankingDataRaw.responses.forEach(response => {
          const ranking = response.ranking;
          
          if (Array.isArray(ranking) && ranking.length > 0 && typeof ranking[0] === 'string') {
            ranking.forEach((optionText, position) => {
              const choice = question.choices?.find((c: { text: string; id?: string }) => 
                c.text === optionText || c.id === optionText
              );
              
              const optionId = choice?.id || `option-${position + 1}`;
              const text = choice?.text || optionText;
              const rank = position + 1;
              
              if (!rankingMap[optionId]) {
                rankingMap[optionId] = { ranks: [], text };
              }
              rankingMap[optionId].ranks.push(rank);
            });
          }
          // 🎯 Caso 2: Array de números (orden de preferencia: [1, 2, 3])
          else if (Array.isArray(ranking) && ranking.length > 0 && typeof ranking[0] === 'number') {
            ranking.forEach((rank, index) => {
              const optionId = question.choices?.[index]?.id || `option-${index + 1}`;
              const optionText = question.choices?.[index]?.text || `Opción ${index + 1}`;
              
              if (!rankingMap[optionId]) {
                rankingMap[optionId] = { ranks: [], text: optionText };
              }
              rankingMap[optionId].ranks.push(rank);
            });
          }
          // 🎯 Caso 3: Objeto con índices ({"option-1": 1, "option-2": 2})
          else if (typeof ranking === 'object' && ranking !== null && !Array.isArray(ranking)) {
            Object.entries(ranking as Record<string, number>).forEach(([key, rank]) => {
              const optionId = key;
              const optionText = question.choices?.find((c: { id: string; text: string }) => c.id === key)?.text || key;
              
              if (!rankingMap[optionId]) {
                rankingMap[optionId] = { ranks: [], text: optionText };
              }
              rankingMap[optionId].ranks.push(rank);
            });
          }
        });
        
        const options = Object.entries(rankingMap).map(([id, data]) => {
          const mean = data.ranks.length > 0 
            ? data.ranks.reduce((sum, rank) => sum + rank, 0) / data.ranks.length 
            : 0;
          
          const distribution: { 1: number; 2: number; 3: number; 4: number; 5: number; 6: number } = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
          };
          
          data.ranks.forEach(rank => {
            const rankKey = Math.min(Math.max(Math.round(rank), 1), 6) as 1 | 2 | 3 | 4 | 5 | 6;
            distribution[rankKey] = (distribution[rankKey] || 0) + 1;
          });
          
          return {
            id,
            text: data.text,
            mean,
            distribution,
            responseTime: '0s'
          };
        });
        
        transformedRankingData = {
          question: question.title || question.description || `Pregunta ${question.id}`,
          options
        };
      }

      let transformedPreferenceTestData: PreferenceTestData | undefined = undefined;

      if (processedDataForQuestion?.preferenceTestData) {
        const preferenceTestDataRaw = processedDataForQuestion.preferenceTestData as { preferences: Array<{ option: string; count: number; percentage: number }>; totalResponses: number };
        
        let questionFiles = question.files;
        
        if ((!questionFiles || !Array.isArray(questionFiles) || questionFiles.length === 0) && researchConfig) {
          const configQuestion = (researchConfig as any)?.questions?.find((q: any) => q.id === question.id);
          if (configQuestion?.files && Array.isArray(configQuestion.files)) {
            questionFiles = configQuestion.files;
          }
        }
        
        const filesMap = new Map<string, string>();
        if (questionFiles && Array.isArray(questionFiles)) {
          questionFiles.forEach((file: any, index: number) => {
            const fileUrl = file.url || file.preview || file.path || file.src;
            if (fileUrl) {
              const fileKey = file.name || `option-${index + 1}`;
              filesMap.set(fileKey, fileUrl);
              filesMap.set(`option-${index + 1}`, fileUrl);
            }
          });
        }
        
        const options = preferenceTestDataRaw.preferences.map((pref, index) => {
          let imageUrl: string | undefined = undefined;
          
          if (pref.option) {
            imageUrl = filesMap.get(pref.option);
          }
          
          if (!imageUrl) {
            imageUrl = filesMap.get(`option-${index + 1}`);
          }
          
          if (!imageUrl && questionFiles && Array.isArray(questionFiles) && questionFiles[index]) {
            const file = questionFiles[index] as any;
            imageUrl = file.url || file.preview || file.path || file.src;
          }
          
          return {
            id: `option-${index + 1}`,
            name: pref.option,
            image: imageUrl,
            selected: pref.count,
            percentage: pref.percentage,
            color: undefined
          };
        });
        
        transformedPreferenceTestData = {
          question: question.title || question.description || `Pregunta ${question.id}`,
          description: question.description,
          options,
          totalSelections: preferenceTestDataRaw.totalResponses,
          totalParticipants: preferenceTestDataRaw.totalResponses,
          // Agregar todas las imágenes disponibles para mostrar en miniatura
          allImages: questionFiles && Array.isArray(questionFiles) 
            ? questionFiles.map((file: any) => ({
                url: file.url || file.preview || file.path || file.src,
                name: file.name || 'Imagen',
                id: file.id || file.name
              })).filter((img: any) => img.url)
            : []
        };
      }

      let transformedNavigationFlowData: NavigationFlowData | undefined = undefined;
      
      if (processedDataForQuestion?.navigationFlowData) {
        const navigationFlowDataRaw = processedDataForQuestion.navigationFlowData as { responses: Array<{ participantId: string; data: unknown; value?: unknown; timestamp: string }>; totalResponses: number };

        const allClicksTracking: Array<{
          x: number;
          y: number;
          timestamp: number;
          hitzoneId?: string;
          imageIndex: number;
          isCorrectHitzone: boolean;
          participantId?: string;
        }> = [];
        
        const visualClickPoints: Array<{
          x: number;
          y: number;
          timestamp: number;
          isCorrect: boolean;
          imageIndex: number;
          participantId?: string;
        }> = [];
        
        const imageSelections: Record<string, {
          hitzoneId: string;
          click: {
            x: number;
            y: number;
            hitzoneWidth: number;
            hitzoneHeight: number;
          };
        }> = {};
        
        if (!navigationFlowDataRaw.responses || navigationFlowDataRaw.responses.length === 0) {
          console.warn('[CognitiveTaskResults] ⚠️ navigationFlowDataRaw.responses está vacío o no existe:', {
            hasResponses: !!navigationFlowDataRaw.responses,
            responsesLength: navigationFlowDataRaw.responses?.length,
            navigationFlowDataRaw
          });
        }
        
        navigationFlowDataRaw.responses?.forEach((response, index) => {
          const rawValue = response.data || response.value;
          
          
          const responseValue = rawValue as {
            imageSelections?: Record<string, {
              click?: { x: number; y: number };
            }>;
            clickPosition?: { x: number; y: number; hitzoneWidth?: number; hitzoneHeight?: number };
            selectedImageIndex?: number;
            selectedHitzone?: string;
            hitzoneId?: string;
            hitzoneWidth?: number;
            hitzoneHeight?: number;
            allClicksTracking?: Array<{
              x: number;
              y: number;
              timestamp: number;
              isCorrectHitzone?: boolean;
              imageIndex?: number;
            }>;
            visualClickPoints?: Array<{
              x: number;
              y: number;
              timestamp: number;
              isCorrect?: boolean;
              imageIndex?: number;
            }> | Record<string, Array<{
              x: number;
              y: number;
              timestamp: number;
              isCorrect?: boolean;
            }>>;
            [key: string]: unknown;
          };
          
          // Intentar extraer clicks de diferentes estructuras posibles
          let clicks: Array<{ x: number; y: number; timestamp: number; isCorrect: boolean; imageIndex: number }> = [];
          
          // Caso 1: imageSelections (puede venir como objeto o como string JSON)
          if (responseValue?.imageSelections) {
            let imageSelectionsObj: Record<string, unknown> = {};
            
            // Si es un objeto, usarlo directamente
            if (typeof responseValue.imageSelections === 'object' && !Array.isArray(responseValue.imageSelections) && responseValue.imageSelections !== null) {
              imageSelectionsObj = responseValue.imageSelections as Record<string, unknown>;
            }
            // Si es un string, intentar parsearlo como JSON
            else if (typeof responseValue.imageSelections === 'string') {
              try {
                const jsonString: string = responseValue.imageSelections;
                
                // Intentar parsear el JSON completo
                let parsed: unknown;
                try {
                  parsed = JSON.parse(jsonString);
                } catch (parseError) {
                  // Si falla, el string puede estar truncado. Intentar extraer objetos individuales
                  console.warn('[CognitiveTaskResults] ⚠️ Error parseando JSON completo:', (parseError as Error).message);
                  console.warn('[CognitiveTaskResults] String (primeros 200 chars):', jsonString.substring(0, 200));
                  
                  try {
                    const extracted: Record<string, { hitzoneId?: string; click: { x: number; y: number } }> = {};
                    
                    const imageIndexPattern = /"(\d+)":\s*\{[^}]*"click":\s*\{[^}]*"x":\s*([\d.]+)[^}]*"y":\s*([\d.]+)/g;
                    let match;
                    
                    while ((match = imageIndexPattern.exec(jsonString)) !== null) {
                      const imageIndex = match[1];
                      const x = parseFloat(match[2]);
                      const y = parseFloat(match[3]);
                      if (!isNaN(x) && !isNaN(y)) {
                        // Intentar extraer hitzoneId si está disponible
                        const hitzoneIdMatch = jsonString.substring(0, match.index).match(/"hitzoneId":\s*"([^"]+)"/);
                        const hitzoneId = hitzoneIdMatch ? hitzoneIdMatch[1] : undefined;
                        
                        extracted[imageIndex] = {
                          hitzoneId,
                          click: { x, y }
                        };
                      }
                    }
                    
                    if (Object.keys(extracted).length > 0) {
                      parsed = extracted;
                    } else {
                      throw parseError;
                    }
                  } catch (regexError) {
                    console.error('[CognitiveTaskResults] ❌ Error en extracción con regex:', regexError);
                    throw parseError;
                  }
                }
                
                if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
                  imageSelectionsObj = parsed as Record<string, unknown>;
                } else {
                  console.warn('[CognitiveTaskResults] ⚠️ imageSelections parseado no es un objeto válido:', typeof parsed, Array.isArray(parsed));
                }
              } catch (e) {
                console.error('[CognitiveTaskResults] ❌ Error crítico parseando imageSelections:', e);
                console.error('[CognitiveTaskResults] String completo:', responseValue.imageSelections);
                // Continuar sin romper la aplicación
              }
            } else {
              console.warn('[CognitiveTaskResults] ⚠️ imageSelections tiene tipo inesperado:', typeof responseValue.imageSelections);
            }
            
            // Procesar imageSelections parseado
            if (Object.keys(imageSelectionsObj).length > 0) {
              Object.entries(imageSelectionsObj).forEach(([imageIndexStr, selection]: [string, unknown]) => {
                const selectionObj = selection as { hitzoneId?: string; click?: { x: number; y: number; hitzoneWidth?: number; hitzoneHeight?: number } };
                if (selectionObj?.click) {
                  clicks.push({
                    x: selectionObj.click.x || 0,
                    y: selectionObj.click.y || 0,
                    timestamp: new Date(response.timestamp).getTime() || Date.now(),
                    isCorrect: true,
                    imageIndex: parseInt(imageIndexStr) || 0
                  });
                } else {
                  console.warn('[CognitiveTaskResults] ⚠️ Selection sin click:', {
                    imageIndexStr,
                    selectionObj
                  });
                }
              });
            } else {
              console.warn('[CognitiveTaskResults] ⚠️ imageSelectionsObj está vacío después del parseo');
            }
          } else {
            console.warn('[CognitiveTaskResults] ⚠️ responseValue.imageSelections es falsy');
          }
          
          // Caso 2: clickPosition (puede venir como objeto o como string JSON)
          // IMPORTANTE: clickPosition tiene el último click, que puede no estar en imageSelections
          if (responseValue?.clickPosition) {
            let clickPositionObj: { x?: number; y?: number; hitzoneWidth?: number; hitzoneHeight?: number } = {};
            
            // Si es un objeto, usarlo directamente
            if (typeof responseValue.clickPosition === 'object' && !Array.isArray(responseValue.clickPosition) && responseValue.clickPosition !== null) {
              clickPositionObj = responseValue.clickPosition as { x?: number; y?: number; hitzoneWidth?: number; hitzoneHeight?: number };
            }
            // Si es un string, intentar parsearlo como JSON
            else if (typeof responseValue.clickPosition === 'string') {
              try {
                const jsonString: string = responseValue.clickPosition;
                
                let parsed: unknown;
                try {
                  parsed = JSON.parse(jsonString);
                } catch (parseError) {
                  // Si falla, intentar extraer datos usando regex
                  console.warn('[CognitiveTaskResults] ⚠️ Error parseando clickPosition JSON completo:', (parseError as Error).message);
                  
                  // Extraer x, y, hitzoneWidth, hitzoneHeight usando regex
                  const xMatch = jsonString.match(/"x":\s*([\d.]+)/);
                  const yMatch = jsonString.match(/"y":\s*([\d.]+)/);
                  const widthMatch = jsonString.match(/"hitzoneWidth":\s*([\d.]+)/);
                  const heightMatch = jsonString.match(/"hitzoneHeight":\s*([\d.]+)/);
                  
                  if (xMatch && yMatch) {
                    const x = parseFloat(xMatch[1]);
                    const y = parseFloat(yMatch[1]);
                    const width = widthMatch ? parseFloat(widthMatch[1]) : undefined;
                    const height = heightMatch ? parseFloat(heightMatch[1]) : undefined;
                    
                    if (!isNaN(x) && !isNaN(y)) {
                      parsed = { x, y, hitzoneWidth: width, hitzoneHeight: height };
                    } else {
                      throw parseError;
                    }
                  } else {
                    throw parseError;
                  }
                }
                
                if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
                  clickPositionObj = parsed as { x?: number; y?: number; hitzoneWidth?: number; hitzoneHeight?: number };
                }
              } catch (e) {
                console.error('[CognitiveTaskResults] ❌ Error crítico parseando clickPosition:', e);
                // Continuar sin romper la aplicación
              }
            }
            
            if (clickPositionObj.x !== undefined && clickPositionObj.y !== undefined) {
              const lastImageIndex = responseValue.selectedImageIndex ?? 0;
              // Verificar si ya tenemos un click para esta imagen
              const hasClickForLastImage = clicks.some(c => c.imageIndex === lastImageIndex);
              if (!hasClickForLastImage) {
                // Agregar el click del clickPosition si no está en imageSelections
                clicks.push({
                  x: clickPositionObj.x || 0,
                  y: clickPositionObj.y || 0,
                  timestamp: new Date(response.timestamp).getTime() || Date.now(),
                  isCorrect: true,
                  imageIndex: lastImageIndex
                });
              }
            }
          }
          
          // Caso 3: allClicksTracking (puede venir como array o como string mal serializado)
          if (responseValue?.allClicksTracking && clicks.length === 0) {
            let allClicksArray: Array<{
              x?: number;
              y?: number;
              timestamp?: number;
              isCorrectHitzone?: boolean;
              imageIndex?: number;
            }> = [];
            
            // Si es un array, usarlo directamente
            if (Array.isArray(responseValue.allClicksTracking)) {
              allClicksArray = responseValue.allClicksTracking;
            }
            // Si es un string, intentar parsearlo
            else if (typeof responseValue.allClicksTracking === 'string') {
              try {
                // Intentar parsear como JSON array
                const parsed = JSON.parse(responseValue.allClicksTracking);
                if (Array.isArray(parsed)) {
                  allClicksArray = parsed;
                }
              } catch {
                // Si falla el parseo JSON, el string puede ser "[object Object],[object Object]"
                // En este caso, necesitamos extraer los datos de imageSelections o visualClickPoints
                console.warn('[CognitiveTaskResults] allClicksTracking viene como string mal formateado:', responseValue.allClicksTracking);
              }
            }
            
            if (allClicksArray.length > 0) {
              clicks = allClicksArray.map((click: {
                x?: number;
                y?: number;
                timestamp?: number;
                isCorrectHitzone?: boolean;
                imageIndex?: number;
              }) => ({
                x: click.x || 0,
                y: click.y || 0,
                timestamp: click.timestamp || new Date(response.timestamp).getTime() || Date.now(),
                isCorrect: click.isCorrectHitzone !== false,
                imageIndex: click.imageIndex ?? 0
              }));
            }
          }
          
          // Caso 4: visualClickPoints es un array plano de objetos con imageIndex
          if (Array.isArray(responseValue?.visualClickPoints) && clicks.length === 0) {
            const visualPoints = Array.isArray(responseValue.visualClickPoints) 
              ? responseValue.visualClickPoints 
              : [];
            clicks = visualPoints.map((point: {
              x?: number;
              y?: number;
              timestamp?: number;
              isCorrect?: boolean;
              imageIndex?: number;
            }) => ({
              x: point.x || 0,
              y: point.y || 0,
              timestamp: point.timestamp || new Date(response.timestamp).getTime() || Date.now(),
              isCorrect: point.isCorrect !== false,
              imageIndex: point.imageIndex ?? 0
            }));
          }
          
          // Caso 5: visualClickPoints es un objeto con índices de imagen
          else if (responseValue?.visualClickPoints && typeof responseValue.visualClickPoints === 'object' && !Array.isArray(responseValue.visualClickPoints) && clicks.length === 0) {
            Object.entries(responseValue.visualClickPoints).forEach(([imageIndexStr, imageClicks]: [string, unknown]) => {
              if (Array.isArray(imageClicks)) {
                const clicksArray = imageClicks as Array<{
                  x?: number;
                  y?: number;
                  timestamp?: number;
                  isCorrect?: boolean;
                  imageIndex?: number;
                }>;
                clicksArray.forEach((point) => {
                  clicks.push({
                    x: point.x || 0,
                    y: point.y || 0,
                    timestamp: point.timestamp || new Date(response.timestamp).getTime() || Date.now(),
                    isCorrect: point.isCorrect !== false,
                    imageIndex: (point.imageIndex ?? parseInt(imageIndexStr)) || 0
                  });
                });
              }
            });
          }
          
          // Procesar cada click encontrado
          if (clicks.length > 0) {
            clicks.forEach((click) => {
            const x = click.x || 0;
            const y = click.y || 0;
            const imageIndex = click.imageIndex ?? 0;
            const hitzoneId = (typeof responseValue?.selectedHitzone === 'string' ? responseValue.selectedHitzone : undefined) 
              || (typeof responseValue?.hitzoneId === 'string' ? responseValue.hitzoneId : undefined) 
              || `hitzone-${index}`;
            const isCorrect = click.isCorrect !== false;
            const timestamp = click.timestamp || new Date(response.timestamp).getTime() || Date.now();
          
            // Agregar a allClicksTracking
            allClicksTracking.push({
              x,
              y,
              timestamp,
              hitzoneId,
              imageIndex,
              isCorrectHitzone: isCorrect,
              participantId: response.participantId
            });
            
            // Agregar a visualClickPoints
            visualClickPoints.push({
              x,
              y,
              timestamp,
              isCorrect,
              imageIndex,
              participantId: response.participantId
            });
            
            // Agregar a imageSelections
            const selectionKey = `${response.participantId}-${imageIndex}-${allClicksTracking.length}`;
            imageSelections[selectionKey] = {
              hitzoneId,
              click: {
                x,
                y,
                hitzoneWidth: (typeof responseValue?.clickPosition === 'object' && responseValue.clickPosition && 'hitzoneWidth' in responseValue.clickPosition ? (responseValue.clickPosition as { hitzoneWidth?: number }).hitzoneWidth : undefined) 
                  || (typeof responseValue?.hitzoneWidth === 'number' ? responseValue.hitzoneWidth : undefined) 
                  || 50,
                hitzoneHeight: (typeof responseValue?.clickPosition === 'object' && responseValue.clickPosition && 'hitzoneHeight' in responseValue.clickPosition ? (responseValue.clickPosition as { hitzoneHeight?: number }).hitzoneHeight : undefined) 
                  || (typeof responseValue?.hitzoneHeight === 'number' ? responseValue.hitzoneHeight : undefined) 
                  || 50
              }
            };
          });
          } else {
            console.warn('[CognitiveTaskResults] ⚠️ No se encontraron clicks para procesar en la respuesta:', {
              index,
              participantId: response.participantId,
              responseValueKeys: Object.keys(responseValue || {}),
              responseValue,
              imageSelectionsType: typeof responseValue?.imageSelections,
              imageSelectionsValue: responseValue?.imageSelections,
              clickPositionType: typeof responseValue?.clickPosition,
              clickPositionValue: responseValue?.clickPosition,
              responseData: response.data,
              responseValueType: typeof responseValue
            });
          }
        });
        
        let questionFiles = question.files;
        
        if ((!questionFiles || !Array.isArray(questionFiles) || questionFiles.length === 0) && researchConfig) {
          const configQuestion = (researchConfig as any)?.questions?.find((q: any) => q.id === question.id);
          if (configQuestion?.files && Array.isArray(configQuestion.files)) {
            questionFiles = configQuestion.files;
          }
        }
        
        const filesArray = Array.isArray(questionFiles) ? questionFiles : [];
        
        const transformedFiles = filesArray.map((file: any) => {
          if (typeof file === 'string') {
            return {
              id: `file-${Date.now()}-${Math.random()}`,
              url: file,
              name: `Imagen ${filesArray.indexOf(file) + 1}`,
              hitZones: []
            };
          } else if (file && typeof file === 'object') {
            return {
              id: file.id || file.s3Key || `file-${Date.now()}-${Math.random()}`,
              url: file.url || file.s3Url || file.s3Key || '',
              name: file.name || file.fileName || `Imagen ${filesArray.indexOf(file) + 1}`,
              hitZones: Array.isArray(file.hitZones) ? file.hitZones : (Array.isArray(file.hitzones) ? file.hitzones : [])
            };
          }
          return null;
        }).filter((f): f is NonNullable<typeof f> => f !== null);
      
        const uniqueParticipants = new Set(
          navigationFlowDataRaw.responses.map(r => r.participantId).filter(Boolean)
        );
        const totalParticipants = uniqueParticipants.size;

        transformedNavigationFlowData = {
          question: question.title || question.description || `Pregunta ${question.id}`,
          totalSelections: navigationFlowDataRaw.totalResponses,
          totalParticipants,
          researchId: researchId || '',
          imageSelections,
          visualClickPoints,
          allClicksTracking,
          files: transformedFiles
        };
      }

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
        ratingData: (processedDataForQuestion as any)?.ratingData,
        preferenceTestData: transformedPreferenceTestData,
        imageSelectionData: (processedDataForQuestion as any)?.imageSelectionData,
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
