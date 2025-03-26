'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/providers/AuthProvider';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
};

// Componente contenido que se envolverá con withSearchParams
function ResearchHistoryContent() {
  const [filter, setFilter] = useState('all');

  const mockData = [
    { id: '1', name: 'Eye Tracking Study 2024', date: '2024-02-15', status: 'completed' },
    { id: '2', name: 'Cognitive Analysis Q1', date: '2024-02-10', status: 'completed' },
    { id: '3', name: 'User Behavior Research', date: '2024-02-01', status: 'archived' },
    // Más datos mock...
  ];
  
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
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm rounded-lg ${
                filter === 'all'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 text-sm rounded-lg ${
                filter === 'completed'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('archived')}
              className={`px-4 py-2 text-sm rounded-lg ${
                filter === 'archived'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Archived
            </button>
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
              {mockData
                .filter(item => filter === 'all' || item.status === filter)
                .map((item) => (
                  <tr key={item.id}>
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
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Usar el HOC para envolver el componente
const ResearchHistoryContentWithSuspense = withSearchParams(ResearchHistoryContent);

export default function ResearchHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);
  
  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
          <ResearchHistoryContentWithSuspense />
        </Suspense>
      </div>
    </div>
  );
} 