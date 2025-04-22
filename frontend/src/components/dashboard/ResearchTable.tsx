'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '../common/ErrorBoundary';
import Link from 'next/link';
import { API_HTTP_ENDPOINT } from '@/api/endpoints';
import { researchAPI } from '@/lib/api'; // Opcional: importar el API cliente para operaciones REST

interface Research {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  progress?: number;
  technique: string;
}

interface ResearchTableProps {
  className?: string;
}

function ResearchTableContent() {
  const router = useRouter();
  const [research, setResearch] = useState<Research[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleString());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Research | null>(null);

  const fetchResearch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Primero intentar obtener la investigación actual
      const currentResponse = await fetch(`${API_HTTP_ENDPOINT}/research/current`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        if (currentData?.data) {
          setResearch([{
            id: currentData.data.id,
            name: currentData.data.title || currentData.data.name,
            status: currentData.data.status || 'in-progress',
            createdAt: currentData.data.createdAt,
            progress: currentData.data.progress,
            technique: currentData.data.metadata?.type || ''
          }]);
          return; // Terminar aquí, setLastUpdate se hará en el finally
        }
      }

      // Si no hay investigación actual, obtener todas las investigaciones
      const response = await fetch(`${API_HTTP_ENDPOINT}/research/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error al obtener las investigaciones: ${response.status}`);
      }

      const data = await response.json();
      const researchData = data?.data || data;
      setResearch(Array.isArray(researchData) ? researchData : []);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar las investigaciones');
      setResearch([]);
    } finally {
      // Actualizar timestamp después de cada solicitud, no durante el renderizado
      setLastUpdate(new Date().toLocaleString());
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResearch();
  }, [fetchResearch]);

  const handleRefresh = () => {
    fetchResearch();
  };

  const handleViewResearch = (item: Research) => {
    if (item.technique === 'eye-tracking' || item.technique === 'aim-framework') {
      router.push(`/dashboard?research=${item.id}&section=welcome-screen`);
    } else {
      router.push(`/dashboard?research=${item.id}`);
    }
  };

  const handleDeleteResearch = (e: React.MouseEvent, item: Research) => {
    e.stopPropagation();
    setProjectToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDeleteResearch = async () => {
    if (!projectToDelete || !projectToDelete.id) {
      console.error('Error: No se puede eliminar una investigación sin ID válido');
      setError('No se puede eliminar la investigación - ID no válido');
      setShowDeleteModal(false);
      setProjectToDelete(null);
      return;
    }

    try {
      console.log('Eliminando investigación con ID:', projectToDelete.id);
      const response = await fetch(`${API_HTTP_ENDPOINT}/research/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la investigación');
      }

      setResearch(research.filter(r => r.id !== projectToDelete.id));
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error al eliminar:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar la investigación');
    }
  };

  const cancelDeleteResearch = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string, classes: string }> = {
      'draft': { text: 'Borrador', classes: 'bg-blue-100 text-blue-800' },
      'in-progress': { text: 'En progreso', classes: 'bg-green-100 text-green-800' },
      'completed': { text: 'Completado', classes: 'bg-purple-100 text-purple-800' },
      'archived': { text: 'Archivado', classes: 'bg-gray-100 text-gray-800' }
    };

    const statusInfo = statusMap[status.toLowerCase()] || { text: status, classes: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.classes}`}>
        {statusInfo.text}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-neutral-200">
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-neutral-900">Research Projects</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Última actualización: {lastUpdate}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          title="Actualizar"
        >
          <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="min-w-full">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : research.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-neutral-500">No hay investigaciones disponibles.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead>
                <tr key="header-row" className="bg-neutral-50">
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-neutral-600">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-neutral-600">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-neutral-600">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-neutral-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {research.map((item, index) => (
                  <tr key={`research-item-${item.id || index}`} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-sm text-neutral-900 max-w-xs truncate">
                      {item.name}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap">
                      {item.createdAt ? 
                        (() => {
                          try {
                            const date = new Date(item.createdAt);
                            // Verificar si la fecha es válida
                            if (isNaN(date.getTime())) {
                              return 'Fecha no disponible';
                            }
                            return format(date, "d 'de' MMMM, yyyy", { locale: es });
                          } catch (error) {
                            console.error('Error formateando fecha:', error);
                            return 'Fecha no disponible';
                          }
                        })() 
                        : 'Fecha no disponible'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Link
                          href={item.technique === 'eye-tracking' || item.technique === 'aim-framework'
                            ? `/dashboard?research=${item.id}&section=welcome-screen`
                            : `/dashboard?research=${item.id}`
                          }
                          className="inline-flex items-center px-3 py-1.5 border border-neutral-200 text-sm font-medium rounded-md text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
                        >
                          Ver
                        </Link>
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-md border border-neutral-200 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                          onClick={(e) => handleDeleteResearch(e, item)}
                          title="Eliminar investigación"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-neutral-900 mb-4">
                ¿Eliminar investigación?
              </h3>
              <p className="text-neutral-600 mb-6">
                ¿Estás seguro de que deseas eliminar la investigación "{projectToDelete.name}"? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={cancelDeleteResearch}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteResearch}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ResearchTable({ className }: ResearchTableProps) {
  return (
    <ErrorBoundary>
      <div className={className}>
        <ResearchTableContent />
      </div>
    </ErrorBoundary>
  );
}