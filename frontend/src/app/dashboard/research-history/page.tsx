'use client';

import { useRouter } from 'next/navigation';
import { useState, memo, Suspense } from 'react';

import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

// Utilidad para formatear fechas
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
};

// Tipos para los datos de historia de investigación
interface ResearchHistoryItem {
  id: string;
  name: string;
  date: string;
  status: 'completed' | 'archived';
}

// Componente para los botones de filtrado
interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

const FilterButton = memo(({ active, onClick, label }: FilterButtonProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm rounded-lg ${
      active
        ? 'bg-blue-50 text-blue-600'
        : 'text-neutral-600 hover:bg-neutral-50'
    }`}
  >
    {label}
  </button>
));

FilterButton.displayName = 'FilterButton';

// Componente para las filas de la tabla
interface HistoryRowProps {
  item: ResearchHistoryItem;
}

const HistoryRow = memo(({ item }: HistoryRowProps) => (
  <tr>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
      {item.name}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
      {formatDate(item.date)}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        item.status === 'completed'
          ? 'bg-green-100 text-green-800'
          : 'bg-neutral-100 text-neutral-800'
      }`}>
        {item.status}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
      <button className="text-blue-600 hover:text-blue-700">
        View Details
      </button>
    </td>
  </tr>
));

HistoryRow.displayName = 'HistoryRow';

// Componente contenido que se envolverá con withSearchParams
const ResearchHistoryContent = memo(() => {
  const [filter, setFilter] = useState('all');

  const mockData: ResearchHistoryItem[] = [
    { id: '1', name: 'Eye Tracking Study 2024', date: '2024-02-15', status: 'completed' },
    { id: '2', name: 'Cognitive Analysis Q1', date: '2024-02-10', status: 'completed' },
    { id: '3', name: 'User Behavior Research', date: '2024-02-01', status: 'archived' },
    // Más datos mock...
  ];
  
  const filteredData = mockData.filter(item => filter === 'all' || item.status === filter);
  
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Research History</h1>
          <p className="mt-2 text-sm text-neutral-600">
            View and analyze your past research projects
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-6">
          <div className="flex gap-2">
            <FilterButton 
              active={filter === 'all'} 
              onClick={() => setFilter('all')} 
              label="All" 
            />
            <FilterButton 
              active={filter === 'completed'} 
              onClick={() => setFilter('completed')} 
              label="Completed" 
            />
            <FilterButton 
              active={filter === 'archived'} 
              onClick={() => setFilter('archived')} 
              label="Archived" 
            />
          </div>
        </div>

        {/* Tabla de Historial */}
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredData.map((item) => (
                <HistoryRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

ResearchHistoryContent.displayName = 'ResearchHistoryContent';

// Usar el HOC para envolver el componente
const ResearchHistoryContentWithSuspense = withSearchParams(ResearchHistoryContent);

export default function ResearchHistoryPage() {
  const router = useRouter();
  const { token } = useProtectedRoute();
  
  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <ErrorBoundary>
          <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
            <ResearchHistoryContentWithSuspense />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
} 