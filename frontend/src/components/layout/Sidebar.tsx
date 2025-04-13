'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

import { Button } from '@/components/ui/Button';
import { researchAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useResearch } from '@/stores/useResearchStore';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';

interface SidebarProps {
  className?: string;
  activeResearch?: {
    id: string;
    name: string;
  };
}

const mainNavItems = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { 
    id: 'new-research', 
    label: 'New Research', 
    href: '/dashboard/research/new',
    getDynamicLabel: (hasDraft: boolean, currentStep?: string, lastUpdated?: Date) => {
      if (!hasDraft) {return 'New Research';}
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
  
  if (diffInMinutes < 1) {return 'just now';}
  if (diffInMinutes < 60) {return `${diffInMinutes}m ago`;}
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {return `${diffInHours}h ago`;}
  
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
  if (!isOpen) {return null;}

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
  
  // Agregar estado para investigaciones recientes
  const [recentResearch, setRecentResearch] = useState<Array<{id: string, name: string, technique: string}>>([]);
  // Estados para controlar mensajes de carga y temporales
  const [isLoadingResearch, setIsLoadingResearch] = useState<boolean>(true);
  const [showNoResearchMessage, setShowNoResearchMessage] = useState<boolean>(false);
  
  // Estado para controlar el modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [researchToDelete, setResearchToDelete] = useState<{id: string, name: string} | null>(null);
  
  // Verificar si estamos en el proceso de creación de una investigación
  const isCreatingResearch = pathname === '/dashboard/research/new';

  // Cargar detalles de la investigación desde localStorage si existe
  const [researchDetails, setResearchDetails] = useState<any>(null);
  
  // Cargar las investigaciones recientes
  useEffect(() => {
    setIsLoadingResearch(true);
    
    try {
      // Verificar si hay una señal de que se ha creado una nueva investigación
      const researchUpdated = localStorage.getItem('research_updated') === 'true';
      
      // Si se detecta que se creó una nueva investigación, limpiar esa señal
      if (researchUpdated) {
        console.log('Se detectó la creación de una nueva investigación');
        localStorage.removeItem('research_updated');
      }
      
      const storedList = localStorage.getItem('research_list');
      if (storedList) {
        const researchList = JSON.parse(storedList);
        
        // Si hay investigaciones en la lista, validar la más reciente
        if (researchList.length > 0) {
          const mostRecent = researchList[researchList.length - 1];
          
          // Verificar si existe en el backend
          const validateResearch = async () => {
            try {
              // Intentar obtener la investigación del backend
              const response = await researchAPI.get(mostRecent.id);
              console.log('Investigación validada exitosamente con el backend:', mostRecent.id);
              console.log('Respuesta del backend:', response);
              
              // Si llegamos aquí, la investigación existe
              setRecentResearch([mostRecent]);
              setIsLoadingResearch(false);
            } catch (error: any) {
              // Si es un error 404, la investigación ya no existe
              if (error?.response?.status === 404 || 
                  (error?.message && error.message.includes('404'))) {
                console.log(`Investigación ${mostRecent.id} ya no existe en el backend, eliminando de recientes`);
                
                // Eliminar la investigación de localStorage
                try {
                  localStorage.removeItem(`research_${mostRecent.id}`);
                  
                  // Actualizar la lista de investigaciones recientes
                  const updatedList = researchList.filter((r: any) => r.id !== mostRecent.id);
                  localStorage.setItem('research_list', JSON.stringify(updatedList));
                  
                  // También limpiar otras entradas relacionadas
                  localStorage.removeItem(`welcome-screen_nonexistent_${mostRecent.id}`);
                  localStorage.removeItem(`thank-you-screen_nonexistent_${mostRecent.id}`);
                  localStorage.removeItem(`eye-tracking_nonexistent_${mostRecent.id}`);
                  localStorage.removeItem(`smart-voc_nonexistent_${mostRecent.id}`);
                  
                  // Mostrar mensaje de no hay investigaciones por 2 segundos
                  setRecentResearch([]);
                  setShowNoResearchMessage(true);
                  setTimeout(() => {
                    setShowNoResearchMessage(false);
                  }, 2000);
                  setIsLoadingResearch(false);
                } catch (localStorageError) {
                  console.error('Error eliminando datos de localStorage:', localStorageError);
                  setIsLoadingResearch(false);
                }
              } else {
                // Si es otro tipo de error (no 404), mantener la investigación en la lista
                // asumiendo que es un error temporal de red
                console.log('Error no 404 al validar investigación, manteniendo en la lista:', error);
                setRecentResearch([mostRecent]);
                setIsLoadingResearch(false);
              }
            }
          };
          
          // Ejecutar la validación
          validateResearch();
        } else {
          // No hay investigaciones en la lista
          setRecentResearch([]);
          setShowNoResearchMessage(true);
          setTimeout(() => {
            setShowNoResearchMessage(false);
          }, 2000);
          setIsLoadingResearch(false);
        }
      } else {
        // No hay lista de investigaciones
        setRecentResearch([]);
        setShowNoResearchMessage(true);
        setTimeout(() => {
          setShowNoResearchMessage(false);
        }, 2000);
        setIsLoadingResearch(false);
      }
    } catch (error) {
      console.error('Error cargando investigación en curso:', error);
      setIsLoadingResearch(false);
    }
  }, [activeResearch]);
  
  useEffect(() => {
    if (activeResearch?.id) {
      try {
        const storedResearch = localStorage.getItem(`research_${activeResearch.id}`);
        if (storedResearch) {
          setResearchDetails(JSON.parse(storedResearch));
        }
      } catch (error) {
        console.error('Error cargando detalles de la investigación:', error);
      }
    }
  }, [activeResearch]);

  // Determinar si debemos mostrar el sidebar de AIM Framework
  const isAimFrameworkResearch = isAimFramework || 
    (researchDetails && researchDetails.technique === 'aim-framework');
  
  // Función para manejar el clic en "New Research" cuando hay una investigación en curso
  const handleNewResearchClick = (e: React.MouseEvent) => {
    // Si hay investigación activa, redireccionar directamente a esa investigación
    if (activeResearch?.id) {
      e.preventDefault();
      console.log('Hay una investigación activa, pero dejando que page.tsx se encargue de mostrar el modal');
      
      // En lugar de mostrar un modal aquí, simplemente navegamos a la página de nueva investigación
      // y dejamos que la lógica en page.tsx maneje la presentación del modal
      router.push('/dashboard/research/new');
    } else {
      // Si no hay investigación activa, permitir navegación normal a /dashboard/research/new
      console.log('No hay investigación activa, navegando a crear nueva investigación');
    }
  };

  // Función para manejar el clic en el logo de EmotioX
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Limpiar cualquier estado que pudiera persistir pero sin causar un refresh completo
    if (window.location.search.includes('research=')) {
      console.log('Navegando al dashboard, limpiando contexto de investigación');
      
      // En lugar de usar window.location.href, usamos router.replace
      // Esto mantiene el estado de autenticación pero limpia los parámetros de URL
      router.replace('/dashboard');
      
      // Para asegurarnos de que se limpie el estado interno, vamos a aplicar un pequeño retraso
      // y luego refrescar los componentes que dependen de searchParams
      setTimeout(() => {
        // Forzar actualización del sidebar - esto no causa un refresh completo
        // pero asegura que los componentes se re-rendericen
        setRecentResearch([...recentResearch]);
      }, 50);
      
      return;
    }
    
    // Si no hay parámetros de investigación, navegación normal
    console.log('Navegando al dashboard principal');
    router.push('/dashboard');
  };
  
  const confirmDeleteResearch = async () => {
    if (!researchToDelete) {return;}
    
    try {
      // Llamar a la API para eliminar la investigación del backend
      try {
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
              <li>
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
              <li>
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
              <li>
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
              <li>
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
              <li>
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
              <li>
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
              <li>
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
              <li>
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
    <div className={cn('w-56 h-[460px] bg-white shadow-lg flex flex-col mt-8 ml-4 mb-4 rounded-2xl', className)}>
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
              // Lógica completamente reescrita para corregir el problema de selección
              let isActive = false;
              
              if (item.id === 'dashboard') {
                // Dashboard activo solo si estamos exactamente en /dashboard y no en otra subruta
                isActive = pathname === '/dashboard';
              } 
              else if (item.id === 'new-research') {
                // New Research activo si estamos en la ruta de nueva investigación
                isActive = pathname === '/dashboard/research/new';
              }
              else if (item.id === 'research-history') {
                // Research History activo si estamos en esa ruta específica
                isActive = pathname === '/dashboard/research-history';
              }
              else if (item.id === 'research') {
                // Research activo si estamos en esa ruta específica
                isActive = pathname === '/dashboard/research';
              }
              else if (item.id === 'emotions') {
                // Emotions activo si estamos en esa ruta específica
                isActive = pathname === '/dashboard/emotions';
              }
              
              // Personalizar el elemento "Nueva investigación" para usar nuestra función personalizada
              if (item.id === 'new-research') {
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center py-2 px-3 rounded-md transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      )}
                      onClick={handleNewResearchClick}
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
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center py-2 px-3 rounded-md transition-colors',
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
            })}
          </ul>
        </nav>
        
        {/* Mostrar solo la investigación más reciente */}
        <div className="w-full">
          <h3 className="p-4 w-full font-semibold text-xs text-neutral-500 uppercase mb-3 flex items-center border-t border-neutral-200 pt-3">
            <span className="text-blue-600 mr-1">•</span>
            INVESTIGACIÓN EN CURSO
          </h3>
          
          {isLoadingResearch ? (
            <div className="py-2 px-3 text-sm text-neutral-500">
              Buscando investigaciones en curso...
            </div>
          ) : showNoResearchMessage ? (
            <div className="py-2 px-3 text-sm text-neutral-500">
              No hay investigaciones en curso
            </div>
          ) : recentResearch.length > 0 ? (
            <ul>
              {recentResearch.slice(0, 1).map((item) => (
                <li key={item.id} className="flex items-center justify-start ml-5">
                  <div className="flex items-center">
                    <Link
                      href={item.technique === 'aim-framework' 
                        ? `/dashboard?research=${item.id}&aim=true&section=welcome-screen`
                        : `/dashboard?research=${item.id}`
                      }
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
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      
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