import { memo } from 'react';

import { ResearchStageManager } from '@/components/research/ResearchStageManager';

import { StagesSectionProps } from '../../../../../shared/interfaces/research-creation.interface';

/**
 * Sección de configuración de etapas
 */
export const StagesSection = memo<StagesSectionProps>(({ id }) => (
  <div className="flex-1 overflow-y-auto mt-4 ml-4 bg-white p-4 rounded-lg border border-neutral-150">
    <div className="mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Configurar Etapas
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Configura las etapas de tu investigación
        </p>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <ResearchStageManager researchId={id} />
      </div>
    </div>
  </div>
));

StagesSection.displayName = 'StagesSection';
