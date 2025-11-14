'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';

import { useSmartVOCResponses } from '@/hooks/useSmartVOCResponses';
import { CPVCard } from './CPVCard';
import { EmotionalStates } from './EmotionalStates';
import { Filters } from './Filters';
import { MetricCard } from './MetricCard';
import { NPSQuestion } from './NPSQuestion';
import { QuestionResults } from './QuestionResults';
import { TrustRelationshipFlow } from './TrustRelationshipFlow';
import { VOCQuestion } from './VOCQuestion';
import { SmartVOCResultsProps } from './types';


export function SmartVOCResults({ researchId, className }: SmartVOCResultsProps) {
  const [timeRange, setTimeRange] = useState<'Today' | 'Week' | 'Month'>('Today');

  // Hook que carga datos SmartVOC automáticamente
  const {
    data: smartVOCData,
    isLoading,
    error
  } = useSmartVOCResponses(researchId);

  // 🎯 DEBUG: Ver qué devuelve el hook
  console.log('[SmartVOCResults] smartVOCData completo:', smartVOCData);
  console.log('[SmartVOCResults] isLoading:', isLoading);
  console.log('[SmartVOCResults] error:', error);
  console.log('[SmartVOCResults] csatScores:', smartVOCData?.csatScores);
  console.log('[SmartVOCResults] cesScores:', smartVOCData?.cesScores);
  console.log('[SmartVOCResults] cvScores:', smartVOCData?.cvScores);

  // Usar preguntas por defecto para mostrar textos
  const defaultQuestions = [
    {
      id: 'smartvoc_nps',
      type: 'SMARTVOC_NPS',
      title: 'Net Promoter Score (NPS)',
      description: 'On a scale from 0-10, how likely are you to recommend [company] to a friend or colleague?'
    },
    {
      id: 'smartvoc_voc',
      type: 'SMARTVOC_VOC',
      title: 'Voice of Customer (VOC)',
      description: 'Please share your thoughts about your experience with our service.'
    },
    {
      id: 'smartvoc_csat',
      type: 'SMARTVOC_CSAT',
      title: 'Customer Satisfaction (CSAT)',
      description: 'How would you rate your overall satisfaction level with our service?'
    },
    {
      id: 'smartvoc_ces',
      type: 'SMARTVOC_CES',
      title: 'Customer Effort Score (CES)',
      description: 'How much effort did you personally have to put forth to handle your request?'
    },
    {
      id: 'smartvoc_cv',
      type: 'SMARTVOC_CV',
      title: 'Customer Value (CV)',
      description: 'How would you rate the overall value you receive from our product/service?'
    },
    {
      id: 'smartvoc_nev',
      type: 'SMARTVOC_NEV',
      title: 'Net Emotional Value (NEV)',
      description: 'How do you feel about your experience with our service?',
      instructions: 'Please select up to 3 options from these 20 emotional moods'
    }
  ];

  // Datos disponibles del nuevo hook
  const hasData = smartVOCData !== null && !error;
  
  // Preparar datos para CPVCard usando timeSeriesData
  const cpvTrendData = smartVOCData?.timeSeriesData?.map(item => ({
    date: new Date(item.date + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    value: item.score
  })) || [];

  // Datos CPV derivados de smartVOCData
  const cpvData = smartVOCData ? {
    cpvValue: smartVOCData.cpvValue || 0,
    satisfaction: smartVOCData.satisfaction || 0,
    retention: smartVOCData.retention || 0,
    impact: smartVOCData.impact || '',
    trend: smartVOCData.trend || '',
    csatPercentage: (smartVOCData.csatScores && Array.isArray(smartVOCData.csatScores) && smartVOCData.csatScores.length > 0) 
      ? Math.round((smartVOCData.csatScores.filter(s => s >= 4).length / smartVOCData.csatScores.length) * 100) 
      : 0,
    cesPercentage: (smartVOCData.cesScores && Array.isArray(smartVOCData.cesScores) && smartVOCData.cesScores.length > 0) 
      ? Math.round((smartVOCData.cesScores.filter(s => s <= 2).length / smartVOCData.cesScores.length) * 100) 
      : 0,
    peakValue: Math.max(smartVOCData.cpvValue || 0, smartVOCData.satisfaction || 0),
    npsValue: smartVOCData.npsScore || 0,
    promoters: smartVOCData.promoters || 0,
    neutrals: smartVOCData.neutrals || 0,
    detractors: smartVOCData.detractors || 0
  } : null;

  // TrustFlow data derivado - mapear timeSeriesData al formato esperado por TrustRelationshipFlow
  const trustFlowData = (smartVOCData?.timeSeriesData || []).map(item => ({
    stage: new Date(item.date + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    nps: item.nps || 0,
    nev: item.nev || 0,
    timestamp: item.date, // Guardar timestamp original para filtrado
    count: item.count || 0
  }));
  
  // Debug: Ver qué datos se están generando
  console.log('[SmartVOCResults] timeSeriesData original:', smartVOCData?.timeSeriesData);
  console.log('[SmartVOCResults] trustFlowData mapeado:', trustFlowData);

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
      console.log('[processNEVData] smartVOCResponses:', smartVOCData.smartVOCResponses);
      smartVOCData.smartVOCResponses.forEach(response => {
        if (response.questionKey && response.questionKey.toLowerCase().includes('nev')) {
          console.log('[processNEVData] Procesando respuesta NEV:', response);
          // 🔄 FIX: Los datos vienen como string separado por comas, no como array
          let emotions: string[] = [];
          
          if (typeof response.response === 'string') {
            // Caso: "feliz,cuidado,seguro,interesado" (puede venir en minúsculas)
            emotions = response.response.split(',').map((e: string) => {
              const trimmed = e.trim();
              // Capitalizar primera letra para que coincida con las emociones definidas
              return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
            });
          } else if (Array.isArray(response.response)) {
            // Caso: ya es array
            emotions = response.response.map((e: string) => {
              const trimmed = String(e).trim();
              return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
            });
          } else if (response.response && typeof response.response === 'object' && 'value' in response.response) {
            // Caso: {value: "feliz,cuidado,seguro,interesado"}
            const responseObj = response.response as { value: unknown };
            if (typeof responseObj.value === 'string') {
              emotions = responseObj.value.split(',').map((e: string) => {
                const trimmed = e.trim();
                return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
              });
            } else if (Array.isArray(responseObj.value)) {
              emotions = responseObj.value.map((e: string) => {
                const trimmed = String(e).trim();
                return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
              });
            }
          }
          
          console.log('[processNEVData] Emociones parseadas:', emotions);
          
          emotions.forEach((emotion: string) => {
            // Buscar coincidencia case-insensitive
            const emotionKey = Object.keys(emotionCounts).find(
              key => key.toLowerCase() === emotion.toLowerCase()
            );
            if (emotionKey) {
              emotionCounts[emotionKey]++;
              totalEmotionResponses++;
              console.log(`[processNEVData] ✅ Emoción "${emotion}" encontrada como "${emotionKey}", count: ${emotionCounts[emotionKey]}`);
            } else {
              console.log(`[processNEVData] ❌ Emoción "${emotion}" no encontrada en emotionCounts`);
            }
          });
        }
      });
    }
    
    console.log('[processNEVData] emotionCounts final:', emotionCounts);
    console.log('[processNEVData] totalEmotionResponses:', totalEmotionResponses);

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

    const totalResponses = smartVOCData?.smartVOCResponses?.filter(r => r.questionKey?.toLowerCase().includes('nev')).length || 0;

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

  // Helper functions for safe calculations
  const safeCalculateAverage = (scores: number[] | undefined): number => {
    if (!scores || scores.length === 0) return 0;
    return parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
  };

  const safeCalculatePercentage = (scores: number[] | undefined, filterFn: (score: number) => boolean): number => {
    if (!scores || scores.length === 0) return 0;
    return Math.round((scores.filter(filterFn).length / scores.length) * 100);
  };

  const hasScores = (scores: number[] | undefined): boolean => {
    return !!(scores && scores.length > 0);
  };

  // Funciones helper para obtener preguntas
  const getQuestionText = (questionType: string) => {
    const question = defaultQuestions.find(q => q.id.toLowerCase().includes(questionType.toLowerCase()));
    return question ? (question.title || question.description) : '';
  };

  const getQuestionInstructions = (questionType: string) => {
    const question = defaultQuestions.find(q => q.id.toLowerCase().includes(questionType.toLowerCase()));
    return question ? ((question as any).instructions || question.description) : '';
  };

  // Obtener textos de preguntas reales
  const csatQuestion = getQuestionText('csat') || "How would you rate your overall satisfaction level with [company]?";
  const cesQuestion = getQuestionText('ces') || "It was easy for me to handle my issue too";
  const cvQuestion = getQuestionText('cv') || "Is there value in your solution over the memory of customers?";
  const nevQuestion = getQuestionText('nev') || "How do you feel about the experience offered by the [company]?";
  const nevInstructions = getQuestionInstructions('nev') || "Please select up to 3 options from these 20 emotional moods";
  const npsQuestion = getQuestionText('nps') || "How likely are you to recommend [company] to a friend or colleague?";
  const vocQuestion = getQuestionText('voc') || "What else would you like to tell us about your experience?";

  // Procesar datos para MetricCards basados en respuestas reales
  const processMetricData = (scores: number[], type: 'csat' | 'ces' | 'cv') => {
    if (!scores || scores.length === 0) {
      return [];
    }

    // Con pocas respuestas, mostrar los scores reales mapeados a porcentajes
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    
    return months.map((month, index) => {
      // Solo mostrar datos para los primeros meses según el número de respuestas
      if (index >= scores.length) {
        return {
          date: month,
          satisfied: 0,
          dissatisfied: 0
        };
      }

      const score = scores[index];
      
      if (type === 'csat') {
        // Para CSAT: convertir score de 1-5 a porcentaje
        // Score alto = más satisfied, score bajo = más dissatisfied
        const satisfied = ((score - 1) / 4) * 100; // 1=0%, 5=100%
        const dissatisfied = 100 - satisfied;
        return {
          date: month,
          satisfied: Math.round(satisfied),
          dissatisfied: Math.round(dissatisfied)
        };
      } else if (type === 'ces') {
        // Para CES: score bajo = menos esfuerzo (mejor), score alto = más esfuerzo (peor)
        const littleEffort = ((5 - score) / 4) * 100; // 1=100%, 5=0%
        const muchEffort = 100 - littleEffort;
        return {
          date: month,
          satisfied: Math.round(littleEffort), // usando satisfied para little effort
          dissatisfied: Math.round(muchEffort) // usando dissatisfied para much effort
        };
      } else { // cv
        // Para CV: convertir score de 1-5 a porcentaje
        const worth = ((score - 1) / 4) * 100; // 1=0%, 5=100%
        const worthless = 100 - worth;
        return {
          date: month,
          satisfied: Math.round(worth), // usando satisfied para worth
          dissatisfied: Math.round(worthless) // usando dissatisfied para worthless
        };
      }
    });
  };

  const csatData = processMetricData(smartVOCData?.csatScores || [], 'csat');
  const cesData = processMetricData(smartVOCData?.cesScores || [], 'ces');
  const cvData = processMetricData(smartVOCData?.cvScores || [], 'cv');

  // Debug: mostrar los scores reales que se están procesando
  console.log('[DEBUG] Raw scores:', {
    csat: smartVOCData?.csatScores,
    ces: smartVOCData?.cesScores,
    cv: smartVOCData?.cvScores,
    total: smartVOCData?.totalResponses
  });
  console.log('[DEBUG] Processed data:', { csatData, cesData, cvData });

  return (
    <div className={cn('pt-4', className)}>
      {/* Contenido superior sin sidebar */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* CPVCard */}
          <div className="md:col-span-1">
            <CPVCard
              value={cpvData?.cpvValue || 0}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              trendData={cpvTrendData}
              satisfaction={cpvData?.satisfaction || 0}
              retention={cpvData?.retention || 0}
              impact={cpvData?.impact || 'Bajo'}
              trend={cpvData?.trend || 'Neutral'}
              hasData={hasData}
              csatPercentage={cpvData?.csatPercentage || 0}
              cesPercentage={cpvData?.cesPercentage || 0}
              peakValue={cpvData?.peakValue || 0}
              isLoading={isLoading}
            />
          </div>

          {/* TrustRelationshipFlow */}
          <div className="md:col-span-2">
            <TrustRelationshipFlow
              data={trustFlowData}
              hasData={hasData}
              isLoading={isLoading}
              timeRange={timeRange === 'Today' ? '24h' : timeRange === 'Week' ? 'week' : 'month'}
              onTimeRangeChange={(range) => {
                const newRange = range === '24h' ? 'Today' : range === 'week' ? 'Week' : 'Month';
                setTimeRange(newRange as 'Today' | 'Week' | 'Month');
              }}
            />
          </div>
        </div>


        {/* Las 3 tarjetas de métricas siempre están presentes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Customer Satisfaction */}
          <MetricCard
            title="Customer Satisfaction"
            score={safeCalculateAverage(smartVOCData?.csatScores)}
            question={csatQuestion}
            data={csatData}
            hasData={hasScores(smartVOCData?.csatScores)}
          />

          {/* Customer Effort Score */}
          <MetricCard
            title="Customer Effort Score"
            score={safeCalculateAverage(smartVOCData?.cesScores)}
            question={cesQuestion}
            data={cesData}
            hasData={hasScores(smartVOCData?.cesScores)}
          />

          {/* Cognitive Value */}
          <MetricCard
            title="Cognitive Value"
            score={safeCalculateAverage(smartVOCData?.cvScores)}
            question={cvQuestion}
            data={cvData}
            hasData={hasScores(smartVOCData?.cvScores)}
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
                questionType="CSAT"
                question={csatQuestion}
                responses={{
                  count: smartVOCData?.csatScores?.length || 0,
                  timeAgo: '0s'
                }}
                score={safeCalculateAverage(smartVOCData?.csatScores)}
                distribution={[
                  { 
                    label: 'Satisfied', 
                    percentage: safeCalculatePercentage(smartVOCData?.csatScores, s => s >= 4), 
                    color: '#10B981' 
                  },
                  { 
                    label: 'Neutral', 
                    percentage: safeCalculatePercentage(smartVOCData?.csatScores, s => s === 3), 
                    color: '#F59E0B' 
                  },
                  { 
                    label: 'Dissatisfied', 
                    percentage: safeCalculatePercentage(smartVOCData?.csatScores, s => s <= 2), 
                    color: '#EF4444' 
                  }
                ]}
              />

              {/* 2.2.- Question: Customer Effort Score (CES) */}
              <QuestionResults
                questionNumber="2.2"
                title="Customer Effort Score (CES)"
                questionType="CES"
                question={cesQuestion}
                responses={{
                  count: smartVOCData?.cesScores?.length || 0,
                  timeAgo: '0s'
                }}
                score={safeCalculateAverage(smartVOCData?.cesScores)}
                distribution={[
                  { 
                    label: 'Little effort', 
                    percentage: safeCalculatePercentage(smartVOCData?.cesScores, s => s <= 2), 
                    color: '#10B981' 
                  },
                  { 
                    label: 'Neutral', 
                    percentage: safeCalculatePercentage(smartVOCData?.cesScores, s => s >= 3 && s <= 4), 
                    color: '#F59E0B' 
                  },
                  { 
                    label: 'Much effort', 
                    percentage: safeCalculatePercentage(smartVOCData?.cesScores, s => s >= 5), 
                    color: '#EF4444' 
                  }
                ]}
              />

              {/* 2.3.- Question: Cognitive Value (CV) */}
              <QuestionResults
                questionNumber="2.3"
                title="Cognitive Value (CV)"
                questionType="CV"
                question={cvQuestion}
                responses={{
                  count: smartVOCData?.cvScores?.length || 0,
                  timeAgo: '0s'
                }}
                score={safeCalculateAverage(smartVOCData?.cvScores)}
                distribution={[
                  { 
                    label: 'Worth', 
                    percentage: safeCalculatePercentage(smartVOCData?.cvScores, s => s >= 4), 
                    color: '#10B981' 
                  },
                  { 
                    label: 'Neutral', 
                    percentage: safeCalculatePercentage(smartVOCData?.cvScores, s => s === 3), 
                    color: '#F59E0B' 
                  },
                  { 
                    label: 'Worthless', 
                    percentage: safeCalculatePercentage(smartVOCData?.cvScores, s => s <= 2), 
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
                questionNumber="2.4"
                questionType="NEV"
              />

              {/* 2.5.- Question: Net Promoter Score (NPS) */}
              <NPSQuestion
                monthlyData={smartVOCData?.monthlyNPSData || [
                  { month: 'Ene', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 },
                  { month: 'Feb', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 },
                  { month: 'Mar', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 },
                  { month: 'Abr', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 },
                  { month: 'May', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 },
                  { month: 'Jun', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 }
                ]}
                npsScore={smartVOCData?.npsScore || 0}
                promoters={smartVOCData?.promoters || 0}
                detractors={smartVOCData?.detractors || 0}
                neutrals={smartVOCData?.neutrals || 0}
                totalResponses={smartVOCData?.npsScores?.length || 0}
                isLoading={isLoading}
                questionText={npsQuestion}
                questionNumber="2.5"
                questionType="NPS"
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
                questionNumber="2.6"
                questionType="VOC"
                questionText={vocQuestion}
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
