'use client';

import { cn } from '@/lib/utils';
import { ClientResearch, ResearchListProps } from '@/interfaces/research';

export function ResearchList({ className, data = [] }: ResearchListProps) {
  const getStatusBadgeClass = (status: ClientResearch['status']) => {
    const baseClasses = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset";
    switch (status) {
      case 'pending':
        return cn(baseClasses, "bg-yellow-50 text-yellow-700 ring-yellow-600/20");
      case 'in_progress':
        return cn(baseClasses, "bg-blue-50 text-blue-700 ring-blue-600/20");
      case 'completed':
        return cn(baseClasses, "bg-green-50 text-green-700 ring-green-600/20");
      default:
        return cn(baseClasses, "bg-neutral-50 text-neutral-700 ring-neutral-600/20");
    }
  };

  return (
    <div className={cn("bg-white rounded-lg shadow-sm overflow-hidden", className)}>
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
                      <span className={getStatusBadgeClass(research.status)}>
                        {research.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-neutral-100">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${research.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-neutral-600">
                          {research.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-3 text-sm text-neutral-600">
                      {research.date}
                    </td>
                    <td className="whitespace-nowrap py-3 text-sm text-neutral-600">
                      {research.researcher}
                    </td>
                    <td className="whitespace-nowrap py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-sm text-neutral-600 hover:text-neutral-900">
                          View
                        </button>
                        <button className="text-sm text-neutral-600 hover:text-neutral-900">
                          Duplicate
                        </button>
                        <button className="text-sm text-red-600 hover:text-red-900">
                          Delete
                        </button>
                      </div>
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