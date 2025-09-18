import { useSearchParams } from 'next/navigation';
import { ReactElement } from 'react';

import { CognitiveTaskForm } from '../CognitiveTask';
import ResearchInProgressPage from '@/app/dashboard/research-in-progress/page';
import { CognitiveTaskResults } from '../CognitiveTaskResults';
import { ImplicitAssociationForm } from '../ImplicitAssociation';
import { ImplicitAssociationResults } from '../ImplicitAssociationResults';
import { RecruitEyeTrackingForm } from '../EyeTracking/Recruit/RecruitEyeTrackingForm';
import { SimpleEyeTrackingForm } from '../EyeTracking/SimpleEyeTrackingForm';
import { ResumeForm } from '../Resume';
import { SmartVOCForm } from '../SmartVOC';
import { SmartVOCResults } from '../SmartVOCResults/index';
import { ThankYouScreenForm } from '../ThankYouScreen';
import { WelcomeScreenForm } from '../WelcomeScreen';
import { ScreenerForm } from '../forms/ScreenerForm';
import { ConfigurationPlaceholder } from '../placeholders/ConfigurationPlaceholder';
import { ParticipantsPlaceholder } from '../placeholders/ParticipantsPlaceholder';
import { DefaultPlaceholder } from '../placeholders/DefaultPlaceholder';
import { STAGE_TITLES, STAGE_COMPONENTS, DEFAULT_SECTION } from '@/config/research-stages.config';

interface StageManagerResult {
  currentSection: string;
  stageTitle: string;
  renderStageContent: () => ReactElement;
}

/**
 * Custom hook que maneja toda la lógica de renderizado de stages
 * Centraliza el mapeo de componentes y la lógica de selección
 */
export function useStageManager(researchId: string): StageManagerResult {
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
  } as const;

  const renderStageContent = (): ReactElement => {
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

  const getStageTitle = (): string => {
    return STAGE_TITLES[currentSection] || STAGE_TITLES.default;
  };

  return {
    currentSection,
    stageTitle: getStageTitle(),
    renderStageContent
  };
}