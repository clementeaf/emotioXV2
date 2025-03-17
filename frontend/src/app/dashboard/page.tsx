'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ResearchTable } from '@/components/dashboard/ResearchTable';
import { ResearchTypes } from '@/components/dashboard/ResearchTypes';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CreateResearchForm } from '@/components/research/CreateResearchForm';
import { SmartVOCForm } from '@/components/research/SmartVOCForm';
import { SimplifiedSmartVOCForm } from '@/components/research/SimplifiedSmartVOCForm';
import Link from 'next/link';
import { DevModeInfo } from '@/components/common/DevModeInfo';
import { WelcomeScreenForm } from '@/components/research/WelcomeScreenForm';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthData {
  user: User;
}

function DashboardContent({ activeResearch }: { activeResearch?: { id: string; name: string } }) {
  const searchParams = useSearchParams();
  const section = searchParams.get('section');
  const stage = searchParams.get('stage');
  const [isAimFramework, setIsAimFramework] = useState(searchParams.get('aim') === 'true');
  
  // Verificar si la investigación es de tipo AIM Framework basado en localStorage
  useEffect(() => {
    // Resetear la bandera isAimFramework si no hay activeResearch
    if (!activeResearch) {
      setIsAimFramework(false);
      return;
    }
    
    // Si hay activeResearch, verificar su técnica
    try {
      const storedResearch = localStorage.getItem(`research_${activeResearch.id}`);
      if (storedResearch) {
        const research = JSON.parse(storedResearch);
        if (research.technique === 'aim-framework') {
          setIsAimFramework(true);
        } else {
          setIsAimFramework(false);
        }
      } else {
        setIsAimFramework(false);
      }
    } catch (error) {
      console.error('Error verificando tipo de investigación:', error);
      setIsAimFramework(false);
    }
  }, [activeResearch]);

  // Si estamos en AIM Framework
  if (activeResearch && isAimFramework) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">
                AIM Framework
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                Configure your AIM Framework research
              </p>
            </div>
            
            <Link 
              href="/dashboard" 
              className="flex items-center px-4 py-2 text-sm bg-white border border-neutral-200 rounded-md shadow-sm hover:bg-neutral-50 text-neutral-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Volver al dashboard
            </Link>
          </div>

          {/* Renderizar el formulario según la sección */}
          {!section || section === 'welcome-screen' ? (
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <h2 className="text-xl font-medium mb-3">Welcome Screen</h2>
              <p className="text-neutral-600 mb-3">
                Configure the welcome screen for your research participants.
              </p>
              {/* Usar nuestro componente WelcomeScreenForm */}
              {activeResearch && <WelcomeScreenForm researchId={activeResearch.id} />}
              {!activeResearch && (
                <div className="p-3 bg-white border border-neutral-200 rounded-md">
                  <p className="text-neutral-700">
                    Please select a research project to configure the welcome screen.
                  </p>
                </div>
              )}
            </div>
          ) : section === 'smart-voc' ? (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <SimplifiedSmartVOCForm 
                onSave={(data) => {
                  console.log('Smart VOC data saved:', data);
                  // Aquí iría la lógica para guardar los datos
                  alert('Smart VOC configuration saved successfully!');
                }}
              />
            </div>
          ) : section === 'cognitive-task' ? (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-xl font-medium mb-4">Cognitive Tasks</h2>
              <p className="text-neutral-600 mb-4">
                Configure cognitive tasks for your research participants.
              </p>
              {/* Aquí iría el formulario de tareas cognitivas */}
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Save Cognitive Tasks
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-xl font-medium mb-4">{section?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h2>
              <p className="text-neutral-600">
                Configure settings for this section.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Si hay una investigación activa y estamos en una etapa específica
  if (activeResearch && section && stage) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-neutral-900">
              {section.charAt(0).toUpperCase() + section.slice(1)} - {stage.charAt(0).toUpperCase() + stage.slice(1)}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Configure your research settings for this stage.
            </p>
          </div>

          {/* Aquí irá el contenido específico de cada etapa */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <p className="text-neutral-600">Content for {section} - {stage}</p>
          </div>
        </div>
      </div>
    );
  }

  // Si estamos en la página de crear nueva investigación
  if (searchParams.get('new')) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-neutral-900">Create New Research</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Fill in the details to create a new research project.
            </p>
          </div>

          <div className="max-w-3xl">
            <CreateResearchForm />
          </div>
        </div>
      </div>
    );
  }

  // Vista por defecto del dashboard
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Welcome back! Here's an overview of your research projects.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Research"
            value="52"
            icon={
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatsCard
            title="Active Projects"
            value="8"
            icon={
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Completed"
            value="44"
            icon={
              <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-3">
            <ResearchTable />
          </div>
          <div>
            <ResearchTypes />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, token, user } = useAuth();
  const searchParams = useSearchParams();
  const researchId = searchParams.get('research');
  const [activeResearch, setActiveResearch] = useState<{ id: string; name: string } | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos de la investigación desde localStorage si existe un ID en la URL
  useEffect(() => {
    if (researchId) {
      try {
        const storedResearch = localStorage.getItem(`research_${researchId}`);
        let researchData;
        
        if (storedResearch) {
          researchData = JSON.parse(storedResearch);
          setActiveResearch({ 
            id: researchData.id, 
            name: researchData.name 
          });
          
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
          
          // Verificar si es AIM Framework y si no hay una sección especificada o si no tiene el parámetro aim=true
          const section = searchParams.get('section');
          const hasAimParam = searchParams.get('aim') === 'true';
          
          if (isAimFramework) {
            if (!hasAimParam || !section) {
              // Añadir el parámetro aim=true y redirigir a welcome-screen si no hay sección
              console.log('Redirigiendo a vista AIM Framework');
              const redirectUrl = `/dashboard?research=${researchId}&aim=true${!section ? '&section=welcome-screen' : ''}`;
              router.replace(redirectUrl);
            }
          }
        } else {
          // Si no existe en localStorage, usar un nombre genérico
          setActiveResearch({ 
            id: researchId, 
            name: 'Research Project' 
          });
        }
      } catch (error) {
        console.error('Error cargando investigación:', error);
        setActiveResearch({ 
          id: researchId, 
          name: 'Research Project' 
        });
      }
    } else {
      // Importante: si no hay researchId en la URL, limpiar activeResearch
      // Esto asegura que al navegar a /dashboard sin parámetros, se limpie el contexto
      console.log('No hay investigación activa en la URL, limpiando estado');
      setActiveResearch(undefined);
    }
  }, [researchId, searchParams, router]);

  // Asegurarnos de limpiar activeResearch cuando se navega a la ruta base sin parámetros
  useEffect(() => {
    // Si estamos en la ruta exacta /dashboard sin parámetros, forzar la limpieza de activeResearch
    // Importante: Separamos este efecto para garantizar que se ejecute cada vez que cambie la URL base
    const hasNoParams = !searchParams.toString();
    const isExactDashboardRoute = pathname === '/dashboard' && hasNoParams;
    
    if (isExactDashboardRoute) {
      console.log('Ruta exacta /dashboard detectada, asegurando limpieza de investigación activa');
      // Limpiar explícitamente el estado actual
      setActiveResearch(undefined);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!token) {
    return null;
  }

  const handleResearchCreated = (id: string, name: string) => {
    setActiveResearch({ id, name });
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar activeResearch={activeResearch} />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1">
          <div className="container mx-auto px-6 py-6">
            <DashboardContent activeResearch={activeResearch} />
          </div>
        </div>
      </div>
    </div>
  );
} 