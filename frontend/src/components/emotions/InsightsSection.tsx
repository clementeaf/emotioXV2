import { memo } from 'react';
import { BulletItem } from '../../../../shared/interfaces/emotions.interface';
import { BulletPoint } from './BulletPoint';

interface InsightsSectionProps {
  keyInsights: BulletItem[];
}

/**
 * Componente para mostrar la sección de insights clave
 */
export const InsightsSection = memo<InsightsSectionProps>(({ keyInsights }) => (
  <div className="bg-white p-6 rounded-lg border border-neutral-200">
    <h3 className="text-lg font-medium text-neutral-900 mb-4">Key Insights</h3>
    <ul className="space-y-3">
      {keyInsights.map((insight: BulletItem, index: number) => (
        <BulletPoint
          key={index}
          color={insight.color}
          text={insight.text}
        />
      ))}
    </ul>
  </div>
));

InsightsSection.displayName = 'InsightsSection';
