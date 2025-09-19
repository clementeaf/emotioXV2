import { memo } from 'react';

import { CreateResearchFormOptimized as CreateResearchForm } from '@/components/research/CreateResearchFormOptimized';

import { CreateSectionProps } from '../../../../../shared/interfaces/research-creation.interface';

/**
 * Sección de creación de investigación
 */
export const CreateSection = memo<CreateSectionProps>(({ onResearchCreated }) => (
  <div className="space-y-6">
    <div className="mb-4">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Nueva Investigación
      </h1>
    </div>

    <CreateResearchForm onResearchCreated={onResearchCreated} />
  </div>
));

CreateSection.displayName = 'CreateSection';
