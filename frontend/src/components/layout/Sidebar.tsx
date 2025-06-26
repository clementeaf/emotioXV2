'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { API_HTTP_ENDPOINT } from '@/api/endpoints';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { Button } from '@/components/ui/Button';
import { researchAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useResearch } from '@/stores/useResearchStore';

import { SidebarBase } from './SidebarBase';

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

interface User {
  id: string;
  email: string;
  name: string;
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
            ¿Estás seguro de que deseas terminar la investigación <span className="font-semibold">&quot;{researchName}&quot;</span>? Esta acción no se puede deshacer.
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

function SidebarContent({ className, activeResearch }: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const { hasDraft, currentDraft } = useResearch();
  const [recentResearch, setRecentResearch] = useState<Array<{ id: string, name: string, technique: string }>>([]);
  const [isLoadingResearch, setIsLoadingResearch] = useState<boolean>(true);
  const [showNoResearchMessage, setShowNoResearchMessage] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [researchToDelete, setResearchToDelete] = useState<{ id: string, name: string } | null>(null);

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setResearchToDelete(null);
  };

  const confirmDeleteResearch = async () => {
    if (!researchToDelete || !researchToDelete.id) {
      closeDeleteModal();
      return;
    }
    try {
      try {
        await researchAPI.delete(researchToDelete.id);
      } catch (apiError) {
        // Error handling silencioso
      }
      localStorage.setItem('research_list', JSON.stringify([]));
      localStorage.removeItem(`research_${researchToDelete.id}`);
      setRecentResearch([]);
      if (window.location.search.includes(`research=${researchToDelete.id}`)) {
        router.replace('/dashboard');
      }
    } catch (error) {
      // Error handling silencioso
    } finally {
      setShowDeleteModal(false);
      setResearchToDelete(null);
    }
  };

  // Cargar la investigación más reciente
  useEffect(() => {
    const fetchMostRecentResearch = async () => {
      setIsLoadingResearch(true);
      setShowNoResearchMessage(false);
      try {
        const response = await fetch(`${API_HTTP_ENDPOINT}/research/all`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error ${response.status} al obtener investigaciones: ${errorText}`);
        }

        const data = await response.json();
        const researches = Array.isArray(data?.data) ? data.data : [];

        if (researches.length === 0) {
          setRecentResearch([]);
          setShowNoResearchMessage(true);
        } else {
          const sortedResearches = researches.sort((a: Research, b: Research) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });

          const mostRecent = sortedResearches[0];

          if (mostRecent && mostRecent.id) {
            setRecentResearch([{
              id: mostRecent.id,
              name: mostRecent.name || 'Investigación sin nombre',
              technique: mostRecent.technique || ''
            }]);
            setShowNoResearchMessage(false);
          } else {
            setRecentResearch([]);
            setShowNoResearchMessage(true);
          }
        }
      } catch (error) {
        setRecentResearch([]);
        setShowNoResearchMessage(true);
      } finally {
        setIsLoadingResearch(false);
      }
    };

    fetchMostRecentResearch();
  }, [activeResearch]);

  function UserInfo() {
    if (!user) {
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
            <span className="text-sm font-medium text-neutral-700">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">Usuario</p>
            <p className="text-xs text-neutral-500 truncate">Cargando...</p>
          </div>
        </div>
      );
    }
    const userName = user.name || 'Usuario';
    const userEmail = user.email || 'Sin email';
    const userInitial = userName.charAt(0).toUpperCase();
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-sm font-medium text-blue-700">{userInitial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate">{userName}</p>
          <p className="text-xs text-neutral-500 truncate">{userEmail}</p>
        </div>
      </div>
    );
  }

  const LogoBlock = (
    <a href="/dashboard" className="flex items-center" onClick={() => router.push('/dashboard')}>
      <span className="text-xl font-semibold text-neutral-900">EmotioX</span>
    </a>
  );

  const MenuBlock = (
    <nav className="mb-6">
      <ul className="space-y-1">
        {mainNavItems.map((item) => {
          let isActive = false;
          if (item.id === 'dashboard') {isActive = pathname === '/dashboard';}
          else if (item.id === 'new-research') {isActive = pathname === '/dashboard/research/new';}
          else if (item.id === 'research-history') {isActive = pathname === '/dashboard/research-history';}
          else if (item.id === 'research') {isActive = pathname === '/dashboard/research';}
          else if (item.id === 'emotions') {isActive = pathname === '/dashboard/emotions';}
          if (item.id === 'new-research') {
            return (
              <li key={item.id}>
                <Link
                  href="/dashboard/research/new"
                  className={cn(
                    'flex items-center py-2 px-3 rounded-md transition-colors w-full text-left',
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-neutral-700 hover:bg-neutral-100'
                  )}
                >
                  {typeof item.label === 'function'
                    ? item.getDynamicLabel?.(hasDraft, currentDraft?.step, currentDraft?.lastUpdated)
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
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-neutral-700 hover:bg-neutral-100'
                )}
              >
                {typeof item.label === 'function'
                  ? item.getDynamicLabel?.(hasDraft, currentDraft?.step, currentDraft?.lastUpdated)
                  : item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  function LogoutButton() {
    const handleLogout = async () => {
      try {
        await logout();
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    };
    return (
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
        title="Cerrar sesión"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="font-medium">Cerrar sesión</span>
      </button>
    );
  }

  const ResearchInProgressBlock = (
    <div className="w-full mt-2">
      <h3 className="p-3 w-full font-semibold text-[14px] text-neutral-500 uppercase flex items-center pt-3">
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
                <div className="flex pl-2">
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

  return (
    <SidebarBase
      userInfo={<UserInfo />}
      topBlock={LogoBlock}
      footer={<LogoutButton />}
      className={className}
    >
      {MenuBlock}
      {ResearchInProgressBlock}
    </SidebarBase>
  );
}

const SidebarContentWithSuspense = withSearchParams(SidebarContent);

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<div className="w-64 flex flex-col">
      <div className="p-4 text-center text-neutral-600">Cargando...</div>
    </div>}>
      <SidebarContentWithSuspense {...props} />
    </Suspense>
  );
}
