import { memo } from 'react';
import { ResearchList } from './ResearchList';

interface ResearchListSectionProps {
  clientId: string | null;
}

export const ResearchListSection = memo(({ clientId }: ResearchListSectionProps) => (
  <div className="col-span-12">
    <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h2 className="text-base font-medium text-neutral-900">
          {clientId ? `List of Research for Client ${clientId}` : 'List of Research'}
        </h2>
      </div>
      <ResearchList />
    </div>
  </div>
));

ResearchListSection.displayName = 'ResearchListSection';
