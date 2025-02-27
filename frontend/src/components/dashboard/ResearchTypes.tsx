'use client';

import { ErrorBoundary } from '../common/ErrorBoundary';

interface ResearchType {
  name: string;
  count: number;
  color: string;
}

interface ResearchTypesProps {
  className?: string;
}

const researchTypes: ResearchType[] = [
  { name: 'Eye Tracking', count: 24, color: 'bg-blue-500' },
  { name: 'Attention Prediction', count: 16, color: 'bg-green-500' },
  { name: 'Cognitive Analysis', count: 12, color: 'bg-purple-500' },
];

function ResearchTypesContent() {
  return (
    <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h2 className="text-base font-medium text-neutral-900">Research Types</h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {researchTypes.map((type) => (
            <div key={type.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`h-2 w-2 rounded-full ${type.color}`} />
                <span className="text-sm text-neutral-600">{type.name}</span>
              </div>
              <span className="text-sm font-medium text-neutral-900">{type.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ResearchTypes({ className }: ResearchTypesProps) {
  return (
    <ErrorBoundary>
      <ResearchTypesContent />
    </ErrorBoundary>
  );
} 