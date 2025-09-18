'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { ConfigCard } from '@/components/common/ConfigCard';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';

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
import { ConfigurationPlaceholder } from './placeholders/ConfigurationPlaceholder';
import { ParticipantsPlaceholder } from './placeholders/ParticipantsPlaceholder';
import { DefaultPlaceholder } from './placeholders/DefaultPlaceholder';
import { StageLoadingState } from './loading/StageLoadingState';
import { STAGE_TITLES, STAGE_COMPONENTS, DEFAULT_SECTION } from '@/config/research-stages.config';


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
    <Suspense fallback={<StageLoadingState />}>
      <ResearchStageManagerContentWithParams {...props} />
    </Suspense>
  );
}

