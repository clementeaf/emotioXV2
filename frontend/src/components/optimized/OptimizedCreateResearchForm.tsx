/**
 * Versión ultra-optimizada del CreateResearchForm con todas las mejoras aplicadas
 */
import React, { memo, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useCachedCompanies } from '@/hooks/useCachedCompanies';
import { useOptimizedCallback, useStableCallback, useMemoizedProps } from '@/hooks/useOptimizedCallback';
import { withOptimizedMemo } from '@/utils/performance';
import { FormField, SelectField, FormSection, FormActions, useFormValidation } from '@/components/forms';
import { ResearchType } from '../../../../shared/interfaces/research.model';

// Tipos optimizados
interface FormData {
  name: string;
  companyId: string;
  type: ResearchType;
  technique: string;
}

interface OptimizedCreateResearchFormProps {
  className?: string;
  onResearchCreated?: (researchId: string) => void;
}

// Componente de paso memoizado
const StepIndicator = memo(({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const steps = useMemo(() => [
    { id: 1, title: 'Name', description: 'Research name and client' },
    { id: 2, title: 'Type', description: 'Research type selection' },
    { id: 3, title: 'Technique', description: 'Configuration setup' }
  ], []);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 w-full h-[2px] bg-neutral-100" />
        {steps.map((step) => (
          <div key={step.id} className="relative flex flex-col items-center">
            <div className={cn(
              'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white transition-colors',
              currentStep === step.id
                ? 'border-blue-500 text-blue-500'
                : currentStep > step.id
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-neutral-200 text-neutral-400'
            )}>
              <span className="text-sm font-medium">{step.id}</span>
            </div>
            <div className="relative z-10 mt-4 text-center">
              <p className={cn(
                'text-sm font-medium',
                currentStep === step.id ? 'text-neutral-900' : 'text-neutral-500'
              )}>
                {step.title}
              </p>
              <p className="mt-1 text-xs text-neutral-400 max-w-[200px]">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
StepIndicator.displayName = 'StepIndicator';

// Componente de selección de tipo memoizado
const ResearchTypeSelector = memo(({ 
  selectedType, 
  onSelect 
}: { 
  selectedType?: ResearchType; 
  onSelect: (type: ResearchType) => void;
}) => {
  const handleSelect = useStableCallback(() => {
    onSelect(ResearchType.BEHAVIOURAL);
  });

  return (
    <FormSection
      title="Kind of research"
      description="Select the type of research you wish to carry out."
    >
      <div className={cn(
        'p-4 border rounded-lg transition-colors cursor-pointer',
        selectedType === ResearchType.BEHAVIOURAL
          ? 'border-blue-500 bg-blue-50'
          : 'border-neutral-200 hover:border-neutral-300'
      )} onClick={handleSelect}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Enterprise</div>
              <div className="text-md font-medium">Behavioural Research</div>
            </div>
          </div>
          <div className={cn(
            'w-4 h-4 rounded-full border-2',
            selectedType === ResearchType.BEHAVIOURAL 
              ? 'bg-blue-500 border-blue-500' 
              : 'border-neutral-300'
          )} />
        </div>
      </div>
    </FormSection>
  );
});
ResearchTypeSelector.displayName = 'ResearchTypeSelector';

// Componente principal optimizado
const OptimizedCreateResearchFormComponent: React.FC<OptimizedCreateResearchFormProps> = ({ 
  className, 
  onResearchCreated 
}) => {
  // Datos con cache
  const { companies, loading: loadingCompanies, error: companiesError } = useCachedCompanies();

  // Configuración del formulario
  const initialValues: FormData = useMemo(() => ({
    name: '',
    companyId: '',
    type: ResearchType.BEHAVIOURAL,
    technique: ''
  }), []);

  const validationRules = useMemo(() => ({
    name: { required: true, minLength: 3, maxLength: 100 },
    companyId: { required: true },
    type: { required: true },
    technique: { required: true }
  }), []);

  // Hook de validación con callback optimizado
  const onSubmit = useOptimizedCallback(async (values: FormData) => {
    // Lógica de envío aquí
    if (onResearchCreated) {
      onResearchCreated('new-research-id');
    }
  }, [onResearchCreated]);

  const {
    values,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    isValid,
    isSubmitting
  } = useFormValidation({
    initialValues,
    validationRules,
    onSubmit
  });

  // Opciones de companies memoizadas
  const companyOptions = useMemo(() => 
    companies.map(company => ({
      value: company.id,
      label: company.name,
      disabled: company.status !== 'active'
    }))
  , [companies]);

  // Callbacks estables
  const handleNameChange = useStableCallback((value: string) => {
    handleChange('name', value);
  });

  const handleCompanyChange = useStableCallback((value: string) => {
    handleChange('companyId', value);
  });

  const handleTypeSelect = useStableCallback((type: ResearchType) => {
    handleChange('type', type);
  });

  const handleTechniqueSelect = useStableCallback(() => {
    handleChange('technique', 'aim-framework');
  });

  // Estado del paso actual (simplificado a 2 pasos)
  const currentStep = values.name && values.companyId ? 2 : 1;
  const canProceed = currentStep === 1 ? values.name && values.companyId : isValid;

  // Props memoizadas para evitar re-renders
  const stepIndicatorProps = useMemoizedProps({
    currentStep,
    totalSteps: 2
  });

  const formActionsProps = useMemoizedProps({
    primaryAction: {
      label: currentStep === 1 ? 'Next' : 'Create Research',
      onClick: currentStep === 1 ? handleTechniqueSelect : handleSubmit,
      disabled: !canProceed,
      loading: isSubmitting,
      type: 'button' as const
    }
  });

  return (
    <div className={cn('max-w-4xl mx-auto p-6', className)}>
      <div className="space-y-8">
        <StepIndicator {...stepIndicatorProps} />

        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <FormSection
              title="Name the Research"
              description="Please, name the research project and assign it to an existing client."
            >
              <FormField
                id="research-name"
                label="Research's name"
                value={values.name}
                placeholder="Project 001"
                error={errors.name}
                required
                onChange={handleNameChange}
                onBlur={() => handleBlur('name')}
              />

              <SelectField
                id="company"
                label="It's made for"
                value={values.companyId}
                options={companyOptions}
                placeholder="Select a company"
                error={errors.companyId || (companiesError ? 'Could not load companies' : '')}
                loading={loadingCompanies}
                required
                onChange={handleCompanyChange}
                onBlur={() => handleBlur('companyId')}
              />
            </FormSection>
          )}

          {currentStep === 2 && (
            <>
              <ResearchTypeSelector
                selectedType={values.type}
                onSelect={handleTypeSelect}
              />

              <FormSection
                title="Technique Selection"
                description="Your research will use AIM Framework Stage 3."
                className="mt-6"
              >
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">✓</span>
                    </div>
                    <div>
                      <p className="font-medium">AIM Framework Stage 3</p>
                      <p className="text-sm text-neutral-600">
                        Start with VOC Smart or build an upgrade by your own
                      </p>
                    </div>
                  </div>
                </div>
              </FormSection>
            </>
          )}
        </div>

        <FormActions {...formActionsProps} />
      </div>
    </div>
  );
};

// Aplicar optimizaciones de memo
export const OptimizedCreateResearchForm = withOptimizedMemo(
  OptimizedCreateResearchFormComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.className === nextProps.className &&
      prevProps.onResearchCreated === nextProps.onResearchCreated
    );
  }
);

export default OptimizedCreateResearchForm;