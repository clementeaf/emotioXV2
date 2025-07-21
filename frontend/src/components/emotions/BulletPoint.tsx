import { memo } from 'react';

import { BulletPointProps } from '@/shared/interfaces/emotions.interface';

/**
 * Componente para mostrar un elemento de lista con punto de color
 */
export const BulletPoint = memo<BulletPointProps>(({ color, text }) => (
  <li className="flex items-start">
    <span className={`inline-block w-2 h-2 rounded-full ${color} mt-1.5 mr-2`} />
    <p className="text-sm text-neutral-600">{text}</p>
  </li>
));

BulletPoint.displayName = 'BulletPoint';
