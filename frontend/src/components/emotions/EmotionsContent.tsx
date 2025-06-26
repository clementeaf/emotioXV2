import React from 'react';

import {
  emotionData,
  keyInsights,
  nextSteps,
  recentAnalysis,
  recommendations
} from '@/data/emotionsMockData';

import { EmotionDistribution } from './EmotionDistribution';
import { InsightsSection } from './InsightsSection';
import { NextStepsSection } from './NextStepsSection';
import { RecentAnalysis } from './RecentAnalysis';
import { RecommendationsSection } from './RecommendationsSection';

/**
 * Componente principal del contenido del dashboard de emociones
 */
export const EmotionsContent: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto mt-4 ml-4 bg-white p-4 rounded-lg border border-neutral-150">
      <div className="mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Emotion Analysis</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Track and analyze emotional responses across your research projects
          </p>
        </div>

        {/* Emotion Distribution y Recent Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <EmotionDistribution emotionData={emotionData} />
          <RecentAnalysis recentAnalysis={recentAnalysis} />
        </div>

        {/* Emotion Insights, Recommendations, Next Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InsightsSection keyInsights={keyInsights} />
          <RecommendationsSection recommendations={recommendations} />
          <NextStepsSection nextSteps={nextSteps} />
        </div>
      </div>
    </div>
  );
};
