import { useResearchHistory } from '@/hooks/useResearchHistory';
import { memo } from 'react';
import { ClientInfoSection } from './ClientInfoSection';
import { ClientSelectorSection } from './ClientSelectorSection';
import { ResearchListSection } from './ResearchListSection';
import { ValueChartSection } from './ValueChartSection';

export const ResearchHistoryContent = memo(() => {
  const { selectedClient, clientId } = useResearchHistory();

  return (
    <div className="space-y-6">
      <ClientSelectorSection />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ValueChartSection />
        </div>
        <div>
          <ClientInfoSection client={selectedClient} />
        </div>
      </div>

      <ResearchListSection clientId={clientId} />
    </div>
  );
});

ResearchHistoryContent.displayName = 'ResearchHistoryContent';
