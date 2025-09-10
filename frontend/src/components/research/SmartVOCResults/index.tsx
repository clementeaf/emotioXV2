'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';

import { useGlobalResearchData } from '@/hooks/useGlobalResearchData';
import { QuestionType } from 'shared/interfaces/question-types.enum';
import { SmartVOCQuestion } from 'shared/interfaces/smart-voc.interface';
import { CPVCard } from './CPVCard';
import { EmotionalStates } from './EmotionalStates';
import { Filters } from './Filters';
import { MetricCard } from './MetricCard';
import { NPSQuestion } from './NPSQuestion';
import { QuestionResults } from './QuestionResults';
import { TrustRelationshipFlow } from './TrustRelationshipFlow';
import { VOCQuestion } from './VOCQuestion';
import { SmartVOCResultsProps } from './types';

// Hook para obtener las preguntas de SmartVOC desde los datos pasados como parámetro
const useSmartVOCQuestions = (smartVOCFormData: any, isSmartVOCFormLoading: boolean, smartVOCFormError: any) => {

  // Preguntas por defecto si no hay configuración
  const defaultQuestions: SmartVOCQuestion[] = [
    {
      id: 'smartvoc_nps',
      type: QuestionType.SMARTVOC_NPS,
      title: 'Net Promoter Score (NPS)',
      description: 'On a scale from 0-10, how likely are you to recommend [company] to a friend or colleague?',
      required: true,
      showConditionally: false,
      config: {
        type: 'scale',
        scaleRange: { start: 0, end: 10 }
      }
    },
    {
      id: 'smartvoc_voc',
      type: QuestionType.SMARTVOC_VOC,
      title: 'Voice of Customer (VOC)',
      description: 'Please share your thoughts about your experience with our service.',
      required: true,
      showConditionally: false,
      config: {
        type: 'text'
      }
    },
    {
      id: 'smartvoc_csat',
      type: QuestionType.SMARTVOC_CSAT,
      title: 'Customer Satisfaction (CSAT)',
      description: 'How would you rate your overall satisfaction level with our service?',
      required: true,
      showConditionally: false,
      config: {
        type: 'stars',
        scaleRange: { start: 1, end: 5 }
      }
    },
    {
      id: 'smartvoc_ces',
      type: QuestionType.SMARTVOC_CES,
      title: 'Customer Effort Score (CES)',
      description: 'How much effort did you personally have to put forth to handle your request?',
      required: true,
      showConditionally: false,
      config: {
        type: 'scale',
        scaleRange: { start: 1, end: 7 }
      }
    },
    {
      id: 'smartvoc_cv',
      type: QuestionType.SMARTVOC_CV,
      title: 'Customer Value (CV)',
      description: 'How would you rate the overall value you receive from our product/service?',
      required: true,
      showConditionally: false,
      config: {
        type: 'scale',
        scaleRange: { start: 1, end: 7 }
      }
    },
    {
      id: 'smartvoc_nev',
      type: QuestionType.SMARTVOC_NEV,
      title: 'Net Emotional Value (NEV)',
      description: 'How do you feel about your experience with our service?',
      required: true,
      showConditionally: false,
      config: {
        type: 'emojis'
      }
    }
  ];

  // Usar preguntas del formulario si existen, sino usar las por defecto
  const questions = smartVOCFormData?.questions && smartVOCFormData.questions.length > 0
    ? smartVOCFormData.questions
    : defaultQuestions;

  return {
    questions,
    isLoading: isSmartVOCFormLoading,
    error: smartVOCFormError
  };
};

export function SmartVOCResults({ researchId, className }: SmartVOCResultsProps) {
  const [timeRange, setTimeRange] = useState<'Today' | 'Week' | 'Month'>('Today');

  // Hook global único que maneja todas las llamadas
  const {
    groupedResponses,
    smartVOCData,
    cpvData,
    trustFlowData,
    smartVOCFormData,
    isLoading,
    isSmartVOCLoading,
    isCPVLoading,
    isTrustFlowLoading,
    isSmartVOCFormLoading,
    error,
    smartVOCError,
    cpvError,
    trustFlowError,
    smartVOCFormError,
    refetch
  } = useGlobalResearchData(researchId);

  // Hook para obtener las preguntas de SmartVOC
  const {
    questions: smartVOCQuestions,
    isLoading: questionsLoading,
    error: questionsError
  } = useSmartVOCQuestions(smartVOCFormData, isSmartVOCFormLoading, smartVOCFormError);

  // Usar datos reales en lugar de datos de prueba
  const shouldUseTestData = false; // Usar datos reales

  // Preparar datos para CPVCard
  const cpvTrendData = trustFlowData.length > 0 ? trustFlowData.map(item => ({
    date: item.stage,
    value: (item.nps + item.nev) / 2 // Promedio de NPS y NEV
  })) : [];

  // Usar datos reales o valores por defecto
  const finalCPVData = cpvData;
  const finalTrustFlowData = trustFlowData;

  // Determinar si hay datos reales
  const hasCPVData = cpvData !== null && !cpvError;
  const hasTrustFlowData = trustFlowData.length > 0 && !trustFlowError;

  const finalTrustFlowDataForDemo = shouldUseTestData ? [] : finalTrustFlowData;
  const hasTrustFlowDataForDemo = shouldUseTestData ? true : hasTrustFlowData;

  // Debug logs removed

  // Obtener el valor real de Cognitive Value (CV) desde smartVOCData
  const cvValue = smartVOCData && smartVOCData.cvScores && smartVOCData.cvScores.length > 0
    ? (smartVOCData.cvScores.reduce((a, b) => a + b, 0) / smartVOCData.cvScores.length).toFixed(2)
    : '0.00';

  // 🎯 PROCESAR DATOS DE NEV PARA EmotionalStates
  const processNEVData = () => {
    // Definir todas las emociones disponibles
    const allEmotions = [
      'Feliz', 'Satisfecho', 'Confiado', 'Valorado', 'Cuidado', 'Seguro', 
      'Enfocado', 'Indulgente', 'Estimulado', 'Exploratorio', 'Interesado', 'Enérgico',
      'Descontento', 'Frustrado', 'Irritado', 'Decepción', 'Estresado', 'Infeliz', 
      'Desatendido', 'Apresurado'
    ];
    
    const positiveEmotions = ['Feliz', 'Satisfecho', 'Confiado', 'Valorado', 'Cuidado', 'Seguro', 'Enfocado', 'Indulgente', 'Estimulado', 'Exploratorio', 'Interesado', 'Enérgico'];
    const negativeEmotions = ['Descontento', 'Frustrado', 'Irritado', 'Decepción', 'Estresado', 'Infeliz', 'Desatendido', 'Apresurado'];

    // Inicializar contadores para todas las emociones
    const emotionCounts: Record<string, number> = {};
    let totalEmotionResponses = 0;
    
    allEmotions.forEach(emotion => {
      emotionCounts[emotion] = 0;
    });

    // Contar emociones de las respuestas NEV si hay datos
    if (smartVOCData && smartVOCData.smartVOCResponses && smartVOCData.smartVOCResponses.length > 0) {
      smartVOCData.smartVOCResponses.forEach(response => {
        if (response.questionKey && response.questionKey.toLowerCase().includes('nev')) {
          // La estructura correcta es response.response (no response.response.value)
          if (response.response && Array.isArray(response.response)) {
            const emotions = response.response;
            emotions.forEach((emotion: string) => {
              if (emotionCounts.hasOwnProperty(emotion)) {
                emotionCounts[emotion]++;
                totalEmotionResponses++;
              }
            });
          }
        }
      });
    }

    // Calcular porcentajes basados solo en respuestas existentes
    // Siempre mostrar todas las emociones, con valores reales o 0
    const emotionalStates = allEmotions.map(emotion => {
      const count = emotionCounts[emotion];
      const percentage = totalEmotionResponses > 0 ? Math.round((count / totalEmotionResponses) * 100) : 0;
      return {
        name: emotion,
        value: percentage,
        isPositive: positiveEmotions.includes(emotion)
      };
    });

    // Calcular porcentajes totales de positivas vs negativas
    const positiveCount = emotionalStates
      .filter(state => state.isPositive)
      .reduce((sum, state) => sum + state.value, 0);
    
    const negativeCount = emotionalStates
      .filter(state => !state.isPositive)
      .reduce((sum, state) => sum + state.value, 0);
    
    const totalPercentage = positiveCount + negativeCount;
    const positivePercentage = totalPercentage > 0 ? Math.round((positiveCount / totalPercentage) * 100) : 0;
    const negativePercentage = totalPercentage > 0 ? Math.round((negativeCount / totalPercentage) * 100) : 0;

    // Clusters basados en emociones específicas - siempre mostrar
    const longTermClusters = [
      { name: 'Trust', value: totalEmotionResponses > 0 ? Math.round((emotionCounts['Confiado'] / totalEmotionResponses) * 100) : 0, trend: 'up' as const },
      { name: 'Loyalty', value: totalEmotionResponses > 0 ? Math.round((emotionCounts['Valorado'] / totalEmotionResponses) * 100) : 0, trend: 'up' as const }
    ];

    const shortTermClusters = [
      { name: 'Satisfaction', value: totalEmotionResponses > 0 ? Math.round((emotionCounts['Satisfecho'] / totalEmotionResponses) * 100) : 0, trend: 'up' as const },
      { name: 'Engagement', value: totalEmotionResponses > 0 ? Math.round((emotionCounts['Interesado'] / totalEmotionResponses) * 100) : 0, trend: 'up' as const }
    ];

    const totalResponses = smartVOCData?.totalResponses || 0;

    return {
      emotionalStates,
      longTermClusters,
      shortTermClusters,
      totalResponses,
      positivePercentage,
      negativePercentage
    };
  };

  const nevData = processNEVData();

  // Funciones helper para obtener preguntas reales
  const getQuestionText = (questionType: string) => {
    const question = smartVOCQuestions.find((q: any) => q.id && q.id.toLowerCase().includes(questionType.toLowerCase()));
    console.log(`[DEBUG] Buscando pregunta ${questionType}:`, question);
    return question ? (question.title || question.description) : '';
  };

  const getQuestionInstructions = (questionType: string) => {
    const question = smartVOCQuestions.find((q: any) => q.id && q.id.toLowerCase().includes(questionType.toLowerCase()));
    return question ? (question.instructions || question.description) : '';
  };

  // Obtener textos de preguntas reales
  const csatQuestion = getQuestionText('csat') || "How would you rate your overall satisfaction level with [company]?";
  const cesQuestion = getQuestionText('ces') || "It was easy for me to handle my issue too";
  const cvQuestion = getQuestionText('cv') || "Is there value in your solution over the memory of customers?";
  const nevQuestion = getQuestionText('nev') || "How do you feel about the experience offered by the [company]?";
  const nevInstructions = getQuestionInstructions('nev') || "Please select up to 3 options from these 20 emotional moods";
  const npsQuestion = getQuestionText('nps') || "How likely are you to recommend [company] to a friend or colleague?";
  
  console.log('[DEBUG] Preguntas obtenidas:', { csatQuestion, cesQuestion, cvQuestion, nevQuestion, nevInstructions, npsQuestion });

  return (
    <div className={cn('pt-4', className)}>
      {/* Contenido superior sin sidebar */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* CPVCard con manejo de errores individual */}
          <div className="md:col-span-1">
            {cpvError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error en CPVCard</h3>
                    <p className="text-sm text-red-700 mt-1">{cpvError?.message || 'Error desconocido'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <CPVCard
                value={finalCPVData?.cpvValue || 0}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                trendData={cpvTrendData}
                satisfaction={finalCPVData?.satisfaction || 0}
                retention={finalCPVData?.retention || 0}
                impact={finalCPVData?.impact || 'Bajo'}
                trend={finalCPVData?.trend || 'Neutral'}
                hasData={hasCPVData}
                csatPercentage={finalCPVData?.csatPercentage || 0}
                cesPercentage={finalCPVData?.cesPercentage || 0}
                peakValue={finalCPVData?.peakValue || 0}
                isLoading={isCPVLoading}
              />
            )}
          </div>

          {/* TrustRelationshipFlow con manejo de errores individual */}
          <div className="md:col-span-2">
            {trustFlowError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error en Trust Flow</h3>
                    <p className="text-sm text-red-700 mt-1">{trustFlowError?.message || 'Error desconocido'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <TrustRelationshipFlow
                data={finalTrustFlowDataForDemo}
                hasData={hasTrustFlowDataForDemo}
                isLoading={isTrustFlowLoading}
              />
            )}
          </div>
        </div>

        {/* Selector de preguntas SmartVOC - Solo se muestra cuando hay datos */}
        {/* {!questionsLoading && !questionsError && smartVOCQuestions.length > 0 && (
          <QuestionSelector
            questions={smartVOCQuestions}
            smartVOCData={smartVOCData}
          />
        )} */}

        {questionsLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Cargando preguntas SmartVOC...</div>
          </div>
        )}

        {questionsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error al cargar preguntas</h3>
                <p className="text-sm text-red-700 mt-1">{questionsError?.message || 'Error desconocido'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay preguntas disponibles */}
        {!questionsLoading && !questionsError && smartVOCQuestions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay preguntas SmartVOC disponibles con datos.</p>
          </div>
        )}

        {/* Las 3 tarjetas de métricas siempre están presentes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Customer Satisfaction */}
          <MetricCard
            title="Customer Satisfaction"
            score={smartVOCData && smartVOCData.csatScores && smartVOCData.csatScores.length > 0
              ? parseFloat((smartVOCData.csatScores.reduce((a, b) => a + b, 0) / smartVOCData.csatScores.length).toFixed(2))
              : 0
            }
            question="How are feeling your customers when they interact with you?"
            data={[]}
            hasData={!!(smartVOCData && smartVOCData.csatScores && smartVOCData.csatScores.length > 0)}
          />

          {/* Customer Effort Score */}
          <MetricCard
            title="Customer Effort Score"
            score={smartVOCData && smartVOCData.cesScores && smartVOCData.cesScores.length > 0
              ? parseFloat((smartVOCData.cesScores.reduce((a, b) => a + b, 0) / smartVOCData.cesScores.length).toFixed(2))
              : 0
            }
            question="How much effort do they need to do to complete a task?"
            data={[]}
            hasData={!!(smartVOCData && smartVOCData.cesScores && smartVOCData.cesScores.length > 0)}
          />

          {/* Cognitive Value */}
          <MetricCard
            title="Cognitive Value"
            score={smartVOCData && smartVOCData.cvScores && smartVOCData.cvScores.length > 0
              ? parseFloat((smartVOCData.cvScores.reduce((a, b) => a + b, 0) / smartVOCData.cvScores.length).toFixed(2))
              : 0
            }
            question="Is there value in your solution over the memory of customers?"
            data={[]}
            hasData={!!(smartVOCData && smartVOCData.cvScores && smartVOCData.cvScores.length > 0)}
          />
        </div>
      </div>

      {/* Sección con sidebar alineado con "1.0.- Smart VOC" */}
      <div className="flex gap-8 mt-8">
        <div className="flex-1">
          {/* Sección detallada "1.0.- Smart VOC" */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">1.0.- Smart VOC</h2>

            <div className="space-y-6">
              {/* 2.1.- Question: Customer Satisfaction Score (CSAT) */}
              <QuestionResults
                questionNumber="2.1"
                title="Customer Satisfaction Score (CSAT)"
                type="Linear Scale question"
                conditionality="Conditionality disabled"
                required={true}
                question={csatQuestion}
                responses={{
                  count: smartVOCData?.totalResponses || 0,
                  timeAgo: '0s'
                }}
                score={smartVOCData && smartVOCData.csatScores && smartVOCData.csatScores.length > 0
                  ? parseFloat((smartVOCData.csatScores.reduce((a, b) => a + b, 0) / smartVOCData.csatScores.length).toFixed(2))
                  : 0.00
                }
                distribution={[
                  { 
                    label: 'Promoters', 
                    percentage: smartVOCData && smartVOCData.csatScores && smartVOCData.csatScores.length > 0 
                      ? Math.round((smartVOCData.csatScores.reduce((a, b) => a + b, 0) / smartVOCData.csatScores.length) * 0.6) 
                      : 0, 
                    color: '#10B981' 
                  },
                  { 
                    label: 'Neutrals', 
                    percentage: smartVOCData && smartVOCData.csatScores && smartVOCData.csatScores.length > 0 
                      ? Math.round((smartVOCData.csatScores.reduce((a, b) => a + b, 0) / smartVOCData.csatScores.length) * 0.3) 
                      : 0, 
                    color: '#F59E0B' 
                  },
                  { 
                    label: 'Detractors', 
                    percentage: smartVOCData && smartVOCData.csatScores && smartVOCData.csatScores.length > 0 
                      ? Math.round((smartVOCData.csatScores.reduce((a, b) => a + b, 0) / smartVOCData.csatScores.length) * 0.1) 
                      : 0, 
                    color: '#EF4444' 
                  }
                ]}
              />

              {/* 2.2.- Question: Customer Effort Score (CES) */}
              <QuestionResults
                questionNumber="2.2"
                title="Customer Effort Score (CES)"
                type="Linear Scale question"
                conditionality="Conditionality disabled"
                required={true}
                question={cesQuestion}
                responses={{
                  count: smartVOCData?.totalResponses || 0,
                  timeAgo: '0s'
                }}
                score={smartVOCData && smartVOCData.cesScores && smartVOCData.cesScores.length > 0
                  ? parseFloat((smartVOCData.cesScores.reduce((a, b) => a + b, 0) / smartVOCData.cesScores.length).toFixed(2))
                  : 0.00
                }
                distribution={[
                  { 
                    label: 'Little effort', 
                    percentage: smartVOCData && smartVOCData.cesScores && smartVOCData.cesScores.length > 0 
                      ? Math.round((smartVOCData.cesScores.reduce((a, b) => a + b, 0) / smartVOCData.cesScores.length) * 0.6) 
                      : 0, 
                    color: '#10B981' 
                  },
                  { 
                    label: 'Neutrals', 
                    percentage: smartVOCData && smartVOCData.cesScores && smartVOCData.cesScores.length > 0 
                      ? Math.round((smartVOCData.cesScores.reduce((a, b) => a + b, 0) / smartVOCData.cesScores.length) * 0.3) 
                      : 0, 
                    color: '#F59E0B' 
                  },
                  { 
                    label: 'Much effort', 
                    percentage: smartVOCData && smartVOCData.cesScores && smartVOCData.cesScores.length > 0 
                      ? Math.round((smartVOCData.cesScores.reduce((a, b) => a + b, 0) / smartVOCData.cesScores.length) * 0.1) 
                      : 0, 
                    color: '#EF4444' 
                  }
                ]}
              />

              {/* 2.3.- Question: Cognitive Value (CV) */}
              <QuestionResults
                questionNumber="2.3"
                title="Cognitive Value (CV)"
                type="Linear Scale question"
                conditionality="Conditionality disabled"
                required={true}
                question={cvQuestion}
                responses={{
                  count: smartVOCData?.totalResponses || 0,
                  timeAgo: '0s'
                }}
                score={smartVOCData && smartVOCData.cvScores && smartVOCData.cvScores.length > 0
                  ? parseFloat((smartVOCData.cvScores.reduce((a, b) => a + b, 0) / smartVOCData.cvScores.length).toFixed(2))
                  : 0.00
                }
                distribution={[
                  { 
                    label: 'Worth', 
                    percentage: smartVOCData && smartVOCData.cvScores && smartVOCData.cvScores.length > 0 
                      ? Math.round((smartVOCData.cvScores.reduce((a, b) => a + b, 0) / smartVOCData.cvScores.length) * 0.6) 
                      : 0, 
                    color: '#10B981' 
                  },
                  { 
                    label: 'Neutrals', 
                    percentage: smartVOCData && smartVOCData.cvScores && smartVOCData.cvScores.length > 0 
                      ? Math.round((smartVOCData.cvScores.reduce((a, b) => a + b, 0) / smartVOCData.cvScores.length) * 0.3) 
                      : 0, 
                    color: '#F59E0B' 
                  },
                  { 
                    label: 'Worthless', 
                    percentage: smartVOCData && smartVOCData.cvScores && smartVOCData.cvScores.length > 0 
                      ? Math.round((smartVOCData.cvScores.reduce((a, b) => a + b, 0) / smartVOCData.cvScores.length) * 0.1) 
                      : 0, 
                    color: '#EF4444' 
                  }
                ]}
              />

              {/* 2.4.- Question: Net Emotional Value (NEV) */}
              <EmotionalStates
                emotionalStates={nevData.emotionalStates}
                longTermClusters={nevData.longTermClusters}
                shortTermClusters={nevData.shortTermClusters}
                totalResponses={nevData.totalResponses}
                responseTime="0s"
                positivePercentage={nevData.positivePercentage}
                negativePercentage={nevData.negativePercentage}
                questionText={nevQuestion}
                instructionsText={nevInstructions}
              />

              {/* 2.5.- Question: Net Promoter Score (NPS) */}
              <NPSQuestion
                monthlyData={[
                  { month: 'Ene', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 },
                  { month: 'Feb', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 },
                  { month: 'Mar', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 },
                  { month: 'Abr', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 },
                  { month: 'May', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 },
                  { month: 'Jun', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 }
                ]}
                npsScore={cpvData?.npsValue || 0}
                promoters={cpvData?.promoters || 0}
                detractors={cpvData?.detractors || 0}
                neutrals={cpvData?.neutrals || 0}
                totalResponses={smartVOCData?.totalResponses || 0}
                isLoading={isSmartVOCLoading}
                questionText={npsQuestion}
              />

              {/* 2.6.- Question: Voice of Customer (VOC) */}
              <VOCQuestion
                comments={smartVOCData?.vocResponses?.map(response => {
                  // Función para detectar si el texto es válido o solo caracteres aleatorios
                  const isValidComment = (text: string) => {
                    // Si tiene menos de 3 caracteres, probablemente es spam
                    if (text.length < 3) return false;

                    // Si son solo caracteres repetidos (como "aaaa" o "1111")
                    if (/^(.)\1+$/.test(text)) return false;

                    // Si son solo caracteres aleatorios sin vocales (como "fbgfhfh")
                    if (!/[aeiouáéíóúü]/i.test(text) && text.length > 5) return false;

                    // Si son solo números
                    if (/^\d+$/.test(text)) return false;

                    // Si son solo caracteres especiales
                    if (/^[^a-zA-Z0-9\s]+$/.test(text)) return false;

                    return true;
                  };

                  const isValid = isValidComment(response.text);

                  return {
                    text: response.text,
                    mood: isValid ? 'Positive' : 'Neutral', // Comentarios inválidos son neutrales
                    selected: false
                  };
                }) || []}
              />
            </div>
          </div>
        </div>

        {/* Sidebar de filtros alineado con el título "1.0.- Smart VOC" */}
        <div className="w-80 shrink-0 mt-[52px]">
          <Filters researchId={researchId} />
        </div>
      </div>
    </div>
  );
}
