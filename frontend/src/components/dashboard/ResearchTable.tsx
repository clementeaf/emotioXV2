'use client';

import { ErrorBoundary } from '../common/ErrorBoundary';

interface ResearchTableProps {
  className?: string;
}

function ResearchTableContent() {
  return (
    <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
        <h2 className="text-base font-medium text-neutral-900">Research Projects</h2>
        <button className="inline-flex h-8 items-center justify-center rounded-lg bg-neutral-900 px-3 text-sm font-medium text-white hover:bg-neutral-800">
          New Research
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Name</th>
              <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Status</th>
              <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Date</th>
              <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Progress</th>
              <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {/* Table rows will go here */}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ResearchTable({ className }: ResearchTableProps) {
  return (
    <ErrorBoundary>
      <ResearchTableContent />
    </ErrorBoundary>
  );
} 