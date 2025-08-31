import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { researchAPI, setupAuthToken } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { useResearch } from '@/stores/useResearchStore';
import { ResearchBasicData, ResearchType } from '../../../../../shared/interfaces/research.model';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface FormState {
  basic: ResearchBasicData;
  currentStep: number;
  errors: Record<string, string>;
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

export default function useCreateResearchForm() {
  const router = useRouter();
  const { token } = useAuth();
  const { currentDraft, createDraft, updateDraft, clearDraft } = useResearch();

  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdResearchId, setCreatedResearchId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  const enterpriseSelectRef = useRef<HTMLSelectElement>(null);

  // Restaurar borrador si existe
  useEffect(() => {
    if (currentDraft && currentDraft.data && currentDraft.data.basic) {
      setFormData((prev) => ({
        ...prev,
        basic: {
          ...prev.basic,
          name: prev.basic.name || currentDraft.data.basic?.name || '',
          companyId: prev.basic.companyId || currentDraft.data.basic?.description || '',
          type: prev.basic.type || (currentDraft.data.basic?.type as ResearchType) || undefined,
          technique: prev.basic.technique || (currentDraft.data.configuration?.technique || '')
        },
        currentStep: currentDraft.step === 'basic' ? 1 :
          currentDraft.step === 'configuration' ? 2 : 3,
        errors: {}
      }));
    }
  }, [currentDraft]);

  // Validación por paso
  const validateStep = (step: number): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.basic.name || formData.basic.name.length < 3) {
          newErrors.name = 'Name must be at least 3 characters';
        }
        if (!formData.basic.companyId) {
          newErrors.companyId = 'Company is required';
        }
        break;

      case 2:
        if (!formData.basic.type) {
          newErrors.type = 'Research type is required';
        }
        break;

      case 3:
        if (!formData.basic.technique) {
          newErrors.technique = 'Technique is required';
        }
        break;
    }

    return newErrors;
  };

  // Actualizar datos del formulario
  const updateFormData = (field: string, value: string) => {
    const currentFormData = { ...formData };
    currentFormData.basic = {
      ...currentFormData.basic,
      [field]: value
    };

    setFormData(currentFormData);

    // Actualizar borrador
    setTimeout(() => {
      updateDraft(
        {
          basic: {
            title: currentFormData.basic.name,
            description: currentFormData.basic.companyId,
            type: currentFormData.basic.type
          },
          configuration: {
            technique: currentFormData.basic.technique
          }
        },
        currentFormData.currentStep === 1 ? 'basic' :
          currentFormData.currentStep === 2 ? 'configuration' : 'review'
      );
    }, 0);
  };

  // Navegación
  const goToNextStep = () => {
    const errors = validateStep(formData.currentStep);
    
    if (Object.keys(errors).length > 0) {
      setFormData(prev => ({ ...prev, errors }));
      
      // Focus en el primer campo con error
      if (errors.name) {
        const nameInput = document.getElementById('name');
        nameInput?.focus();
      } else if (errors.companyId) {
        enterpriseSelectRef.current?.focus();
      }
      
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

  // Toggles
  const toggleResearchType = (type: ResearchType) => {
    updateFormData('type', type);
  };

  const toggleTechnique = (technique: string) => {
    updateFormData('technique', technique);
  };

  // Envío del formulario
  const submitForm = async () => {
    const finalErrors = validateStep(formData.currentStep);
    
    if (Object.keys(finalErrors).length > 0) {
      setFormData(prev => ({ ...prev, errors: finalErrors }));
      return;
    }

    try {
      setIsSubmitting(true);
      setupAuthToken();

      // Preparar datos
      const createData: ResearchBasicData = {
        name: formData.basic.name,
        companyId: formData.basic.companyId,
        type: formData.basic.type || ResearchType.BEHAVIOURAL,
        technique: formData.basic.technique || '',
        description: formData.basic.description || ''
      };

      const result = await researchAPI.create(createData);

      if (result.success && result.data) {
        setCreatedResearchId(result.data.id);
        clearDraft();
        setShowSummary(true);
        
        // Countdown para redirección
        let timeLeft = 3;
        setCountdown(timeLeft);
        
        const countdownInterval = setInterval(() => {
          timeLeft -= 1;
          setCountdown(timeLeft);
          
          if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            
            if (formData.basic.technique === 'aim-framework') {
              router.push(`/dashboard/research/${result.data.id}/new`);
            } else {
              router.push(`/dashboard/research/${result.data.id}`);
            }
          }
        }, 1000);

        toast.success('Research created successfully!');
      } else {
        throw new Error(result.message || 'Failed to create research');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error creating research');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verificaciones de estado
  const canGoNext = () => {
    const errors = validateStep(formData.currentStep);
    return Object.keys(errors).length === 0;
  };

  return {
    // Estado
    formData,
    steps,
    isSubmitting,
    showSummary,
    countdown,
    enterpriseSelectRef,
    
    // Acciones
    updateFormData,
    goToNextStep,
    goToPreviousStep,
    toggleResearchType,
    toggleTechnique,
    submitForm,
    
    // Validaciones
    canGoNext
  };
}