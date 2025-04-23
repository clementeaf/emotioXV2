'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

import { Button } from '@/components/ui/Button';
import { researchAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useResearch } from '@/stores/useResearchStore';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { API_HTTP_ENDPOINT } from '@/api/endpoints';

interface SidebarProps {
  className?: string;
  activeResearch?: {
    id: string;
    name: string;
  };
}

interface Research {
  id: string;
  name: string;
  technique?: string;
  createdAt: string;
}

const mainNavItems = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  {
    id: 'new-research',
    label: 'New Research',
    href: '/dashboard/research/new',
    getDynamicLabel: (hasDraft: boolean, currentStep?: string, lastUpdated?: Date) => {
      if (!hasDraft) { return 'New Research'; }
      const timeAgo = lastUpdated ? getTimeAgo(lastUpdated) : '';
      const stepText = {
        basic: 'Basic Data',
        configuration: 'Configuration',
        review: 'Review'
      }[currentStep || 'basic'];
      return (
        <div className="flex flex-col">
          <span>New Research</span>
          <span className="text-xs text-neutral-500">
            {stepText} • {timeAgo}
          </span>
        </div>
      );
    }
  },
  { id: 'research-history', label: "Research's History", href: '/dashboard/research-history' },
  { id: 'research', label: 'Research', href: '/dashboard/research' },
  { id: 'emotions', label: 'Emotions', href: '/dashboard/emotions' },
];

const researchStages = [
  {
    id: 'build',
    label: 'Build',
    isCompleted: false,
    isEnabled: true,
    subsections: [
      { id: 'welcome', label: 'Welcome Screen', isCompleted: false, isEnabled: true },
      { id: 'smart-voc', label: 'Smart VOC', isCompleted: false, isEnabled: true },
      { id: 'cognitive', label: 'Cognitive Tasks', isCompleted: false, isEnabled: true },
      { id: 'eye-tracking', label: 'Eye Tracking', isCompleted: false, isEnabled: true },
      { id: 'thank-you', label: 'Thank You Screen', isCompleted: false, isEnabled: true },
    ],
  },
  {
    id: 'recruit',
    label: 'Recruit',
    isCompleted: false,
    isEnabled: true,
    subsections: [
      { id: 'eye-tracking', label: 'Eye Tracking', isCompleted: false, isEnabled: true }
    ],
  },
  {
    id: 'results',
    label: 'Results',
    isCompleted: false,
    isEnabled: true,
    subsections: [
      { id: 'smartvoc', label: 'Smart VOC', isCompleted: false, isEnabled: true },
      { id: 'cognitive-task', label: 'Tareas Cognitivas', isCompleted: false, isEnabled: true },
    ],
  },
];

const getTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) { return 'just now'; }
  if (diffInMinutes < 60) { return `${diffInMinutes}m ago`; }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) { return `${diffInHours}h ago`; }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

// Añadir la interfaz para el modal de confirmación
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  researchName: string;
}

// Componente de Modal de Confirmación de Eliminación
function DeleteConfirmationModal({ isOpen, onClose, onConfirm, researchName }: DeleteConfirmationModalProps) {
  if (!isOpen) { return null; }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Cabecera con fondo de color */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-neutral-900">
              Terminar investigación
            </h2>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5">
          <p className="text-neutral-700 mb-6 leading-relaxed">
            ¿Estás seguro de que deseas terminar la investigación <span className="font-semibold">"{researchName}"</span>? Esta acción no se puede deshacer.
          </p>

          {/* Botones principales */}
          <div className="space-y-3">
            <Button
              onClick={onConfirm}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Sí, terminar investigación</span>
            </Button>

            <Button
              onClick={onClose}
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
  );
}

// Componente interno para el contenido del sidebar que usa useSearchParams
function SidebarContent({ className, activeResearch }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const { hasDraft, currentDraft } = useResearch();
  const isAimFramework = searchParams?.get('aim') === 'true';
  const searchParamsSection = searchParams ? searchParams.get('section') : null;

  // Estado para la investigación más reciente
  const [recentResearch, setRecentResearch] = useState<Array<{ id: string, name: string, technique: string }>>([]);
  const [isLoadingResearch, setIsLoadingResearch] = useState<boolean>(true);
  const [showNoResearchMessage, setShowNoResearchMessage] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [researchToDelete, setResearchToDelete] = useState<{ id: string, name: string } | null>(null);

  // Cargar la investigación más reciente
  useEffect(() => {
    const fetchMostRecentResearch = async () => {
      setIsLoadingResearch(true);
      try {
        // Primero intentar obtener la investigación actual
        const currentResponse = await fetch(`${API_HTTP_ENDPOINT}/research/current`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          console.log('currentData: ', currentData);  
          
          // Verifica que data no sea un array vacío
          if (currentData?.data && 
              ((Array.isArray(currentData.data) && currentData.data.length > 0) || 
               (!Array.isArray(currentData.data) && currentData.data.id))) {
            
            // Si es un array con elementos, usa el primer elemento
            const dataItem = Array.isArray(currentData.data) ? currentData.data[0] : currentData.data;
            
            setRecentResearch([{
              id: dataItem.id,
              name: dataItem.title || dataItem.name,
              technique: dataItem.metadata?.type || ''
            }]);
            setShowNoResearchMessage(false);
          } else {
            // Si es un array vacío o no tiene ID
            setRecentResearch([]);
            setShowNoResearchMessage(true);
          }
          
          setIsLoadingResearch(false);
          return;
        }

        // Si no hay investigación actual, intentar obtener la lista
        const response = await fetch(`${API_HTTP_ENDPOINT}/research/all`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener investigaciones');
        }

        const data = await response.json();
        const researches = Array.isArray(data?.data) ? data.data : [];

        // Ordenar por fecha de creación y tomar la más reciente
        const sortedResearches = researches.sort((a: Research, b: Research) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (sortedResearches.length > 0 && sortedResearches[0].id) {
          setRecentResearch([{
            id: sortedResearches[0].id,
            name: sortedResearches[0].name,
            technique: sortedResearches[0].technique || ''
          }]);
          setShowNoResearchMessage(false);
        } else {
          setRecentResearch([]);
          setShowNoResearchMessage(true);
        }
      } catch (error) {
        console.error('Error cargando investigación reciente:', error);
        setRecentResearch([]);
        setShowNoResearchMessage(true);
      } finally {
        setIsLoadingResearch(false);
      }
    };

    fetchMostRecentResearch();
  }, [activeResearch]);

  // Determinar si debemos mostrar el sidebar de AIM Framework
  const isAimFrameworkResearch = isAimFramework ||
    (recentResearch.length > 0 && recentResearch[0].technique === 'aim-framework');

  // Función para manejar el clic en el logo de EmotioX
  const handleLogoClick = () => {
    router.push('/dashboard');
  };

  const confirmDeleteResearch = async () => {
    if (!researchToDelete || !researchToDelete.id) {
      console.error('Error: Intentando eliminar una investigación sin ID válido');
      closeDeleteModal();
      return;
    }

    try {
      // Llamar a la API para eliminar la investigación del backend
      try {
        console.log('Eliminando investigación con ID:', researchToDelete.id);
        const response = await researchAPI.delete(researchToDelete.id);
        console.log('Investigación eliminada en el backend:', response);
      } catch (apiError) {
        console.error('Error al eliminar la investigación del backend:', apiError);
        // Continuamos con la eliminación local incluso si la API falla
      }

      // Eliminar los datos del localStorage como respaldo o en caso de fallo de la API
      localStorage.setItem('research_list', JSON.stringify([]));
      console.log('Investigación eliminada localmente:', researchToDelete.id);

      // También eliminar los datos específicos de la investigación
      localStorage.removeItem(`research_${researchToDelete.id}`);

      // Actualizar el estado local para reflejar el cambio inmediatamente
      setRecentResearch([]);

      // Redirigir al dashboard principal si estamos actualmente en la investigación eliminada
      if (window.location.search.includes(`research=${researchToDelete.id}`)) {
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('Error al eliminar la investigación:', error);
    } finally {
      // Cerrar el modal y limpiar el estado
      setShowDeleteModal(false);
      setResearchToDelete(null);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setResearchToDelete(null);
  };

  // Si tenemos una investigación activa de tipo AIM Framework
  if (activeResearch && isAimFrameworkResearch) {
    return (
      <div className={cn('w-56 bg-white shadow-lg flex flex-col mt-16 ml-4 mb-4 rounded-2xl', className)}>
        <div className="px-4 pt-8">
          <a
            href="/dashboard"
            className="flex items-center"
            onClick={handleLogoClick}
          >
            <div className="flex items-center">
              <span className="text-xl font-semibold text-neutral-900">EmotioX</span>
              <span className="text-xs ml-1 text-neutral-500">(Inicio)</span>
            </div>
          </a>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="mb-4">
            <h3 className="font-semibold text-xs text-neutral-500 uppercase mb-2">BUILD</h3>
            <ul className="space-y-1">
              <li key="welcome-screen">
                <Link
                  href={`/dashboard?research=${activeResearch.id}&aim=true&section=welcome-screen`}
                  className={cn(
                    'flex items-center text-sm px-3 py-2 rounded-md transition-colors',
                    searchParamsSection === 'welcome-screen'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  <span className="w-5 h-5 mr-2 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">1</span>
                  Welcome Screen
                </Link>
              </li>
              <li key="smart-voc">
                <Link
                  href={`/dashboard?research=${activeResearch.id}&aim=true&section=smart-voc`}
                  className={cn(
                    'flex items-center text-sm px-3 py-2 rounded-md transition-colors',
                    searchParamsSection === 'smart-voc'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  <span className="w-5 h-5 mr-2 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">2</span>
                  Smart VOC
                </Link>
              </li>
              <li key="cognitive-task">
                <Link
                  href={`/dashboard?research=${activeResearch.id}&aim=true&section=cognitive-task`}
                  className={cn(
                    'flex items-center text-sm px-3 py-2 rounded-md transition-colors',
                    searchParamsSection === 'cognitive-task'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  <span className="w-5 h-5 mr-2 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">3</span>
                  Cognitive Tasks
                </Link>
              </li>
              <li key="eye-tracking">
                <Link
                  href={`/dashboard?research=${activeResearch.id}&aim=true&section=eye-tracking`}
                  className={cn(
                    'flex items-center text-sm px-3 py-2 rounded-md transition-colors',
                    searchParamsSection === 'eye-tracking'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  <span className="w-5 h-5 mr-2 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">4</span>
                  Eye Tracking
                </Link>
              </li>
              <li key="thank-you">
                <Link
                  href={`/dashboard?research=${activeResearch.id}&aim=true&section=thank-you`}
                  className={cn(
                    'flex items-center text-sm px-3 py-2 rounded-md transition-colors',
                    searchParamsSection === 'thank-you'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  <span className="w-5 h-5 mr-2 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">5</span>
                  Thank You Screen
                </Link>
              </li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-xs text-neutral-500 uppercase mb-2">RECRUIT</h3>
            <ul className="space-y-1">
              <li key="eye-tracking-recruit">
                <Link
                  href={`/dashboard?research=${activeResearch.id}&aim=true&section=eye-tracking-recruit`}
                  className={cn(
                    'flex items-center text-sm px-3 py-2 rounded-md transition-colors',
                    searchParamsSection === 'eye-tracking-recruit'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  Eye Tracking
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-xs text-neutral-500 uppercase mb-2">RESULTS</h3>
            <ul className="space-y-1">
              <li key="smart-voc-results">
                <Link
                  href={`/dashboard?research=${activeResearch.id}&aim=true&section=smart-voc-results`}
                  className={cn(
                    'flex items-center text-sm px-3 py-2 rounded-md transition-colors',
                    searchParamsSection === 'smart-voc-results'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  SmartVOC
                </Link>
              </li>
              <li key="cognitive-task-results">
                <Link
                  href={`/dashboard?research=${activeResearch.id}&aim=true&section=cognitive-task-results`}
                  className={cn(
                    'flex items-center text-sm px-3 py-2 rounded-md transition-colors',
                    searchParamsSection === 'cognitive-task-results'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  Cognitive Task
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Modal de confirmación */}
        {researchToDelete && (
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={closeDeleteModal}
            onConfirm={confirmDeleteResearch}
            researchName={researchToDelete.name}
          />
        )}
      </div>
    );
  }

  // Sidebar estándar para el resto de vistas
  return (
    <div className={cn('w-56 h-[410px] bg-white shadow-lg flex flex-col mt-8 ml-4 mb-4 rounded-2xl', className)}>
      <div className="px-4 pt-4 pb-3 border-b border-neutral-200">
        <a
          href="/dashboard"
          className="flex items-center"
          onClick={handleLogoClick}
        >
          <div className="flex items-center">
            <span className="text-xl font-semibold text-neutral-900">EmotioX</span>
            <span className="text-xs ml-1 text-neutral-500">(Inicio)</span>
          </div>
        </a>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="p-4">
          <ul className="space-y-1">
            {mainNavItems.map((item) => {
              let isActive = false;

              if (item.id === 'dashboard') {
                isActive = pathname === '/dashboard';
              }
              else if (item.id === 'new-research') {
                isActive = pathname === '/dashboard/research/new';
              }
              else if (item.id === 'research-history') {
                isActive = pathname === '/dashboard/research-history';
              }
              else if (item.id === 'research') {
                isActive = pathname === '/dashboard/research';
              }
              else if (item.id === 'emotions') {
                isActive = pathname === '/dashboard/emotions';
              }

              if (item.id === 'new-research') {
                return (
                  <li key={item.id}>
                    <Link
                      href="/dashboard/research/new"
                      className={cn(
                        'flex items-center py-2 px-3 rounded-md transition-colors w-full text-left',
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      )}
                    >
                      {typeof item.label === 'function'
                        ? item.getDynamicLabel!(hasDraft, currentDraft?.step, currentDraft?.lastUpdated)
                        : item.label}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  <button
                    onClick={() => router.push(item.href)}
                    className={cn(
                      'flex items-center py-2 px-3 rounded-md transition-colors w-full text-left',
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    )}
                  >
                    {typeof item.label === 'function'
                      ? item.getDynamicLabel!(hasDraft, currentDraft?.step, currentDraft?.lastUpdated)
                      : item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sección de investigación en curso */}
        <div className="w-full">
          <h3 className="p-4 w-full font-semibold text-xs text-neutral-500 uppercase flex items-center border-t border-neutral-200 pt-3">
            <span className="text-blue-600 mr-1">•</span>
            INVESTIGACIÓN EN CURSO
          </h3>

          {isLoadingResearch ? (
            <div className="px-3 text-xs text-neutral-500">
              Buscando investigación reciente...
            </div>
          ) : showNoResearchMessage || !recentResearch.length || !recentResearch[0]?.id ? (
            <div className="px-3 text-xs ml-2 text-sm text-neutral-500">
              NO HAY INVESTIGACIÓN EN CURSO
            </div>
          ) : (
            <ul>
              {recentResearch.map((item) => (
                item && item.id ? (
                  <li key={`recent-${item.id}`}>
                    <div className="flex ml-5">
                      <Link
                        href={`/dashboard?research=${item.id}&section=welcome-screen`}
                        className={cn(
                          'flex-1 flex items-center py-2 px-2 rounded-lg text-sm bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 transition-colors max-w-[150px]',
                          pathname?.includes(`research=${item.id}`)
                            ? 'bg-neutral-100 text-neutral-900 font-medium'
                            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                        )}
                      >
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        <span className="truncate">{item.name}</span>
                        {item.technique === 'aim-framework' && (
                          <span className="ml-auto text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">AIM</span>
                        )}
                      </Link>
                      <button
                        onClick={() => {
                          setResearchToDelete(item);
                          setShowDeleteModal(true);
                        }}
                        className="ml-2 p-1 text-neutral-400 hover:text-red-500 transition-colors"
                        title="Eliminar investigación"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ) : null
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      {showDeleteModal && researchToDelete && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={closeDeleteModal}
          onConfirm={confirmDeleteResearch}
          researchName={researchToDelete.name}
        />
      )}
    </div>
  );
}

// Envolver el componente con el HOC withSearchParams
const SidebarContentWithSuspense = withSearchParams(SidebarContent);

// Componente público que exportamos
export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<div className="w-64 bg-white border-r border-neutral-200 flex flex-col">
      <div className="p-4 text-center text-neutral-600">Cargando...</div>
    </div>}>
      <SidebarContentWithSuspense {...props} />
    </Suspense>
  );
} 