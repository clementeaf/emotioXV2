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

    return (researchConfig as any).questions.map((question: any) => {
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

  if ((researchConfig as any)?.questions) {
    // Siempre usar preguntas de configuración cuando estén disponibles
    finalQuestions = (researchConfig as any).questions.map((question: any) => {
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
      
      const processedDataForQuestion = processedData.find((data: any) => {
        // 1. Comparar por questionId directo
        if (data.questionId === question.id) {
          return true;
        }
        
        // 2. Comparar questionKey del endpoint con el esperado desde question.type
        if (data.questionKey === expectedQuestionKey) {
          return true;
        }
        
        // 3. Comparar questionKey con question.id (por si el questionKey es el mismo que el id)
        if (data.questionKey === question.id) {
          return true;
        }
        
        // 4. Comparar si el questionKey contiene el tipo de pregunta (más flexible)
        if (data.questionKey && normalizedType && data.questionKey.toLowerCase().includes(normalizedType.toLowerCase())) {
          return true;
        }
        
        return false;
      });

      // Transformar sentimentData al formato que espera MainContent (CognitiveTaskQuestion)
      let transformedSentimentData: any = undefined;
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
      let transformedChoiceData: any = undefined;
      if (processedDataForQuestion?.choiceData) {
        const choiceDataRaw = processedDataForQuestion.choiceData as { choices: Array<{ label: string; count: number; percentage: number }>; totalResponses: number };
        transformedChoiceData = {
          question: question.title || question.description || `Pregunta ${question.id}`,
          description: question.description,
          options: choiceDataRaw.choices.map((choice, index) => ({
            id: `${question.id}-choice-${index}`,
            text: choice.label,
            count: choice.count,
            percentage: choice.percentage
          })),
          totalResponses: choiceDataRaw.totalResponses,
          responseDuration: undefined
        };
      }

      // Transformar linearScaleData al formato que espera LinearScaleResults
      let transformedLinearScaleData: any = undefined;
      if (processedDataForQuestion?.linearScaleData) {
        const linearScaleDataRaw = processedDataForQuestion.linearScaleData as { values: number[]; average: number; totalResponses: number };
        transformedLinearScaleData = {
          question: question.title || question.description || `Pregunta ${question.id}`,
          description: question.description,
          scaleRange: question.scaleConfig || { startValue: 1, endValue: 5 },
          values: linearScaleDataRaw.values,
          average: linearScaleDataRaw.average,
          totalResponses: linearScaleDataRaw.totalResponses
        };
      }

      // Transformar rankingData al formato que espera RankingResults
      let transformedRankingData: any = undefined;
      if (processedDataForQuestion?.rankingData) {
        const rankingDataRaw = processedDataForQuestion.rankingData as { responses: Array<{ participantId: string; ranking: unknown; timestamp: string }>; totalResponses: number };
        
        // Procesar responses para construir options
        // Agrupar rankings por opción y calcular mean, distribution
        const rankingMap: Record<string, { ranks: number[]; text: string }> = {};
        
        rankingDataRaw.responses.forEach(response => {
          const ranking = response.ranking;
          if (Array.isArray(ranking)) {
            ranking.forEach((rank, index) => {
              const optionId = `option-${index + 1}`;
              const optionText = question.choices?.[index]?.text || `Opción ${index + 1}`;
              
              if (!rankingMap[optionId]) {
                rankingMap[optionId] = { ranks: [], text: optionText };
              }
              rankingMap[optionId].ranks.push(rank);
            });
          } else if (typeof ranking === 'object' && ranking !== null) {
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
      let transformedPreferenceTestData: any = undefined;
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
      let transformedNavigationFlowData: any = undefined;
      if (processedDataForQuestion?.navigationFlowData) {
        const navigationFlowDataRaw = processedDataForQuestion.navigationFlowData as { responses: Array<{ participantId: string; data: unknown; value?: unknown; timestamp: string }>; totalResponses: number };
        
        
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
        
        navigationFlowDataRaw.responses.forEach((response, index) => {
          // El data viene de r.value mapeado en useCognitiveTaskResponses.ts
          // En useCognitiveTaskResponses.ts línea 232: data: r.value
          // El backend ahora parsea los campos críticos (imageSelections, clickPosition, etc.)
          const responseValue = (response.data || response.value) as any;
          
          // Intentar extraer clicks de diferentes estructuras posibles
          let clicks: Array<{ x: number; y: number; timestamp: number; isCorrect: boolean; imageIndex: number }> = [];
          
          // Caso 1: imageSelections (ya parseado por el backend)
          if (responseValue?.imageSelections && typeof responseValue.imageSelections === 'object') {
            Object.entries(responseValue.imageSelections).forEach(([imageIndexStr, selection]: [string, any]) => {
              if (selection?.click) {
                clicks.push({
                  x: selection.click.x || 0,
                  y: selection.click.y || 0,
                  timestamp: new Date(response.timestamp).getTime() || Date.now(),
                  isCorrect: true,
                  imageIndex: parseInt(imageIndexStr) || 0
                });
              }
            });
          }
          
          // Caso 2: clickPosition (ya parseado por el backend) - SIEMPRE agregarlo si existe
          // IMPORTANTE: clickPosition tiene el último click, que puede no estar en imageSelections
          if (responseValue?.clickPosition && typeof responseValue.clickPosition === 'object') {
            const lastImageIndex = responseValue.selectedImageIndex ?? 0;
            // Verificar si ya tenemos un click para esta imagen
            const hasClickForLastImage = clicks.some(c => c.imageIndex === lastImageIndex);
            if (!hasClickForLastImage) {
              // Agregar el click del clickPosition si no está en imageSelections
              clicks.push({
                x: responseValue.clickPosition.x || 0,
                y: responseValue.clickPosition.y || 0,
                timestamp: new Date(response.timestamp).getTime() || Date.now(),
                isCorrect: true,
                imageIndex: lastImageIndex
              });
            }
          }
          
          // Caso 3: allClicksTracking (ya parseado por el backend)
          if (responseValue?.allClicksTracking && Array.isArray(responseValue.allClicksTracking) && clicks.length === 0) {
            clicks = responseValue.allClicksTracking.map((click: any) => ({
              x: click.x || 0,
              y: click.y || 0,
              timestamp: click.timestamp || new Date(response.timestamp).getTime() || Date.now(),
              isCorrect: click.isCorrectHitzone !== false,
              imageIndex: click.imageIndex ?? 0
            }));
          }
          
          // Caso 4: visualClickPoints es un array plano de objetos con imageIndex
          if (Array.isArray(responseValue?.visualClickPoints) && clicks.length === 0) {
            clicks = responseValue.visualClickPoints.map((point: any) => ({
              x: point.x || 0,
              y: point.y || 0,
              timestamp: point.timestamp || new Date(response.timestamp).getTime() || Date.now(),
              isCorrect: point.isCorrect !== false,
              imageIndex: point.imageIndex ?? 0
            }));
          }
          
          // Caso 5: visualClickPoints es un objeto con índices de imagen
          else if (responseValue?.visualClickPoints && typeof responseValue.visualClickPoints === 'object' && !Array.isArray(responseValue.visualClickPoints) && clicks.length === 0) {
            Object.entries(responseValue.visualClickPoints).forEach(([imageIndexStr, imageClicks]: [string, any]) => {
              if (Array.isArray(imageClicks)) {
                imageClicks.forEach((point: any) => {
                  clicks.push({
                    x: point.x || 0,
                    y: point.y || 0,
                    timestamp: point.timestamp || new Date(response.timestamp).getTime() || Date.now(),
                    isCorrect: point.isCorrect !== false,
                    imageIndex: parseInt(imageIndexStr) || (point.imageIndex ?? 0)
                  });
                });
              }
            });
          }
          
          // Procesar cada click encontrado
          clicks.forEach((click) => {
            const x = click.x || 0;
            const y = click.y || 0;
            const imageIndex = click.imageIndex ?? 0;
            const hitzoneId = responseValue?.selectedHitzone || responseValue?.hitzoneId || `hitzone-${index}`;
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
                hitzoneWidth: responseValue?.clickPosition?.hitzoneWidth || responseValue?.hitzoneWidth || 50,
                hitzoneHeight: responseValue?.clickPosition?.hitzoneHeight || responseValue?.hitzoneHeight || 50
              }
            };
          });
        });
        
        // Incluir hitzones de cada archivo en los files
        const filesWithHitzones = (question.files || []).map((file: any) => ({
          ...file,
          hitZones: file.hitZones || []
        }));

        transformedNavigationFlowData = {
          question: question.title || question.description || `Pregunta ${question.id}`,
          totalParticipants: navigationFlowDataRaw.totalResponses,
          totalSelections: navigationFlowDataRaw.totalResponses,
          researchId: researchId || '',
          imageSelections,
          visualClickPoints,
          allClicksTracking,
          files: filesWithHitzones
        };
      }

      const questionData = {
        key: `question-${question.id}`,
        questionId: question.id,
        questionType: getQuestionType(question.type),
        questionText: question.title || question.description || `Pregunta ${question.id}`,
        required: question.required || false,
        conditionalityDisabled: question.showConditionally || false,
        hasNewData: processedDataForQuestion ? (processedDataForQuestion as any).totalResponses > 0 : false,
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
