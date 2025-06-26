import { memo } from 'react';

import { EmotionBarProps } from '../../../../shared/interfaces/emotions.interface';

/**
 * Componente para mostrar una barra de progreso de emoción
 */
export const EmotionBar = memo<EmotionBarProps>(({ emotion, value, color }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-neutral-600 w-24">{emotion}</span>
    <div className="flex-1 mx-4">
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
    <span className="text-sm text-neutral-600 w-12 text-right">{value}%</span>
  </div>
));

EmotionBar.displayName = 'EmotionBar';
