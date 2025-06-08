import { useState } from 'react';
import { StudyLayout } from '../layout/StudyLayout';
import { FormCard } from '../layout/FormCard';
import { getStandardButtonText, getButtonDisabledState, formSpacing } from '@/utils/formHelpers';

// Datos de ejemplo para el estudio
const exampleSteps = [
  { id: 'welcome', name: 'Bienvenida', type: 'welcome', completed: true },
  { id: 'demographics', name: 'Datos demográficos', type: 'demographic', completed: true },
  { id: 'survey-1', name: 'Encuesta de satisfacción', type: 'survey', completed: false },
  { id: 'survey-2', name: 'Experiencia del cliente', type: 'survey', completed: false },
  { id: 'feedback', name: 'Comentarios finales', type: 'feedback', completed: false },
  { id: 'thankyou', name: 'Agradecimiento', type: 'thankyou', completed: false },
];

export function StudyLayoutExample() {
  const [currentStep, setCurrentStep] = useState(2); // Paso actual (0-indexed)
  const [formData, setFormData] = useState({
    satisfaction: '',
    recommendation: '',
    comments: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Simular navegación
  const handleNavigateToStep = (stepIndex: number) => {
    console.log(`Navegando al paso ${stepIndex}`);
    setCurrentStep(stepIndex);
  };

  // Simular envío de formulario
  const handleSubmit = async () => {
    setIsLoading(true);
    
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Marcar paso como completado y avanzar
    const updatedSteps = [...exampleSteps];
    updatedSteps[currentStep].completed = true;
    
    setIsLoading(false);
    
    // Avanzar al siguiente paso
    if (currentStep < exampleSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Renderizar contenido según el paso actual
  const renderStepContent = () => {
    const step = exampleSteps[currentStep];
    
    switch (step.id) {
      case 'survey-1':
        return (
          <FormCard 
            title="Encuesta de Satisfacción"
            description="Ayúdanos a entender tu experiencia"
            showProgress
            currentStep={currentStep + 1}
            totalSteps={exampleSteps.length}
          >
            <div className={`space-y-6 ${formSpacing.section}`}>
              {/* Pregunta de satisfacción */}
              <div>
                <label className={`block text-sm font-medium text-neutral-700 ${formSpacing.label}`}>
                  ¿Qué tan satisfecho estás con nuestro servicio?
                </label>
                <div className="space-y-2">
                  <p className="text-sm text-neutral-500 italic">
                    Las opciones de respuesta se configuran dinámicamente según las necesidades del estudio.
                  </p>
                </div>
              </div>

              {/* Pregunta de recomendación */}
              <div>
                <label className={`block text-sm font-medium text-neutral-700 ${formSpacing.label}`}>
                  ¿Recomendarías nuestro servicio?
                </label>
                <div className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50">
                  <p className="text-sm text-neutral-500 italic">
                    Campo dinámico - las opciones se configuran según el estudio
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={getButtonDisabledState({
                isRequired: true,
                value: formData.satisfaction && formData.recommendation,
                isSaving: isLoading,
                isLoading
              })}
              className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${formSpacing.button}`}
            >
              {getStandardButtonText({
                isSaving: isLoading,
                hasExistingData: false
              })}
            </button>
          </FormCard>
        );
        
      case 'survey-2':
        return (
          <FormCard 
            title="Experiencia del Cliente"
            description="Comparte más detalles sobre tu experiencia"
            showProgress
            currentStep={currentStep + 1}
            totalSteps={exampleSteps.length}
          >
            <div className={formSpacing.section}>
              <label className={`block text-sm font-medium text-neutral-700 ${formSpacing.label}`}>
                Comparte cualquier comentario adicional
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Escribe tus comentarios aquí..."
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${formSpacing.button}`}
            >
              {getStandardButtonText({
                isSaving: isLoading,
                hasExistingData: !!formData.comments.trim()
              })}
            </button>
          </FormCard>
        );
        
      default:
        return (
          <FormCard 
            title={step.name}
            description={`Contenido para el paso: ${step.type}`}
          >
            <div className="text-center py-8">
              <p className="text-neutral-600 mb-4">
                Este es el contenido para el paso "{step.name}"
              </p>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${formSpacing.button}`}
              >
                {isLoading ? 'Cargando...' : 'Continuar'}
              </button>
            </div>
          </FormCard>
        );
    }
  };

  return (
    <StudyLayout
      researchId="example-research-123"
      sidebarSteps={exampleSteps}
      currentStepIndex={currentStep}
      onNavigateToStep={handleNavigateToStep}
      showProgressBar={true}
    >
      {renderStepContent()}
    </StudyLayout>
  );
} 