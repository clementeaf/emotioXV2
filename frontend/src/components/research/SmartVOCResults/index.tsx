'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CPVCard } from './CPVCard';
import { TrustRelationshipFlow } from './TrustRelationshipFlow';
import { MetricCard } from './MetricCard';
import { QuestionResults } from './QuestionResults';
import { EmotionalStates } from './EmotionalStates';
import { Filters } from './Filters';
import { mockData } from './mockData';
import { SmartVOCResultsProps } from './types';
import { metrics } from './config';

export function SmartVOCResults({ className }: SmartVOCResultsProps) {
  const [timeRange, setTimeRange] = useState<'Today' | 'Week' | 'Month'>('Today');

  return (
    <div className={cn("flex gap-8 p-8", className)}>
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
      </div>

      <Filters className="w-80 shrink-0" />
    </div>
  );
} 