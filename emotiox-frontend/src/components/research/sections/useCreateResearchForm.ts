import { useState, useEffect } from 'react';
import { useCreateResearch } from '../../../hooks/research/useResearch';
import { useCompanies } from '../../../hooks/companies/useCompanies';
import { useResearchStore, researchHelpers } from '../../../stores/useResearchStore';
import { useResearchList } from '../../../hooks/research/useResearch';

interface FormState {
  basic: {
    name: string;
    companyId: string;
    type?: string;
    technique?: string;
    description?: string;
  };
  currentStep: number;
  errors: Record<string, string>;
}

interface Step {
  id: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  { id: 1, title: 'Name', description: 'Research name and client' },
  { id: 2, title: 'Type', description: 'Research type selection' },
  { id: 3, title: 'Technique', description: 'Configuration setup' }
];

const initialFormState: FormState = {
  basic: {
    name: '',
    companyId: ''
  },
  currentStep: 1,
  errors: {}
};

export const useCreateResearchForm = (onResearchCreated?: (researchId: string, researchName: string) => void) => {
  // Zustand store for optimistic updates
  const { optimisticAdd, reconcileByClientId, rollback } = useResearchStore();
  
  // Hooks
  const companiesQuery = useCompanies();
  const { data: existingResearch = [] } = useResearchList();
  
  const companies = companiesQuery.data?.data || [];
  const loadingCompanies = companiesQuery.isLoading;
  const companiesError = companiesQuery.error?.message || null;
  const refreshCompanies = companiesQuery.refetch;
  const createResearchMutation = useCreateResearch();
  
  // Local state
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [showSummary, setShowSummary] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [validationTimer, setValidationTimer] = useState<NodeJS.Timeout | null>(null);
  
  const isSubmitting = createResearchMutation.isPending;

  // Real-time validation for research name
  useEffect(() => {
    if (validationTimer) {
      clearTimeout(validationTimer);
    }

    if (formData.basic.name.length > 2) {
      const timer = setTimeout(() => {
        const researchList = Array.isArray(existingResearch) ? existingResearch : existingResearch.data || [];
        const isDuplicate = researchList.some(
          (research: any) => research.name.toLowerCase() === formData.basic.name.toLowerCase()
        );
        
        if (isDuplicate) {
          setFormData(prev => ({
            ...prev,
            errors: {
              ...prev.errors,
              name: 'Research name already exists. Please choose a different name.'
            }
          }));
        }
      }, 500);

      setValidationTimer(timer);
    }

    return () => {
      if (validationTimer) {
        clearTimeout(validationTimer);
      }
    };
  }, [formData.basic.name, existingResearch]);

  // Countdown effect
  useEffect(() => {
    if (showSummary && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showSummary && countdown === 0) {
      if (onResearchCreated) {
        onResearchCreated('temp-research-id', formData.basic.name);
      }
    }
  }, [showSummary, countdown, onResearchCreated, formData.basic.name]);

  // Validation function
  const validateStep = (step: number): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.basic.name.trim()) {
        newErrors.name = 'Research name is required';
      } else if (formData.basic.name.length < 3) {
        newErrors.name = 'Research name must be at least 3 characters';
      }
      
      if (!formData.basic.companyId) {
        newErrors.companyId = 'Please select a company';
      }
    }

    if (step === 2 && !formData.basic.type) {
      newErrors.type = 'Please select a research type';
    }

    if (step === 3 && !formData.basic.technique) {
      newErrors.technique = 'Please select a technique';
    }

    return newErrors;
  };

  // Update form data
  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      basic: {
        ...prev.basic,
        [field]: value
      },
      errors: {
        ...prev.errors,
        [field]: ''
      }
    }));
  };

  // Navigation functions
  const goToNextStep = () => {
    const errors = validateStep(formData.currentStep);

    if (Object.keys(errors).length > 0) {
      setFormData(prev => ({ ...prev, errors }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1,
      errors: {}
    }));
  };

  const goToPreviousStep = () => {
    setFormData(prev => ({
      ...prev,
      currentStep: prev.currentStep - 1,
      errors: {}
    }));
  };

  // Toggle functions
  const toggleResearchType = (type: string) => {
    updateFormData('type', type);
  };

  const toggleTechnique = (technique: string) => {
    updateFormData('technique', technique);
  };

  // Submit form with optimistic updates
  const submitForm = async () => {
    console.log('🚀 CREATE FORM SUBMIT STARTED');

    const finalErrors = validateStep(formData.currentStep);

    if (Object.keys(finalErrors).length > 0) {
      console.log('🚀 VALIDATION ERRORS:', finalErrors);
      setFormData(prev => ({ ...prev, errors: finalErrors }));
      return;
    }

    if (isSubmitting) return;

    const clientId = researchHelpers.newClientId();
    console.log('🚀 GENERATED CLIENT ID:', clientId);
    
    const createData = {
      name: formData.basic.name,
      companyId: formData.basic.companyId,
      type: formData.basic.type || 'behavioural',
      technique: formData.basic.technique || '',
      description: formData.basic.description || ''
    };

    console.log('🚀 ADDING OPTIMISTIC RESEARCH:', createData);
    optimisticAdd({
      clientId,
      name: createData.name,
      companyId: createData.companyId,
      technique: createData.technique,
      status: 'draft',
      stage: 'basic-info',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      console.log('🚀 SENDING CREATE REQUEST TO BACKEND');
      const result = await createResearchMutation.mutateAsync(createData);
      
      console.log('🚀 CREATE SUCCESS - Reconciling with real data');
      reconcileByClientId(clientId, result.data);
      
      setShowSummary(true);
      
      if (onResearchCreated && result.data) {
        onResearchCreated(result.data.id, result.data.name);
      }
    } catch (error) {
      console.error('🚀 CREATE ERROR - Rolling back:', error);
      rollback();
    }
  };

  // Check if can go next
  const canGoNext = (): boolean => {
    const errors = validateStep(formData.currentStep);
    return Object.keys(errors).length === 0;
  };

  return {
    formData,
    steps,
    isSubmitting,
    showSummary,
    countdown,
    companies: companies,
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
  };
};