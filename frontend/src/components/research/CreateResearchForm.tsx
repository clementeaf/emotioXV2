'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { researchAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useResearch } from '@/stores/useResearchStore';

import {
  ResearchBasicData,
  ResearchType
} from 'shared/interfaces/research.model';


interface Step {
  id: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Research details and objectives'
  },
  {
    id: 2,
    title: 'Research Type',
    description: 'Select methodology and approach'
  },
  {
    id: 3,
    title: 'Configuration',
    description: 'Setup research components'
  }
];

interface CreateResearchFormProps {
  className?: string;
  onResearchCreated?: (researchId: string, researchName: string) => void;
}

interface FormState {
  basic: ResearchBasicData;
  currentStep: number;
  errors: Record<string, string>;
}

const initialFormState: FormState = {
  basic: {
    name: '',
    enterprise: ''
  },
  currentStep: 1,
  errors: {}
};

export function CreateResearchForm({ className, onResearchCreated }: CreateResearchFormProps) {
  const router = useRouter();
  const { token } = useAuth();
  const { currentDraft, createDraft, updateDraft, clearDraft } = useResearch();

  // Mover la inicialización a un estado básico primero
  const [formData, setFormData] = useState<FormState>(initialFormState);

  // Luego usar un useEffect para actualizar con el borrador si existe
  useEffect(() => {
    if (currentDraft && currentDraft.data && currentDraft.data.basic) {
      setFormData((prev) => ({
        ...prev,
        basic: {
          ...prev.basic,
          name: prev.basic.name || currentDraft.data.basic?.name || '',
          enterprise: prev.basic.enterprise || currentDraft.data.basic?.description || '',
          type: prev.basic.type || (currentDraft.data.basic?.type as ResearchType) || undefined,
          technique: prev.basic.technique || (currentDraft.data.configuration?.technique || '')
        },
        currentStep: currentDraft.step === 'basic' ? 1 :
          currentDraft.step === 'configuration' ? 2 : 3,
        errors: {}
      }));
    }
  }, [currentDraft]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdResearchId, setCreatedResearchId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const enterpriseSelectRef = React.useRef<HTMLSelectElement>(null);

  // Efecto para crear un borrador si no existe
  useEffect(() => {
    // Solo crear un borrador nuevo cuando realmente se necesite
    // y no en cada renderizado
    let shouldCreateDraft = false;

    if (!currentDraft) {
      shouldCreateDraft = true;
    }

    // Mover la creación del borrador fuera del flujo de renderizado
    if (shouldCreateDraft) {
      setTimeout(() => {
        createDraft();
      }, 0);
    }
  }, [currentDraft, createDraft]);

  // Efecto para manejar el comportamiento del placeholder en el select
  useEffect(() => {
    const selectEl = enterpriseSelectRef.current;
    if (!selectEl) { return; }

    // Función para ocultar la primera opción cuando el select está abierto
    const handleSelectFocus = () => {
      if (selectEl.options[0] && selectEl.options[0].value === '') {
        selectEl.options[0].style.display = 'none';
      }
    };

    // Función para mostrar la primera opción cuando el select está cerrado
    const handleSelectBlur = () => {
      if (selectEl.options[0] && selectEl.options[0].value === '') {
        selectEl.options[0].style.display = '';
      }
    };

    // Agregar event listeners
    selectEl.addEventListener('focus', handleSelectFocus);
    selectEl.addEventListener('blur', handleSelectBlur);

    // Cleanup
    return () => {
      selectEl.removeEventListener('focus', handleSelectFocus);
      selectEl.removeEventListener('blur', handleSelectBlur);
    };
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        // Validar información básica
        if (!formData.basic.name || formData.basic.name.length < 3) {
          newErrors.name = 'Name must be at least 3 characters';
        }
        if (!formData.basic.enterprise) {
          newErrors.enterprise = 'Enterprise is required';
        }
        break;

      case 2:
        // No validation needed for step 2 yet
        break;

      case 3:
        // No validation needed for step 3 yet
        break;
    }

    setFormData((prev) => ({
      ...prev,
      errors: newErrors
    }));

    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field: string, value: any) => {
    // Crear una copia local de formData que podamos modificar
    const currentFormData = { ...formData };

    // Actualizar la copia local
    currentFormData.basic = {
      ...currentFormData.basic,
      [field]: value
    };

    // Actualizar el estado con la copia modificada
    setFormData(currentFormData);

    // Mover la actualización del borrador fuera de la función de actualización de estado
    // utilizando un setTimeout para evitar actualizaciones durante el renderizado
    setTimeout(() => {
      updateDraft(
        {
          basic: {
            title: currentFormData.basic.name,
            description: currentFormData.basic.enterprise,
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

  const handleNext = () => {
    if (validateStep(formData.currentStep)) {
      // Crear una copia local y calcular el nuevo paso
      const newStep = formData.currentStep + 1;
      const draftStep = newStep === 1 ? 'basic' :
        newStep === 2 ? 'configuration' : 'review';

      // Actualizar el estado
      setFormData((prev) => ({
        ...prev,
        currentStep: newStep
      }));

      // Mover la actualización del borrador fuera del ciclo de renderizado
      setTimeout(() => {
        updateDraft(
          {
            basic: {
              title: formData.basic.name,
              description: formData.basic.enterprise,
              type: formData.basic.type
            },
            configuration: {
              technique: formData.basic.technique
            }
          },
          draftStep
        );
      }, 0);
    }
  };

  const handlePrevious = () => {
    // Calcular el nuevo paso
    const newStep = Math.max(1, formData.currentStep - 1);
    const draftStep = newStep === 1 ? 'basic' :
      newStep === 2 ? 'configuration' : 'review';

    // Actualizar el estado
    setFormData((prev) => ({
      ...prev,
      currentStep: newStep
    }));

    // Mover la actualización del borrador fuera del ciclo de renderizado
    setTimeout(() => {
      updateDraft(
        {
          basic: {
            title: formData.basic.name,
            description: formData.basic.enterprise,
            type: formData.basic.type
          },
          configuration: {
            technique: formData.basic.technique
          }
        },
        draftStep
      );
    }, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep(formData.currentStep)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar los datos para la API
      const createData: ResearchBasicData = {
        name: formData.basic.name,
        enterprise: formData.basic.enterprise,
        type: formData.basic.type || ResearchType.BEHAVIOURAL,
        technique: formData.basic.technique || '',
        description: formData.basic.description || ''
      };

      // Llamar a la API real
      const response = await researchAPI.create(createData);

      if (response.data) {
        // Limpiar el borrador ya que se creó exitosamente
        clearDraft();

        // Guardar el ID de la investigación creada
        const researchId = response.data.id;
        const researchName = response.data.name || formData.basic.name; // Usar el nombre del formulario si no viene en la respuesta

        // Actualizar el localStorage con la nueva investigación
        const currentResearchList = JSON.parse(localStorage.getItem('research_list') || '[]');
        const newResearch = {
          id: researchId,
          name: researchName,
          technique: formData.basic.technique,
          type: formData.basic.type,
          enterprise: formData.basic.enterprise,
          createdAt: new Date().toISOString()
        };

        localStorage.setItem('research_list', JSON.stringify([...currentResearchList, newResearch]));

        // También guardar los detalles específicos de la investigación
        localStorage.setItem(`research_${researchId}`, JSON.stringify(newResearch));

        setCreatedResearchId(researchId);
        setShowSummary(true);

        // Notificar al componente padre si existe el callback
        if (onResearchCreated) {
          onResearchCreated(researchId, researchName);
        }

        // Iniciar cuenta regresiva para redirección
        let count = 3;
        setCountdown(count);

        const countdownInterval = setInterval(() => {
          count -= 1;
          setCountdown(count);

          if (count === 0) {
            clearInterval(countdownInterval);
            // Redirigir basado en la técnica seleccionada
            if (formData.basic.technique === 'aim-framework') {
              router.push(`/dashboard?research=${researchId}&aim=true&section=welcome-screen`);
            } else {
              router.push(`/dashboard?research=${researchId}`);
            }
          }
        }, 1000);
      } else {
        throw new Error('Error al crear la investigación: No se recibió respuesta del servidor');
      }
    } catch (error) {
      console.error('Error al crear la investigación:', error);
      toast.error('Error al crear la investigación. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleResearchType = (type: ResearchType) => {
    if (formData.basic.type === type) {
      updateFormData('type', undefined);
    } else {
      updateFormData('type', type);
    }
  };

  const toggleResearchTechnique = (technique: string) => {
    if (formData.basic.technique === technique) {
      updateFormData('technique', undefined);
    } else {
      updateFormData('technique', technique);
    }
  };

  return (
    <div className={cn('max-w-3xl mx-auto h-[520px]', className)}>
      {/* Mostrar notificación si la investigación se creó */}
      {createdResearchId && (
        <div className="mb-4 p-6 bg-white border-2 border-green-500 text-neutral-800 rounded-lg shadow-lg">
          <div className="flex items-start">
            <svg className="w-6 h-6 mr-3 mt-0.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-medium text-xl mb-2">¡Investigación creada exitosamente!</p>
              <p className="text-sm mb-1">ID de investigación: <span className="font-mono bg-neutral-100 px-1 py-0.5 rounded">{createdResearchId}</span></p>
              <p className="text-sm mb-1">Nombre: <span className="font-medium">{formData.basic.name}</span></p>
              <p className="text-sm mb-4">Técnica: <span className="font-medium">{formData.basic.technique === 'aim-framework' ? 'AIM Framework' : 'Biométrica'}</span></p>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <a
                  href={formData.basic.technique === 'aim-framework'
                    ? `/dashboard?research=${createdResearchId}&aim=true&section=welcome-screen`
                    : `/dashboard?research=${createdResearchId}&section=forms`
                  }
                  className="inline-flex justify-center items-center px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm"
                >
                  Continuar con la investigación
                </a>
                <a
                  href="/dashboard"
                  className="inline-flex justify-center items-center px-6 py-3 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 shadow-sm"
                >
                  Volver al dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mostrar resumen y cuenta regresiva para AIM Framework */}
      {showSummary && (
        <div className="mb-4 p-6 bg-white border-2 border-blue-500 text-neutral-800 rounded-lg shadow-lg">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <div className="h-10 w-10 text-blue-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">Configurando AIM Framework</h2>

            <div className="bg-neutral-50 p-4 rounded-lg w-full mb-6">
              <h3 className="font-medium text-lg mb-3 text-left">Resumen de opciones seleccionadas:</h3>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="font-medium">Nombre de investigación:</span>
                  <span>{formData.basic.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Empresa:</span>
                  <span>{formData.basic.enterprise}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Tipo de investigación:</span>
                  <span>Behavioural Research</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Técnica:</span>
                  <span>AIM Framework Stage 3</span>
                </div>
              </div>
            </div>

            <p className="text-lg mb-2">
              Preparando espacio de trabajo conforme a las opciones seleccionadas.
            </p>
            <p className="text-xl font-bold">
              Dirigiendo al espacio creado en {countdown}...
            </p>
          </div>
        </div>
      )}

      {/* Contenido del formulario solo si no hay una investigación creada ni resumen */}
      {!createdResearchId && !showSummary && (
        <>
          {/* Progress Steps */}
          <div className="mb-2">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 w-full h-[2px] bg-neutral-100" />
              {steps.map((step) => (
                <div key={step.id} className="relative flex flex-col items-center">
                  <div className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white transition-colors',
                    formData.currentStep === step.id
                      ? 'border-blue-500 text-blue-500'
                      : formData.currentStep > step.id
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-neutral-200 text-neutral-400'
                  )}>
                    <span className="text-sm font-medium">{step.id}</span>
                  </div>
                  <div className="relative z-10 mt-4 text-center">
                    <p className={cn(
                      'text-sm font-medium',
                      formData.currentStep === step.id
                        ? 'text-neutral-900'
                        : 'text-neutral-500'
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

          {/* Form Content */}
          <div className="h-[400px] rounded-xl overflow-hidden">
            <div className="px-8 py-8">
              {formData.currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium">Name the Research</h2>
                    <p className="text-neutral-500 text-sm mb-6">Please, name the research project and assign it to an existing client or create a new one</p>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-medium text-neutral-900">
                          Research's name
                        </label>
                        <Input
                          id="name"
                          value={formData.basic.name}
                          onChange={(e) => updateFormData('name', e.target.value)}
                          placeholder="Project 001"
                          error={!!formData.errors.name}
                        />
                        {formData.errors.name && (
                          <p className="text-sm text-red-500">{formData.errors.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="enterprise" className="block text-sm font-medium text-neutral-900">
                          It&apos;s made for
                        </label>
                        <select
                          id="enterprise"
                          ref={enterpriseSelectRef}
                          value={formData.basic.enterprise}
                          onChange={(e) => updateFormData('enterprise', e.target.value)}
                          className={cn(
                            'w-full px-3 py-2 rounded-lg border bg-white text-neutral-900',
                            formData.errors.enterprise ? 'border-red-500' : 'border-neutral-200',
                            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                          )}
                        >
                          <option value="">Select an enterprise</option>
                          <option value="enterprise1">Enterprise 1</option>
                          <option value="enterprise2">Enterprise 2</option>
                          <option value="enterprise3">Enterprise 3</option>
                        </select>
                        {formData.errors.enterprise && (
                          <p className="text-sm text-red-500">{formData.errors.enterprise}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formData.currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-medium mb-2">Kind of research</h2>
                    <p className="text-neutral-500 text-sm mb-6">
                      Select the type of research you wish to carry out. In the next
                      step, you will be able to select between different configurations.
                    </p>

                    <div className="space-y-4">
                      {/* Solo Behavioural Research */}
                      <div className={cn(
                        'p-4 border rounded-lg transition-colors',
                        formData.basic.type === ResearchType.BEHAVIOURAL
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-neutral-200'
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
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
                          <Button
                            type="button"
                            variant={formData.basic.type === ResearchType.BEHAVIOURAL ? 'default' : 'outline'}
                            onClick={() => toggleResearchType(ResearchType.BEHAVIOURAL)}
                            className={formData.basic.type === ResearchType.BEHAVIOURAL ? 'bg-blue-500 hover:bg-blue-600' : ''}
                          >
                            {formData.basic.type === ResearchType.BEHAVIOURAL ? 'Selected' : 'Choose'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formData.currentStep === 3 && (
                <div className="space-y-6 h-[310px]">
                  <div>
                    <h2 className="text-xl font-medium mb-2">Techniques for Behavioural Research</h2>
                    <p className="text-neutral-500 text-sm mb-6">
                      Please, select the configuration for this research.
                    </p>

                    <div className="space-y-4">
                      {/* Opción 2: AIM Framework Stage 3 */}
                      <div className="flex items-center justify-between border border-neutral-200 rounded-lg p-4">
                        <div className="flex-1">
                          <div className="text-md font-medium mb-2">AIM Framework Stage 3</div>
                          <p className="text-sm text-neutral-600">
                            Start with VOC Smart or build an upgrade by your own
                          </p>
                        </div>
                        <div className="ml-4">
                          <Button
                            type="button"
                            variant={formData.basic.technique === 'aim-framework' ? 'default' : 'outline'}
                            onClick={() => toggleResearchTechnique('aim-framework')}
                            className={formData.basic.technique === 'aim-framework' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                          >
                            {formData.basic.technique === 'aim-framework' ? 'Selected' : 'Choose'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-between mt-4">
                {formData.currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                  >
                    Previous
                  </Button>
                )}
                <div className="ml-auto">
                  {formData.currentStep < steps.length ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={
                        (formData.currentStep === 2 && formData.basic.type !== ResearchType.BEHAVIOURAL) ||
                        (formData.currentStep === 3 && !formData.basic.technique)
                      }
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      loading={isSubmitting && !showSummary}
                      disabled={!formData.basic.technique}
                    >
                      {formData.basic.technique === 'aim-framework'
                        ? 'Setup AIM Framework'
                        : 'Create Research'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getResearchTypeDescription(type: ResearchType): string {
  switch (type) {
    case ResearchType.EYE_TRACKING:
      return 'Track and analyze user eye movements to understand visual attention and behavior patterns.';
    case ResearchType.ATTENTION_PREDICTION:
      return 'Predict and analyze where users are likely to focus their attention using AI models.';
    case ResearchType.COGNITIVE_ANALYSIS:
      return 'Analyze cognitive processes and decision-making patterns through various tasks and measurements.';
    case ResearchType.BEHAVIOURAL:
      return 'Analyze behavioral patterns and responses to understand user interactions and preferences.';
    default:
      return '';
  }
}
