'use client';

import { ErrorBoundary } from '../common/ErrorBoundary';

interface ClientInfoProps {
  className?: string;
}

function ClientInfoContent() {
  return (
    <div className="space-y-4">
      <div className="prose prose-sm">
        <p className="text-sm text-neutral-600">
          The Universidad del Desarrollo (UDD) is a private autonomous university in Chile, with headquarters in Concepción and Santiago, specifically in the commune of Las Condes.
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">Total Research</span>
          <span className="font-medium text-neutral-900">23</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">Active Projects</span>
          <span className="font-medium text-neutral-900">5</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">Success Rate</span>
          <span className="font-medium text-neutral-900">87%</span>
        </div>
      </div>
    </div>
  );
}

export function ClientInfo({ className }: ClientInfoProps) {
  return (
    <ErrorBoundary>
      <ClientInfoContent />
    </ErrorBoundary>
  );
} 