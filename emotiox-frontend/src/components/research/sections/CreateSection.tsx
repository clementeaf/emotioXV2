import React, { useState } from 'react';
import { FormSteps } from './FormSteps';
import { BasicInfoStep } from './BasicInfoStep';
import { ResearchTypeStep } from './ResearchTypeStep';
import { TechniqueStep } from './TechniqueStep';
import { FormActions } from './FormActions';
import { ResearchSummary } from './ResearchSummary';
import { useCreateResearchForm } from './useCreateResearchForm';
import type { CreateSectionProps } from '../../../types/research-creation.interface';

/**
 * Sección de creación de investigación con formulario multi-paso
 */
export const CreateSection: React.FC<CreateSectionProps> = ({ onResearchCreated }) => {
  const {
    formData,
    steps,
    isSubmitting,
    showSummary,
    countdown,
    companies,
    loadingCompanies,
    companiesError,
    refreshCompanies,
    updateFormData,
    goToNextStep,
    goToPreviousStep,
    toggleResearchType,
    toggleTechnique,
    submitForm,
    canGoNext
  } = useCreateResearchForm(onResearchCreated);

  // Si ya se completó, mostrar resumen
  if (showSummary) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <ResearchSummary
          formData={formData.basic}
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
            onCompanyCreated={async (newCompany) => {
              console.log('Nueva empresa creada:', newCompany);
              await refreshCompanies();
            }}
          />
        );
      case 2:
        return (
          <ResearchTypeStep
            selectedType={formData.basic.type || ''}
            onTypeToggle={toggleResearchType}
          />
        );
      case 3:
        return (
          <TechniqueStep
            selectedTechnique={formData.basic.technique || ''}
            onTechniqueToggle={toggleTechnique}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        <FormSteps
          steps={steps}
          currentStep={formData.currentStep}
        />

        {/* Contenido principal */}
        <div className="min-h-[200px]">
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
};
