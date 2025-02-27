'use client';

import { ErrorBoundary } from '../common/ErrorBoundary';

interface ClientSelectorProps {
  className?: string;
}

function ClientSelectorContent() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h2 className="text-base font-medium text-neutral-900">Change client</h2>
        <div className="relative w-64">
          <select
            className="w-full h-9 pl-3 pr-8 text-sm bg-neutral-50 border-0 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-200"
            defaultValue=""
          >
            <option value="" disabled>Select a client</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export function ClientSelector({ className }: ClientSelectorProps) {
  return (
    <ErrorBoundary>
      <ClientSelectorContent />
    </ErrorBoundary>
  );
} 