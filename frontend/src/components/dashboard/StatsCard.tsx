'use client';

import { ErrorBoundary } from '../common/ErrorBoundary';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  className?: string;
}

function StatsCardContent({ title, value, icon }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-2">
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatsCard(props: StatsCardProps) {
  return (
    <ErrorBoundary>
      <StatsCardContent {...props} />
    </ErrorBoundary>
  );
} 