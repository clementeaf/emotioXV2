'use client';

import { ErrorBoundary } from '../common/ErrorBoundary';

interface PerceivedValueChartProps {
  className?: string;
}

function PerceivedValueChartContent() {
  return (
    <div className="w-full aspect-[8/5] bg-neutral-50 rounded-lg flex items-center justify-center">
      <div className="text-sm text-neutral-600">
        Perceived Value Chart will be rendered here
      </div>
    </div>
  );
}

export function PerceivedValueChart({ className }: PerceivedValueChartProps) {
  return (
    <ErrorBoundary>
      <PerceivedValueChartContent />
    </ErrorBoundary>
  );
} 