import React from 'react';
import { Link } from 'react-router-dom';
import { useResearchList } from '../../hooks/research/useResearch';
import type { Research } from '../../types/api.types';

interface RecentResearchSectionProps {
  isCollapsed: boolean;
}

const RecentResearchSection: React.FC<RecentResearchSectionProps> = ({ isCollapsed }) => {
  const { data: researchData, isLoading } = useResearchList();
  const recentResearch = researchData?.data?.slice(0, 3) || [];

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 pt-4 mt-4 px-4 flex flex-col items-center justify-center py-4">
      <h3 className="text-md font-semibold text-gray-900 mb-3">Investigaciones Recientes</h3>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : recentResearch.length === 0 ? (
        <p className="text-[13px] text-gray-500">No hay investigaciones recientes</p>
      ) : (
        <div className="space-y-1">
          {recentResearch.map((research: Research) => (
            <Link
              key={research.id}
              to={`/dashboard?research=${research.id}`}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-full transition-colors text-gray-700 hover:bg-gray-100"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  research.status === 'in-progress' ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="truncate">{research.name}</p>
                <p className="text-xs text-gray-500">
                  {research.status === 'in-progress'
                    ? 'En progreso'
                    : research.status === 'completed'
                    ? 'Completada'
                    : 'Borrador'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentResearchSection;
