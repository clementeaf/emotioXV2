import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { useCompanies } from '@/hooks/useCompanies';
import { FormSteps } from './CreateResearchForm/FormSteps';
import { BasicInfoStep } from './CreateResearchForm/BasicInfoStep';
import { ResearchTypeStep } from './CreateResearchForm/ResearchTypeStep';
import { TechniqueStep } from './CreateResearchForm/TechniqueStep';
import { FormActions } from './CreateResearchForm/FormActions';
import { ResearchSummary } from './CreateResearchForm/ResearchSummary';
import useCreateResearchForm from './CreateResearchForm/useCreateResearchForm';

interface CreateResearchFormOptimizedProps {
  className?: string;
  onResearchCreated?: (researchId: string) => void;
}

export const CreateResearchFormOptimized: React.FC<CreateResearchFormOptimizedProps> = memo(({
  className,
  onResearchCreated
}) => {
  // Hooks personalizados
  const { companies, loading: loadingCompanies, error: companiesError } = useCompanies();
  const {
    formData,
    steps,
    isSubmitting,
    showSummary,
    countdown,
    enterpriseSelectRef,
    updateFormData,
    goToNextStep,
    goToPreviousStep,
    toggleResearchType,
    toggleTechnique,
    submitForm,
    canGoNext
  } = useCreateResearchForm();

  // Si ya se completó, mostrar resumen
  if (showSummary) {
    return (
      <div className={cn('max-w-2xl mx-auto p-6', className)}>
        <ResearchSummary
          formData={formData.basic}
          companies={companies}
          countdown={countdown}
        />
      </div>
    );
  }

  // Renderizar contenido del paso actual
  const renderStepContent = () => {
    switch (formData.currentStep) {
      case 1:
        return (
          <BasicInfoStep
            formData={formData.basic}
            errors={formData.errors}
            companies={companies}
            loadingCompanies={loadingCompanies}
            companiesError={companiesError}
            onFieldChange={updateFormData}
            enterpriseSelectRef={enterpriseSelectRef}
          />
        );
      case 2:
        return (
          <ResearchTypeStep
            selectedType={formData.basic.type}
            onTypeToggle={toggleResearchType}
          />
        );
      case 3:
        return (
          <TechniqueStep
            selectedTechnique={formData.basic.technique}
            onTechniqueToggle={toggleTechnique}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('max-w-4xl mx-auto p-6', className)}>
      <div className="space-y-8">
        {/* Indicador de pasos */}
        <FormSteps
          steps={steps}
          currentStep={formData.currentStep}
        />

        {/* Contenido principal */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Acciones del formulario */}
        <FormActions
          currentStep={formData.currentStep}
          totalSteps={steps.length}
          canGoNext={canGoNext()}
          isSubmitting={isSubmitting}
          selectedTechnique={formData.basic.technique}
          onPrevious={goToPreviousStep}
          onNext={goToNextStep}
          onSubmit={submitForm}
        />
      </div>
    </div>
  );
});

CreateResearchFormOptimized.displayName = 'CreateResearchFormOptimized';

export default CreateResearchFormOptimized;