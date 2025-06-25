import { memo } from 'react';
import { EmotionData } from '../../../../shared/interfaces/emotions.interface';
import { EmotionBar } from './EmotionBar';

interface EmotionDistributionProps {
  emotionData: EmotionData[];
}

/**
 * Componente para mostrar la distribución de emociones
 */
export const EmotionDistribution = memo<EmotionDistributionProps>(({ emotionData }) => (
  <div className="bg-white p-6 rounded-lg border border-neutral-200">
    <h3 className="text-lg font-medium text-neutral-900 mb-4">Emotion Distribution</h3>
    <div className="space-y-4">
      {emotionData.map((item: EmotionData) => (
        <EmotionBar
          key={item.emotion}
          emotion={item.emotion}
          value={item.value}
          color={item.color}
        />
      ))}
    </div>
  </div>
));

EmotionDistribution.displayName = 'EmotionDistribution';
