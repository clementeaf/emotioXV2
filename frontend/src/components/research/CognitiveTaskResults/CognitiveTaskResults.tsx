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


interface ProcessedDataItem {
  questionId: string;
  questionKey: string;
  sentimentData?: {
    responses: Array<{ text: string; participantId: string; timestamp: string }>;
    totalResponses: number;
  };
  choiceData?: {
    choices: Array<{ label: string; count: number; percentage: number }>;
    totalResponses: number;
  };
  linearScaleData?: {
    values: number[];
    average: number;
    totalResponses: number;
  };
  rankingData?: {
    responses: Array<{ participantId: string; ranking: unknown; timestamp: string }>;
    totalResponses: number;
  };
  preferenceTestData?: {
    preferences: Array<{ option: string; count: number; percentage: number }>;
    totalResponses: number;
  };
  navigationFlowData?: {
    responses: Array<{ participantId: string; data: unknown; value?: unknown; timestamp: string }>;
    totalResponses: number;
  };
  [key: string]: unknown;
}

export const CognitiveTaskResults: React.FC<CognitiveTaskResultsProps> = ({ researchId: propResearchId }) => {
  const params = useParams();
  // Normalizar researchId para evitar cambios que causen re-renders
  const researchId = React.useMemo(() => {
    return propResearchId || params?.research as string || params?.id as string || null;
  }, [propResearchId, params?.research, params?.id]);

  // Hook para obtener respuestas y configuración de CognitiveTask
  const {
    researchConfig,
    processedData,
    isLoading,
    isError,
    error,
    refetch
  } = useCognitiveTaskResponses(researchId);



  // Mostrar loading
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

  // Mostrar error
  if (isError && error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return (
      <div className="space-y-6">
        <CognitiveTaskHeader title="2.0.- Cognitive task" />
        <ErrorState error={errorMessage} onRetry={refetch} />
      </div>
    );
  }

  // Crear preguntas desde la configuración real del backend
  const createQuestionsFromConfig = () => {
    if (!researchConfig || !(researchConfig as any)?.questions) {
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

  // Usar datos procesados cuando estén disponibles, o las preguntas de configuración
  let finalQuestions;

  const config = (researchConfig as unknown) as ResearchConfig | null;
  if (config?.questions) {
    // Siempre usar preguntas de configuración cuando estén disponibles
    finalQuestions = config.questions.map((question: ResearchConfigQuestion) => {
      // Mapear tipos de pregunta cognitiva a tipos de visualización
      // El questionType puede venir con o sin prefijo 'cognitive_' (ej: 'short_text' o 'cognitive_short_text')
      const getViewType = (questionType: string): 'sentiment' | 'choice' | 'ranking' | 'linear_scale' | 'preference' | 'image_selection' | 'navigation_flow' => {
        // Normalizar el tipo de pregunta (remover prefijo si existe)
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
            // Fallback: intentar detectar por el tipo original
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

      // Mapear tipos de pregunta a tipos de visualización
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

      // Buscar datos procesados correspondientes a esta pregunta
      // El questionKey del endpoint tiene formato: "cognitive_short_text", "cognitive_long_text", etc.
      // El question.id de la configuración puede ser: "3.1", "3.2", etc.
      // El question.type puede ser: "short_text", "long_text", etc. (sin prefijo cognitive_)
      const questionType = (question.type as string) || '';
      const normalizedType = questionType.replace(/^cognitive_/, ''); // Remover prefijo si existe
      const expectedQuestionKey = `cognitive_${normalizedType}`;
      
      // 🎯 DEBUG: Log para diagnosticar matching de datos
      if (processedData && processedData.length > 0) {
        console.log(`[CognitiveTaskResults] Buscando datos para pregunta:`, {
          questionId: question.id,
          questionType: question.type,
          normalizedType,
          expectedQuestionKey,
          availableDataKeys: processedData.map(d => ({ questionId: d.questionId, questionKey: d.questionKey }))
        });
      }
      
      const processedDataForQuestion = processedData.find((data) => {
        // 1. Comparar por questionId directo
        if (data.questionId === question.id) {
          console.log(`[CognitiveTaskResults] ✅ Match por questionId: ${data.questionId} === ${question.id}`);
          return true;
        }
        
        // 2. Comparar questionKey del endpoint con el esperado desde question.type
        if (data.questionKey === expectedQuestionKey) {
          console.log(`[CognitiveTaskResults] ✅ Match por questionKey: ${data.questionKey} === ${expectedQuestionKey}`);
          return true;
        }
        
        // 3. Comparar questionKey con question.id (por si el questionKey es el mismo que el id)
        if (data.questionKey === question.id) {
          console.log(`[CognitiveTaskResults] ✅ Match por questionKey === question.id: ${data.questionKey}`);
          return true;
        }
        
        // 4. Comparar si el questionKey contiene el tipo de pregunta (más flexible)
        if (data.questionKey && normalizedType && data.questionKey.toLowerCase().includes(normalizedType.toLowerCase())) {
          console.log(`[CognitiveTaskResults] ✅ Match por contains: ${data.questionKey} contiene ${normalizedType}`);
          return true;
        }
        
        return false;
      });
      
      // 🎯 DEBUG: Log si no se encontraron datos
      if (!processedDataForQuestion && processedData && processedData.length > 0) {
        console.warn(`[CognitiveTaskResults] ⚠️ No se encontraron datos procesados para pregunta:`, {
          questionId: question.id,
          questionType: question.type,
          expectedQuestionKey,
          totalProcessedData: processedData.length
        });
      }

      // Transformar sentimentData al formato que espera MainContent (CognitiveTaskQuestion)
      let transformedSentimentData: {
        id: string;
        questionNumber: string;
        questionText: string;
        questionType: 'short_text' | 'long_text';
        required: boolean;
        conditionalityDisabled: boolean;
        sentimentResults: Array<{
          id: string;
          text: string;
          sentiment: 'neutral';
          selected: boolean;
          type: 'comment';
        }>;
        sentimentAnalysis: {
          text: string;
        };
        themes: unknown[];
        keywords: unknown[];
      } | undefined = undefined;
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
            text: r.text || String(r.text || ''), // Asegurar que siempre sea string
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

      // Transformar choiceData al formato que espera ChoiceResults
      let transformedChoiceData: {
        question: string;
        description?: string;
        instructions?: string;
        options: Array<{
          id: string;
          text: string;
          count: number;
          percentage: number;
        }>;
        totalResponses: number;
        responseDuration?: unknown;
      } | undefined = undefined;
      if (processedDataForQuestion?.choiceData) {
        const choiceDataRaw = processedDataForQuestion.choiceData as { choices: Array<{ id?: string; label: string; count: number; percentage: number }>; totalResponses: number };
        
        // 🎯 Asegurar que todas las opciones de la configuración estén incluidas
        // Si hay opciones en la configuración que no están en choiceDataRaw, agregarlas con 0%
        const configChoices = question.choices || [];
        const processedChoicesMap = new Map(
          choiceDataRaw.choices.map(c => [c.id || c.label, c])
        );
        
        // Agregar opciones de configuración que no están en los datos procesados
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
        
        // Ordenar opciones según el orden de la configuración
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

      // Transformar linearScaleData al formato que espera LinearScaleResults
      let transformedLinearScaleData: {
        question: string;
        description?: string;
        scaleRange: { start: number; end: number };
        values?: number[];
        responses?: Array<{ value: number; count: number }>;
        distribution?: Record<number, number>;
        average: number;
        totalResponses: number;
      } | undefined = undefined;
      if (processedDataForQuestion?.linearScaleData) {
        const linearScaleDataRaw = processedDataForQuestion.linearScaleData as { 
          values?: number[]; 
          responses?: Array<{ value: number; count: number }>;
          distribution?: Record<number, number>;
          scaleRange?: { start: number; end: number };
          average: number; 
          totalResponses: number 
        };
        
        // Usar scaleRange de los datos procesados o de la configuración
        const scaleRange = linearScaleDataRaw.scaleRange || 
          (question.scaleConfig ? { start: question.scaleConfig.startValue || 1, end: question.scaleConfig.endValue || 5 } : { start: 1, end: 5 });
        
        transformedLinearScaleData = {
          question: question.title || question.description || `Pregunta ${question.id}`,
          description: question.description,
          scaleRange,
          values: linearScaleDataRaw.values,
          responses: linearScaleDataRaw.responses,
          distribution: linearScaleDataRaw.distribution,
          average: linearScaleDataRaw.average,
          totalResponses: linearScaleDataRaw.totalResponses
        };
      }

      // Transformar rankingData al formato que espera RankingResults
      let transformedRankingData: {
        question: string;
        options: Array<{
          id: string;
          text: string;
          mean: number;
          distribution: { 1: number; 2: number; 3: number; 4: number; 5: number; 6: number };
          responseTime: string;
        }>;
        responses: Array<{ participantId: string; ranking: unknown; timestamp: string }>;
        totalResponses: number;
      } | undefined = undefined;
      if (processedDataForQuestion?.rankingData) {
        const rankingDataRaw = processedDataForQuestion.rankingData as { responses: Array<{ participantId: string; ranking: unknown; timestamp: string }>; totalResponses: number };
        
        // Procesar responses para construir options
        // Agrupar rankings por opción y calcular mean, distribution
        const rankingMap: Record<string, { ranks: number[]; text: string }> = {};
        
        rankingDataRaw.responses.forEach(response => {
          const ranking = response.ranking;
          
          // 🎯 Caso 1: Array de strings (orden de preferencia: ["Opción A", "Opción B", "Opción C"])
          if (Array.isArray(ranking) && ranking.length > 0 && typeof ranking[0] === 'string') {
            ranking.forEach((optionText, position) => {
              // Buscar la opción en question.choices por texto
              const choice = question.choices?.find((c: { text: string; id?: string }) => 
                c.text === optionText || c.id === optionText
              );
              
              const optionId = choice?.id || `option-${position + 1}`;
              const text = choice?.text || optionText;
              const rank = position + 1; // Posición en el ranking (1-based)
              
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
        
        // Construir options con mean y distribution
        const options = Object.entries(rankingMap).map(([id, data]) => {
          const mean = data.ranks.length > 0 
            ? data.ranks.reduce((sum, rank) => sum + rank, 0) / data.ranks.length 
            : 0;
          
          // Construir distribution (1-6)
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
          options,
          responses: rankingDataRaw.responses,
          totalResponses: rankingDataRaw.totalResponses
        };
      }

      // Transformar preferenceTestData al formato que espera PreferenceTestResults
      let transformedPreferenceTestData: {
        question: string;
        description?: string;
        options: Array<{
          id: string;
          name: string;
          image?: unknown;
          selected: number;
          percentage: number;
          color?: unknown;
        }>;
        totalSelections: number;
        totalParticipants: number;
      } | undefined = undefined;
      if (processedDataForQuestion?.preferenceTestData) {
        const preferenceTestDataRaw = processedDataForQuestion.preferenceTestData as { preferences: Array<{ option: string; count: number; percentage: number }>; totalResponses: number };
        
        // Transformar preferences a options con la estructura esperada
        const options = preferenceTestDataRaw.preferences.map((pref, index) => ({
          id: `option-${index + 1}`,
          name: pref.option,
          image: undefined, // Se puede agregar si hay imágenes en la pregunta
          selected: pref.count,
          percentage: pref.percentage,
          color: undefined // Se puede agregar si hay colores definidos
        }));
        
        transformedPreferenceTestData = {
          question: question.title || question.description || `Pregunta ${question.id}`,
          description: question.description,
          options,
          totalSelections: preferenceTestDataRaw.totalResponses,
          totalParticipants: preferenceTestDataRaw.totalResponses
        };
      }

      // Transformar navigationFlowData al formato que espera NavigationFlowResults
      let transformedNavigationFlowData: {
        question: string;
        allClicksTracking: Array<{
          x: number;
          y: number;
          timestamp: number;
          hitzoneId?: string;
          imageIndex: number;
          isCorrectHitzone: boolean;
          participantId?: string;
        }>;
        visualClickPoints: Array<{
          x: number;
          y: number;
          timestamp: number;
          isCorrect: boolean;
          imageIndex: number;
          participantId?: string;
        }>;
        imageSelections: Record<string, {
          hitzoneId: string;
          click: {
            x: number;
            y: number;
            hitzoneWidth: number;
            hitzoneHeight: number;
          };
        }>;
        totalResponses: number;
        [key: string]: unknown;
      } | undefined = undefined;
      
      // 🎯 DEBUG: Log de processedDataForQuestion
      console.log('[CognitiveTaskResults] processedDataForQuestion para NavigationFlow:', {
        hasProcessedData: !!processedDataForQuestion,
        hasNavigationFlowData: !!processedDataForQuestion?.navigationFlowData,
        navigationFlowDataType: typeof processedDataForQuestion?.navigationFlowData,
        navigationFlowData: processedDataForQuestion?.navigationFlowData,
        processedDataKeys: processedDataForQuestion ? Object.keys(processedDataForQuestion) : []
      });
      
      if (processedDataForQuestion?.navigationFlowData) {
        const navigationFlowDataRaw = processedDataForQuestion.navigationFlowData as { responses: Array<{ participantId: string; data: unknown; value?: unknown; timestamp: string }>; totalResponses: number };
        
        // 🎯 DEBUG: Log de navigationFlowDataRaw
        console.log('[CognitiveTaskResults] navigationFlowDataRaw:', {
          hasNavigationFlowData: !!processedDataForQuestion.navigationFlowData,
          totalResponses: navigationFlowDataRaw?.totalResponses,
          responsesCount: navigationFlowDataRaw?.responses?.length || 0,
          responses: navigationFlowDataRaw?.responses,
          navigationFlowDataRawKeys: navigationFlowDataRaw ? Object.keys(navigationFlowDataRaw) : []
        });
        
        // Procesar responses para construir allClicksTracking y visualClickPoints
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
        
        // 🎯 DEBUG: Verificar que responses existe y tiene elementos
        if (!navigationFlowDataRaw.responses || navigationFlowDataRaw.responses.length === 0) {
          console.warn('[CognitiveTaskResults] ⚠️ navigationFlowDataRaw.responses está vacío o no existe:', {
            hasResponses: !!navigationFlowDataRaw.responses,
            responsesLength: navigationFlowDataRaw.responses?.length,
            navigationFlowDataRaw
          });
        }
        
        navigationFlowDataRaw.responses?.forEach((response, index) => {
          // El data viene de r.value mapeado en useCognitiveTaskResponses.ts
          // En useCognitiveTaskResponses.ts línea 232: data: r.value
          // El backend ahora parsea los campos críticos (imageSelections, clickPosition, etc.)
          const rawValue = response.data || response.value;
          
          // 🎯 DEBUG: Log del valor crudo antes de cualquier procesamiento
          console.log('[CognitiveTaskResults] 🔍 Valor crudo de la respuesta:', {
            index,
            participantId: response.participantId,
            rawValueType: typeof rawValue,
            rawValue,
            hasData: !!response.data,
            hasValue: !!response.value
          });
          
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
          
          // 🎯 DEBUG: Log de respuesta recibida
          console.log('[CognitiveTaskResults] Procesando respuesta NavigationFlow:', {
            index,
            participantId: response.participantId,
            hasData: !!response.data,
            hasValue: !!response.value,
            responseValueKeys: responseValue ? Object.keys(responseValue) : [],
            hasImageSelections: !!responseValue?.imageSelections,
            imageSelectionsType: typeof responseValue?.imageSelections,
            imageSelectionsValue: responseValue?.imageSelections,
            hasClickPosition: !!responseValue?.clickPosition,
            clickPositionType: typeof responseValue?.clickPosition,
            clickPositionValue: responseValue?.clickPosition
          });
          
          // Intentar extraer clicks de diferentes estructuras posibles
          let clicks: Array<{ x: number; y: number; timestamp: number; isCorrect: boolean; imageIndex: number }> = [];
          
          // Caso 1: imageSelections (puede venir como objeto o como string JSON)
          if (responseValue?.imageSelections) {
            let imageSelectionsObj: Record<string, unknown> = {};
            
            // Si es un objeto, usarlo directamente
            if (typeof responseValue.imageSelections === 'object' && !Array.isArray(responseValue.imageSelections) && responseValue.imageSelections !== null) {
              imageSelectionsObj = responseValue.imageSelections as Record<string, unknown>;
              console.log('[CognitiveTaskResults] ✅ imageSelections es objeto, usando directamente');
            }
            // Si es un string, intentar parsearlo como JSON
            else if (typeof responseValue.imageSelections === 'string') {
              try {
                const jsonString: string = responseValue.imageSelections;
                console.log('[CognitiveTaskResults] 🔄 Parseando imageSelections como JSON, longitud:', jsonString.length);
                
                // Intentar parsear el JSON completo
                let parsed: unknown;
                try {
                  parsed = JSON.parse(jsonString);
                } catch (parseError) {
                  // Si falla, el string puede estar truncado. Intentar extraer objetos individuales
                  console.warn('[CognitiveTaskResults] ⚠️ Error parseando JSON completo:', (parseError as Error).message);
                  console.warn('[CognitiveTaskResults] String (primeros 200 chars):', jsonString.substring(0, 200));
                  
                  // Intentar extraer objetos individuales usando regex (para casos donde el JSON está truncado)
                  // Buscar patrones como "0":{"hitzoneId":"...","click":{"x":...,"y":...}}
                  try {
                    const extracted: Record<string, { hitzoneId?: string; click: { x: number; y: number } }> = {};
                    
                    // Buscar todos los índices de imagen y sus clicks
                    // Patrón: "0":{"hitzoneId":"...","click":{"x":...,"y":...
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
                        console.log('[CognitiveTaskResults] ✅ Extraído click para imagen', imageIndex, 'x:', x, 'y:', y, 'hitzoneId:', hitzoneId);
                      }
                    }
                    
                    if (Object.keys(extracted).length > 0) {
                      parsed = extracted;
                      console.log('[CognitiveTaskResults] ✅ Extraídos', Object.keys(extracted).length, 'clicks usando regex');
                    } else {
                      throw parseError;
                    }
                  } catch (regexError) {
                    console.error('[CognitiveTaskResults] ❌ Error en extracción con regex:', regexError);
                    // Si la extracción con regex también falla, lanzar el error original
                    throw parseError;
                  }
                }
                
                if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
                  imageSelectionsObj = parsed as Record<string, unknown>;
                  console.log('[CognitiveTaskResults] ✅ imageSelections parseado exitosamente, keys:', Object.keys(imageSelectionsObj));
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
            
            // 🎯 DEBUG: Log de imageSelections parseado
            console.log('[CognitiveTaskResults] imageSelections parseado:', {
              isString: typeof responseValue.imageSelections === 'string',
              entriesCount: Object.keys(imageSelectionsObj).length,
              imageSelectionsObj,
              imageSelectionsObjKeys: Object.keys(imageSelectionsObj)
            });
            
            // Procesar imageSelections parseado
            if (Object.keys(imageSelectionsObj).length > 0) {
              Object.entries(imageSelectionsObj).forEach(([imageIndexStr, selection]: [string, unknown]) => {
                const selectionObj = selection as { hitzoneId?: string; click?: { x: number; y: number; hitzoneWidth?: number; hitzoneHeight?: number } };
                console.log('[CognitiveTaskResults] Procesando selection:', {
                  imageIndexStr,
                  selection,
                  hasClick: !!selectionObj?.click,
                  click: selectionObj?.click
                });
                if (selectionObj?.click) {
                  clicks.push({
                    x: selectionObj.click.x || 0,
                    y: selectionObj.click.y || 0,
                    timestamp: new Date(response.timestamp).getTime() || Date.now(),
                    isCorrect: true,
                    imageIndex: parseInt(imageIndexStr) || 0
                  });
                  console.log('[CognitiveTaskResults] ✅ Click agregado desde imageSelections:', {
                    imageIndex: parseInt(imageIndexStr) || 0,
                    x: selectionObj.click.x,
                    y: selectionObj.click.y
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
              console.log('[CognitiveTaskResults] ✅ clickPosition es objeto, usando directamente');
            }
            // Si es un string, intentar parsearlo como JSON
            else if (typeof responseValue.clickPosition === 'string') {
              try {
                const jsonString: string = responseValue.clickPosition;
                console.log('[CognitiveTaskResults] 🔄 Parseando clickPosition como JSON, longitud:', jsonString.length);
                
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
                      console.log('[CognitiveTaskResults] ✅ Extraído clickPosition usando regex:', { x, y, width, height });
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
          
        // 🎯 DEBUG: Log de clicks encontrados antes de procesarlos
        console.log('[CognitiveTaskResults] Clicks encontrados antes de procesar:', {
          clicksCount: clicks.length,
          clicks: clicks,
          responseValue: responseValue,
          hasImageSelections: !!responseValue?.imageSelections,
          hasClickPosition: !!responseValue?.clickPosition,
          hasAllClicksTracking: !!responseValue?.allClicksTracking,
          hasVisualClickPoints: !!responseValue?.visualClickPoints
        });
          
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
        
        // Incluir hitzones de cada archivo en los files (si files existe y es array)
        // Los files pueden venir en question.files o en la configuración completa
        let questionFiles = question.files;
        
        // 🎯 Si no hay files en question, buscar en researchConfig directamente
        if ((!questionFiles || !Array.isArray(questionFiles) || questionFiles.length === 0) && researchConfig) {
          const configQuestion = (researchConfig as any)?.questions?.find((q: any) => q.id === question.id);
          if (configQuestion?.files && Array.isArray(configQuestion.files)) {
            questionFiles = configQuestion.files;
            console.log(`[CognitiveTaskResults] NavigationFlow - files encontrados en researchConfig:`, {
              questionId: question.id,
              filesCount: configQuestion.files.length
            });
          }
        }
        
        const filesArray = Array.isArray(questionFiles) ? questionFiles : [];
        
        // 🎯 Transformar files al formato esperado por NavigationFlowResults
        const transformedFiles = filesArray.map((file: any) => {
          // El archivo puede venir en diferentes formatos
          if (typeof file === 'string') {
            // Si es solo una URL string
            return {
              id: `file-${Date.now()}-${Math.random()}`,
              url: file,
              name: `Imagen ${filesArray.indexOf(file) + 1}`,
              hitZones: []
            };
          } else if (file && typeof file === 'object') {
            // Si es un objeto con propiedades
            return {
              id: file.id || file.s3Key || `file-${Date.now()}-${Math.random()}`,
              url: file.url || file.s3Url || file.s3Key || '',
              name: file.name || file.fileName || `Imagen ${filesArray.indexOf(file) + 1}`,
              hitZones: Array.isArray(file.hitZones) ? file.hitZones : (Array.isArray(file.hitzones) ? file.hitzones : [])
            };
          }
          return null;
        }).filter((f): f is NonNullable<typeof f> => f !== null);
        
        // 🎯 DEBUG: Log de files disponibles
        console.log(`[CognitiveTaskResults] NavigationFlow - files disponibles:`, {
          questionId: question.id,
          questionFiles,
          filesArrayLength: filesArray.length,
          transformedFilesLength: transformedFiles.length,
          transformedFiles: transformedFiles
        });
        
        // 🎯 Calcular totalParticipants desde las respuestas únicas
        const uniqueParticipants = new Set(
          navigationFlowDataRaw.responses.map(r => r.participantId).filter(Boolean)
        );
        const totalParticipants = uniqueParticipants.size;

        transformedNavigationFlowData = {
          question: question.title || question.description || `Pregunta ${question.id}`,
          totalResponses: navigationFlowDataRaw.totalResponses,
          totalParticipants,
          imageSelections,
          visualClickPoints,
          allClicksTracking,
          files: transformedFiles // 🎯 CRÍTICO: Incluir files transformados para mostrar las imágenes
        };
        
        // 🎯 DEBUG: Log de datos transformados
        console.log(`[CognitiveTaskResults] NavigationFlow - datos transformados:`, {
          questionId: question.id,
          totalResponses: transformedNavigationFlowData.totalResponses,
          totalParticipants: transformedNavigationFlowData.totalParticipants,
          filesCount: Array.isArray(transformedNavigationFlowData.files) ? transformedNavigationFlowData.files.length : 0,
          visualClickPointsCount: Array.isArray(transformedNavigationFlowData.visualClickPoints) ? transformedNavigationFlowData.visualClickPoints.length : 0,
          allClicksTrackingCount: Array.isArray(transformedNavigationFlowData.allClicksTracking) ? transformedNavigationFlowData.allClicksTracking.length : 0,
          visualClickPoints: transformedNavigationFlowData.visualClickPoints,
          allClicksTracking: transformedNavigationFlowData.allClicksTracking
        });
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
      
      // 🎯 DEBUG: Log de datos finales para la pregunta
      if (processedDataForQuestion) {
        console.log(`[CognitiveTaskResults] 📊 Datos finales para pregunta ${question.id}:`, {
          viewType: questionData.viewType,
          hasSentimentData: !!questionData.sentimentData,
          hasChoiceData: !!questionData.choiceData,
          hasRankingData: !!questionData.rankingData,
          hasLinearScaleData: !!questionData.linearScaleData,
          hasPreferenceTestData: !!questionData.preferenceTestData,
          hasNavigationFlowData: !!questionData.navigationFlowData,
          totalResponses: processedDataForQuestion.totalResponses || 0
        });
      }
      
      return questionData;
    });
  } else {
    // Fallback con preguntas temporales
    finalQuestions = createQuestionsFromConfig();
  }

  return (
    <div className="flex gap-8">
      <div className="flex-1 space-y-6">
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
