import { memo } from 'react';

import { BulletItem } from '../../../../shared/interfaces/emotions.interface';

import { BulletPoint } from './BulletPoint';

interface NextStepsSectionProps {
  nextSteps: BulletItem[];
}

/**
 * Componente para mostrar la sección de próximos pasos
 */
export const NextStepsSection = memo<NextStepsSectionProps>(({ nextSteps }) => (
  <div className="bg-white p-6 rounded-lg border border-neutral-200">
    <h3 className="text-lg font-medium text-neutral-900 mb-4">Next Steps</h3>
    <ul className="space-y-3">
      {nextSteps.map((step: BulletItem, index: number) => (
        <BulletPoint
          key={index}
          color={step.color}
          text={step.text}
        />
      ))}
    </ul>
  </div>
));

NextStepsSection.displayName = 'NextStepsSection';
