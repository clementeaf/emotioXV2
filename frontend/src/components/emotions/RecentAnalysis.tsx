import { memo } from 'react';

import { AnalysisItem as AnalysisItemType } from '@/shared/interfaces/emotions.interface';

import { AnalysisItem } from './AnalysisItem';

interface RecentAnalysisProps {
  recentAnalysis: AnalysisItemType[];
}

/**
 * Componente para mostrar análisis recientes
 */
export const RecentAnalysis = memo<RecentAnalysisProps>(({ recentAnalysis }) => (
  <div className="bg-white p-6 rounded-lg border border-neutral-200">
    <h3 className="text-lg font-medium text-neutral-900 mb-4">Recent Analysis</h3>
    <div className="space-y-6">
      {recentAnalysis.map((analysis: AnalysisItemType) => (
        <AnalysisItem key={analysis.id} item={analysis} />
      ))}
    </div>
  </div>
));

RecentAnalysis.displayName = 'RecentAnalysis';
