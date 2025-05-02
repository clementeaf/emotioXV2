'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, memo, Suspense } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { ResearchTable } from '@/components/dashboard/ResearchTable';
import { ResearchTypes } from '@/components/dashboard/ResearchTypes';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ResearchStageManager } from '@/components/research/ResearchStageManager';
import { cleanAllResearchFromLocalStorage } from '@/lib/cleanup/localStorageCleanup';

// Interfaces para tipar los datos
interface ResearchData {
  id: string;
  name: string;
  technique?: string;
  createdAt?: string;
  status?: string;
}

interface ActiveResearch {
  id: string;
  name: string;
}

const DashboardStats = memo(() => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <StatsCard 
      title="Total Investigaciones" 
      value="0" 
      icon={
        <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      }
    />
    <StatsCard 
      title="En Progreso" 
      value="0" 
      icon={
        <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    />
    <StatsCard 
      title="Completadas" 
      value="0" 
      icon={
        <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    />
    <StatsCard 
      title="Participantes" 
      value="0" 
      icon={
        <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      }
    />
  </div>
));

DashboardStats.displayName = 'DashboardStats';

const DashboardMainContent = memo(() => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 bg-white rounded-lg border border-neutral-200 p-6">
      <ResearchTable />
    </div>
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <h2 className="text-lg font-medium mb-6">Tipos de Investigación</h2>
      <ResearchTypes />
    </div>
  </div>
));

DashboardMainContent.displayName = 'DashboardMainContent';

const DashboardHeader = memo(() => (
  <div className="mb-8">
    <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
  </div>
));

DashboardHeader.displayName = 'DashboardHeader';

const DashboardContent = memo(() => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const researchId = searchParams?.get('research');
  const section = searchParams?.get('section') || null;
  const [isAimFramework, setIsAimFramework] = useState(searchParams?.get('aim') === 'true');
  const [activeResearch, setActiveResearch] = useState<ActiveResearch | undefined>(undefined);

  useEffect(() => {
    if (researchId) {
      try {
        const storedResearch = localStorage.getItem(`research_${researchId}`);
        let researchData: ResearchData;
        
        const hasAimParam = searchParams?.get('aim') === 'true';
        
        if (storedResearch) {
          researchData = JSON.parse(storedResearch);
          setActiveResearch({ 
            id: researchData.id, 
            name: researchData.name 
          });
          
          if (hasAimParam && researchData.technique !== 'aim-framework') {
            researchData.technique = 'aim-framework';
            localStorage.setItem(`research_${researchId}`, JSON.stringify(researchData));
          }
          
          const newResearchList = [{
            id: researchData.id,
            name: researchData.name,
            technique: researchData.technique || '',
            createdAt: researchData.createdAt || new Date().toISOString()
          }];
          
          localStorage.setItem('research_list', JSON.stringify(newResearchList));
          
          const isAimFramework = researchData.technique === 'aim-framework';
          
          if (isAimFramework) {
            if (!hasAimParam || !section) {
              const redirectUrl = `/dashboard?research=${researchId}&aim=true${!section ? '&section=welcome-screen' : ''}`;
              router.replace(redirectUrl);
            }
          }
          
          setIsAimFramework(isAimFramework);
        } else {
          const newResearchData: ResearchData = {
            id: researchId,
            name: 'Research Project',
            technique: hasAimParam ? 'aim-framework' : '',
            createdAt: new Date().toISOString(),
            status: 'draft'
          };
          
          localStorage.setItem(`research_${researchId}`, JSON.stringify(newResearchData));
          
          const newResearchList = [{
            id: newResearchData.id,
            name: newResearchData.name,
            technique: newResearchData.technique,
            createdAt: newResearchData.createdAt
          }];
          
          localStorage.setItem('research_list', JSON.stringify(newResearchList));
          
          setActiveResearch({ 
            id: researchId, 
            name: 'Research Project' 
          });
          
          setIsAimFramework(hasAimParam);
          
          if (hasAimParam && !searchParams?.get('section')) {
            const redirectUrl = `/dashboard?research=${researchId}&aim=true&section=welcome-screen`;
            router.replace(redirectUrl);
          }
        }
      } catch (error) {
        console.error('Error loading research:', error);
        setActiveResearch({ 
          id: researchId, 
          name: 'Research Project' 
        });
      }
    } else {
      setActiveResearch(undefined);
      setIsAimFramework(false);
      cleanAllResearchFromLocalStorage();
    }
  }, [researchId, searchParams, router]);

  if (activeResearch && (isAimFramework || section)) {
    return <ResearchStageManager researchId={activeResearch.id} />;
  }

  return (
    <div className="flex-1 overflow-y-auto mt-4">
      <div className="container mx-auto px-6 py-8">
        <DashboardStats />
        <DashboardMainContent />
      </div>
    </div>
  );
});

DashboardContent.displayName = 'DashboardContent';

const DashboardContentWithSuspense = withSearchParams(DashboardContent);

const DashboardLayout = memo(() => {
  const searchParams = useSearchParams();
  const researchId = searchParams?.get('research');
  const section = searchParams?.get('section');
  const isAimFramework = searchParams?.get('aim') === 'true';
  
  if (researchId && (isAimFramework || section)) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <ErrorBoundary>
          <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
            <DashboardContentWithSuspense />
          </Suspense>
        </ErrorBoundary>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col mt-12">
        <Navbar />
        <ErrorBoundary>
          <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
            <DashboardContentWithSuspense />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
});

DashboardLayout.displayName = 'DashboardLayout';

const DashboardLayoutWithParams = withSearchParams(DashboardLayout);

export default function DashboardPage() {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
      <DashboardLayoutWithParams />
    </Suspense>
  );
} 