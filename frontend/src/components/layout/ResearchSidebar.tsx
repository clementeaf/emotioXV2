'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { memo, useMemo, useCallback } from 'react';

import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { useResearchList } from '@/hooks/useResearchList';
import { ResearchSidebarProps } from '@/interfaces/research';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { BASE_SECTIONS, getBuildStages, getResultsStages, DEFAULT_SECTION } from '@/config/research-stages.config';
import { SidebarBase } from './SidebarBase';


function ResearchSidebarContent({ researchId, className }: ResearchSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const currentSection = searchParams?.get('section') || DEFAULT_SECTION;
  const { researches } = useResearchList();
  const researchData = researches.find(r => r.id === researchId);

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

  const researchName = researchData?.name || (researchId ? `Research ${researchId.slice(-8)}` : 'Research');
  const researchTechnique = researchData
    ? (researchData as { technique?: string; basic?: { technique?: string } }).technique ||
      (researchData as { technique?: string; basic?: { technique?: string } }).basic?.technique
    : null;

  const sections = useMemo(() => {
    const dynamicSections = [...BASE_SECTIONS];
    const buildSectionIndex = dynamicSections.findIndex(s => s.id === 'build');
    const resultsSectionIndex = dynamicSections.findIndex(s => s.id === 'results');

    // Handle BUILD section
    if (buildSectionIndex !== -1 && researchTechnique) {
      const buildStages = getBuildStages(researchTechnique);
      dynamicSections[buildSectionIndex] = {
        ...dynamicSections[buildSectionIndex],
        stages: buildStages
      };
    } else if (buildSectionIndex !== -1) {
      dynamicSections[buildSectionIndex] = {
        ...dynamicSections[buildSectionIndex],
        stages: getBuildStages('')
      };
    }

    // Handle RESULTS section
    if (resultsSectionIndex !== -1 && researchTechnique) {
      const resultsStages = getResultsStages(researchTechnique);
      dynamicSections[resultsSectionIndex] = {
        ...dynamicSections[resultsSectionIndex],
        stages: resultsStages
      };
    } else if (resultsSectionIndex !== -1) {
      dynamicSections[resultsSectionIndex] = {
        ...dynamicSections[resultsSectionIndex],
        stages: getResultsStages('')
      };
    }

    return dynamicSections;
  }, [researchTechnique, researchData]);
  const isLoadingName = false;
  const error = null;

  const handleBackToDashboard = useCallback(() => { 
    router.push('/dashboard'); 
  }, [router]);

  const handleOpenPublicTests = useCallback(() => {
    if (researchId) {
      const isDevelopment = window.location.hostname === 'localhost';
      const baseUrl = isDevelopment
        ? 'http://localhost:5173'
        : 'https://d35071761848hm.cloudfront.net';
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

    </nav>
  ), [sections, researchId, currentSection]);

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
  return <ResearchSidebarContentWithSuspense researchId={researchId} activeStage={activeStage} />;
}
