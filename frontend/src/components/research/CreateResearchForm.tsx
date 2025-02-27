'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Research Details',
    description: 'Name and client information'
  },
  {
    id: 2,
    title: 'Research Type',
    description: 'Select research methodology'
  },
  {
    id: 3,
    title: 'Techniques',
    description: 'Choose research techniques'
  }
];

interface CreateResearchFormProps {
  className?: string;
  onResearchCreated?: (researchId: string, researchName: string) => void;
}

export function CreateResearchForm({ className, onResearchCreated }: CreateResearchFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    researchType: '',
    techniques: [] as string[]
  });

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    // Validar que los campos requeridos estén completos
    if (!formData.name || !formData.clientId) {
      // TODO: Mostrar mensaje de error
      return;
    }

    try {
      // TODO: Integrar con la API cuando esté lista
      const researchId = `research-${Date.now()}`;
      
      // Notificar al componente padre sobre la nueva investigación
      onResearchCreated?.(researchId, formData.name);

      // Navegar a la primera etapa de la investigación (Build - Welcome)
      router.push(`/research/${researchId}?section=build&stage=welcome`);
    } catch (error) {
      console.error('Error creating research:', error);
      // TODO: Mostrar mensaje de error
    }
  };

  return (
    <div className={cn("max-w-3xl mx-auto", className)}>
      {/* Progress Steps */}
      <div className="mb-12">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 w-full h-[2px] bg-neutral-100" />
          {steps.map((step) => (
            <div key={step.id} className="relative flex flex-col items-center">
              <div className={cn(
                "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white transition-colors",
                currentStep === step.id
                  ? "border-blue-500 text-blue-500"
                  : currentStep > step.id
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-neutral-200 text-neutral-400"
              )}>
                <span className="text-sm font-medium">{step.id}</span>
              </div>
              <div className="relative z-10 mt-4 text-center">
                <p className={cn(
                  "text-sm font-medium",
                  currentStep === step.id
                    ? "text-neutral-900"
                    : "text-neutral-500"
                )}>
                  {step.title}
                </p>
                <p className="mt-1 text-xs text-neutral-400 max-w-[140px]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-neutral-900">
                  Research Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  placeholder="Enter a name for your research..."
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="client" className="block text-sm font-medium text-neutral-900">
                  Client
                </label>
                <select
                  id="client"
                  value={formData.clientId}
                  onChange={(e) => updateFormData({ clientId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm"
                >
                  <option value="">Select a client...</option>
                  <option value="udd">Universidad del Desarrollo</option>
                  <option value="demo">Cliente Demo</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Kind of research
              </h3>
              <p className="text-sm text-neutral-500 mb-6">
                Select the type of research you wish to carry out. In this step you will be able to select between different configurations.
              </p>

              <div 
                role="button"
                tabIndex={0}
                onClick={() => updateFormData({ researchType: 'behavioral' })}
                className={cn(
                  "group relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer",
                  formData.researchType === 'behavioral'
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-neutral-200 hover:border-blue-500/50 hover:bg-blue-50/30"
                )}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-neutral-900 mb-1">
                    Behavioral Research
                  </h4>
                  <p className="text-sm text-neutral-500">
                    Analyze user behavior patterns and interactions to understand how they engage with your product or service.
                  </p>
                </div>
                {formData.researchType === 'behavioral' && (
                  <div className="absolute top-4 right-4">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Techniques for Behavioural Research
              </h3>
              <p className="text-sm text-neutral-500 mb-6">
                Please, select the configuration for this research.
              </p>

              <div className="space-y-4">
                {/* AIM Framework Option */}
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => updateFormData({ techniques: ['aim'] })}
                  className={cn(
                    "group relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer",
                    formData.techniques.includes('aim')
                      ? "border-blue-500 bg-blue-50/50"
                      : "border-neutral-200 hover:border-blue-500/50 hover:bg-blue-50/30"
                  )}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-neutral-900 mb-1">
                      AIM Framework Stage 3
                    </h4>
                    <p className="text-sm text-neutral-500">
                      Start with VOC Smart or build an upgrade by your own.
                    </p>
                  </div>
                  {formData.techniques.includes('aim') && (
                    <div className="absolute top-4 right-4">
                      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-8 py-6 bg-neutral-50/70 border-t border-neutral-200/70">
          <div className="flex justify-between">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                Previous
              </button>
            )}
            <div className="flex-1" />
            {currentStep < steps.length ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                Create Research
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 