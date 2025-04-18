'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { ResearchSidebar } from '@/components/layout/ResearchSidebar';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';

import { CognitiveTaskForm } from './CognitiveTask';
// import { EyeTrackingForm } from './EyeTracking/EyeTrackingForm';
import { CognitiveTaskResults } from './CognitiveTaskResults';
import { SmartVOCForm } from './SmartVOC';
import { SmartVOCResults } from './SmartVOCResults/index';
import { ThankYouScreenForm } from './ThankYouScreen';
import { WelcomeScreenForm } from './WelcomeScreen';
import { RecruitEyeTrackingForm } from './EyeTracking/Recruit/RecruitEyeTrackingForm';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

interface ResearchStageManagerProps {
  researchId: string;
}

// Componente interno que usa useSearchParams
function ResearchStageManagerContent({ researchId }: ResearchStageManagerProps) {
  const searchParams = useSearchParams();
  const currentSection = searchParams?.get('section') || 'welcome-screen';
  const [researchName, setResearchName] = useState('Research Project');

  const renderStageContent = () => {
    switch (currentSection) {
      case 'welcome-screen':
        return <WelcomeScreenForm researchId={researchId} />;
      case 'smart-voc':
        return <SmartVOCForm researchId={researchId} />;
      case 'cognitive':
        return <CognitiveTaskForm researchId={researchId} />;
      case 'eye-tracking':
        return <DisabledEyeTrackingForm researchId={researchId} />;
      case 'eye-tracking-recruit':
        return <RecruitEyeTrackingForm researchId={researchId} />;
      case 'thank-you':
        return <ThankYouScreenForm researchId={researchId} />;
      case 'smart-voc-results':
        return <SmartVOCResults />;
      case 'cognitive-task-results':
        return <CognitiveTaskResults />;
      case 'configuration':
        return <div className="p-6 bg-white rounded-lg border border-neutral-200">
          <h2 className="text-lg font-medium mb-4">Configuración del Reclutamiento</h2>
          <p className="text-neutral-600 mb-4">Configura los parámetros para el reclutamiento de participantes.</p>
          {/* Contenido de configuración */}
        </div>;
      case 'participants':
        return <div className="p-6 bg-white rounded-lg border border-neutral-200">
          <h2 className="text-lg font-medium mb-4">Gestión de Participantes</h2>
          <p className="text-neutral-600 mb-4">Visualiza y gestiona a los participantes de tu estudio.</p>
          {/* Contenido de participantes */}
        </div>;
      default:
        return <div className="p-6 bg-white rounded-lg border border-neutral-200">
          <h2 className="text-lg font-medium mb-4">Configuración de Investigación</h2>
          <p className="text-neutral-600">Selecciona una sección para configurar tu investigación.</p>
        </div>;
    }
  };

  const getStageTitle = () => {
    switch (currentSection) {
      case 'welcome-screen':
        return 'Configuración de pantalla de bienvenida';
      case 'smart-voc':
        return 'Configuración de Smart VOC';
      case 'cognitive':
        return 'Configuración de tareas cognitivas';
      case 'eye-tracking':
        return 'Configuración de seguimiento ocular';
      case 'eye-tracking-recruit':
        return 'Configuración de reclutamiento ocular';
      case 'thank-you':
        return 'Configuración de pantalla de agradecimiento';
      case 'configuration':
        return 'Configuración del Reclutamiento';
      case 'participants':
        return 'Gestión de Participantes';
      case 'smart-voc-results':
        return 'Resultados de SmartVOC';
      case 'cognitive-task-results':
        return 'Resultados de Tareas Cognitivas';
      default:
        return 'Configuración de investigación';
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-72">
        <ResearchSidebar researchId={researchId} activeStage={currentSection} />
      </div>
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-neutral-900 mb-2">{getStageTitle()}</h1>
            </div>
            {renderStageContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

// Usar el HOC para envolver el componente
const ResearchStageManagerContentWithParams = withSearchParams(ResearchStageManagerContent);

// Componente público que exportamos
export function ResearchStageManager(props: ResearchStageManagerProps) {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResearchStageManagerContentWithParams {...props} />
    </Suspense>
  );
}

// Componente de carga reutilizable
export function LoadingState() {
  return (
    <div className="flex h-screen">
      {/* Barra lateral simulada */}
      <div className="w-72">
        <div className="bg-white rounded-lg shadow-sm mx-4 mt-4 p-6">
          <div className="h-8 bg-neutral-200 rounded w-3/4 mb-8"></div>
          
          <div className="space-y-6">
            <div>
              <div className="h-4 bg-neutral-200 rounded w-1/3 mb-3"></div>
              <div className="space-y-2">
                <div className="h-8 bg-neutral-200 rounded-md"></div>
                <div className="h-8 bg-neutral-200 rounded-md"></div>
                <div className="h-8 bg-neutral-200 rounded-md"></div>
              </div>
            </div>
            
            <div>
              <div className="h-4 bg-neutral-200 rounded w-1/3 mb-3"></div>
              <div className="space-y-2">
                <div className="h-8 bg-neutral-200 rounded-md"></div>
                <div className="h-8 bg-neutral-200 rounded-md"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1">
        <main className="p-6">
          <LoadingSkeleton variant="full" />
        </main>
      </div>
    </div>
  );
}

// En su lugar, agregar un componente provisional
const DisabledEyeTrackingForm = ({ researchId }: { researchId: string }) => (
  <div className="p-6 bg-white rounded-lg border border-neutral-200">
    <div className="text-center py-8">
      <h3 className="text-lg font-medium text-red-600 mb-3">Componente temporalmente deshabilitado</h3>
      <p className="text-neutral-600 mb-4">
        El componente EyeTrackingForm ha sido retirado temporalmente del proceso de compilación.
      </p>
      <div className="inline-block bg-yellow-100 border border-yellow-200 rounded-lg p-4 text-left">
        <p className="text-sm text-yellow-800">
          <strong>Nota técnica:</strong> Este componente ha sido desactivado debido a problemas con las actualizaciones de estado durante el renderizado.
        </p>
      </div>
    </div>
  </div>
); 