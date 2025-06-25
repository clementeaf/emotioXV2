import { ResearchConfirmation } from '@/components/research/ResearchConfirmation';
import { memo } from 'react';
import { SuccessSectionProps } from '../../../../../shared/interfaces/research-creation.interface';

/**
 * Sección de investigación exitosa
 */
export const SuccessSection = memo<SuccessSectionProps>(({ id, name, onClose }) => (
  <div className="flex-1 overflow-y-auto mt-4 ml-4 bg-white p-4 rounded-lg border border-neutral-150">
    <div className="mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Investigación Creada
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Tu investigación ha sido creada exitosamente
        </p>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <ResearchConfirmation
          researchId={id}
          researchName={name}
          onClose={onClose}
        />
      </div>
    </div>
  </div>
));

SuccessSection.displayName = 'SuccessSection';
