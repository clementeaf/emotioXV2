'use client';

import { ErrorBoundary } from '../common/ErrorBoundary';

interface ResearchListProps {
  className?: string;
}

function ResearchListContent() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50">
            <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Research name</th>
            <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Name</th>
            <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Status</th>
            <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Progress</th>
            <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Date</th>
            <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Researcher</th>
            <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {/* Table rows will be rendered here */}
        </tbody>
      </table>
    </div>
  );
}

export function ResearchList({ className }: ResearchListProps) {
  return (
    <ErrorBoundary>
      <ResearchListContent />
    </ErrorBoundary>
  );
} 