'use client';

import { useState } from 'react';
import { StudyLayout } from '../layout/StudyLayout';
import { FormCard } from '../layout/FormCard';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';
import { formSpacing, getStandardButtonText, getButtonDisabledState } from '@/utils/formHelpers';

interface DemographicsFormWithNewDesignProps {
  className?: string;
  researchId?: string;
}

interface DemographicQuestion {
  id: string;
  label: string;
  type: 'single-choice' | 'multiple-choice' | 'text' | 'number';
  isRequired: boolean;
  enabled: boolean;
  options?: string[];
}

export function DemographicsFormWithNewDesign({ 
  className, 
  researchId = "demo-research-001" 
}: DemographicsFormWithNewDesignProps) {
  const [questions, setQuestions] = useState<DemographicQuestion[]>([
    {
      id: 'age',
      label: 'Edad',
      type: 'single-choice',
      isRequired: true,
      enabled: true,
      options: ['Menor de 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
    },
    {
      id: 'gender',
      label: 'Género',
      type: 'single-choice',
      isRequired: true,
      enabled: true,
      options: ['Masculino', 'Femenino', 'No binario', 'Prefiero no decir']
    },
    {
      id: 'country',
      label: 'País de Residencia',
      type: 'single-choice',
      isRequired: true,
      enabled: true,
      options: ['Estados Unidos', 'Canadá', 'Reino Unido', 'Alemania', 'Francia', 'España', 'Otro']
    },
    {
      id: 'education',
      label: 'Nivel Educativo',
      type: 'single-choice',
      isRequired: false,
      enabled: true,
      options: ['Secundaria', 'Universidad (parcial)', 'Licenciatura', 'Maestría', 'Doctorado', 'Otro']
    }
  ]);

  const [isSaving, setIsSaving] = useState(false);

  // Datos de ejemplo para el sidebar
  const studySteps = [
    { id: 'welcome', name: 'Bienvenida', type: 'welcome', completed: true },
    { id: 'demographics', name: 'Datos Demográficos', type: 'demographic', completed: false },
    { id: 'survey', name: 'Encuesta Principal', type: 'survey', completed: false },
    { id: 'feedback', name: 'Comentarios', type: 'feedback', completed: false },
    { id: 'thankyou', name: 'Agradecimiento', type: 'thankyou', completed: false },
  ];

  const toggleQuestionEnabled = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? {...q, enabled: !q.enabled} : q
    ));
  };

  const toggleQuestionRequired = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? {...q, isRequired: !q.isRequired} : q
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSaving(false);
    
    // Aquí podrías navegar al siguiente paso
    console.log('Configuración guardada');
  };

  const hasAnyEnabled = questions.some(q => q.enabled);

  return (
    <StudyLayout
      researchId={researchId}
      sidebarSteps={studySteps}
      currentStepIndex={1} // Paso de demografía
      showProgressBar={true}
      className={className}
    >
      <FormCard
        title="Configuración de Preguntas Demográficas"
        description="Configure las preguntas estándar demográficas que se harán a todos los participantes"
        variant="wide"
      >
        {/* Información contextual */}
        <div className={`p-4 bg-amber-50 border border-amber-200 rounded-lg ${formSpacing.section}`}>
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-amber-800">
              Las preguntas demográficas te ayudan a entender mejor a tu audiencia de investigación. 
              Activa solo las preguntas que sean relevantes para tus objetivos de investigación.
            </p>
          </div>
        </div>

        {/* Lista de preguntas */}
        <div className={`space-y-4 ${formSpacing.section}`}>
          {questions.map((question) => (
            <div 
              key={question.id} 
              className={cn(
                'border rounded-lg overflow-hidden transition-all duration-200',
                question.enabled 
                  ? 'border-neutral-200 bg-white shadow-sm' 
                  : 'border-neutral-200 bg-neutral-50'
              )}
            >
              <div className="p-4">
                {/* Header de la pregunta */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <h3 className={cn(
                      'text-sm font-medium',
                      question.enabled ? 'text-neutral-900' : 'text-neutral-500'
                    )}>
                      {question.label}
                    </h3>
                    {question.isRequired && question.enabled && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                        Requerida
                      </span>
                    )}
                  </div>
                  <Switch 
                    checked={question.enabled}
                    onCheckedChange={() => toggleQuestionEnabled(question.id)}
                  />
                </div>
                
                {/* Detalles de la pregunta (solo si está habilitada) */}
                {question.enabled && (
                  <>
                    <div className="mb-3">
                      <div className="text-xs text-neutral-500 mb-1">Tipo de Pregunta</div>
                      <div className="text-sm text-neutral-700">
                        {question.type === 'single-choice' ? 'Opción única' : 
                         question.type === 'multiple-choice' ? 'Opción múltiple' : 
                         question.type === 'text' ? 'Texto libre' : 'Número'}
                      </div>
                    </div>
                    
                    {/* Opciones */}
                    {question.options && (
                      <div className="mb-3">
                        <div className="text-xs text-neutral-500 mb-2">Opciones</div>
                        <div className="flex flex-wrap gap-2">
                          {question.options.map((option, index) => (
                            <span 
                              key={index} 
                              className="text-xs px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full"
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Controles */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`required-${question.id}`}
                          checked={question.isRequired}
                          onChange={() => toggleQuestionRequired(question.id)}
                          className="mr-2 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor={`required-${question.id}`} className="text-sm text-neutral-700">
                          Hacer requerida
                        </label>
                      </div>
                      <Button size="sm" variant="outline">
                        Editar Opciones
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botón para agregar nueva pregunta */}
        <div className={formSpacing.section}>
          <Button variant="outline" className="w-full">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar Nueva Pregunta
          </Button>
        </div>

        {/* Estadísticas rápidas */}
        <div className={`bg-neutral-50 rounded-lg p-4 ${formSpacing.section}`}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-neutral-900">
                {questions.filter(q => q.enabled).length}
              </div>
              <div className="text-xs text-neutral-500">Habilitadas</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-neutral-900">
                {questions.filter(q => q.enabled && q.isRequired).length}
              </div>
              <div className="text-xs text-neutral-500">Requeridas</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-neutral-900">
                {questions.filter(q => !q.enabled).length}
              </div>
              <div className="text-xs text-neutral-500">Deshabilitadas</div>
            </div>
          </div>
        </div>

        {/* Botón de guardar */}
        <div className="flex justify-end gap-3">
          <Button variant="outline">
            Vista Previa
          </Button>
          <button
            onClick={handleSave}
            disabled={getButtonDisabledState({
              isRequired: true,
              value: hasAnyEnabled,
              isSaving,
              isLoading: isSaving
            })}
            className={`bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${formSpacing.button}`}
          >
            {getStandardButtonText({
              isSaving,
              hasExistingData: false,
              customSavingText: 'Guardando configuración...',
              customCreateText: 'Guardar y Continuar'
            })}
          </button>
        </div>
      </FormCard>
    </StudyLayout>
  );
} 