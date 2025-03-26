'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
// Eliminamos la importación de researchAPI ya que no la utilizaremos
// import { researchAPI } from '@/lib/api';
import { ResearchProject, ResearchTableProps } from '@/interfaces/research';
import { mockResearchAPI, generateMockResearchProjects } from '@/lib/mock-data';
import { formatDate, isDevelopmentMode } from '@/lib/utils';

import { ErrorBoundary } from '../common/ErrorBoundary';

function ResearchTableContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [research, setResearch] = useState<ResearchProject[]>([]);
  const [isDevMode, setIsDevMode] = useState(false);
  // Ya no necesitamos estado para modo simulado, siempre usamos datos simulados
  // const [isSimulatedMode, setIsSimulatedMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ResearchProject | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [showApiErrorMessage, setShowApiErrorMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

  // Verificar si estamos en modo desarrollo (localhost)
  useEffect(() => {
    setIsDevMode(isDevelopmentMode());
    // Ya no necesitamos configurar el modo simulado
  }, []);

  // Función para cargar datos de investigación
  const loadResearchData = async (forceRefresh = false) => {
    if (!forceRefresh) {
      setIsLoading(true);
    }

    try {
      console.log('Usando datos simulados para investigaciones...');
      
      // 1. Intentar usar caché si no se fuerza actualización
      if (!forceRefresh) {
        try {
          const cachedData = localStorage.getItem('cached_research_data');
          const cachedTime = localStorage.getItem('cached_research_timestamp');
          
          if (cachedData && cachedTime) {
            const parsedData = JSON.parse(cachedData);
            const timestamp = parseInt(cachedTime, 10);
            const now = Date.now();
            
            // Si los datos en caché son recientes, usarlos
            if (now - timestamp < CACHE_DURATION) {
              console.log('Usando datos de investigación en caché...');
              setResearch(parsedData);
              setLastUpdated(timestamp);
              setIsLoading(false);
              return;
            } else {
              console.log('Datos en caché expirados, actualizando...');
            }
          }
        } catch (cacheError) {
          console.error('Error verificando caché:', cacheError);
        }
      } else {
        console.log('Forzando recarga de datos simulados...');
      }
      
      // 2. Usar siempre la API simulada
      const mockResponse = await mockResearchAPI.list();
      const dataArray = mockResponse.data;
      
      // 3. Guardar datos y actualizar cache
      setResearch(dataArray);
      const now = Date.now();
      setLastUpdated(now);
      
      // Guardar en caché
      localStorage.setItem('cached_research_data', JSON.stringify(dataArray));
      localStorage.setItem('cached_research_timestamp', now.toString());
      
    } catch (error: any) {
      console.error('Error al cargar investigaciones simuladas:', error);
      setError(error.message || 'Error al cargar las investigaciones simuladas');
      
      // Intentar generar datos simulados directamente como último recurso
      try {
        console.log('Generando datos simulados de respaldo...');
        const mockData = generateMockResearchProjects(10);
        setResearch(mockData);
        const now = Date.now();
        setLastUpdated(now);
      } catch (mockError) {
        console.error('Error también con datos simulados de respaldo:', mockError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadResearchData();
  }, []); // Ya no necesitamos dependencia de isSimulatedMode

  // Detectar cambios que pueden requerir actualización de la tabla
  useEffect(() => {
    // Verificar si venimos de una ruta de creación/edición de investigación
    const checkForRefresh = () => {
      const needsRefresh = 
        localStorage.getItem('research_updated') === 'true' || 
        pathname === '/dashboard' && localStorage.getItem('last_path')?.includes('/dashboard/research/');
      
      if (needsRefresh) {
        console.log('Se detectaron cambios en investigaciones, actualizando datos...');
        loadResearchData(true);
        localStorage.removeItem('research_updated');
      }
      
      // Almacenar la ruta actual para futuras comparaciones
      localStorage.setItem('last_path', pathname || '');
    };

    checkForRefresh();
    
    // Opcionalmente, podemos verificar periódicamente si es necesario actualizar
    const intervalCheck = setInterval(() => {
      const lastUpdateTime = parseInt(localStorage.getItem('cached_research_timestamp') || '0', 10);
      const now = Date.now();
      if (now - lastUpdateTime > CACHE_DURATION) {
        console.log('Intervalo de caché vencido, actualizando datos...');
        loadResearchData(true);
      }
    }, 60000); // Verificar cada minuto
    
    return () => clearInterval(intervalCheck);
  }, [pathname, searchParams]);

  // Botón para refrescar manualmente
  const handleRefreshData = () => {
    loadResearchData(true);
  };

  // Ya no necesitamos toggle para cambiar entre modo real y simulado
  // const toggleSimulatedMode = () => {
  //   const newMode = !isSimulatedMode;
  //   setIsSimulatedMode(newMode);
  //   localStorage.setItem('use_simulated_api', newMode ? 'true' : 'false');
  //   loadResearchData(true);
  // };

  const handleViewResearch = (item: ResearchProject) => {
    // Si es de tipo AIM, redirigir a sección de formularios específica
    const isAimFramework = item.technique === 'aim-framework';
    if (isAimFramework) {
      router.push(`/dashboard?research=${item.id}&aim=true&section=welcome-screen`);
    } else {
      router.push(`/dashboard?research=${item.id}`);
    }
  };

  const handleDeleteResearch = (e: React.MouseEvent, item: ResearchProject) => {
    e.stopPropagation(); // Evitar que el evento se propague
    setProjectToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDeleteResearch = async () => {
    if (!projectToDelete) {return;}
    
    try {
      // Usar solo API simulada
      const response = await mockResearchAPI.delete(projectToDelete.id);
      
      if (response && response.data) {
        console.log('Respuesta del servidor simulado:', response);
        
        // Actualizar la lista de investigaciones removiendo la eliminada
        const updatedResearch = research.filter(r => r.id !== projectToDelete.id);
        setResearch(updatedResearch);
        
        // Actualizar la caché con los datos más recientes
        const now = Date.now();
        localStorage.setItem('cached_research_data', JSON.stringify(updatedResearch));
        localStorage.setItem('cached_research_timestamp', now.toString());
        setLastUpdated(now);
        
        // Marcar que hubo un cambio en las investigaciones
        localStorage.setItem('research_updated', 'true');
        
        // Eliminar del localStorage si existe
        localStorage.removeItem(`research_${projectToDelete.id}`);
        
        // Actualizar la lista de investigaciones recientes en localStorage
        try {
          const storedList = localStorage.getItem('research_list');
          if (storedList) {
            const list = JSON.parse(storedList);
            const updatedList = list.filter((item: any) => item.id !== projectToDelete.id);
            localStorage.setItem('research_list', JSON.stringify(updatedList));
          }
        } catch (error) {
          console.error('Error actualizando la lista de investigaciones:', error);
        }
      } else {
        console.error('Error al eliminar la investigación: respuesta vacía o incorrecta');
      }
    } catch (error) {
      console.error('Error al eliminar la investigación simulada:', error);
    } finally {
      setShowDeleteModal(false);
      setProjectToDelete(null);
    }
  };

  const cancelDeleteResearch = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Borrador
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            En progreso
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Completado
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Archivado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-100">
          <div>
            <h2 className="text-lg font-medium text-neutral-900">Research Projects</h2>
            {lastUpdated > 0 && (
              <p className="text-sm text-neutral-500 mt-1">
                Última actualización: {new Date(lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Eliminamos el botón de toggle entre datos reales y simulados */}
            <button
              onClick={handleRefreshData}
              className="bg-white text-neutral-600 hover:text-neutral-900 p-2 rounded-md border border-neutral-200 hover:bg-neutral-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Eliminamos los mensajes de error relacionados con la API real */}
        
        {/* Mensaje permanente indicando que se usan datos simulados */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-700 flex items-center">
            <svg className="w-5 h-5 mr-1.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Usando datos simulados. Los cambios solo son temporales y no se guardan en la base de datos.
          </p>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : research.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-neutral-500">No hay investigaciones disponibles.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Nombre</th>
                  <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Estado</th>
                  <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Fecha</th>
                  <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Progreso</th>
                  <th className="whitespace-nowrap px-6 py-3 text-left text-sm font-medium text-neutral-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {research.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-900 font-medium">
                      {item.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                      <div className="w-full bg-neutral-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${item.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs mt-1 inline-block">{item.progress || 0}%</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewResearch(item)}
                        >
                          Ver
                        </Button>
                        
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
          )}
        </div>
      </div>
      
      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            {/* Cabecera con fondo de color */}
            <div className="bg-red-50 border-b border-red-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-xl font-semibold text-neutral-900">
                  Eliminar investigación
                </h2>
              </div>
            </div>
            
            {/* Contenido */}
            <div className="px-6 py-5">
              <p className="text-neutral-700 mb-6 leading-relaxed">
                ¿Estás seguro de que deseas eliminar la investigación <span className="font-semibold">"{projectToDelete.name}"</span>? Esta acción no se puede deshacer.
              </p>
              
              {/* Botones principales */}
              <div className="space-y-3">
                <Button
                  onClick={confirmDeleteResearch}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Sí, eliminar investigación</span>
                </Button>
                
                <Button
                  onClick={cancelDeleteResearch}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 py-2.5"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancelar</span>
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