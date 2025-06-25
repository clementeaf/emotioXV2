import { memo } from 'react';
import { ClientSelector } from './ClientSelector';

export const ClientSelectorSection = memo(() => (
  <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] p-4">
    <ClientSelector />
  </div>
));

ClientSelectorSection.displayName = 'ClientSelectorSection';
