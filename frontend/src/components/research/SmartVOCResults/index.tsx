'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';

import { metrics } from './config';
import { CPVCard } from './CPVCard';
import { EmotionalStates } from './EmotionalStates';
import { Filters } from './Filters';
import { MetricCard } from './MetricCard';
import { mockData } from './mockData';
import { NPSQuestion } from './NPSQuestion';
import { QuestionResults } from './QuestionResults';
import { TrustRelationshipFlow } from './TrustRelationshipFlow';
import { SmartVOCResultsProps } from './types';
import { VOCQuestion } from './VOCQuestion';

// Datos de ejemplo para el gráfico NPS
const monthlyNPSData = [
  { month: 'Jan', promoters: 35, neutrals: 40, detractors: 25, npsRatio: 10 },
  { month: 'Feb', promoters: 38, neutrals: 37, detractors: 25, npsRatio: 13 },
  { month: 'Mar', promoters: 40, neutrals: 35, detractors: 25, npsRatio: 15 },
  { month: 'Apr', promoters: 37, neutrals: 38, detractors: 25, npsRatio: 12 },
  { month: 'May', promoters: 35, neutrals: 40, detractors: 25, npsRatio: 10 },
  { month: 'Jun', promoters: 42, neutrals: 33, detractors: 25, npsRatio: 17 },
  { month: 'Jul', promoters: 45, neutrals: 30, detractors: 25, npsRatio: 20 },
  { month: 'Ago', promoters: 43, neutrals: 32, detractors: 25, npsRatio: 18 },
  { month: 'Sep', promoters: 40, neutrals: 35, detractors: 25, npsRatio: 15 },
  { month: 'Oct', promoters: 38, neutrals: 37, detractors: 25, npsRatio: 13 },
  { month: 'Nov', promoters: 41, neutrals: 34, detractors: 25, npsRatio: 16 },
  { month: 'Dec', promoters: 44, neutrals: 31, detractors: 25, npsRatio: 19 }
];

// Datos de ejemplo para VOC
const vocComments = [
  { text: 'Camera lens working memory in...', mood: 'Positive' },
  { text: 'Laptop, Camera lens memory in...', mood: 'Positive' },
  { text: 'Mobile', mood: 'Positive' },
  { text: 'Camera lens', mood: 'Positive', selected: true },
  { text: 'Computer accessories', mood: 'Positive' },
  { text: 'TV, Camera lens working memory in...', mood: 'Positive' },
  { text: 'Mobile, lens working memory in...', mood: 'Positive' },
  { text: 'Laptop', mood: 'green' },
  { text: 'Camera lens working memory in...', mood: 'green' },
  { text: 'Camera lens working memory in...', mood: 'green' }
];

export function SmartVOCResults({ className }: SmartVOCResultsProps) {
  const [timeRange, setTimeRange] = useState<'Today' | 'Week' | 'Month'>('Today');

  return (
    <div className={cn('flex gap-8 p-8', className)}>
      <div className="flex-1 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <CPVCard
            value={mockData.cpv}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            trendData={mockData.cpvTrend}
            className="md:col-span-1"
          />

          <TrustRelationshipFlow 
            data={mockData.trustFlow} 
            className="md:col-span-2" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {metrics.map(metric => {
            const { score, data } = metric.getData(mockData);
            return (
              <MetricCard
                key={metric.key}
                title={metric.title}
                score={score}
                question={metric.question}
                data={data}
              />
            );
          })}
        </div>

        <div className="space-y-6">
          {mockData.questionResults.map((result) => (
            <QuestionResults
              key={result.questionNumber}
              {...result}
            />
          ))}
        </div>

        <EmotionalStates
          emotionalStates={mockData.emotionalStates.states}
          longTermClusters={mockData.emotionalStates.longTermClusters}
          shortTermClusters={mockData.emotionalStates.shortTermClusters}
        />

        {/* NPS Question después de EmotionalStates */}
        <NPSQuestion monthlyData={monthlyNPSData} />

        {/* VOC Question después de NPS Question */}
        <VOCQuestion comments={vocComments} />
      </div>

      <Filters className="w-80 shrink-0" />
    </div>
  );
} 