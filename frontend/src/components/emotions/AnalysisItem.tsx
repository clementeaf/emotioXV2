import { formatDate } from '@/utils/dateUtils';
import { memo } from 'react';
import { AnalysisItemProps } from '../../../../shared/interfaces/emotions.interface';

/**
 * Componente para mostrar un item de análisis reciente
 */
export const AnalysisItem = memo<AnalysisItemProps>(({ item }) => (
  <div className="flex items-start justify-between">
    <div>
      <h4 className="text-sm font-medium text-neutral-900">{item.title}</h4>
      <p className="text-xs text-neutral-500 mt-1">
        {formatDate(item.date)}
      </p>
    </div>
    <div className="text-right">
      <p className="text-sm font-medium text-neutral-900">{item.dominantEmotion}</p>
      <p className="text-xs text-neutral-500 mt-1">Score: {item.score}</p>
    </div>
  </div>
));

AnalysisItem.displayName = 'AnalysisItem';
