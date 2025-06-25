'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { ResearchSection, ResearchSidebarProps } from '@/interfaces/research';
import { researchAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { Research } from '../../../../shared/interfaces/research.model';

const sections: ResearchSection[] = [
  {
    id: 'build',
    title: 'Build',
    stages: [
      { id: 'welcome-screen', title: 'Welcome Screen' },
      { id: 'smart-voc', title: 'Smart VOC' },
      { id: 'cognitive', title: 'Cognitive Tasks' },
      { id: 'thank-you', title: 'Thank You Screen' }
    ]
  },
  {
    id: 'recruit',
    title: 'Recruit',
    stages: [
      { id: 'eye-tracking-recruit', title: 'Eye Tracking' }
    ]
  },
  {
    id: 'results',
    title: 'Results',
    stages: [
      { id: 'smart-voc-results', title: 'SmartVOC' },
      { id: 'cognitive-task-results', title: 'Cognitive Task' }
    ]
  }
];

// Componente interno que usa useSearchParams
function ResearchSidebarContent({ researchId, activeStage, className }: ResearchSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const currentSection = searchParams?.get('section') || 'welcome-screen';

  // Componente para mostrar información del usuario
  function UserInfo() {
    if (!user) {
      return (
        <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
            <span className="text-xs font-medium text-neutral-600">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-neutral-700 truncate">Usuario</p>
            <p className="text-xs text-neutral-500 truncate">Cargando...</p>
          </div>
        </div>
      );
    }

    const userName = user.name || 'Usuario';
    const userEmail = user.email || 'Sin email';
    const userInitial = userName.charAt(0).toUpperCase();

    return (
      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-xs font-medium text-blue-700">
            {userInitial}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-neutral-900 truncate">
            {userName}
          </p>
          <p className="text-xs text-neutral-500 truncate">
            {userEmail}
          </p>
        </div>
      </div>
    );
  }

  // Componente para el botón de logout
  function LogoutButton() {
    const handleLogout = async () => {
      try {
        console.log('Cerrando sesión desde ResearchSidebar...');
        await logout();
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        // Forzar logout local en caso de error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    };

    return (
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
        title="Cerrar sesión"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="font-medium">Cerrar sesión</span>
      </button>
    );
  }

  // Estados para el nombre y la carga
  const [researchName, setResearchName] = useState<string>('Cargando nombre...'); // Estado inicial de carga
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener URL base de public-tests desde variable de entorno
  const publicTestsBaseUrl = process.env.NEXT_PUBLIC_PUBLIC_TESTS_URL || 'https://main.dgsabzeqh9eea.amplifyapp.com';
  const localPublicTestsUrl = 'http://localhost:5173';
  const isAmplify = !!publicTestsBaseUrl;

  // Obtener nombre de la investigación
  useEffect(() => {
    const fetchResearchName = async () => {
      if (!researchId) {
        setResearchName('Investigación no encontrada');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await researchAPI.get(researchId);
        let researchData: Research | null = null;
        if (Array.isArray(response.data) && response.data.length > 0) {
          researchData = response.data[0] as Research;
        } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          researchData = response.data as Research;
        }
        const nameFromApi = researchData?.name;

        if (nameFromApi) {
          setResearchName(nameFromApi);
          try {
            localStorage.setItem(`research_${researchId}`, JSON.stringify(researchData));
          } catch (storageError) {
            console.error('[ResearchSidebar] Falló al guardar en localStorage:', storageError);
          }
        } else {
          fetchNameFromLocalStorage();
        }
      } catch (apiError: any) {
        console.error(`[ResearchSidebar] Error capturado al llamar a researchAPI.get para ${researchId}:`, apiError);
        setError(`Error al cargar datos (${apiError.message || 'detalle desconocido'})`);
        fetchNameFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };

    const fetchNameFromLocalStorage = () => {
      try {
        const storedData = localStorage.getItem(`research_${researchId}`);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData?.name) {
            setResearchName(parsedData.name);
            setError(null);
            return;
          }
        }
      } catch (storageError) {
         console.error('[ResearchSidebar] Error al leer/parsear localStorage:', storageError);
        setError('Error al acceder a datos locales.');
      }
      setResearchName('Nombre no disponible');
    };

    fetchResearchName();
  }, [researchId]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  // Construir la URL de public-tests según entorno
  let publicTestUrl: string | null = null;
  if (researchId) {
    if (process.env.NODE_ENV === 'development') {
      publicTestUrl = `${localPublicTestsUrl}?researchId=${researchId}`;
    } else {
      publicTestUrl = `${publicTestsBaseUrl}?researchId=${researchId}`;
    }
  }

  return (
    <div className={cn('p-4 mt-24 mx-4 flex flex-col min-h-[510px] h-full overflow-y-auto', className)}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-neutral-900 truncate" title={researchName}>
            {isLoading ? 'Cargando nombre...' : researchName}
          </h2>
        </div>
        <button
          onClick={handleBackToDashboard}
          className="py-2 text-sm text-neutral-700 font-medium transition-colors text-left"
          aria-label="Volver al dashboard"
        >
          ← Volver al dashboard
        </button>

        {/* Enlace a Public Tests */}
        {publicTestUrl ? (
          <a
            href={publicTestUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Abrir vista de participante
            <ExternalLink size={14} className="ml-1.5" />
          </a>
        ) : (
          <p className="text-xs text-neutral-500">(URL de Public Tests no configurada)</p>
        )}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      {/* Header con información del usuario */}
      <div className="mt-6 mb-4">
        <UserInfo />
      </div>

      {/* Contenido del sidebar */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="space-y-1">
              <div>
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>

              {section.stages?.map((stage) => (
                <Link
                  key={stage.id}
                  href={`/dashboard?research=${researchId}&aim=true&section=${stage.id}`}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                    currentSection === stage.id
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  )}
                >
                  <span className="flex-1">{stage.title}</span>
                </Link>
              ))}

              {/* Agregar botón de cerrar sesión después de la sección RESULTS */}
              {section.id === 'results' && (
                <div className="mt-4 pt-3 border-t border-neutral-200">
                  <LogoutButton />
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

// Usar el HOC para envolver el componente
const ResearchSidebarContentWithSuspense = withSearchParams(ResearchSidebarContent);

// Componente público que exportamos
export function ResearchSidebar({ researchId, activeStage }: ResearchSidebarProps) {
  return (
    <Suspense fallback={<div className="w-60 flex flex-col">
      <div className="p-4 text-center text-neutral-600">Cargando...</div>
    </div>}>
      <ResearchSidebarContentWithSuspense researchId={researchId} activeStage={activeStage} />
    </Suspense>
  );
}
