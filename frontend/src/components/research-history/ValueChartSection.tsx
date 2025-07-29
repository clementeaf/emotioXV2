import { memo } from 'react';
import { PerceivedValueChart } from './PerceivedValueChart';

export const ValueChartSection = memo(() => (
  <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] p-6">
    <h2 className="text-base font-medium text-neutral-900 mb-4">Research&apos;s History</h2>
    <PerceivedValueChart />
  </div>
));

ValueChartSection.displayName = 'ValueChartSection';
