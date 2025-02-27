'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ResearchSidebar } from '@/components/layout/ResearchSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { WelcomeScreenForm } from './WelcomeScreenForm';
import { SmartVOCForm } from './SmartVOCForm';
import { CognitiveTaskForm } from './CognitiveTaskForm';
import { ThankYouScreenForm } from './ThankYouScreenForm';
import { EyeTrackingForm } from './EyeTrackingForm';
import { RecruitConfiguration } from './RecruitConfiguration';

interface ResearchStageManagerProps {
  researchId: string;
}

export function ResearchStageManager({ researchId }: ResearchStageManagerProps) {
  const searchParams = useSearchParams();
  const currentSection = searchParams.get('section') || 'build';
  const currentStage = searchParams.get('stage') || 'welcome';

  const renderStageContent = () => {
    switch (currentSection) {
      case 'build':
        switch (currentStage) {
          case 'welcome':
            return <WelcomeScreenForm />;
          case 'smart-voc':
            return <SmartVOCForm />;
          case 'cognitive':
            return <CognitiveTaskForm />;
          case 'eye-tracking':
            return <EyeTrackingForm researchId={researchId} />;
          case 'thank-you':
            return <ThankYouScreenForm />;
          default:
            return <WelcomeScreenForm />;
        }
      case 'recruit':
        return <RecruitConfiguration />;
      case 'results':
        return (
          <div className="p-8">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <p className="text-neutral-600">
              Results will be available once the research is completed.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const getStageTitle = () => {
    switch (currentSection) {
      case 'build':
        switch (currentStage) {
          case 'welcome':
            return 'Welcome Screen Configuration';
          case 'smart-voc':
            return 'Smart VOC Configuration';
          case 'cognitive':
            return 'Cognitive Task Configuration';
          case 'eye-tracking':
            return 'Eye Tracking Configuration';
          case 'thank-you':
            return 'Thank You Screen Configuration';
          default:
            return 'Research Configuration';
        }
      case 'recruit':
        return 'Recruitment Configuration';
      case 'results':
        return 'Research Results';
      default:
        return 'Research Configuration';
    }
  };

  const getStageDescription = () => {
    switch (currentSection) {
      case 'build':
        switch (currentStage) {
          case 'welcome':
            return 'Configure the welcome message that participants will see.';
          case 'smart-voc':
            return 'Set up your Voice of Customer questions.';
          case 'cognitive':
            return 'Design cognitive assessment tasks for your research.';
          case 'eye-tracking':
            return 'Configure the eye tracking settings for your research study.';
          case 'thank-you':
            return 'Configure the completion message for participants.';
          default:
            return 'Configure your research settings.';
        }
      case 'recruit':
        return 'Set up your recruitment parameters and manage participants.';
      case 'results':
        return 'View and analyze your research results.';
      default:
        return 'Configure your research settings.';
    }
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      <ResearchSidebar researchId={researchId} activeStage={currentStage} />
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