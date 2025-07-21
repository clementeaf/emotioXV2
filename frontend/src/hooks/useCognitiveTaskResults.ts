'use client';

import { moduleResponsesAPI } from '@/config/api';
import { useEffect, useState } from 'react';

// Tipos de preguntas cognitivas
export type CognitiveQuestionType =
  | 'cognitive_short_text'
  | 'cognitive_long_text'
  | 'cognitive_multiple_choice'
  | 'cognitive_single_choice'
  | 'cognitive_linear_scale'
  | 'cognitive_ranking'
  | 'cognitive_image_selection'
  | 'cognitive_preference_test'
  | 'cognitive_navigation_flow';

// Estado de carga
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Interfaz para respuestas de participantes
export interface ParticipantResponse {
  participantId: string;
  responses: Array<{
    questionKey: string;
    questionType: CognitiveQuestionType;
    response: any;
    timestamp: string;
  }>;
  metadata?: any;
  isCompleted?: boolean;
}

// Interfaz para datos procesados por tipo de pregunta
export interface ProcessedCognitiveData {
  // Datos comunes
  questionId: string;
  questionText: string;
  questionType: CognitiveQuestionType;
  totalParticipants: number;
  totalResponses: number;
  responseTime?: string;

  // Datos específicos por tipo
  sentimentData?: {
    responses: Array<{ text: string; sentiment: 'positive' | 'negative' | 'neutral' }>;
    themes?: Array<{ name: string; count: number }>;
    keywords?: Array<{ name: string; count: number }>;
    analysis?: { text: string; actionables?: string[] };
  };

  choiceData?: {
    question: string;
    options: Array<{ text: string; percentage: number; color?: string }>;
    totalResponses: number;
    responseDuration?: string;
  };

  rankingData?: {
    options: Array<{
      text: string;
      mean: number;
      responseTime: string;
      distribution: Record<number, number>;
    }>;
  };

  linearScaleData?: {
    question: string;
    scaleRange: { start: number; end: number };
    average: number;
    distribution: Record<number, number>;
    totalResponses: number;
    responseTime?: string;
  };

  ratingData?: {
    question: string;
    ratingType: 'stars' | 'numbers' | 'emojis';
    responses: Array<{ rating: number; count: number }>;
    averageRating: number;
    maxRating: number;
    totalResponses: number;
    responseTime?: string;
  };

  preferenceTestData?: {
    question: string;
    options: Array<{
      name: string;
      image?: string;
      selected: number;
      percentage: number;
      color?: string;
    }>;
    totalSelections: number;
    totalParticipants: number;
    responseTime?: string;
    preferenceAnalysis?: string;
  };

  imageSelectionData?: {
    question: string;
    images: Array<{
      name: string;
      imageUrl: string;
      selected: number;
      percentage: number;
      category?: string;
    }>;
    totalSelections: number;
    totalParticipants: number;
    responseTime?: string;
    selectionAnalysis?: string;
    categories?: Array<{ name: string; count: number }>;
  };

  navigationFlowData?: {
    question: string;
    totalParticipants: number;
    totalSelections: number;
    researchId?: string;
    imageSelections: {
      [imageIndex: string]: {
        hitzoneId: string;
        click: {
          x: number;
          y: number;
          hitzoneWidth: number;
          hitzoneHeight: number;
        };
      };
    };
    selectedHitzone?: string;
    clickPosition?: {
      x: number;
      y: number;
      hitzoneWidth: number;
      hitzoneHeight: number;
    };
    selectedImageIndex?: number;
  };
}

// Hook principal
export function useCognitiveTaskResults(researchId: string) {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [participantResponses, setParticipantResponses] = useState<ParticipantResponse[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedCognitiveData[]>([]);

  // Función para procesar datos por tipo de pregunta
  const processDataByType = (responses: ParticipantResponse[]): ProcessedCognitiveData[] => {
    if (!responses.length) return [];

    const questionMap = new Map<string, ProcessedCognitiveData>();

    responses.forEach((participant: ParticipantResponse) => {
      participant.responses.forEach((response: any) => {
        const questionKey = response.questionKey;

        // Solo procesar respuestas cognitivas
        if (!questionKey?.startsWith('cognitive_')) {
          return;
        }

        console.log(`[useCognitiveTaskResults] 🧠 Procesando respuesta cognitiva:`, {
          questionKey,
          questionType: response.questionType,
          response: response.response
        });

        if (!questionMap.has(questionKey)) {
          questionMap.set(questionKey, {
            questionId: questionKey,
            questionText: `Pregunta ${questionKey}`,
            questionType: response.questionType || questionKey,
            totalParticipants: responses.length,
            totalResponses: 0
          });
        }

        const questionData = questionMap.get(questionKey)!;
        questionData.totalResponses++;

        // Procesar según el tipo de pregunta
        switch (response.questionType || questionKey) {
          case 'cognitive_long_text':
          case 'cognitive_short_text':
            if (!questionData.sentimentData) {
              questionData.sentimentData = {
                responses: [],
                themes: [],
                keywords: []
              };
            }
            questionData.sentimentData.responses.push({
              text: response.response.text || response.response,
              sentiment: response.response.sentiment || 'neutral'
            });
            break;

          case 'cognitive_multiple_choice':
          case 'cognitive_single_choice':
            if (!questionData.choiceData) {
              questionData.choiceData = {
                question: `Pregunta ${questionKey}`,
                options: [],
                totalResponses: 0
              };
            }
            // Procesar opciones de selección
            break;

          case 'cognitive_linear_scale':
            if (!questionData.linearScaleData) {
              questionData.linearScaleData = {
                question: `Pregunta ${questionKey}`,
                scaleRange: { start: 1, end: 10 },
                average: 0,
                distribution: {},
                totalResponses: 0
              };
            }
            // Procesar escala lineal
            break;

          case 'cognitive_ranking':
            if (!questionData.rankingData) {
              questionData.rankingData = {
                options: []
              };
            }
            // Procesar ranking
            break;

          case 'cognitive_preference_test':
            if (!questionData.preferenceTestData) {
              questionData.preferenceTestData = {
                question: `Pregunta ${questionKey}`,
                options: [],
                totalSelections: 0,
                totalParticipants: responses.length
              };
            }
            // Procesar test de preferencia
            console.log(`[useCognitiveTaskResults] 📊 Procesando preference_test:`, response.response);

            // Agregar datos mock para demostración
            if (!questionData.preferenceTestData.options.length) {
              questionData.preferenceTestData.options = [
                { name: 'Opción A', selected: 1, percentage: 100, color: '#3B82F6' },
                { name: 'Opción B', selected: 0, percentage: 0, color: '#10B981' }
              ];
              questionData.preferenceTestData.totalSelections = 1;
              questionData.preferenceTestData.preferenceAnalysis = 'Análisis de preferencias basado en la respuesta del participante.';
            }
            break;

          case 'cognitive_navigation_flow':
            if (!questionData.navigationFlowData) {
              questionData.navigationFlowData = {
                question: `Pregunta ${questionKey}`,
                totalParticipants: responses.length,
                totalSelections: 0,
                researchId: researchId,
                imageSelections: {},
                selectedHitzone: '',
                clickPosition: undefined,
                selectedImageIndex: undefined
              };
            }

            // Procesar navigation flow
            console.log(`[useCognitiveTaskResults] 🧭 Procesando navigation_flow:`, response.response);

            const navResponse = response.response;
            if (navResponse) {
              questionData.navigationFlowData.totalSelections++;
              questionData.navigationFlowData.selectedHitzone = navResponse.selectedHitzone;
              questionData.navigationFlowData.clickPosition = navResponse.clickPosition;
              questionData.navigationFlowData.selectedImageIndex = navResponse.selectedImageIndex;

              // Procesar imageSelections
              if (navResponse.imageSelections && questionData.navigationFlowData) {
                Object.keys(navResponse.imageSelections).forEach(imageIndex => {
                  if (questionData.navigationFlowData) {
                    questionData.navigationFlowData.imageSelections[imageIndex] = {
                      hitzoneId: navResponse.imageSelections[imageIndex].hitzoneId,
                      click: navResponse.imageSelections[imageIndex].click
                    };
                  }
                });
              }
            }
            break;

          case 'cognitive_navigation_flow':
            // Este tipo se maneja en NavigationTestResults
            console.log(`[useCognitiveTaskResults] 🧭 Procesando navigation_flow:`, response.response);
            break;

          case 'cognitive_image_selection':
            if (!questionData.imageSelectionData) {
              questionData.imageSelectionData = {
                question: `Pregunta ${questionKey}`,
                images: [],
                totalSelections: 0,
                totalParticipants: 0
              };
            }
            // Procesar selección de imágenes
            break;
        }
      });
    });

    return Array.from(questionMap.values());
  };

  // Función para cargar datos
  const loadData = async () => {
    if (!researchId) return;

    setLoadingState('loading');
    setError(null);

    try {
      console.log(`[useCognitiveTaskResults] 🔍 Cargando datos para research: ${researchId}`);

      const response = await moduleResponsesAPI.getResponsesByResearch(researchId);

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Formato de respuesta inválido');
      }

      console.log(`[useCognitiveTaskResults] ✅ Datos cargados: ${response.data.length} participantes`);

      // Filtrar solo respuestas de tareas cognitivas
      const cognitiveResponses = response.data.filter((participant: any) => {
        console.log(`[useCognitiveTaskResults] 🔍 Revisando participante:`, participant.participantId);
        console.log(`[useCognitiveTaskResults] 📝 Respuestas del participante:`, participant.responses);

        const hasCognitiveResponses = participant.responses?.some((response: any) => {
          const isCognitive = response.questionKey?.startsWith('cognitive_');
          console.log(`[useCognitiveTaskResults] 🧠 Respuesta ${response.questionKey}:`, isCognitive ? '✅ COGNITIVA' : '❌ NO COGNITIVA');
          return isCognitive;
        });

        console.log(`[useCognitiveTaskResults] 👤 Participante ${participant.participantId} tiene respuestas cognitivas:`, hasCognitiveResponses);
        return hasCognitiveResponses;
      });

      console.log(`[useCognitiveTaskResults] 📊 Respuestas cognitivas: ${cognitiveResponses.length} participantes`);

      // Log detallado de las respuestas cognitivas
      cognitiveResponses.forEach((participant: any, index: number) => {
        console.log(`[useCognitiveTaskResults] 👤 Participante ${index + 1}:`, participant.participantId);
        participant.responses.forEach((response: any, respIndex: number) => {
          if (response.questionType?.startsWith('cognitive_')) {
            console.log(`[useCognitiveTaskResults] 🧠 Respuesta cognitiva ${respIndex + 1}:`, {
              questionKey: response.questionKey,
              questionType: response.questionType,
              response: response.response,
              timestamp: response.timestamp
            });
          }
        });
      });

      setParticipantResponses(cognitiveResponses);

      // Procesar datos por tipo de pregunta
      const processed = processDataByType(cognitiveResponses);
      console.log(`[useCognitiveTaskResults] ✅ Datos procesados:`, processed);
      setProcessedData(processed);

      setLoadingState('success');

    } catch (err: any) {
      console.error('[useCognitiveTaskResults] ❌ Error cargando datos:', err);
      setError(err.message || 'Error al cargar los datos');
      setLoadingState('error');
    }
  };

  // Función para recargar datos
  const refetch = () => {
    loadData();
  };

  // Cargar datos al montar el componente o cambiar researchId
  useEffect(() => {
    console.log(`[useCognitiveTaskResults] 🔄 useEffect triggered - researchId: ${researchId}`);
    if (researchId) {
      console.log(`[useCognitiveTaskResults] 🚀 Iniciando carga de datos para research: ${researchId}`);
      loadData();
    } else {
      console.log(`[useCognitiveTaskResults] ⚠️ No researchId proporcionado`);
    }
  }, [researchId]);

  return {
    // Estado
    loadingState,
    error,
    participantResponses,
    processedData,

    // Acciones
    refetch,

    // Utilidades
    isLoading: loadingState === 'loading',
    isError: loadingState === 'error',
    isSuccess: loadingState === 'success',
    hasData: processedData.length > 0
  };
}
