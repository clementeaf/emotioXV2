'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, memo, Suspense } from 'react';

import { ResearchTable } from '@/components/dashboard/ResearchTable';
import { ResearchTypes } from '@/components/dashboard/ResearchTypes';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { ResearchStageManager } from '@/components/research/ResearchStageManager';
import { cleanAllObsoleteResearch } from '@/lib/cleanup/localStorageCleanup';

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

// Componente de contenido principal del dashboard
const DashboardMainContent = memo(() => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Investigaciones recientes */}
    <div className="lg:col-span-2 bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">Investigaciones Recientes</h2>
        <Link 
          href="/dashboard/research/new" 
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Nueva Investigación
        </Link>
      </div>
      <ResearchTable />
    </div>

    {/* Tipos de investigación */}
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <h2 className="text-lg font-medium mb-6">Tipos de Investigación</h2>
      <ResearchTypes />
    </div>
  </div>
));

DashboardMainContent.displayName = 'DashboardMainContent';

// Componente para el header del dashboard
const DashboardHeader = memo(() => (
  <div className="mb-8">
    <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
    <p className="mt-2 text-sm text-neutral-600">
      Bienvenido a EmotioX, tu plataforma de investigación de emociones
    </p>
  </div>
));

DashboardHeader.displayName = 'DashboardHeader';

/**
 * Componente que usa useSearchParams, debe estar envuelto en Suspense
 */
const DashboardContent = memo(() => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const researchId = searchParams?.get('research');
  const section = searchParams?.get('section') || null;
  const [isAimFramework, setIsAimFramework] = useState(searchParams?.get('aim') === 'true');
  const [activeResearch, setActiveResearch] = useState<ActiveResearch | undefined>(undefined);
  
  // Cargar datos de la investigación desde localStorage si existe un ID en la URL
  useEffect(() => {
    if (researchId) {
      console.log('DEBUG: URL contiene ID de investigación:', researchId);
      try {
        const storedResearch = localStorage.getItem(`research_${researchId}`);
        console.log('DEBUG: Datos de localStorage para investigación:', storedResearch);
        let researchData: ResearchData;
        
        // Verificar si la URL contiene el parámetro aim=true
        const hasAimParam = searchParams?.get('aim') === 'true';
        
        if (storedResearch) {
          researchData = JSON.parse(storedResearch);
          console.log('DEBUG: Datos de investigación parseados:', researchData);
          setActiveResearch({ 
            id: researchData.id, 
            name: researchData.name 
          });
          
          // Si la URL tiene aim=true pero la investigación en localStorage no es de tipo aim-framework,
          // actualizar el localStorage con esta información
          if (hasAimParam && researchData.technique !== 'aim-framework') {
            console.log('DEBUG: Actualizando técnica de investigación a aim-framework');
            researchData.technique = 'aim-framework';
            localStorage.setItem(`research_${researchId}`, JSON.stringify(researchData));
          }
          
          // En lugar de mantener una lista y añadir/reordenar, simplemente crear una lista con un solo elemento
          const newResearchList = [{
            id: researchData.id,
            name: researchData.name,
            technique: researchData.technique || '',
            createdAt: researchData.createdAt || new Date().toISOString()
          }];
          
          // Guardar la lista reemplazando completamente la anterior
          localStorage.setItem('research_list', JSON.stringify(newResearchList));
          console.log('Lista de investigaciones actualizada con solo la investigación actual:', researchData.name);
          
          // Verificar si la técnica es aim-framework
          const isAimFramework = researchData.technique === 'aim-framework';
          console.log('DEBUG: ¿Es investigación AIM Framework?', isAimFramework);
          
          // Verificar si es AIM Framework y si no hay una sección especificada o si no tiene el parámetro aim=true
          const section = searchParams?.get('section');
          console.log('DEBUG: Parámetros URL - section:', section, 'aim=true:', hasAimParam);
          
          if (isAimFramework) {
            if (!hasAimParam || !section) {
              // Añadir el parámetro aim=true y redirigir a welcome-screen si no hay sección
              console.log('DEBUG: Redirigiendo a vista AIM Framework');
              const redirectUrl = `/dashboard?research=${researchId}&aim=true${!section ? '&section=welcome-screen' : ''}`;
              console.log('DEBUG: URL de redirección:', redirectUrl);
              router.replace(redirectUrl);
            }
          }
          
          setIsAimFramework(isAimFramework);
        } else {
          // Si no existe en localStorage, crear un nuevo registro con los datos mínimos
          console.log('DEBUG: No se encontraron datos en localStorage, creando nuevo registro');
          
          // Crear datos básicos para la investigación
          const newResearchData: ResearchData = {
            id: researchId,
            name: 'Research Project',
            // Si la URL contiene aim=true, establecer la técnica como aim-framework
            technique: hasAimParam ? 'aim-framework' : '',
            createdAt: new Date().toISOString(),
            status: 'draft'
          };
          
          // Guardar en localStorage
          localStorage.setItem(`research_${researchId}`, JSON.stringify(newResearchData));
          console.log('DEBUG: Guardado nuevo registro de investigación en localStorage:', newResearchData);
          
          // Actualizar también la lista de investigaciones
          const newResearchList = [{
            id: newResearchData.id,
            name: newResearchData.name,
            technique: newResearchData.technique,
            createdAt: newResearchData.createdAt
          }];
          
          localStorage.setItem('research_list', JSON.stringify(newResearchList));
          console.log('DEBUG: Actualizada lista de investigaciones con la nueva investigación');
          
          setActiveResearch({ 
            id: researchId, 
            name: 'Research Project' 
          });
          
          setIsAimFramework(hasAimParam);
          
          // Si la URL tiene aim=true pero no tiene una sección, redirigir a welcome-screen
          if (hasAimParam && !searchParams?.get('section')) {
            const redirectUrl = `/dashboard?research=${researchId}&aim=true&section=welcome-screen`;
            console.log('DEBUG: Redirigiendo a vista AIM Framework después de crear el registro:', redirectUrl);
            router.replace(redirectUrl);
          }
        }
      } catch (error) {
        console.error('DEBUG: Error cargando investigación:', error);
        setActiveResearch({ 
          id: researchId, 
          name: 'Research Project' 
        });
      }
    } else {
      // Importante: si no hay researchId en la URL, limpiar activeResearch
      // Esto asegura que al navegar a /dashboard sin parámetros, se limpie el contexto
      console.log('DEBUG: No hay investigación activa en la URL, limpiando estado');
      setActiveResearch(undefined);
      setIsAimFramework(false);
    }
    
    // Limpiar investigaciones obsoletas del localStorage
    // al cargar el dashboard
    cleanAllObsoleteResearch().catch(error => {
      console.error('Error al limpiar investigaciones obsoletas:', error);
    });
    
    // También podemos configurar una limpieza periódica (cada 30 minutos)
    const cleanupInterval = setInterval(() => {
      cleanAllObsoleteResearch().catch(error => {
        console.error('Error en limpieza periódica de investigaciones:', error);
      });
    }, 30 * 60 * 1000); // 30 minutos
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, [researchId, searchParams, router]);

  // Si estamos en AIM Framework
  if (activeResearch && isAimFramework) {
    console.log('DEBUG: Renderizando vista AIM Framework. activeResearch:', activeResearch, 'isAimFramework:', isAimFramework, 'section:', section);
    return <ResearchStageManager researchId={activeResearch.id} />;
  }

  // Si no estamos en AIM Framework o no hay research activa
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto px-6 py-8">
        <DashboardHeader />
        <DashboardStats />
        <DashboardMainContent />
      </div>
    </div>
  );
});

DashboardContent.displayName = 'DashboardContent';

// Usar el HOC para envolver el componente
const DashboardContentWithSuspense = withSearchParams(DashboardContent);

/**
 * Componente interno que usa useSearchParams para la lógica del layout
 */
const DashboardLayout = memo(() => {
  const searchParams = useSearchParams();
  const researchId = searchParams?.get('research');
  const isAimFramework = searchParams?.get('aim') === 'true';
  
  // Si estamos en modo AIM Framework, retornar solo el contenido del dashboard sin el sidebar general
  if (researchId && isAimFramework) {
    return (
      <div className="flex min-h-screen bg-neutral-50">
        <div className="flex-1">
          <ErrorBoundary>
            <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
              <DashboardContentWithSuspense />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    );
  }
  
  // Modo normal con sidebar
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1">
          <ErrorBoundary>
            <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
              <DashboardContentWithSuspense />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
});

DashboardLayout.displayName = 'DashboardLayout';

// Usar el HOC para envolver el componente que usa useSearchParams
const DashboardLayoutWithParams = withSearchParams(DashboardLayout);

/**
 * Componente principal del Dashboard
 */
export default function DashboardPage() {
  const { token } = useProtectedRoute();
  
  if (!token) {
    return null;
  }
  
  return (
    <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
      <DashboardLayoutWithParams />
    </Suspense>
  );
} 