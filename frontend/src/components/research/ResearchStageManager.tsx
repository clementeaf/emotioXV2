'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { WelcomeScreenForm } from './WelcomeScreenForm';
import { SmartVOCForm } from './SmartVOCForm';
import { CognitiveTaskForm } from './CognitiveTaskForm';
import { ThankYouScreenForm } from './ThankYouScreenForm';
import { EyeTrackingForm } from './EyeTrackingForm';
import { RecruitConfiguration } from './RecruitConfiguration';
import { ParticipantsForm } from './ParticipantsForm';
import { DemographicsForm } from './DemographicsForm';
import { LinkSettingsForm } from './LinkSettingsForm';
import { QuotasForm } from './QuotasForm';
import { ProgressMonitorForm } from './ProgressMonitorForm';
import { SmartVOCResults } from './SmartVOCResults';
import { SmartVOCTextAnalysis } from './SmartVOCTextAnalysis';
import { SmartVOCTrendAnalysis } from './SmartVOCTrendAnalysis';
import { SmartVOCEmotionalAnalysis } from './SmartVOCEmotionalAnalysis';
import { SmartVOCNPSAnalysis } from './SmartVOCNPSAnalysis';
import { SmartVOCSentimentAnalysis } from './SmartVOCSentimentAnalysis';
import { SmartVOCDashboard } from './SmartVOCDashboard';
import { SmartVOCCognitiveTaskAnalysis } from './SmartVOCCognitiveTaskAnalysis';

interface ResearchStageManagerProps {
  researchId: string;
}

export function ResearchStageManager({ researchId }: ResearchStageManagerProps) {
  const searchParams = useSearchParams();
  const currentSection = searchParams.get('section') || 'build';
  const currentStage = searchParams.get('stage') || 'welcome';
  const [researchName, setResearchName] = useState('Research Project');

  const renderStageContent = () => {
    switch (currentSection) {
      case 'build':
        switch (currentStage) {
          case 'welcome':
            return <WelcomeScreenForm researchId={researchId} />;
          case 'smart-voc':
            return <SmartVOCForm />;
          case 'cognitive':
            return <CognitiveTaskForm />;
          case 'eye-tracking':
            return <EyeTrackingForm researchId={researchId} />;
          case 'thank-you':
            return <ThankYouScreenForm researchId={researchId} />;
          default:
            return <WelcomeScreenForm researchId={researchId} />;
        }
      case 'recruit':
        switch (currentStage) {
          case 'screener':
            return <div className="p-6 bg-white rounded-lg border border-neutral-200">
              <h2 className="text-lg font-medium mb-4">Configuración del Screener</h2>
              <p className="text-neutral-600 mb-4">Configura las preguntas de filtrado para seleccionar a los participantes adecuados para tu estudio.</p>
              {/* Contenido del screener */}
            </div>;
          case 'welcome-screen':
            return <WelcomeScreenForm researchId={researchId} />;
          case 'implicit-association':
            return <div className="p-6 bg-white rounded-lg border border-neutral-200">
              <h2 className="text-lg font-medium mb-4">Prueba de Asociación Implícita</h2>
              <p className="text-neutral-600 mb-4">Configura pruebas para medir asociaciones implícitas entre conceptos y evaluaciones.</p>
              {/* Contenido de la prueba de asociación implícita */}
            </div>;
          case 'cognitive-task':
            return <CognitiveTaskForm />;
          case 'eye-tracking':
            return <EyeTrackingForm researchId={researchId} />;
          case 'thank-you':
            return <ThankYouScreenForm researchId={researchId} />;
          default:
            return <div className="p-6 bg-white rounded-lg border border-neutral-200">
              <h2 className="text-lg font-medium mb-4">Etapas de Investigación</h2>
              <p className="text-neutral-600">Selecciona una etapa para configurar tu investigación.</p>
            </div>;
        }
      case 'results':
        switch (currentStage) {
          case 'smartvoc':
            return (
              <div className="space-y-8">
                <SmartVOCResults />
              </div>
            );
          case 'cognitive-task':
            return <SmartVOCCognitiveTaskAnalysis />;
          default:
            return (
              <div className="p-8">
                <h2 className="text-xl font-semibold mb-4">Resultados</h2>
                <p className="mt-2 text-sm text-neutral-600">
                  Los resultados estarán disponibles una vez que se complete la investigación.
                </p>
              </div>
            );
        }
      default:
        return null;
    }
  };

  const getStageTitle = () => {
    switch (currentSection) {
      case 'build':
        switch (currentStage) {
          case 'welcome':
            return 'Configuración de pantalla de bienvenida';
          case 'smart-voc':
            return 'Configuración de Smart VOC';
          case 'cognitive':
            return 'Configuración de tareas cognitivas';
          case 'eye-tracking':
            return 'Configuración de seguimiento ocular';
          case 'thank-you':
            return 'Configuración de pantalla de agradecimiento';
          default:
            return 'Configuración de investigación';
        }
      case 'recruit':
        switch (currentStage) {
          case 'screener':
            return 'Configuración del Screener';
          case 'welcome-screen':
            return 'Pantalla de Bienvenida';
          case 'implicit-association':
            return 'Prueba de Asociación Implícita';
          case 'cognitive-task':
            return 'Tareas Cognitivas';
          case 'eye-tracking':
            return 'Seguimiento Ocular';
          case 'thank-you':
            return 'Pantalla de Agradecimiento';
          default:
            return 'Etapas de Investigación';
        }
      case 'results':
        switch (currentStage) {
          case 'smartvoc':
            return 'Resultados Smart VOC';
          case 'cognitive-task':
            return 'Tareas Cognitivas';
          default:
            return 'Resultados de la investigación';
        }
      default:
        return 'Configuración de investigación';
    }
  };

  const getStageDescription = () => {
    switch (currentSection) {
      case 'build':
        switch (currentStage) {
          case 'welcome':
            return 'Configura el mensaje de bienvenida que verán los participantes.';
          case 'smart-voc':
            return 'Configura tus preguntas de Voice of Customer.';
          case 'cognitive':
            return 'Diseña tareas de evaluación cognitiva para tu investigación.';
          case 'eye-tracking':
            return 'Configura los ajustes de seguimiento ocular para tu estudio.';
          case 'thank-you':
            return 'Configura el mensaje de finalización para los participantes.';
          default:
            return 'Configura los ajustes de tu investigación.';
        }
      case 'recruit':
        switch (currentStage) {
          case 'screener':
            return 'Configura preguntas de filtrado para seleccionar a los participantes adecuados.';
          case 'welcome-screen':
            return 'Diseña la pantalla de bienvenida que verán los participantes al iniciar el estudio.';
          case 'implicit-association':
            return 'Configura pruebas para medir asociaciones inconscientes entre conceptos.';
          case 'cognitive-task':
            return 'Diseña tareas cognitivas para evaluar procesos mentales específicos.';
          case 'eye-tracking':
            return 'Configura estudios de seguimiento ocular para analizar patrones de atención visual.';
          case 'thank-you':
            return 'Personaliza la pantalla de agradecimiento que se mostrará al finalizar el estudio.';
          default:
            return 'Selecciona y configura las diferentes etapas de tu investigación.';
        }
      case 'results':
        switch (currentStage) {
          case 'smartvoc':
            return 'Visualiza y analiza los resultados de las preguntas de Voice of Customer.';
          case 'cognitive-task':
            return 'Explora los resultados de tareas cognitivas y pruebas de usabilidad avanzadas.';
          default:
            return 'Visualiza y analiza los resultados de tu investigación.';
        }
      default:
        return 'Configura los ajustes de tu investigación.';
    }
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar activeResearch={{ id: researchId, name: researchName }} />
      <div className="flex-1 flex flex-col">
        <Navbar mode="research" researchId={researchId} />
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-5xl mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-neutral-900">
                {getStageTitle()}
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                {getStageDescription()}
              </p>
            </div>
            {renderStageContent()}
          </div>
        </main>
      </div>
    </div>
  );
} 