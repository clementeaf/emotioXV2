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

      <div className="grid grid-cols-12 gap-6">
        <ValueChartSection />
        <ClientInfoSection client={selectedClient} />
        <ResearchListSection clientId={clientId} />
      </div>
    </div>
  );
});

ResearchHistoryContent.displayName = 'ResearchHistoryContent';
