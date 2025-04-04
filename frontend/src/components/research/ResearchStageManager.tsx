'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

import { Navbar } from '@/components/layout/Navbar';
import { ResearchSidebar } from '@/components/layout/ResearchSidebar';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';

import { CognitiveTaskForm } from './CognitiveTaskForm';
import { EyeTrackingForm } from './EyeTracking/EyeTrackingForm';
import { SmartVOCCognitiveTaskAnalysis } from './SmartVOCCognitiveTaskAnalysis';
import { SmartVOCForm } from './SmartVOCForm';
import { SmartVOCResults } from './SmartVOCResults';
import { ThankYouScreenForm } from './ThankYouScreenForm';
import { WelcomeScreenForm } from './WelcomeScreenForm';
import { RecruitEyeTrackingForm } from './EyeTracking/Recruit/RecruitEyeTrackingForm';

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
        return <EyeTrackingForm researchId={researchId} />;
      case 'eye-tracking-recruit':
        return <RecruitEyeTrackingForm researchId={researchId} />;
      case 'thank-you':
        return <ThankYouScreenForm researchId={researchId} />;
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
      case 'overview':
        return <div className="p-6 bg-white rounded-lg border border-neutral-200">
          <h2 className="text-lg font-medium mb-4">Resumen de Resultados</h2>
          <p className="text-neutral-600 mb-4">Vista general de los resultados de tu investigación.</p>
          {/* Contenido de resumen */}
        </div>;
      case 'analytics':
        return <div className="p-6 bg-white rounded-lg border border-neutral-200">
          <h2 className="text-lg font-medium mb-4">Análisis de Datos</h2>
          <p className="text-neutral-600 mb-4">Analiza en profundidad los datos recopilados.</p>
          {/* Contenido de análisis */}
        </div>;
      case 'export':
        return <div className="p-6 bg-white rounded-lg border border-neutral-200">
          <h2 className="text-lg font-medium mb-4">Exportar Resultados</h2>
          <p className="text-neutral-600 mb-4">Exporta los resultados de tu investigación en diferentes formatos.</p>
          {/* Contenido de exportación */}
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
      case 'overview':
        return 'Resumen de Resultados';
      case 'analytics':
        return 'Análisis de Datos';
      case 'export':
        return 'Exportar Resultados';
      default:
        return 'Configuración de investigación';
    }
  };

  const getStageDescription = () => {
    switch (currentSection) {
      case 'welcome-screen':
        return 'Configura el mensaje de bienvenida que verán los participantes.';
      case 'smart-voc':
        return 'Configura tus preguntas de Voice of Customer.';
      case 'cognitive':
        return 'Diseña tareas de evaluación cognitiva para tu investigación.';
      case 'eye-tracking':
        return 'Personaliza el módulo de seguimiento ocular según tus necesidades.';
      case 'eye-tracking-recruit':
        return 'Configura el proceso de reclutamiento para el seguimiento ocular.';
      case 'thank-you':
        return 'Configura el mensaje de finalización para los participantes.';
      case 'configuration':
        return 'Configura los parámetros para el reclutamiento de participantes.';
      case 'participants':
        return 'Visualiza y gestiona a los participantes de tu estudio.';
      case 'overview':
        return 'Vista general de los resultados de tu investigación.';
      case 'analytics':
        return 'Analiza en profundidad los datos recopilados.';
      case 'export':
        return 'Exporta los resultados de tu investigación en diferentes formatos.';
      default:
        return 'Configura los ajustes de tu investigación.';
    }
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      <ResearchSidebar researchId={researchId} activeStage={currentSection} className="fixed left-0 top-0 h-full z-10" />
      <div className="flex-1 flex flex-col ml-64">
        <Navbar mode="research" researchId={researchId} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-neutral-900 mb-2">{getStageTitle()}</h1>
              <p className="text-neutral-600">{getStageDescription()}</p>
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
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 border-r-2 border-neutral-300 mx-auto mb-4"></div>
          <p className="text-neutral-600">Cargando investigación...</p>
        </div>
      </div>
    }>
      <ResearchStageManagerContentWithParams {...props} />
    </Suspense>
  );
} 