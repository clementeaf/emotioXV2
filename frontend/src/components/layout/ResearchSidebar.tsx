'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { useEyeTrackingSharedData } from '@/hooks/useEyeTrackingSharedData';
import { useResearchById } from '@/hooks/useResearchList';
import { ResearchSection, ResearchSidebarProps } from '@/interfaces/research';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
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
      { id: 'eye-tracking-recruit', title: 'Configuración de estudio' }
    ]
  },
  {
    id: 'results',
    title: 'Results',
    stages: [
      { id: 'smart-voc-results', title: 'SmartVOC' },
      { id: 'cognitive-task-results', title: 'Cognitive Task' }
    ]
  },
  {
    id: 'research-status',
    title: 'Research Status',
    stages: [
      { id: 'research-in-progress', title: 'Investigación en curso' }
    ]
  },
];

function ResearchSidebarContent({ researchId, className }: ResearchSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const currentSection = searchParams?.get('section') || 'welcome-screen';

  // Usar solo research data básico (sin grouped responses)
  const { data: researchData, isLoading: isLoadingResearch, error: researchError } = useResearchById(researchId || '');

  // Usar el hook compartido para obtener eye-tracking data solo cuando sea necesario
  // Optimización: Solo cargar datos cuando realmente se necesiten para verificación
  const { data: eyeTrackingData, isLoading: isLoadingEyeTracking } = useEyeTrackingSharedData(researchId || '', {
    enabled: (currentSection === 'eye-tracking' || currentSection === 'eye-tracking-recruit') && !!researchId,
    type: currentSection === 'eye-tracking' ? 'build' : currentSection === 'eye-tracking-recruit' ? 'recruit' : 'both'
  });

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
        className="w-full flex items-center gap-2 px-4 py-2 ml-2 text-[15px] text-red-600 hover:bg-red-200 rounded-lg transition-colors border border-red-200 hover:border-red-300"
        title="Cerrar sesión"
      >
        <span className="font-[400]">Cerrar sesión</span>
      </button>
    );
  }

  // Estados para el nombre y la carga
  // Obtener el nombre del research desde el hook centralizado
  const researchName = researchData?.name || 'Cargando...';
  const isLoading = isLoadingResearch;
  const error = researchError?.message || null;

  const handleBackToDashboard = () => { router.push('/dashboard'); };

  // Función para navegar a public-tests
  const handleOpenPublicTests = () => {
    if (researchId) {
      console.log('researchId', researchId);
      // Usar la URL de Vercel en producción, localhost en desarrollo
      const isDevelopment = window.location.hostname === 'localhost';
      const baseUrl = isDevelopment
        ? 'http://localhost:5173'
        : 'https://emotio-xv-2-public-tests.vercel.app';
      console.log('🌐 Abriendo URL:', baseUrl);
      window.open(`${baseUrl}/?researchId=${researchId}`, '_blank');
    }
  };

  // Bloque superior: nombre proyecto y enlaces
  const TopBlock = (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-neutral-900 truncate" title={researchName}>
          {researchName}
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

  // Estado para el botón de publicación
  const [isPublishEnabled, setIsPublishEnabled] = useState(false);
  const [isCheckingContent, setIsCheckingContent] = useState(false);

  // Verificar contenido solo cuando sea necesario
  useEffect(() => {
    // Solo verificar si estamos en una sección que requiere eye-tracking
    const shouldCheckEyeTracking = currentSection === 'eye-tracking' || currentSection === 'eye-tracking-recruit';

    if (!shouldCheckEyeTracking) {
      // Si no estamos en sección de eye-tracking, habilitar publicación por defecto
      setIsPublishEnabled(true);
      setIsCheckingContent(false);
      return;
    }

    // Solo verificar si tenemos datos y no estamos cargando
    if (!isLoadingEyeTracking && eyeTrackingData !== undefined) {
      setIsCheckingContent(true);

      try {
        // Verificar si hay contenido configurado
        const hasContent = checkIfResearchHasContent();
        setIsPublishEnabled(hasContent);
      } catch (error) {
        console.error('Error verificando contenido:', error);
        setIsPublishEnabled(false);
      } finally {
        setIsCheckingContent(false);
      }
    }
  }, [researchId, currentSection, eyeTrackingData, isLoadingEyeTracking]);

  // Función para verificar si hay contenido configurado (síncrona)
  const checkIfResearchHasContent = (): boolean => {
    if (!researchId || !eyeTrackingData) return false;

    try {
      // Usar los datos del hook centralizado
      const response = eyeTrackingData;

      if (response) {
        // Verificar si hay preguntas demográficas habilitadas
        const hasDemographics = Object.values(response.demographicQuestions || {}).some((q: any) => q?.enabled);

        // Verificar si hay configuración de enlaces habilitada
        const hasLinkConfig = Object.values(response.linkConfig || {}).some(value => value);

        // Verificar si hay parámetros habilitados
        const hasParameters = Object.values(response.parameterOptions || {}).some(value => value);

        return hasDemographics || hasLinkConfig || hasParameters;
      }

      return false;
    } catch (error) {
      console.error('Error verificando contenido:', error);
      return false;
    }
  };

  // Función para publicar investigación
  const handlePublishResearch = () => {
    if (researchId && isPublishEnabled) {
      console.log('Publicando investigación:', researchId);
      // TODO: Implementar lógica de publicación
      alert('Función de publicación en desarrollo');
    }
  };

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

      {/* 🎯 BOTÓN PUBLICAR INVESTIGACIÓN */}
      <div className="space-y-1">
        <div>
          <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Acciones
          </h3>
        </div>
        <button
          onClick={handlePublishResearch}
          disabled={!isPublishEnabled || isCheckingContent}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors font-medium ${isPublishEnabled && !isCheckingContent
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          {isCheckingContent ? 'Verificando...' : 'Publicar investigación'}
        </button>

        {/* Mostrar mensaje solo cuando sea necesario y esté estable */}
        {!isPublishEnabled && !isCheckingContent && (currentSection === 'eye-tracking' || currentSection === 'eye-tracking-recruit') && (
          <p className="text-xs text-gray-500 mt-1">
            Complete la configuración de Eye Tracking para habilitar la publicación
          </p>
        )}
      </div>
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
