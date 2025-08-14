'use client';

import { getApiUrl } from '@/api/dynamic-endpoints';
import { moduleResponsesAPI } from '@/config/api';
import { useEffect, useState } from 'react';

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

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// 🎯 NUEVA INTERFAZ PARA LA ESTRUCTURA OPTIMIZADA
interface GroupedResponse {
  participantId: string;
  value: any;
  responseTime?: string;
  timestamp: string;
  metadata?: any;
}

interface GroupedResponsesData {
  [questionKey: string]: GroupedResponse[];
}

// 🎯 INTERFAZ LEGACY MANTENIDA PARA COMPATIBILIDAD
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
    sentimentResults: Array<{ id: string; text: string; sentiment: 'positive' | 'negative' | 'neutral' }>;
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
    question?: string;
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
      responseTime?: string; // 🎯 NUEVO: Tiempo de respuesta por opción
    }>;
    totalSelections: number;
    totalParticipants: number;
    responseTime?: string;
    responseTimes?: number[]; // Array de tiempos de respuesta (legacy)
    responseTimesByOption?: Record<string, number[]>; // 🎯 NUEVO: Tiempos por opción
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
    // 🎯 NUEVO: ARCHIVOS CON S3KEYS
    files?: Array<{
      id: string;
      name: string;
      s3Key: string;
      url: string;
    }>;
  };
}

export function useCognitiveTaskResults(researchId: string) {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [participantResponses, setParticipantResponses] = useState<ParticipantResponse[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedCognitiveData[]>([]);
  const [researchConfig, setResearchConfig] = useState<any>(null);

  // 🎯 NUEVA FUNCIÓN PARA PROCESAR DATOS DE LA ESTRUCTURA OPTIMIZADA
  const processOptimizedData = (groupedResponses: GroupedResponsesData, configData: any): ProcessedCognitiveData[] => {
    const processed: ProcessedCognitiveData[] = [];

    // Obtener todas las preguntas cognitivas de la configuración
    const cognitiveQuestions = configData?.questions?.filter((q: any) =>
      q.questionKey?.startsWith('cognitive_')
    ) || [];

    cognitiveQuestions.forEach((questionConfig: any) => {
      const questionKey = questionConfig.questionKey;
      const responses = groupedResponses[questionKey] || [];

      if (responses.length === 0) return;

      const questionType = questionConfig.type as CognitiveQuestionType;
      const questionId = questionConfig.id;
      const questionText = questionConfig.title || questionConfig.description || 'Sin título';

      // Procesar según el tipo de pregunta
      switch (questionType) {
        case 'cognitive_linear_scale':
          const linearScaleData = processLinearScaleData(responses, questionConfig);
          if (linearScaleData) {
            processed.push({
              questionId,
              questionText,
              questionType,
              totalParticipants: responses.length,
              totalResponses: responses.length,
              responseTime: calculateAverageResponseTime(responses),
              linearScaleData
            });
          }
          break;

        case 'cognitive_ranking':
          const rankingData = processRankingData(responses, questionConfig);
          if (rankingData) {
            processed.push({
              questionId,
              questionText,
              questionType,
              totalParticipants: responses.length,
              totalResponses: responses.length,
              responseTime: calculateAverageResponseTime(responses),
              rankingData
            });
          }
          break;

        case 'cognitive_single_choice':
        case 'cognitive_multiple_choice':
          const choiceData = processChoiceData(responses, questionConfig);
          if (choiceData) {
            processed.push({
              questionId,
              questionText,
              questionType,
              totalParticipants: responses.length,
              totalResponses: responses.length,
              responseTime: calculateAverageResponseTime(responses),
              choiceData
            });
          }
          break;

        case 'cognitive_short_text':
        case 'cognitive_long_text':
          const sentimentData = processSentimentData(responses, questionConfig);
          if (sentimentData) {
            processed.push({
              questionId,
              questionText,
              questionType,
              totalParticipants: responses.length,
              totalResponses: responses.length,
              responseTime: calculateAverageResponseTime(responses),
              sentimentData
            });
          }
          break;

        case 'cognitive_navigation_flow':
          const navigationFlowData = processNavigationFlowData(responses, questionConfig);
          if (navigationFlowData) {
            processed.push({
              questionId,
              questionText,
              questionType,
              totalParticipants: responses.length,
              totalResponses: responses.length,
              responseTime: calculateAverageResponseTime(responses),
              navigationFlowData
            });
          }
          break;

        case 'cognitive_preference_test':
          const preferenceTestData = processPreferenceTestData(responses, questionConfig);
          if (preferenceTestData) {
            processed.push({
              questionId,
              questionText,
              questionType,
              totalParticipants: responses.length,
              totalResponses: responses.length,
              responseTime: calculateAverageResponseTime(responses),
              preferenceTestData
            });
          }
          break;

        case 'cognitive_image_selection':
          const imageSelectionData = processImageSelectionData(responses, questionConfig);
          if (imageSelectionData) {
            processed.push({
              questionId,
              questionText,
              questionType,
              totalParticipants: responses.length,
              totalResponses: responses.length,
              responseTime: calculateAverageResponseTime(responses),
              imageSelectionData
            });
          }
          break;
      }
    });

    return processed;
  };

  // 🎯 FUNCIONES AUXILIARES PARA PROCESAR DATOS
  const calculateAverageResponseTime = (responses: GroupedResponse[]): string => {
    const times = responses
      .map(r => r.responseTime)
      .filter(t => t)
      .map(t => parseFloat(t?.replace('s', '') || '0'));

    if (times.length === 0) return '0s';
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return `${avg.toFixed(1)}s`;
  };

  const processLinearScaleData = (responses: GroupedResponse[], questionConfig: any) => {
    const values = responses.map(r => r.value).filter(v => typeof v === 'number');
    if (values.length === 0) return null;

    const distribution: Record<number, number> = {};
    const scaleRange = {
      start: questionConfig.scaleConfig?.startValue || 1,
      end: questionConfig.scaleConfig?.endValue || 5
    };

    // Contar distribución
    for (let i = scaleRange.start; i <= scaleRange.end; i++) {
      distribution[i] = values.filter(v => v === i).length;
    }

    const average = values.reduce((a, b) => a + b, 0) / values.length;

    return {
      question: questionConfig.title || questionConfig.description,
      scaleRange,
      average,
      distribution,
      totalResponses: values.length,
      responseTime: calculateAverageResponseTime(responses)
    };
  };

  const processRankingData = (responses: GroupedResponse[], questionConfig: any) => {
    const choices = questionConfig.choices || [];
    if (choices.length === 0) return null;

    const options = choices.map((choice: any, index: number) => {
      const choiceText = choice.text;
      const rankings = responses
        .map(r => r.value)
        .filter(v => Array.isArray(v))
        .map(ranking => ranking.indexOf(choiceText) + 1)
        .filter(rank => rank > 0);

      const mean = rankings.length > 0 ? rankings.reduce((a, b) => a + b, 0) / rankings.length : 0;
      const distribution: Record<number, number> = {};

      for (let i = 1; i <= choices.length; i++) {
        distribution[i] = rankings.filter(r => r === i).length;
      }

      return {
        id: choice.id || `choice-${index + 1}`,
        text: choiceText,
        mean,
        responseTime: calculateAverageResponseTime(responses),
        distribution
      };
    });

    return {
      options,
      question: questionConfig.title || questionConfig.description
    };
  };

  const processChoiceData = (responses: GroupedResponse[], questionConfig: any) => {
    const choices = questionConfig.choices || [];
    if (choices.length === 0) return null;

    const totalResponses = responses.length;
    const optionCounts: Record<string, number> = {};

    responses.forEach(response => {
      const value = response.value;
      if (Array.isArray(value)) {
        // Multiple choice
        value.forEach(v => {
          optionCounts[v] = (optionCounts[v] || 0) + 1;
        });
      } else {
        // Single choice
        optionCounts[value] = (optionCounts[value] || 0) + 1;
      }
    });

    const options = choices.map((choice: any) => ({
      id: choice.id,
      text: choice.text,
      count: optionCounts[choice.id] || 0,
      percentage: totalResponses > 0 ? ((optionCounts[choice.id] || 0) / totalResponses) * 100 : 0,
      color: getRandomColor()
    }));

    return {
      question: questionConfig.title || questionConfig.description,
      options,
      totalResponses,
      responseDuration: calculateAverageResponseTime(responses)
    };
  };

  const processSentimentData = (responses: GroupedResponse[], questionConfig: any) => {
    const texts = responses
      .map(r => r.value)
      .filter(v => typeof v === 'string' && v.trim().length > 0);

    if (texts.length === 0) return null;

    const sentimentResults = texts.map((text, index) => ({
      id: `sentiment-${index + 1}`,
      text,
      sentiment: 'neutral' as const // Placeholder - implementar análisis de sentimiento real
    }));

    return {
      sentimentResults,
      themes: [],
      keywords: [],
      analysis: { text: 'Análisis de sentimiento pendiente' }
    };
  };

  const processNavigationFlowData = (responses: GroupedResponse[], questionConfig: any) => {
    if (!responses || responses.length === 0) return null;

    // 🎯 DEBUG: Log de datos de entrada
    console.log('🎯 processNavigationFlowData - responses:', responses);
    console.log('🎯 processNavigationFlowData - questionConfig:', questionConfig);

    // Agregar todos los clicks de todos los participantes
    const allVisualClickPoints: any[] = [];
    const allClicksTracking: any[] = [];
    const imageSelections: any = {};

    responses.forEach(response => {
      if (!response.value) return;

      const value = response.value;
      console.log('🎯 processNavigationFlowData - processing response:', { participantId: response.participantId, value });

      // Agregar clicks visuales
      if (value.visualClickPoints && Array.isArray(value.visualClickPoints)) {
        console.log('🎯 processNavigationFlowData - visualClickPoints encontrados:', value.visualClickPoints.length);
        value.visualClickPoints.forEach((point: any) => {
          allVisualClickPoints.push({
            ...point,
            participantId: response.participantId
          });
        });
      }

      // Agregar tracking de clicks
      if (value.allClicksTracking && Array.isArray(value.allClicksTracking)) {
        console.log('🎯 processNavigationFlowData - allClicksTracking encontrados:', value.allClicksTracking.length);
        value.allClicksTracking.forEach((click: any) => {
          allClicksTracking.push({
            ...click,
            participantId: response.participantId
          });
        });
      }

      // Agregar selecciones de imagen
      if (value.imageSelections && typeof value.imageSelections === 'object') {
        Object.assign(imageSelections, value.imageSelections);
      }
    });

    const result = {
      question: questionConfig.title || questionConfig.description,
      totalParticipants: responses.length,
      totalSelections: responses.length,
      researchId: questionConfig.researchId,
      imageSelections,
      visualClickPoints: allVisualClickPoints,
      allClicksTracking: allClicksTracking,
      files: questionConfig.files || []
    };

    console.log('🎯 processNavigationFlowData - resultado final:', result);
    return result;
  };

  const processPreferenceTestData = (responses: GroupedResponse[], questionConfig: any) => {
    const files = questionConfig.files || [];
    const totalSelections = responses.length;

    const selectionCounts: Record<string, number> = {};
    const responseTimesByOption: Record<string, number[]> = {};

    responses.forEach(response => {
      const selectedValue = response.value;

      if (selectedValue) {
        const fileId = typeof selectedValue === 'object' ? selectedValue.id || selectedValue.fileId : selectedValue;
        selectionCounts[fileId] = (selectionCounts[fileId] || 0) + 1;

        if (!responseTimesByOption[fileId]) {
          responseTimesByOption[fileId] = [];
        }
        if (response.responseTime) {
          const time = parseFloat(response.responseTime.replace('s', ''));
          responseTimesByOption[fileId].push(time);
        }
      }
    });

    const processedOptions = files.map((file: any) => {
      const fileId = file.id || file.s3Key;
      const selected = selectionCounts[fileId] || 0;
      const percentage = totalSelections > 0 ? Math.round((selected / totalSelections) * 100) : 0;

      const optionTimes = responseTimesByOption[fileId] || [];
      const avgTime = optionTimes.length > 0
        ? `${(optionTimes.reduce((a, b) => a + b, 0) / optionTimes.length).toFixed(1)}s`
        : 'N/A';

      return {
        id: fileId,
        name: file.name || `Imagen ${fileId}`,
        image: file.url || (file.s3Key ? `https://emotioxv2.s3.amazonaws.com/${file.s3Key}` : ''),
        selected,
        percentage,
        color: getRandomColor(),
        responseTime: avgTime
      };
    });

    return {
      question: questionConfig.title || questionConfig.description,
      options: processedOptions,
      totalSelections,
      totalParticipants: responses.length,
      responseTime: calculateAverageResponseTime(responses),
      responseTimes: responses.map(r => parseFloat(r.responseTime?.replace('s', '') || '0')),
      responseTimesByOption,
      preferenceAnalysis: totalSelections > 0 ? 'Análisis de preferencias completado' : 'Sin datos para analizar'
    };
  };

  const processImageSelectionData = (responses: GroupedResponse[], questionConfig: any) => {
    // Implementación simplificada - expandir según necesidades
    const images = questionConfig.images || [];
    const totalSelections = responses.length;

    const processedImages = images.map((image: any) => ({
      name: image.name,
      imageUrl: image.url,
      selected: 0, // Calcular basado en responses
      percentage: 0,
      category: image.category
    }));

    return {
      question: questionConfig.title || questionConfig.description,
      images: processedImages,
      totalSelections,
      totalParticipants: responses.length,
      responseTime: calculateAverageResponseTime(responses),
      selectionAnalysis: 'Análisis de selección pendiente',
      categories: []
    };
  };

  const getRandomColor = () => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // 🎯 FUNCIÓN LEGACY MANTENIDA PARA COMPATIBILIDAD
  const processDataByType = (responses: ParticipantResponse[], configData: any): ProcessedCognitiveData[] => {
    // Esta función se mantiene para compatibilidad pero ya no se usa
    // La nueva lógica está en processOptimizedData
    return [];
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
        fetch(`${getApiUrl(`research/${researchId}/cognitive-task`)}`, {
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

      // 🎯 NUEVA LÓGICA: Verificar si es la estructura optimizada
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        // Estructura optimizada agrupada por questionKey
        const groupedResponses = response.data as GroupedResponsesData;
        const processed = processOptimizedData(groupedResponses, configData);
        setProcessedData(processed);

        // Convertir a formato legacy para mantener compatibilidad
        const legacyResponses: ParticipantResponse[] = [];
        Object.entries(groupedResponses).forEach(([questionKey, responses]) => {
          responses.forEach(response => {
            const existingParticipant = legacyResponses.find(p => p.participantId === response.participantId);
            if (existingParticipant) {
              existingParticipant.responses.push({
                questionKey,
                questionType: questionKey as CognitiveQuestionType,
                response: response.value,
                timestamp: response.timestamp
              });
            } else {
              legacyResponses.push({
                participantId: response.participantId,
                responses: [{
                  questionKey,
                  questionType: questionKey as CognitiveQuestionType,
                  response: response.value,
                  timestamp: response.timestamp
                }],
                metadata: response.metadata
              });
            }
          });
        });
        setParticipantResponses(legacyResponses);
      } else {
        // Estructura legacy (array de participantes)
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

        if (cognitiveResponses.length > 0) {
          const processed = processDataByType(cognitiveResponses, configData);
          setProcessedData(processed);
        } else {
          setProcessedData([]);
        }
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
