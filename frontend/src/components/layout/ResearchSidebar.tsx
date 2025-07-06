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
import { navigateToPublicTestsSafe } from '@/config/amplify-config';

import { Research } from '../../../../shared/interfaces/research.model';

import { SidebarBase } from './SidebarBase';

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

function ResearchSidebarContent({ researchId, activeStage, className }: ResearchSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const currentSection = searchParams?.get('section') || 'welcome-screen';

  // Bloque de usuario/avatar
  function UserInfo() {
    if (!user) {
      return (
        <div className="flex items-center gap-3 p-3">
          <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center">
            <span className="text-lg font-medium text-neutral-600">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-md font-medium text-neutral-900 truncate">Usuario</p>
            <p className="text-md text-neutral-500 truncate">Cargando...</p>
          </div>
        </div>
      );
    }
    const userName = user.name || 'Usuario';
    const userEmail = user.email || 'Sin email';
    const userInitial = userName.charAt(0).toUpperCase();
    return (
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-300 flex items-center justify-center">
          <span className="text-lg font-medium text-blue-900">{userInitial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-md font-medium text-neutral-900 truncate">{userName}</p>
          <p className="text-md text-neutral-500 truncate">{userEmail}</p>
        </div>
      </div>
    );
  }

  // Footer (logout)
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
        className="w-full flex items-center gap-2 px-4 py-2 text-[15px] text-red-600 hover:bg-red-200 rounded-lg transition-colors border border-red-200 hover:border-red-300"
        title="Cerrar sesión"
      >
        <span className="font-[400]">Cerrar sesión</span>
      </button>
    );
  }

  // Estados para el nombre y la carga
  const [researchName, setResearchName] = useState<string>('Cargando nombre...');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
          researchData = response.data[0] as unknown as Research;
        } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          researchData = response.data as unknown as Research;
        }
        const nameFromApi = researchData?.name;

        if (nameFromApi) {
          setResearchName(nameFromApi);
          try {
            localStorage.setItem(`research_${researchId}`, JSON.stringify(researchData));
          } catch (storageError) {
            // Error handling silencioso
          }
        } else {
          fetchNameFromLocalStorage();
        }
      } catch (apiError: unknown) {
        const errorMessage = apiError instanceof Error ? apiError.message : 'detalle desconocido';
        setError(`Error al cargar datos (${errorMessage})`);
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
        setError('Error al acceder a datos locales.');
      }
      setResearchName('Nombre no disponible');
    };

    fetchResearchName();
  }, [researchId]);
  
  const handleBackToDashboard = () => { router.push('/dashboard'); };
  
  // Función para navegar a public-tests usando Amplify
  const handleOpenPublicTests = () => {
    if (researchId) {
      navigateToPublicTestsSafe(researchId);
    }
  };

  // Bloque superior: nombre proyecto y enlaces
  const TopBlock = (
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
      {researchId ? (
        <button
          onClick={handleOpenPublicTests}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
          Abrir vista de participante
          <ExternalLink size={14} className="ml-1.5" />
        </button>
      ) : (
        <p className="text-xs text-neutral-500">(Research ID no disponible)</p>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  // Menú/secciones
  const MenuBlock = (
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
                  ? 'bg-blue-200 text-blue-600 font-medium'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              )}
            >
              <span className="flex-1">{stage.title}</span>
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <SidebarBase
      userInfo={<UserInfo />}
      topBlock={TopBlock}
      footer={<LogoutButton />}
      className={className}
    >
      {MenuBlock}
    </SidebarBase>
  );
}

const ResearchSidebarContentWithSuspense = withSearchParams(ResearchSidebarContent);

export function ResearchSidebar({ researchId, activeStage }: ResearchSidebarProps) {
  return (
    <Suspense fallback={<div className="w-60 flex flex-col">
      <div className="p-4 text-center text-neutral-600">Cargando...</div>
    </div>}>
      <ResearchSidebarContentWithSuspense researchId={researchId} activeStage={activeStage} />
    </Suspense>
  );
}
