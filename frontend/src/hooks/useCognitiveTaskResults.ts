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
    responses: Array<{ id: string; text: string; sentiment: 'positive' | 'negative' | 'neutral' }>;
    themes?: Array<{ name: string; count: number }>;
    keywords?: Array<{ name: string; count: number }>;
    analysis?: { text: string; actionables?: string[] };
  };

  choiceData?: {
    question: string;
    options: Array<{ id: string; text: string; count: number; percentage: number; color?: string }>;
    totalResponses: number;
    responseDuration?: string;
  };

  rankingData?: {
    options: Array<{
      id: string;
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
      id: string;
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
    // 🎯 NUEVO: PUNTOS VISUALES PERSISTIDOS
    visualClickPoints?: Array<{
      x: number;
      y: number;
      timestamp: number;
      isCorrect: boolean;
      imageIndex: number;
      participantId?: string;
    }>;
    // 🎯 NUEVO: DATOS DE RASTREO COMPLETO DE CLICS
    allClicksTracking?: Array<{
      x: number;
      y: number;
      timestamp: number;
      hitzoneId?: string;
      imageIndex: number;
      isCorrectHitzone: boolean;
      participantId?: string;
    }>;
  };
}

// Hook principal
export function useCognitiveTaskResults(researchId: string) {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [participantResponses, setParticipantResponses] = useState<ParticipantResponse[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedCognitiveData[]>([]);
  const [researchConfig, setResearchConfig] = useState<any>(null);

  // Función para procesar datos por tipo de pregunta
  const processDataByType = (responses: ParticipantResponse[], configData: any): ProcessedCognitiveData[] => {
    if (!responses.length) return [];

    const questionMap = new Map<string, ProcessedCognitiveData>();

    responses.forEach((participant: ParticipantResponse) => {
      participant.responses.forEach((response: any) => {
        const questionKey = response.questionKey;

        // Solo procesar respuestas cognitivas
        if (!questionKey?.startsWith('cognitive_')) {
          return;
        }

        // Buscar el título en configData si está disponible
        const questionConfig = configData?.questions?.find((q: any) => q.questionKey === questionKey);
        const questionId = questionConfig?.id || questionKey;

        if (!questionMap.has(questionId)) {
          const questionTitle = questionConfig?.title || `Pregunta ${questionKey}`;

          questionMap.set(questionId, { // 🎯 FIX: Usar questionId como clave del Map
            questionId: questionId,
            questionText: questionTitle,
            questionType: response.questionType || questionKey,
            totalParticipants: responses.length,
            totalResponses: 0
          });
        }

        const questionData = questionMap.get(questionId)!;
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

            // Extraer el texto de la respuesta
            let responseText = '';
            if (typeof response.response === 'string') {
              responseText = response.response;
            } else if (response.response && typeof response.response === 'object') {
              responseText = response.response.text || response.response.value || JSON.stringify(response.response);
            }

            // Clasificar sentimiento básico
            let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
            if (responseText.length > 0) {
              const positiveWords = ['bueno', 'excelente', 'me gusta', 'genial', 'perfecto', 'amazing', 'great', 'good', 'love', 'like'];
              const negativeWords = ['malo', 'terrible', 'no me gusta', 'horrible', 'pésimo', 'bad', 'terrible', 'hate', 'dislike', 'awful'];

              const lowerText = responseText.toLowerCase();
              const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
              const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

              if (positiveCount > negativeCount) {
                sentiment = 'positive';
              } else if (negativeCount > positiveCount) {
                sentiment = 'negative';
              }
            }

            questionData.sentimentData.responses.push({
              id: `sentiment-${questionData.sentimentData.responses.length + 1}-${participant.participantId}`,
              text: responseText,
              sentiment: sentiment
            });
            break;

          case 'cognitive_multiple_choice':
          case 'cognitive_single_choice':
            if (!questionData.choiceData) {
              // 🎯 FIX: Usar questionConfig que ya se encontró antes del switch
              questionData.choiceData = {
                question: questionConfig?.title || `Pregunta ${questionKey}`,
                options: [],
                totalResponses: 0
              };

              // Inicializar opciones basándose en la configuración real
              if (questionConfig?.choices) {
                questionConfig.choices.forEach((choice: any, index: number) => {
                  questionData.choiceData!.options.push({
                    id: choice.id || `option-${index + 1}`,
                    text: choice.text,
                    count: 0,
                    percentage: 0
                  });
                });
              }
            }

            // Procesar opciones de selección
            let selectedOption = '';
            // Extraer la opción seleccionada de diferentes formatos posibles
            if (response.response?.value) {
              selectedOption = response.response.value;
            } else if (response.response?.selected) {
              selectedOption = response.response.selected;
            } else if (response.response?.choice) {
              selectedOption = response.response.choice;
            } else if (response.response?.answer) {
              selectedOption = response.response.answer;
            } else if (typeof response.response === 'string') {
              selectedOption = response.response;
            } else if (response.response) {
              selectedOption = JSON.stringify(response.response);
            }

            if (selectedOption && questionData.choiceData) {
              // Para opción múltiple, selectedOption puede ser un array
              const optionsToProcess = Array.isArray(selectedOption) ? selectedOption : [selectedOption];

              optionsToProcess.forEach(option => {
                // Buscar la opción por ID primero, luego por texto
                let existingOption = questionData.choiceData!.options.find(opt => opt.id === option);
                if (!existingOption) {
                  existingOption = questionData.choiceData!.options.find(opt => opt.text === option);
                }

                if (existingOption) {
                  existingOption.count = (existingOption.count || 0) + 1;
                } else {
                  // Si no se encuentra, agregar como nueva opción
                  questionData.choiceData!.options.push({
                    id: option,
                    text: option,
                    count: 1,
                    percentage: 0, // Se calculará después
                    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
                  });
                }
              });
            }
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
            const scaleValue = response.response?.value || response.response;
            if (typeof scaleValue === 'number') {
              questionData.linearScaleData.distribution[scaleValue] = (questionData.linearScaleData.distribution[scaleValue] || 0) + 1;
            }
            break;

          case 'cognitive_ranking':
            if (!questionData.rankingData) {
              questionData.rankingData = {
                options: []
              };
            }

            // Procesar ranking
            const rankingData = response.response?.ranking || response.response;
            if (Array.isArray(rankingData)) {
              rankingData.forEach((item, index) => {
                const existingOption = questionData.rankingData!.options.find(opt => opt.text === item);
                if (existingOption) {
                  existingOption.mean = (existingOption.mean + (index + 1)) / 2;
                } else {
                  questionData.rankingData!.options.push({
                    id: `rank-${questionData.rankingData!.options.length + 1}`,
                    text: String(item),
                    mean: index + 1,
                    responseTime: '0s',
                    distribution: {}
                  });
                }
              });
            }
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

            const preferenceSelection = response.response?.selected || response.response?.preference || response.response;
            if (preferenceSelection) {
              // Extraer el nombre de la preferencia de manera segura
              let preferenceName = '';
              if (typeof preferenceSelection === 'string') {
                preferenceName = preferenceSelection;
              } else if (typeof preferenceSelection === 'object' && preferenceSelection !== null) {
                // Intentar extraer el nombre de diferentes propiedades posibles
                preferenceName = preferenceSelection.name ||
                  preferenceSelection.text ||
                  preferenceSelection.label ||
                  preferenceSelection.value ||
                  preferenceSelection.title ||
                  JSON.stringify(preferenceSelection);
              } else {
                preferenceName = String(preferenceSelection);
              }


              const existingOption = questionData.preferenceTestData.options.find(opt => opt.name === preferenceName);
              if (existingOption) {
                existingOption.selected += 1;
              } else {
                questionData.preferenceTestData.options.push({
                  id: `pref-${questionData.preferenceTestData.options.length + 1}`,
                  name: preferenceName,
                  selected: 1,
                  percentage: 0,
                  color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
                });
              }
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

              // 🎯 PROCESAR visualClickPoints - ACUMULAR en lugar de sobrescribir
              if (navResponse.visualClickPoints && Array.isArray(navResponse.visualClickPoints)) {
                if (!questionData.navigationFlowData.visualClickPoints) {
                  questionData.navigationFlowData.visualClickPoints = [];
                }
                // Agregar los puntos del participante actual con su ID
                const pointsWithParticipantId = navResponse.visualClickPoints.map((point: any) => ({
                  ...point,
                  participantId: participant.participantId
                }));
                questionData.navigationFlowData.visualClickPoints.push(...pointsWithParticipantId);
              }

              // 🎯 PROCESAR allClicksTracking - ACUMULAR en lugar de sobrescribir
              if (navResponse.allClicksTracking && Array.isArray(navResponse.allClicksTracking)) {
                if (!questionData.navigationFlowData.allClicksTracking) {
                  questionData.navigationFlowData.allClicksTracking = [];
                }
                // Agregar los clicks del participante actual con su ID
                const clicksWithParticipantId = navResponse.allClicksTracking.map((click: any) => ({
                  ...click,
                  participantId: participant.participantId
                }));
                questionData.navigationFlowData.allClicksTracking.push(...clicksWithParticipantId);
              }
            }
            break;

          case 'cognitive_navigation_flow':
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

    // Calcular porcentajes y métricas finales
    questionMap.forEach((questionData) => {
      // Calcular porcentajes para choice data
      if (questionData.choiceData) {
        const total = questionData.choiceData.options.reduce((sum, opt) => sum + opt.count, 0);
        questionData.choiceData.options.forEach(opt => {
          opt.percentage = total > 0 ? Math.round((opt.count / total) * 100) : 0;
        });
        questionData.choiceData.totalResponses = total;
      }

      // Calcular promedio para linear scale
      if (questionData.linearScaleData) {
        const values = Object.entries(questionData.linearScaleData.distribution).map(([value, count]) => ({
          value: parseInt(value),
          count
        }));
        const total = values.reduce((sum, item) => sum + item.count, 0);
        const average = values.reduce((sum, item) => sum + (item.value * item.count), 0) / total;
        questionData.linearScaleData.average = Math.round(average * 10) / 10;
        questionData.linearScaleData.totalResponses = total;
      }

      // Calcular porcentajes para preference test
      if (questionData.preferenceTestData) {
        const total = questionData.preferenceTestData.options.reduce((sum, opt) => sum + opt.selected, 0);
        questionData.preferenceTestData.options.forEach(opt => {
          opt.percentage = total > 0 ? Math.round((opt.selected / total) * 100) : 0;
        });
        questionData.preferenceTestData.totalSelections = total;
      }

      // Generar análisis de sentimiento para texto
      if (questionData.sentimentData && questionData.sentimentData.responses.length > 0) {
        const positiveCount = questionData.sentimentData.responses.filter(r => r.sentiment === 'positive').length;
        const negativeCount = questionData.sentimentData.responses.filter(r => r.sentiment === 'negative').length;
        const neutralCount = questionData.sentimentData.responses.filter(r => r.sentiment === 'neutral').length;

        const total = questionData.sentimentData.responses.length;
        const positivePercentage = Math.round((positiveCount / total) * 100);
        const negativePercentage = Math.round((negativeCount / total) * 100);
        const neutralPercentage = Math.round((neutralCount / total) * 100);

        questionData.sentimentData.analysis = {
          text: `Análisis de sentimiento: ${positivePercentage}% positivo, ${negativePercentage}% negativo, ${neutralPercentage}% neutral.`,
          actionables: [
            positivePercentage > 50 ? 'La mayoría de respuestas son positivas' : '',
            negativePercentage > 30 ? 'Considerar mejorar aspectos negativos' : '',
            neutralPercentage > 50 ? 'Necesita más engagement' : ''
          ].filter(Boolean)
        };
      }
    });

    return Array.from(questionMap.values());
  };

  // Función para cargar datos
  const loadData = async () => {
    if (!researchId) return;

    setLoadingState('loading');
    setError(null);

    try {
      // Obtener token usando el servicio correcto
      const { default: tokenService } = await import('@/services/tokenService');
      const token = tokenService.getToken();

      if (!token) {
        console.warn('[useCognitiveTaskResults] No hay token de autenticación disponible');
      }

      // Cargar configuración y respuestas en paralelo
      const [configResponse, response] = await Promise.all([
        fetch(`https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev/research/${researchId}/cognitive-task`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        }),
        moduleResponsesAPI.getResponsesByResearch(researchId)
      ]);

      if (!configResponse.ok) {
        throw new Error(`Error ${configResponse.status}: ${configResponse.statusText}`);
      }

      const configData = await configResponse.json();
      setResearchConfig(configData);

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Formato de respuesta inválido');
      }

      const cognitiveResponses = response.data.filter((participant: any) => {
        const hasCognitiveResponses = participant.responses?.some((response: any) => {
          const isCognitive = response.questionKey?.startsWith('cognitive_');
          return isCognitive;
        });
        return hasCognitiveResponses;
      });

      setParticipantResponses(cognitiveResponses);

      // Procesar datos después de tener tanto la configuración como las respuestas
      if (cognitiveResponses.length > 0) {
        // 🎯 FIX: Pasar configData directamente en lugar de depender del estado researchConfig
        const processed = processDataByType(cognitiveResponses, configData);

        setProcessedData(processed);
      } else {
        setProcessedData([]);
      }

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
    if (researchId) {
      loadData();
    }
  }, [researchId]);

  return {
    // Estado
    loadingState,
    error,
    participantResponses,
    processedData,
    researchConfig,

    // Acciones
    refetch,

    // Utilidades
    isLoading: loadingState === 'loading',
    isError: loadingState === 'error',
    isSuccess: loadingState === 'success',
    hasData: processedData.length > 0
  };
}
