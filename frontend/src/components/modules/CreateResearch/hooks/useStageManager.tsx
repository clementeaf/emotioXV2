import { useSearchParams } from 'next/navigation';
import React, { ReactElement } from 'react';

import { PlaceholderCard } from '@/components/common/PlaceholderCard';
import { STAGE_TITLES, STAGE_COMPONENTS, DEFAULT_SECTION } from '@/config/research-stages.config';

// Importaciones dinámicas para evitar errores de Fast Refresh
const CognitiveTaskForm = React.lazy(() => import('../../../research/CognitiveTask').then(mod => ({ default: mod.CognitiveTaskForm })));
const ResearchInProgressPage = React.lazy(() => import('@/app/dashboard/research-in-progress/page'));
const CognitiveTaskResults = React.lazy(() => import('../../../research/CognitiveTaskResults').then(mod => ({ default: mod.CognitiveTaskResults })));
const ImplicitAssociationForm = React.lazy(() => import('../../../research/ImplicitAssociation').then(mod => ({ default: mod.ImplicitAssociationForm })));
const ImplicitAssociationResults = React.lazy(() => import('../../../research/ImplicitAssociationResults').then(mod => ({ default: mod.ImplicitAssociationResults })));
const RecruitEyeTrackingForm = React.lazy(() => import('../../../research/EyeTracking/Recruit/RecruitEyeTrackingForm').then(mod => ({ default: mod.RecruitEyeTrackingForm })));
const SimpleEyeTrackingForm = React.lazy(() => import('../../../research/EyeTracking/SimpleEyeTrackingForm').then(mod => ({ default: mod.SimpleEyeTrackingForm })));
const ResumeForm = React.lazy(() => import('../../../research/Resume').then(mod => ({ default: mod.ResumeForm })));
const SmartVOCForm = React.lazy(() => import('../../../research/SmartVOC').then(mod => ({ default: mod.SmartVOCForm })));
const SmartVOCResults = React.lazy(() => import('../../../research/SmartVOCResults/index').then(mod => ({ default: mod.SmartVOCResults })));
const ThankYouScreenForm = React.lazy(() => import('../../../research/ThankYouScreen').then(mod => ({ default: mod.ThankYouScreenForm })));
const WelcomeScreenForm = React.lazy(() => import('../../../research/WelcomeScreen').then(mod => ({ default: mod.WelcomeScreenForm })));
const ScreenerForm = React.lazy(() => import('../../../research/forms/ScreenerForm').then(mod => ({ default: mod.ScreenerForm })));
const TestCommonPage = React.lazy(() => import('@/components/development/TestCommonPage').then(mod => ({ default: mod.TestCommonPage })));

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
    PlaceholderCard,
    TestCommonPage
  } as const;

  const renderStageContent = (): ReactElement => {
    const stageConfig = STAGE_COMPONENTS[currentSection] || STAGE_COMPONENTS.default;
    const ComponentToRender = componentMap[stageConfig.component as keyof typeof componentMap];

    if (!ComponentToRender) {
      console.warn(`Component ${stageConfig.component} not found for section ${currentSection}`);
      return (
        <PlaceholderCard
          title="Funcionalidad en desarrollo"
          description={`La funcionalidad para ${currentSection} está en desarrollo. Pronto estará disponible.`}
          variant="coming-soon"
        />
      );
    }

    const componentProps = {
      researchId,
      ...stageConfig.props
    } as any;

    // Usar Suspense para cargar componentes dinámicamente
    const component = (
      <React.Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
        <ComponentToRender {...componentProps} />
      </React.Suspense>
    );

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
