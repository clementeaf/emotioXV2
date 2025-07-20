'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

import { useCPVData } from '@/hooks/useCPVData';
import { useSmartVOCResponses } from '@/hooks/useSmartVOCResponses';
import { useTrustFlowData } from '@/hooks/useTrustFlowData';
import { smartVOCFormService } from '@/services/smartVOCFormService';
import { QuestionType } from 'shared/interfaces/question-types.enum';
import { SmartVOCQuestion } from 'shared/interfaces/smart-voc.interface';
import { CPVCard } from './CPVCard';
import { Filters } from './Filters';
import { QuestionSelector } from './QuestionSelector';
import { TrustRelationshipFlow } from './TrustRelationshipFlow';
import { SmartVOCResultsProps } from './types';

// Hook real para obtener las preguntas de SmartVOC
const useSmartVOCQuestions = (researchId: string) => {
  const [questions, setQuestions] = useState<SmartVOCQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!researchId) {
        setError('Research ID es requerido');
        setIsLoading(false);
        return;
      }

      try {
        console.log(`[useSmartVOCQuestions] 🔍 Obteniendo preguntas SmartVOC para research: ${researchId}`);

        const formData = await smartVOCFormService.getByResearchId(researchId);

        if (formData && formData.questions && formData.questions.length > 0) {
          console.log(`[useSmartVOCQuestions] ✅ Preguntas obtenidas:`, formData.questions.length);
          setQuestions(formData.questions);
        } else {
          console.log(`[useSmartVOCQuestions] ⚠️ No se encontraron preguntas configuradas, usando preguntas por defecto`);
          // Usar preguntas por defecto si no hay configuración
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
          setQuestions(defaultQuestions);
        }
      } catch (error: any) {
        console.error(`[useSmartVOCQuestions] ❌ Error al obtener preguntas:`, error);
        setError(error.message || 'Error al obtener preguntas SmartVOC');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [researchId]);

  return {
    questions,
    isLoading,
    error
  };
};

export function SmartVOCResults({ researchId, className }: SmartVOCResultsProps) {
  const [timeRange, setTimeRange] = useState<'Today' | 'Week' | 'Month'>('Today');

  // Hooks individuales con resiliencia
  const {
    data: cpvData,
    isLoading: cpvLoading,
    error: cpvError,
    defaultData: cpvDefault
  } = useCPVData(researchId);

  const {
    data: trustFlowData,
    isLoading: trustFlowLoading,
    error: trustFlowError,
    defaultData: trustFlowDefault
  } = useTrustFlowData(researchId);

  // Hook para datos generales SmartVOC (para NPS y VOC)
  const {
    data: smartVOCData,
    isLoading: smartVOCLoading,
    error: smartVOCError
  } = useSmartVOCResponses(researchId);

  // Hook para obtener las preguntas de SmartVOC
  const {
    questions: smartVOCQuestions,
    isLoading: questionsLoading,
    error: questionsError
  } = useSmartVOCQuestions(researchId);

  // Usar datos reales en lugar de datos de prueba
  const shouldUseTestData = false; // Usar datos reales

  // Preparar datos para CPVCard
  const cpvTrendData = trustFlowData.length > 0 ? trustFlowData.map(item => ({
    date: item.stage,
    value: (item.nps + item.nev) / 2 // Promedio de NPS y NEV
  })) : [];

  // Usar datos de prueba para CPVCard también
  const cpvTrendDataForDemo = shouldUseTestData ? trustFlowDefault.map(item => ({
    date: item.stage,
    value: (item.nps + item.nev) / 2 // Promedio de NPS y NEV
  })) : cpvTrendData;

  // Usar datos reales o valores por defecto
  const finalCPVData = cpvData || cpvDefault;
  const finalTrustFlowData = trustFlowData.length > 0 ? trustFlowData : trustFlowDefault;

  // Determinar si hay datos reales
  const hasCPVData = cpvData !== null && !cpvError;
  const hasTrustFlowData = trustFlowData.length > 0 && !trustFlowError;

  const finalTrustFlowDataForDemo = shouldUseTestData ? trustFlowDefault : finalTrustFlowData;
  const hasTrustFlowDataForDemo = shouldUseTestData ? true : hasTrustFlowData;

  // Debug logs
  console.log('[SmartVOCResults] 📊 CPV Data:', cpvData ? '✅' : '❌', '| Loading:', cpvLoading, '| Error:', cpvError ? '❌' : '✅');
  console.log('[SmartVOCResults] 📊 Trust Flow Data:', trustFlowData.length > 0 ? '✅' : '❌', '| Loading:', trustFlowLoading, '| Error:', trustFlowError ? '❌' : '✅');
  console.log('[SmartVOCResults] 🔍 Trust Flow Data Details:', {
    dataLength: trustFlowData.length,
    data: trustFlowData,
    hasData: hasTrustFlowData,
    finalData: finalTrustFlowData
  });

  return (
    <div className={cn('flex gap-8 p-8', className)}>
      <div className="flex-1 space-y-8">
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
                    <p className="text-sm text-red-700 mt-1">{cpvError}</p>
                  </div>
                </div>
              </div>
            ) : (
              <CPVCard
                value={finalCPVData.cpvValue}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                trendData={cpvTrendDataForDemo}
                satisfaction={finalCPVData.satisfaction}
                retention={finalCPVData.retention}
                impact={finalCPVData.impact}
                trend={finalCPVData.trend}
                hasData={hasCPVData}
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
                    <p className="text-sm text-red-700 mt-1">{trustFlowError}</p>
                  </div>
                </div>
              </div>
            ) : (
              <TrustRelationshipFlow
                data={finalTrustFlowDataForDemo}
                hasData={hasTrustFlowDataForDemo}
              />
            )}
          </div>
        </div>

        {/* Selector de preguntas SmartVOC */}
        {!questionsLoading && !questionsError && (
          <QuestionSelector
            researchId={researchId}
            questions={smartVOCQuestions}
            smartVOCData={smartVOCData}
          />
        )}

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
                <p className="text-sm text-red-700 mt-1">{questionsError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Los MetricCards se renderizarán cuando haya datos reales */}
        </div>
      </div>

      <Filters className="w-80 shrink-0" />
    </div>
  );
}
