import { CreateResearchForm } from '@/components/research/CreateResearchForm';
import { memo } from 'react';
import { CreateSectionProps } from '../../../../../shared/interfaces/research-creation.interface';

/**
 * Sección de creación de investigación
 */
export const CreateSection = memo<CreateSectionProps>(({ onResearchCreated }) => (
  <div className="flex-1 overflow-y-auto mt-4 ml-4 bg-white p-4 rounded-lg border border-neutral-150">
    <div className="mx-auto px-6 py-8">
      <div className="mb-4">
        <h1 className="text-2xl mt-2 font-semibold text-neutral-900">
          Nueva Investigación
        </h1>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <CreateResearchForm onResearchCreated={onResearchCreated} />
      </div>
    </div>
  </div>
));

CreateSection.displayName = 'CreateSection';
