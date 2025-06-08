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
    <div className="bg-white rounded-lg shadow-md border border-neutral-100 hover:shadow-lg transition-shadow duration-300 p-6">
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