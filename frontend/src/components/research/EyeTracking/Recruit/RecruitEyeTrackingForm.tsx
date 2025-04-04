'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';
import { useEyeTrackingRecruit } from './hooks/useEyeTrackingRecruit';
import { DemographicQuestionKey, LinkConfigKey, ParameterOptionKey, BacklinkKey } from '@/shared/interfaces/eyeTracking';

// Componente Checkbox interno
type CheckedState = boolean;

interface CheckboxProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: CheckedState;
  onCheckedChange?: (checked: CheckedState) => void;
  id?: string;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, id, ...props }, ref) => {
    return (
      <button
        ref={ref}
        role="checkbox"
        aria-checked={checked}
        id={id}
        data-state={checked ? "checked" : "unchecked"}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
          className
        )}
        {...props}
      >
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-white"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
    );
  }
);

Checkbox.displayName = "Checkbox";

interface RecruitEyeTrackingFormProps {
  researchId: string;
  className?: string;
}

export function RecruitEyeTrackingForm({ researchId, className }: RecruitEyeTrackingFormProps) {
  const {
    loading,
    saving,
    formData,
    stats,
    handleDemographicChange,
    handleLinkConfigChange,
    handleBacklinkChange,
    handleParamOptionChange,
    setLimitParticipants,
    setParticipantLimit,
    setResearchUrl,
    saveForm,
    generateRecruitmentLink,
    generateQRCode,
    copyLinkToClipboard,
    previewLink
  } = useEyeTrackingRecruit({ researchId });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 border-r-2 border-neutral-300"></div>
      </div>
    );
  }

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-6">
          <header className="mb-8 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-neutral-900">
              Nueva investigación de comportamiento
            </h1>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {}}
                className="flex items-center gap-2"
              >
                Cancelar
              </Button>
              <Button
                onClick={saveForm}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? 'Guardando...' : 'Guardar configuración'}
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left column */}
            <div>
              <div className="mb-8">
                <h2 className="text-base font-medium mb-4">Enlace de reclutamiento</h2>
                
                <div className="space-y-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Switch
                        checked={true}
                        onCheckedChange={() => {}}
                        className="mr-3"
                      />
                      <span className="text-sm font-medium">Preguntas demográficas</span>
                    </div>
                    <span className="text-sm text-neutral-400">Por favor seleccione</span>
                  </div>
                  
                  <div className="pl-10 space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="age"
                        checked={formData.demographicQuestions.age}
                        onCheckedChange={(checked: boolean) => handleDemographicChange('age' as DemographicQuestionKey, checked)}
                      />
                      <label htmlFor="age" className="text-sm">Edad</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="country"
                        checked={formData.demographicQuestions.country}
                        onCheckedChange={(checked: boolean) => handleDemographicChange('country' as DemographicQuestionKey, checked)}
                      />
                      <label htmlFor="country" className="text-sm">País</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="gender"
                        checked={formData.demographicQuestions.gender}
                        onCheckedChange={(checked: boolean) => handleDemographicChange('gender' as DemographicQuestionKey, checked)}
                      />
                      <label htmlFor="gender" className="text-sm">Género</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="educationLevel"
                        checked={formData.demographicQuestions.educationLevel}
                        onCheckedChange={(checked: boolean) => handleDemographicChange('educationLevel' as DemographicQuestionKey, checked)}
                      />
                      <label htmlFor="educationLevel" className="text-sm">Nivel educativo</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="householdIncome"
                        checked={formData.demographicQuestions.householdIncome}
                        onCheckedChange={(checked: boolean) => handleDemographicChange('householdIncome' as DemographicQuestionKey, checked)}
                      />
                      <label htmlFor="householdIncome" className="text-sm">Ingresos familiares anuales</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="employmentStatus"
                        checked={formData.demographicQuestions.employmentStatus}
                        onCheckedChange={(checked: boolean) => handleDemographicChange('employmentStatus' as DemographicQuestionKey, checked)}
                      />
                      <label htmlFor="employmentStatus" className="text-sm">Situación laboral</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="dailyHoursOnline"
                        checked={formData.demographicQuestions.dailyHoursOnline}
                        onCheckedChange={(checked: boolean) => handleDemographicChange('dailyHoursOnline' as DemographicQuestionKey, checked)}
                      />
                      <label htmlFor="dailyHoursOnline" className="text-sm">Horas diarias en línea</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="technicalProficiency"
                        checked={formData.demographicQuestions.technicalProficiency}
                        onCheckedChange={(checked: boolean) => handleDemographicChange('technicalProficiency' as DemographicQuestionKey, checked)}
                      />
                      <label htmlFor="technicalProficiency" className="text-sm">Competencia técnica</label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Switch
                        checked={true}
                        onCheckedChange={() => {}}
                        className="mr-3"
                      />
                      <span className="text-sm font-medium">Configuración del enlace</span>
                    </div>
                    <span className="text-sm text-neutral-400">Por favor seleccione</span>
                  </div>
                  
                  <div className="pl-10 space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="allowMobileDevices"
                        checked={formData.linkConfig.allowMobileDevices}
                        onCheckedChange={(checked: boolean) => handleLinkConfigChange('allowMobileDevices' as LinkConfigKey, checked)}
                      />
                      <label htmlFor="allowMobileDevices" className="text-sm">Permitir que los participantes realicen la encuesta en dispositivos móviles</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="trackLocation"
                        checked={formData.linkConfig.trackLocation}
                        onCheckedChange={(checked: boolean) => handleLinkConfigChange('trackLocation' as LinkConfigKey, checked)}
                      />
                      <label htmlFor="trackLocation" className="text-sm">Rastrear la ubicación de los participantes</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="multipleAttempts"
                        checked={formData.linkConfig.multipleAttempts}
                        onCheckedChange={(checked: boolean) => handleLinkConfigChange('multipleAttempts' as LinkConfigKey, checked)}
                      />
                      <label htmlFor="multipleAttempts" className="text-sm">Se puede realizar varias veces dentro de una misma sesión</label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Switch
                        checked={formData.participantLimit.enabled}
                        onCheckedChange={setLimitParticipants}
                        className="mr-3"
                      />
                      <span className="text-sm font-medium">Limitar número de participantes</span>
                    </div>
                    <span className="text-sm text-neutral-400">Por favor seleccione</span>
                  </div>
                  
                  {formData.participantLimit.enabled && (
                    <div className="pl-10">
                      <p className="text-sm mb-3">Dejar de aceptar respuestas después de este número de participantes.</p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={formData.participantLimit.limit}
                          onChange={(e) => setParticipantLimit(parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <span className="text-sm">Recibirás {formData.participantLimit.limit} respuestas más.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right column */}
            <div>
              <div className="mb-8">
                <h2 className="text-base font-medium mb-4">Configuración de la investigación</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3">A. Enlaces de retorno</h3>
                    <p className="text-sm text-neutral-500 mb-4">Utilice parámetros uid para transmitir los ID de los participantes a su sistema</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm mb-2">Enlace para entrevistas completadas</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 bg-neutral-100 border border-r-0 border-neutral-300 rounded-l-md text-sm text-neutral-600">
                            https://
                          </span>
                          <Input
                            value={formData.backlinks.complete}
                            onChange={(e) => handleBacklinkChange('complete' as BacklinkKey, e.target.value)}
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-2">Enlace para entrevistas descalificadas</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 bg-neutral-100 border border-r-0 border-neutral-300 rounded-l-md text-sm text-neutral-600">
                            https://
                          </span>
                          <Input
                            value={formData.backlinks.disqualified}
                            onChange={(e) => handleBacklinkChange('disqualified' as BacklinkKey, e.target.value)}
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-2">Enlace para entrevistas excedidas</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 bg-neutral-100 border border-r-0 border-neutral-300 rounded-l-md text-sm text-neutral-600">
                            https://
                          </span>
                          <Input
                            value={formData.backlinks.overquota}
                            onChange={(e) => handleBacklinkChange('overquota' as BacklinkKey, e.target.value)}
                            className="rounded-l-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">B. Enlace de investigación para compartir</h3>
                    <p className="text-sm text-neutral-500 mb-4">El sistema de invitación externo debe sustituir el parámetro [ID del participante] por el ID individual del participante.</p>
                    
                    <div>
                      <label className="block text-sm mb-2">URL de la investigación</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 bg-neutral-100 border border-r-0 border-neutral-300 rounded-l-md text-sm text-neutral-600">
                          https://
                        </span>
                        <Input
                          value={formData.researchUrl}
                          onChange={(e) => setResearchUrl(e.target.value)}
                          className="rounded-l-none rounded-r-none"
                        />
                        <button 
                          className="px-2 py-2 bg-neutral-100 border border-l-0 border-neutral-300 rounded-r-md text-neutral-600"
                          onClick={copyLinkToClipboard}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex mt-4 gap-4">
                      <Button
                        variant="outline"
                        onClick={previewLink}
                        className="flex items-center gap-2"
                      >
                        <span>Vista previa del enlace</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </Button>
                      
                      <Button
                        onClick={generateQRCode}
                        className="flex items-center gap-2"
                      >
                        <span>Generar QR</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <rect x="7" y="7" width="3" height="3"></rect>
                          <rect x="14" y="7" width="3" height="3"></rect>
                          <rect x="7" y="14" width="3" height="3"></rect>
                          <rect x="14" y="14" width="3" height="3"></rect>
                        </svg>
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">C. Parámetros de investigación a guardar</h3>
                    <p className="text-sm text-neutral-500 mb-4">Especifique los parámetros que desea guardar (claves separadas por comas)</p>
                    
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                        <Checkbox 
                          id="parameters"
                          checked={formData.parameterOptions.parameters}
                          onCheckedChange={(checked: boolean) => handleParamOptionChange('parameters' as ParameterOptionKey, checked)}
                          className="h-4 w-4"
                        />
                        <label htmlFor="parameters" className="text-xs text-blue-600">Parámetros</label>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                        <Checkbox 
                          id="separated"
                          checked={formData.parameterOptions.separated}
                          onCheckedChange={(checked: boolean) => handleParamOptionChange('separated' as ParameterOptionKey, checked)}
                          className="h-4 w-4"
                        />
                        <label htmlFor="separated" className="text-xs text-blue-600">Separados</label>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                        <Checkbox 
                          id="with"
                          checked={formData.parameterOptions.with}
                          onCheckedChange={(checked: boolean) => handleParamOptionChange('with' as ParameterOptionKey, checked)}
                          className="h-4 w-4"
                        />
                        <label htmlFor="with" className="text-xs text-blue-600">Con</label>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                        <Checkbox 
                          id="comma"
                          checked={formData.parameterOptions.comma}
                          onCheckedChange={(checked: boolean) => handleParamOptionChange('comma' as ParameterOptionKey, checked)}
                          className="h-4 w-4"
                        />
                        <label htmlFor="comma" className="text-xs text-blue-600">Coma</label>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                        <Checkbox 
                          id="keys"
                          checked={formData.parameterOptions.keys}
                          onCheckedChange={(checked: boolean) => handleParamOptionChange('keys' as ParameterOptionKey, checked)}
                          className="h-4 w-4"
                        />
                        <label htmlFor="keys" className="text-xs text-blue-600">Claves</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Statistics row */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {stats && Object.entries(stats).map(([key, data]) => (
              <div 
                key={key} 
                className={cn(
                  "rounded-lg overflow-hidden",
                  key === 'complete' ? 'bg-blue-500' : 
                  key === 'disqualified' ? 'bg-amber-500' : 'bg-red-500'
                )}
              >
                <div className="p-4 text-white">
                  <h3 className="font-medium">Entrevistas</h3>
                  <h2 className="text-2xl font-bold mt-1">{data.label}</h2>
                  <div className="mt-2 flex items-center justify-between">
                    <span>{data.count} {data.description}</span>
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{data.percentage}%</span>
                      </div>
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-current opacity-25" strokeWidth="3"></circle>
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="16" 
                          fill="none" 
                          className="stroke-current" 
                          strokeWidth="3" 
                          strokeDasharray="100" 
                          strokeDashoffset={100 - data.percentage}
                          transform="rotate(-90 18 18)"
                        ></circle>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 