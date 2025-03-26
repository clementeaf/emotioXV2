'use client';

import { SimplifiedSmartVOCForm } from '@/components/research/SimplifiedSmartVOCForm';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

import { ResearchTable } from '@/components/dashboard/ResearchTable';
import { ResearchTypes } from '@/components/dashboard/ResearchTypes';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { CognitiveTaskForm } from '@/components/research/CognitiveTaskForm';
import { CreateResearchForm } from '@/components/research/CreateResearchForm';
import { EyeTrackingForm } from '@/components/research/EyeTrackingForm';
import { ThankYouScreenForm } from '@/components/research/ThankYouScreenForm';
import { WelcomeScreenForm } from '@/components/research/WelcomeScreenForm';
import { useAuth } from '@/providers/AuthProvider';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthData {
  user: User;
}

/**
 * Componente que usa useSearchParams, debe estar envuelto en Suspense
 */
function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const researchId = searchParams?.get('research');
  const section = searchParams?.get('section') || null;
  const stage = searchParams?.get('stage') || null;
  const [isAimFramework, setIsAimFramework] = useState(searchParams?.get('aim') === 'true');
  const [activeResearch, setActiveResearch] = useState<{ id: string; name: string } | undefined>(undefined);
  
  // Cargar datos de la investigación desde localStorage si existe un ID en la URL
  useEffect(() => {
    if (researchId) {
      console.log('DEBUG: URL contiene ID de investigación:', researchId);
      try {
        const storedResearch = localStorage.getItem(`research_${researchId}`);
        console.log('DEBUG: Datos de localStorage para investigación:', storedResearch);
        let researchData;
        
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
          const newResearchData = {
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
  }, [researchId, searchParams, router]);

  // Si estamos en AIM Framework
  if (activeResearch && isAimFramework) {
    console.log('DEBUG: Renderizando vista AIM Framework. activeResearch:', activeResearch, 'isAimFramework:', isAimFramework, 'section:', section);
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
              {activeResearch && (
                console.log('DEBUG: Renderizando WelcomeScreenForm con researchId:', activeResearch.id),
                <WelcomeScreenForm researchId={activeResearch.id} />
              )}
              {!activeResearch && (
                <div className="p-3 bg-white border border-neutral-200 rounded-md">
                  <p className="text-neutral-700">
                    Please select a research project to configure the welcome screen.
                  </p>
                </div>
              )}
            </div>
          ) : section === 'smart-voc' ? (
            (() => {
              console.log('DEBUG: Renderizando SimplifiedSmartVOCForm');
              return (
                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                  <SimplifiedSmartVOCForm 
                    onSave={(data) => {
                      console.log('Smart VOC data saved:', data);
                      // Aquí iría la lógica para guardar los datos
                      alert('Smart VOC configuration saved successfully!');
                    }}
                  />
                </div>
              );
            })()
          ) : section === 'cognitive-task' ? (
            (() => {
              console.log('DEBUG: Renderizando CognitiveTaskForm con researchId:', activeResearch?.id);
              return (
                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                  <h2 className="text-xl font-medium mb-3">Cognitive Tasks</h2>
                  <p className="text-neutral-600 mb-3">
                    Configure cognitive tasks for your research participants.
                  </p>
                  {activeResearch && <CognitiveTaskForm 
                    onSave={(data) => {
                      console.log('Cognitive tasks data saved:', data);
                      // Aquí iría la lógica para guardar los datos
                      alert('Cognitive tasks saved successfully!');
                    }}
                  />}
                  {!activeResearch && (
                    <div className="p-3 bg-white border border-neutral-200 rounded-md">
                      <p className="text-neutral-700">
                        Please select a research project to configure cognitive tasks.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()
          ) : section === 'eye-tracking' ? (
            (() => {
              console.log('DEBUG: Renderizando EyeTrackingForm con researchId:', activeResearch?.id);
              return (
                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                  <h2 className="text-xl font-medium mb-3">Eye Tracking</h2>
                  <p className="text-neutral-600 mb-3">
                    Configure the eye tracking experiment for your research.
                  </p>
                  {activeResearch && <EyeTrackingForm 
                    researchId={activeResearch.id}
                  />}
                  {!activeResearch && (
                    <div className="p-3 bg-white border border-neutral-200 rounded-md">
                      <p className="text-neutral-700">
                        Please select a research project to configure eye tracking.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()
          ) : section === 'thank-you' ? (
            (() => {
              console.log('DEBUG: Renderizando ThankYouScreenForm');
              return (
                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                  <h2 className="text-xl font-medium mb-3">Thank You Screen</h2>
                  <p className="text-neutral-600 mb-3">
                    Configure the final screen that participants will see after completing the research.
                  </p>
                  {activeResearch ? (
                    <ThankYouScreenForm researchId={activeResearch.id} />
                  ) : (
                    <div className="p-3 bg-white border border-neutral-200 rounded-md">
                      <p className="text-neutral-700">
                        Please select a research project to configure the thank you screen.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-700">
                Please select a section to configure from the sidebar.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Si no estamos en AIM Framework o no hay research activa
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto px-6 py-8">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Bienvenido a EmotioX, tu plataforma de investigación de emociones
          </p>
        </div>

        {/* Estadísticas rápidas */}
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

        {/* Sección principal */}
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
      </div>
    </div>
  );
}

// Usar el HOC para envolver el componente
const DashboardContentWithSuspense = withSearchParams(DashboardContent);

/**
 * Componente principal del Dashboard
 */
export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, token, user } = useAuth();
  
  // Redirigir a login si el usuario no está autenticado
  useEffect(() => {
    if (!isAuthenticated && !token) {
      router.push('/login');
    }
  }, [isAuthenticated, token, router]);
  
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="flex-1">
          <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
            <DashboardContentWithSuspense />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 