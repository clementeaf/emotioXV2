'use client';

import { ResearchActions } from '@/components/research-actions';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ResearchListProps } from '@/interfaces/research';
import { cn } from '@/lib/utils';

interface ClientsResearchListProps extends ResearchListProps {
  onDuplicateSuccess?: (newResearchId: string) => void;
  onDeleteSuccess?: (deletedResearchId: string) => void;
}

export function ClientsResearchList({
  className,
  data = [],
  onDuplicateSuccess,
  onDeleteSuccess
}: ClientsResearchListProps) {
  return (
    <div className={cn('bg-white rounded-lg shadow-sm overflow-hidden', className)}>
      <div className="p-6">
        <h3 className="text-base font-medium text-neutral-900 mb-4">
          List of research
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="whitespace-nowrap py-3 text-left text-sm font-medium text-neutral-600">Name</th>
                <th className="whitespace-nowrap py-3 text-left text-sm font-medium text-neutral-600">Status</th>
                <th className="whitespace-nowrap py-3 text-left text-sm font-medium text-neutral-600">Progress</th>
                <th className="whitespace-nowrap py-3 text-left text-sm font-medium text-neutral-600">Date</th>
                <th className="whitespace-nowrap py-3 text-left text-sm font-medium text-neutral-600">Researcher</th>
                <th className="whitespace-nowrap py-3 text-left text-sm font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.length > 0 ? (
                data.map((research) => (
                  <tr key={research.id}>
                    <td className="whitespace-nowrap py-3 text-sm text-neutral-900">
                      {research.name}
                    </td>
                    <td className="whitespace-nowrap py-3">
                      <StatusBadge status={research.status} />
                    </td>
                    <td className="whitespace-nowrap py-3">
                      <ProgressBar progress={research.progress} />
                    </td>
                    <td className="whitespace-nowrap py-3 text-sm text-neutral-600">
                      {research.date}
                    </td>
                    <td className="whitespace-nowrap py-3 text-sm text-neutral-600">
                      {research.researcher}
                    </td>
                    <td className="whitespace-nowrap py-3">
                      <ResearchActions
                        researchId={research.id}
                        researchName={research.name}
                        onDuplicateSuccess={onDuplicateSuccess}
                        onDeleteSuccess={onDeleteSuccess}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-neutral-600">
                    No research data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
