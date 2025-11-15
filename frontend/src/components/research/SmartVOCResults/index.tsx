'use client';

import { useMemo, useState } from 'react';

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
import {
  safeCalculateAverage,
  safeCalculatePercentage,
  hasScores
} from './utils/calculations';
import {
  getQuestionText,
  getQuestionInstructions
} from './utils/question-helpers';
import {
  processMetricData,
  processNEVData,
  isValidComment
} from './utils/data-processors';

export function SmartVOCResults({ researchId, className }: SmartVOCResultsProps) {
  const [timeRange, setTimeRange] = useState<'Today' | 'Week' | 'Month'>('Today');

  const {
    data: smartVOCData,
    isLoading,
    error
  } = useSmartVOCResponses(researchId);

  const hasData = useMemo(() => {
    return smartVOCData !== null && !error;
  }, [smartVOCData, error]);

  const cpvTrendData = useMemo(() => {
    return smartVOCData?.timeSeriesData?.map(item => ({
      date: new Date(item.date + 'T12:00:00').toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric' 
      }),
      value: item.score
    })) || [];
  }, [smartVOCData?.timeSeriesData]);

  const cpvData = useMemo(() => {
    if (!smartVOCData) return null;
    
    return {
      cpvValue: smartVOCData.cpvValue || 0,
      satisfaction: smartVOCData.satisfaction || 0,
      retention: smartVOCData.retention || 0,
      impact: smartVOCData.impact || '',
      trend: smartVOCData.trend || '',
      csatPercentage: hasScores(smartVOCData.csatScores)
        ? Math.round((smartVOCData.csatScores.filter(s => s >= 4).length / smartVOCData.csatScores.length) * 100)
        : 0,
      cesPercentage: hasScores(smartVOCData.cesScores)
        ? Math.round((smartVOCData.cesScores.filter(s => s <= 2).length / smartVOCData.cesScores.length) * 100)
        : 0,
      peakValue: Math.max(smartVOCData.cpvValue || 0, smartVOCData.satisfaction || 0),
      npsValue: smartVOCData.npsScore || 0,
      promoters: smartVOCData.promoters || 0,
      neutrals: smartVOCData.neutrals || 0,
      detractors: smartVOCData.detractors || 0
    };
  }, [smartVOCData]);

  const trustFlowData = useMemo(() => {
    return (smartVOCData?.timeSeriesData || []).map(item => ({
      stage: new Date(item.date + 'T12:00:00').toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric' 
      }),
      nps: item.nps || 0,
      nev: item.nev || 0,
      timestamp: item.date,
      count: item.count || 0
    }));
  }, [smartVOCData?.timeSeriesData]);

  const nevData = useMemo(() => {
    return processNEVData(smartVOCData);
  }, [smartVOCData]);

  const csatQuestion = getQuestionText('csat') || 
    "How would you rate your overall satisfaction level with [company]?";
  const cesQuestion = getQuestionText('ces') || 
    "It was easy for me to handle my issue too";
  const cvQuestion = getQuestionText('cv') || 
    "Is there value in your solution over the memory of customers?";
  const nevQuestion = getQuestionText('nev') || 
    "How do you feel about the experience offered by the [company]?";
  const nevInstructions = getQuestionInstructions('nev') || 
    "Please select up to 3 options from these 20 emotional moods";
  const npsQuestion = getQuestionText('nps') || 
    "How likely are you to recommend [company] to a friend or colleague?";
  const vocQuestion = getQuestionText('voc') || 
    "What else would you like to tell us about your experience?";

  const csatData = useMemo(() => {
    return processMetricData(smartVOCData?.csatScores || [], 'csat');
  }, [smartVOCData?.csatScores]);

  const cesData = useMemo(() => {
    return processMetricData(smartVOCData?.cesScores || [], 'ces');
  }, [smartVOCData?.cesScores]);

  const cvData = useMemo(() => {
    return processMetricData(smartVOCData?.cvScores || [], 'cv');
  }, [smartVOCData?.cvScores]);

  const monthlyNPSData = useMemo(() => {
    return smartVOCData?.monthlyNPSData || [
      { month: 'Ene', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 },
      { month: 'Feb', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 },
      { month: 'Mar', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 },
      { month: 'Abr', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 },
      { month: 'May', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 },
      { month: 'Jun', promoters: 0, neutrals: 0, detractors: 0, npsRatio: 0 }
    ];
  }, [smartVOCData?.monthlyNPSData]);

  const vocComments = useMemo(() => {
    return smartVOCData?.vocResponses?.map(response => ({
      text: response.text,
      mood: isValidComment(response.text) ? 'Positive' : 'Neutral',
      selected: false
    })) || [];
  }, [smartVOCData?.vocResponses]);

  return (
    <div className={cn('pt-4', className)}>
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <MetricCard
            title="Customer Satisfaction"
            score={safeCalculateAverage(smartVOCData?.csatScores)}
            question={csatQuestion}
            data={csatData}
            hasData={hasScores(smartVOCData?.csatScores)}
          />

          <MetricCard
            title="Customer Effort Score"
            score={safeCalculateAverage(smartVOCData?.cesScores)}
            question={cesQuestion}
            data={cesData}
            hasData={hasScores(smartVOCData?.cesScores)}
          />

          <MetricCard
            title="Cognitive Value"
            score={safeCalculateAverage(smartVOCData?.cvScores)}
            question={cvQuestion}
            data={cvData}
            hasData={hasScores(smartVOCData?.cvScores)}
          />
        </div>
      </div>

      <div className="flex gap-8 mt-8">
        <div className="flex-1">
          <div className="space-y-6">
            <QuestionResults
              questionNumber="2.1"
              title="Customer Satisfaction Score"
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

            <NPSQuestion
              monthlyData={monthlyNPSData}
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

            <VOCQuestion
              comments={vocComments}
              questionNumber="2.6"
              questionType="VOC"
              questionText={vocQuestion}
            />
          </div>
        </div>

        <div className="w-80 shrink-0">
          <Filters researchId={researchId} />
        </div>
      </div>
    </div>
  );
}
