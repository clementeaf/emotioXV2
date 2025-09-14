'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, memo, useMemo, useCallback } from 'react';

import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { useResearchList } from '@/hooks/useResearchList';
import { ResearchSection, ResearchSidebarProps } from '@/interfaces/research';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { SidebarBase } from './SidebarBase';

// Base sections structure - BUILD stages will be dynamic based on technique
const baseSections: ResearchSection[] = [
  {
    id: 'build',
    title: 'Build',
    stages: [] // Will be populated dynamically
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

// Function to get BUILD stages based on research technique
const getBuildStages = (technique: string) => {
  const baseStages = [
    { id: 'welcome-screen', title: 'Welcome Screen' },
    { id: 'smart-voc', title: 'Smart VOC' },
    { id: 'cognitive', title: 'Cognitive Tasks' },
    { id: 'thank-you', title: 'Thank You Screen' }
  ];

  // For biometric-cognitive technique, add Screener before Welcome Screen and Implicit Association after
  if (technique === 'biometric-cognitive') {
    return [
      { id: 'screener', title: 'Screener' },
      { id: 'welcome-screen', title: 'Welcome Screen' },
      { id: 'implicit-association', title: 'Implicit Association' },
      { id: 'smart-voc', title: 'Smart VOC' },
      { id: 'cognitive', title: 'Cognitive Tasks' },
      { id: 'thank-you', title: 'Thank You Screen' }
    ];
  }

  return baseStages;
};

function ResearchSidebarContent({ researchId, className }: ResearchSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const currentSection = searchParams?.get('section') || 'welcome-screen';

  // Get research data from existing list instead of making another API call
  const { researches } = useResearchList();
  const researchData = researches.find(r => r.id === researchId);




  // Memoized User Info Component
  const UserInfo = memo(() => {
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
  });
  UserInfo.displayName = 'UserInfo';

  // Memoized Logout Button Component
  const LogoutButton = memo(() => {
    const handleLogout = useCallback(async () => {
      try {
        await logout();
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }, [logout]);

    return (
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-2 px-4 py-2 ml-2 text-[15px] text-red-600 hover:bg-red-200 rounded-lg transition-colors border border-red-200 hover:border-red-300"
        title="Cerrar sesión"
      >
        <span className="font-[400]">Cerrar sesión</span>
      </button>
    );
  });
  LogoutButton.displayName = 'LogoutButton';

  // Use actual research data for display
  // Try both nested (Research type) and flat (ResearchAPIResponse type) structures
  const researchName = researchData?.name || (researchId ? `Research ${researchId.slice(-8)}` : 'Research');
  const researchTechnique = researchData
    ? (researchData as { technique?: string; basic?: { technique?: string } }).technique ||
      (researchData as { technique?: string; basic?: { technique?: string } }).basic?.technique
    : null;

  // Generate dynamic sections based on research technique
  const sections = useMemo(() => {
    const dynamicSections = [...baseSections];
    const buildSectionIndex = dynamicSections.findIndex(s => s.id === 'build');

    if (buildSectionIndex !== -1 && researchTechnique) {
      const buildStages = getBuildStages(researchTechnique);
      dynamicSections[buildSectionIndex] = {
        ...dynamicSections[buildSectionIndex],
        stages: buildStages
      };
    } else if (buildSectionIndex !== -1) {
      // Fallback to default stages if no technique is available
      dynamicSections[buildSectionIndex] = {
        ...dynamicSections[buildSectionIndex],
        stages: getBuildStages('')
      };
    }
    return dynamicSections;
  }, [researchTechnique, researchData]);
  const isLoadingName = false; // No loading since data comes from existing list
  const error = null; // No error since we're using cached data

  const handleBackToDashboard = useCallback(() => { 
    router.push('/dashboard'); 
  }, [router]);

  // Optimized function for navigating to public-tests
  const handleOpenPublicTests = useCallback(() => {
    if (researchId) {
      // Usar la URL local en desarrollo, configurada en producción
      const isDevelopment = window.location.hostname === 'localhost';
      const baseUrl = isDevelopment
        ? 'http://localhost:5173'
        : 'https://public-tests.emotioxv2.com';
      window.open(`${baseUrl}/?researchId=${researchId}`, '_blank');
    }
  }, [researchId]);

  // Bloque superior: nombre proyecto y enlaces
  const TopBlock = (
    <div>
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-neutral-900 truncate" title={typeof researchName === 'string' ? researchName : ''}>
          {isLoadingName ? (
            <div className="animate-pulse bg-gray-200 rounded h-6 w-32"></div>
          ) : (
            researchName
          )}
        </h2>
        {researchTechnique && !isLoadingName && (
          <p className="text-sm text-neutral-600 mt-1 truncate" title={researchTechnique}>
            {researchTechnique}
          </p>
        )}
        {isLoadingName && (
          <div className="animate-pulse bg-gray-200 rounded h-4 w-24 mt-1"></div>
        )}
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

  // Optimized publish state management with useMemo
  const publishState = useMemo(() => {
    // Solo verificar si estamos en una sección que requiere eye-tracking
    const shouldCheckEyeTracking = currentSection === 'eye-tracking' || currentSection === 'eye-tracking-recruit';

    if (!shouldCheckEyeTracking) {
      return { enabled: true, checking: false };
    }

    // Simplified: Enable publish for recruit section by default
    // Content validation happens in the actual components
    return {
      enabled: currentSection === 'eye-tracking-recruit',
      checking: false
    };
  }, [currentSection]);

  // Use the memoized state
  useEffect(() => {
    setIsPublishEnabled(publishState.enabled);
    setIsCheckingContent(publishState.checking);
  }, [publishState]);

  // REMOVED: Content checking logic to avoid unnecessary API calls
  // The actual form components handle content validation

  // Optimized publish research function
  const handlePublishResearch = useCallback(() => {
    if (researchId && isPublishEnabled) {
      // Publication logic pending - requires research.updateStatus('published') API call
      alert('La función de publicación estará disponible próximamente');
    }
  }, [researchId, isPublishEnabled]);

  // Memoized Menu Block to prevent unnecessary re-renders
  const MenuBlock = useMemo(() => (
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
  ), [sections, researchId, currentSection, isPublishEnabled, isCheckingContent, handlePublishResearch]);

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

// Optimized loading skeleton component
const SidebarSkeleton = memo(() => (
  <div className="w-64 flex flex-col bg-white border-r border-neutral-200">
    <div className="px-6 pt-8 pb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-neutral-200 animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-neutral-200 rounded animate-pulse w-24"></div>
          <div className="h-3 bg-neutral-200 rounded animate-pulse w-32"></div>
        </div>
      </div>
    </div>
    <div className="px-6 pt-4 pb-3 space-y-2">
      <div className="h-5 bg-neutral-200 rounded animate-pulse w-40"></div>
      <div className="h-4 bg-neutral-200 rounded animate-pulse w-32"></div>
    </div>
    <div className="flex-1 px-6 py-4 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 bg-neutral-200 rounded animate-pulse w-16"></div>
          <div className="space-y-1">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="h-8 bg-neutral-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
));
SidebarSkeleton.displayName = 'SidebarSkeleton';

export function ResearchSidebar({ researchId, activeStage }: ResearchSidebarProps) {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <ResearchSidebarContentWithSuspense researchId={researchId} activeStage={activeStage} />
    </Suspense>
  );
}
