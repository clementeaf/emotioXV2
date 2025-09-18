'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { ConfigCard } from '@/components/common/ConfigCard';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

import { CognitiveTaskForm } from './CognitiveTask';
// import { EyeTrackingForm } from './EyeTracking/EyeTrackingForm';

import ResearchInProgressPage from '@/app/dashboard/research-in-progress/page';
import { CognitiveTaskResults } from './CognitiveTaskResults';
import { ImplicitAssociationForm } from './ImplicitAssociation';
import { ImplicitAssociationResults } from './ImplicitAssociationResults';
import { RecruitEyeTrackingForm } from './EyeTracking/Recruit/RecruitEyeTrackingForm';
import { SimpleEyeTrackingForm } from './EyeTracking/SimpleEyeTrackingForm';
import { ResumeForm } from './Resume';
import { SmartVOCForm } from './SmartVOC';
import { SmartVOCResults } from './SmartVOCResults/index';
import { ThankYouScreenForm } from './ThankYouScreen';
import { WelcomeScreenForm } from './WelcomeScreen';
import { ScreenerForm } from './forms/ScreenerForm';
import { STAGE_TITLES, STAGE_COMPONENTS, DEFAULT_SECTION } from '@/config/research-stages.config';

const ConfigurationPlaceholder = ({ researchId }: { researchId: string }) => (
  <div className="p-6 bg-gray-50 rounded-lg">
    <h2 className="text-xl font-semibold mb-4">Configuration</h2>
    <p className="text-gray-600">Configuration for research {researchId} coming soon...</p>
  </div>
);

const ParticipantsPlaceholder = ({ researchId }: { researchId: string }) => (
  <div className="p-6 bg-gray-50 rounded-lg">
    <h2 className="text-xl font-semibold mb-4">Participants Management</h2>
    <p className="text-gray-600">Participants management for research {researchId} coming soon...</p>
  </div>
);

const DefaultPlaceholder = ({ researchId }: { researchId: string }) => (
  <div className="p-6 bg-gray-50 rounded-lg">
    <h2 className="text-xl font-semibold mb-4">Research Configuration</h2>
    <p className="text-gray-600">Configuration for research {researchId} coming soon...</p>
  </div>
);


interface ResearchStageManagerProps {
  researchId: string;
}

// Componente interno que usa useSearchParams
function ResearchStageManagerContent({ researchId }: ResearchStageManagerProps) {
  const searchParams = useSearchParams();
  const currentSection = searchParams?.get('section') || DEFAULT_SECTION;

  // Component mapping for dynamic rendering
  const componentMap = {
    ScreenerForm,
    WelcomeScreenForm,
    ImplicitAssociationForm,
    SmartVOCForm,
    CognitiveTaskForm,
    SimpleEyeTrackingForm,
    RecruitEyeTrackingForm,
    ThankYouScreenForm,
    ResumeForm,
    ImplicitAssociationResults,
    SmartVOCResults,
    CognitiveTaskResults,
    ResearchInProgressPage,
    ConfigurationPlaceholder,
    ParticipantsPlaceholder,
    DefaultPlaceholder
  };

  const renderStageContent = () => {
    const stageConfig = STAGE_COMPONENTS[currentSection] || STAGE_COMPONENTS.default;
    const ComponentToRender = componentMap[stageConfig.component as keyof typeof componentMap];

    if (!ComponentToRender) {
      console.warn(`Component ${stageConfig.component} not found for section ${currentSection}`);
      const DefaultComponent = componentMap.DefaultPlaceholder;
      return <DefaultComponent researchId={researchId} />;
    }

    const componentProps = {
      researchId,
      ...stageConfig.props
    };

    const component = <ComponentToRender {...componentProps} />;

    // Apply container styles if specified
    if (stageConfig.containerStyles) {
      return <div style={stageConfig.containerStyles}>{component}</div>;
    }

    return component;
  };

  const getStageTitle = () => {
    return STAGE_TITLES[currentSection] || STAGE_TITLES.default;
  };

  return (
    <div className="liquid-glass flex-1 mt-8 ml-4 p-10 rounded-2xl mb-4 flex flex-col justify-start">
      <h1 className="text-2xl font-semibold text-neutral-900">{getStageTitle()}</h1>
      <ConfigCard>
        {renderStageContent()}
      </ConfigCard>
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
    <div className="flex h-screen bg-neutral-50">
      {/* Barra lateral simulada */}
      <div className="w-60">
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
      <div className="flex-1 flex flex-col mt-12 pr-7 pb-4">
        <div className="flex-1 overflow-y-auto mt-4 ml-4 bg-white p-4 rounded-lg border border-neutral-150">
          <div className="mx-auto px-6 py-8">
            <LoadingSkeleton variant="full" />
          </div>
        </div>
      </div>
    </div>
  );
}

