import { memo } from 'react';

import { BulletItem } from '../../../../shared/interfaces/emotions.interface';

import { BulletPoint } from './BulletPoint';

interface RecommendationsSectionProps {
  recommendations: BulletItem[];
}

/**
 * Componente para mostrar la sección de recomendaciones
 */
export const RecommendationsSection = memo<RecommendationsSectionProps>(({ recommendations }) => (
  <div className="bg-white p-6 rounded-lg border border-neutral-200">
    <h3 className="text-lg font-medium text-neutral-900 mb-4">Recommendations</h3>
    <ul className="space-y-3">
      {recommendations.map((rec: BulletItem, index: number) => (
        <BulletPoint
          key={index}
          color={rec.color}
          text={rec.text}
        />
      ))}
    </ul>
  </div>
));

RecommendationsSection.displayName = 'RecommendationsSection';
