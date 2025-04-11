'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { Navbar } from '@/components/layout/Navbar';
import { ResearchSidebar } from '@/components/layout/ResearchSidebar';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';

import { CognitiveTaskForm } from './CognitiveTask';
// import { EyeTrackingForm } from './EyeTracking/EyeTrackingForm';
import { SmartVOCCognitiveTaskAnalysis } from './SmartVOCCognitiveTaskAnalysis';
import { SmartVOCForm } from './SmartVOC';
import { SmartVOCResults } from './SmartVOCResults';
import { ThankYouScreenForm } from './ThankYouScreen';
import { WelcomeScreenForm } from './WelcomeScreen';
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
        return <DisabledEyeTrackingForm researchId={researchId} />;
      case 'eye-tracking-recruit':
        return <RecruitEyeTrackingForm researchId={researchId} />;
      case 'thank-you':
        return <ThankYouScreenForm researchId={researchId} />;
      case 'smart-voc-results':
        return <SmartVOCResults />;
      case 'cognitive-task-results':
        return <SmartVOCCognitiveTaskAnalysis />;
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
      case 'smart-voc-results':
        return 'Visualiza los resultados obtenidos de las preguntas SmartVOC.';
      case 'cognitive-task-results':
        return 'Analiza los resultados de las tareas cognitivas realizadas.';
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