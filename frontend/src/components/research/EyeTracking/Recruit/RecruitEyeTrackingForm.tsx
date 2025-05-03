'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useEyeTrackingRecruit } from './hooks/useEyeTrackingRecruit';
import { DemographicQuestionKeys, ParameterOptionKeys, BacklinkKeys } from '@/shared/interfaces/eyeTrackingRecruit.interface';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorModal } from './components';


interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, id, ...props }, ref) => {
    // Asegurarse de que checked tenga un valor predeterminado
    const isChecked = checked || false;

    // Función de manejador de clic mejorada
    const handleClick = () => {
      console.log('Checkbox clicked, current state:', isChecked);
      if (onCheckedChange) {
        onCheckedChange(!isChecked);
      }
    };

    return (
      <button
        ref={ref}
        role="checkbox"
        aria-checked={isChecked}
        id={id}
        data-state={isChecked ? "checked" : "unchecked"}
        onClick={handleClick}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
          className
        )}
        {...props}
      >
        {isChecked && (
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
    demographicQuestionsEnabled,
    setDemographicQuestionsEnabled,
    linkConfigEnabled,
    setLinkConfigEnabled,
    handleDemographicChange,
    handleLinkConfigChange,
    handleBacklinkChange,
    handleParamOptionChange,
    setLimitParticipants,
    setParticipantLimit,
    saveForm,
    generateRecruitmentLink,
    generateQRCode,
    copyLinkToClipboard,
    modalError,
    modalVisible,
    closeModal
  } = useEyeTrackingRecruit({ researchId });

  // Function to determine the save button text
  const getSaveButtonText = () => {
    if (saving) {
      return 'Guardando...';
    }
    // If formData.id exists, it's an update
    if (formData.id) {
      return 'Actualizar';
    }
    // Otherwise, it's a new creation
    return 'Guardar';
  };

  if (loading) {
    return (
      <>
        <div className={cn("max-w-4xl", className)}>
          <LoadingSkeleton variant="form" rows={8} title={true} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className={cn("max-w-[1600px]", className)}>
        <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div>
                <div className="mb-8">
                  <h2 className="text-base font-medium mb-4">Enlace de reclutamiento</h2>

                  <div className="space-y-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={demographicQuestionsEnabled}
                          onChange={(e) => {
                            console.log('Demográficas cambiado:', e.target.checked);
                            setDemographicQuestionsEnabled(e.target.checked);
                          }}
                          className="w-5 h-5 mr-3 cursor-pointer"
                        />
                        <span className="text-sm font-medium">Preguntas demográficas</span>
                      </div>
                      <span className="text-sm text-neutral-400">Por favor seleccione</span>
                    </div>

                    <div className={`pl-10 space-y-3 ${!demographicQuestionsEnabled ? 'opacity-60' : ''}`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="age"
                          checked={formData.demographicQuestions.age.enabled}
                          onChange={(e) => {
                            console.log('Edad cambiado:', e.target.checked);
                            handleDemographicChange('age' as DemographicQuestionKeys, e.target.checked);
                          }}
                          disabled={!demographicQuestionsEnabled}
                          className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label htmlFor="age" className={`text-sm ${demographicQuestionsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>Edad</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="country"
                          checked={formData.demographicQuestions.country.enabled}
                          onChange={(e) => {
                            console.log('País cambiado:', e.target.checked);
                            handleDemographicChange('country' as DemographicQuestionKeys, e.target.checked);
                          }}
                          disabled={!demographicQuestionsEnabled}
                          className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label htmlFor="country" className={`text-sm ${demographicQuestionsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>País</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="gender"
                          checked={formData.demographicQuestions.gender.enabled}
                          onChange={(e) => handleDemographicChange('gender' as DemographicQuestionKeys, e.target.checked)}
                          disabled={!demographicQuestionsEnabled}
                          className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label htmlFor="gender" className={`text-sm ${demographicQuestionsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>Género</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="educationLevel"
                          checked={formData.demographicQuestions.educationLevel.enabled}
                          onChange={(e) => handleDemographicChange('educationLevel' as DemographicQuestionKeys, e.target.checked)}
                          disabled={!demographicQuestionsEnabled}
                          className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label htmlFor="educationLevel" className={`text-sm ${demographicQuestionsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>Nivel educativo</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="householdIncome"
                          checked={formData.demographicQuestions.householdIncome.enabled}
                          onChange={(e) => handleDemographicChange('householdIncome' as DemographicQuestionKeys, e.target.checked)}
                          disabled={!demographicQuestionsEnabled}
                          className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label htmlFor="householdIncome" className={`text-sm ${demographicQuestionsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>Ingresos familiares anuales</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="employmentStatus"
                          checked={formData.demographicQuestions.employmentStatus.enabled}
                          onChange={(e) => handleDemographicChange('employmentStatus' as DemographicQuestionKeys, e.target.checked)}
                          disabled={!demographicQuestionsEnabled}
                          className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label htmlFor="employmentStatus" className={`text-sm ${demographicQuestionsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>Situación laboral</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="dailyHoursOnline"
                          checked={formData.demographicQuestions.dailyHoursOnline.enabled}
                          onChange={(e) => handleDemographicChange('dailyHoursOnline' as DemographicQuestionKeys, e.target.checked)}
                          disabled={!demographicQuestionsEnabled}
                          className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label htmlFor="dailyHoursOnline" className={`text-sm ${demographicQuestionsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>Horas diarias en línea</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="technicalProficiency"
                          checked={formData.demographicQuestions.technicalProficiency.enabled}
                          onChange={(e) => handleDemographicChange('technicalProficiency' as DemographicQuestionKeys, e.target.checked)}
                          disabled={!demographicQuestionsEnabled}
                          className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label htmlFor="technicalProficiency" className={`text-sm ${demographicQuestionsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>Competencia técnica</label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={linkConfigEnabled}
                          onChange={(e) => {
                            console.log('Configuración enlace cambiado:', e.target.checked);
                            setLinkConfigEnabled(e.target.checked);
                          }}
                          className="w-5 h-5 mr-3 cursor-pointer"
                        />
                        <span className="text-sm font-medium">Configuración del enlace</span>
                      </div>
                      <span className="text-sm text-neutral-400">Por favor seleccione</span>
                    </div>

                    <div className={`pl-10 space-y-3 ${!linkConfigEnabled ? 'opacity-60' : ''}`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="allowMobile"
                          checked={formData.linkConfig.allowMobile}
                          onChange={(e) => {
                            console.log('Dispositivos móviles clicado:', e.target.checked);
                            handleLinkConfigChange('allowMobile', e.target.checked);
                          }}
                          disabled={!linkConfigEnabled}
                          className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label htmlFor="allowMobile" className={`text-sm ${linkConfigEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>Permitir que los participantes realicen la encuesta en dispositivos móviles</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="trackLocation"
                          checked={formData.linkConfig.trackLocation}
                          onChange={(e) => handleLinkConfigChange('trackLocation', e.target.checked)}
                          disabled={!linkConfigEnabled}
                          className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label htmlFor="trackLocation" className={`text-sm ${linkConfigEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>Rastrear la ubicación de los participantes</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="allowMultipleAttempts"
                          checked={formData.linkConfig.allowMultipleAttempts}
                          onChange={(e) => handleLinkConfigChange('allowMultipleAttempts', e.target.checked)}
                          disabled={!linkConfigEnabled}
                          className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label htmlFor="allowMultipleAttempts" className={`text-sm ${linkConfigEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>Se puede realizar varias veces dentro de una misma sesión</label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.participantLimit.enabled}
                          onChange={(e) => {
                            console.log('Límite cambiado:', e.target.checked);
                            setLimitParticipants(e.target.checked);
                          }}
                          className="w-5 h-5 mr-3 cursor-pointer"
                        />
                        <span className="text-sm font-medium">Limitar número de participantes</span>
                      </div>
                      <span className="text-sm text-neutral-400">Por favor seleccione</span>
                    </div>

                    <div className={`pl-10 ${!formData.participantLimit.enabled ? 'opacity-60' : ''}`}>
                      <p className="text-sm mb-3">Dejar de aceptar respuestas después de este número de participantes.</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={formData.participantLimit.value}
                          onChange={(e) => setParticipantLimit(parseInt(e.target.value) || 0)}
                          disabled={!formData.participantLimit.enabled}
                          className="w-20 px-3 py-2 border border-neutral-300 rounded-md disabled:bg-neutral-100 disabled:cursor-not-allowed"
                        />
                        <span className="text-sm">Recibirás {formData.participantLimit.value} respuestas más.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div>
                <div className="mb-8">
                  <h2 className="text-base font-medium mb-4">Configuración de la investigación</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center">
                        A. Enlaces de retorno
                        <div className="relative ml-2 group">
                          <span className="cursor-help w-5 h-5 rounded-full bg-blue-100 text-blue-600 inline-flex items-center justify-center text-xs font-bold">i</span>
                          <div className="absolute left-0 transform -translate-y-full top-0 w-72 bg-white p-3 rounded shadow-lg border border-neutral-200 hidden group-hover:block z-10 text-sm text-blue-700">
                            <p><strong>¿Qué son los enlaces de retorno?</strong></p>
                            <p className="mt-1">Son URLs a las que se redirigirá a los participantes después de completar, ser descalificados o exceder la cuota de la investigación. Por ejemplo, podrían ser redirigidos a:</p>
                            <ul className="list-disc pl-5 mt-1">
                              <li>Su sitio web principal</li>
                              <li>Una página de agradecimiento</li>
                              <li>Un panel de encuestas externo</li>
                            </ul>
                            <p className="mt-1">El sistema añadirá automáticamente un parámetro <code className="bg-blue-100 px-1 py-0.5 rounded">?uid=PARTICIPANT_ID</code> al final de cada URL para que pueda identificar al participante en su sistema.</p>
                          </div>
                        </div>
                      </h3>
                      <p className="text-sm text-neutral-500 mb-4">Utilice parámetros uid para transmitir los ID de los participantes a su sistema</p>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm mb-2">Enlace para entrevistas completadas</label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 bg-neutral-100 border border-r-0 border-neutral-300 rounded-l-md text-sm text-neutral-600">
                              https://
                            </span>
                            <input
                              type="text"
                              value={formData.backlinks.complete}
                              onChange={(e) => handleBacklinkChange('complete' as BacklinkKeys, e.target.value)}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-r-md"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm mb-2">Enlace para entrevistas descalificadas</label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 bg-neutral-100 border border-r-0 border-neutral-300 rounded-l-md text-sm text-neutral-600">
                              https://
                            </span>
                            <input
                              type="text"
                              value={formData.backlinks.disqualified}
                              onChange={(e) => handleBacklinkChange('disqualified' as BacklinkKeys, e.target.value)}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-r-md"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm mb-2">Enlace para entrevistas excedidas</label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 bg-neutral-100 border border-r-0 border-neutral-300 rounded-l-md text-sm text-neutral-600">
                              https://
                            </span>
                            <input
                              type="text"
                              value={formData.backlinks.overquota}
                              onChange={(e) => handleBacklinkChange('overquota' as BacklinkKeys, e.target.value)}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-r-md"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center">
                        B. Enlace de investigación para compartir
                        <div className="relative ml-2 group">
                          <span className="cursor-help w-5 h-5 rounded-full bg-green-100 text-green-600 inline-flex items-center justify-center text-xs font-bold">i</span>
                          <div className="absolute left-0 transform -translate-y-full top-0 w-72 bg-white p-3 rounded shadow-lg border border-neutral-200 hidden group-hover:block z-10 text-sm text-green-700">
                            <p><strong>¿Cómo funciona este enlace?</strong></p>
                            <p className="mt-1">Esta es la URL que se debe compartir con participantes potenciales para invitarlos al estudio. Funciona así:</p>
                            <ul className="list-disc pl-5 mt-1">
                              <li>La URL contiene un marcador <code className="bg-green-100 px-1 py-0.5 rounded">{"participant_id"}</code> que debe ser reemplazado</li>
                              <li>Si usa un panel externo, ellos reemplazarán este marcador con el ID único de cada participante</li>
                              <li>Si comparte manualmente, puede reemplazarlo con cualquier identificador (ej. correo o nombre)</li>
                            </ul>
                            <p className="mt-1">Ejemplo: <code className="bg-green-100 px-1 py-0.5 rounded">www.useremotion.com/sysgd-jye746?respondent=123</code> donde "123" es el ID único del participante.</p>
                          </div>
                        </div>
                      </h3>
                      <p className="text-sm text-neutral-500 mb-4">El sistema de invitación externo debe sustituir el parámetro [ID del participante] por el ID individual del participante.</p>

                      <div>
                        <label className="block text-sm mb-2">URL de la investigación</label>
                        <div className="flex">
                          <input
                            type="text"
                            value={formData.researchUrl}
                            readOnly
                            className="w-full px-3 py-2 border border-neutral-300 rounded-l-md bg-neutral-50 cursor-not-allowed"
                          />
                          <button
                            type="button"
                            className="px-2 py-2 bg-neutral-100 border border-l-0 border-neutral-300 rounded-r-md text-neutral-600"
                            onClick={copyLinkToClipboard}
                            title="Copiar enlace"
                            aria-label="Copiar enlace al portapapeles"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Esta URL se genera automáticamente con la misma que aparece en "Abrir vista de participante"
                        </div>
                      </div>

                      <div className="flex mt-4 gap-4">
                        <button
                          type="button"
                          onClick={generateQRCode}
                          className="px-4 py-2 rounded-lg bg-neutral-900 text-white shadow hover:bg-neutral-800 text-sm font-medium flex items-center gap-2"
                          aria-label="Generar código QR"
                        >
                          <span>Generar QR</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <rect x="7" y="7" width="3" height="3"></rect>
                            <rect x="14" y="7" width="3" height="3"></rect>
                            <rect x="7" y="14" width="3" height="3"></rect>
                            <rect x="14" y="14" width="3" height="3"></rect>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3 mt-10">C. Parámetros de investigación a guardar</h3>
                <p className="text-sm text-neutral-500 mb-4">Especifique los parámetros que desea guardar (claves separadas por comas)</p>

                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                    <input
                      type="checkbox"
                      id="saveDeviceInfo"
                      checked={formData.parameterOptions.saveDeviceInfo}
                      onChange={(e) => handleParamOptionChange('saveDeviceInfo' as ParameterOptionKeys, e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="saveDeviceInfo" className="text-xs text-blue-600 cursor-pointer">Guardar información del dispositivo</label>
                  </div>

                  <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                    <input
                      type="checkbox"
                      id="saveLocationInfo"
                      checked={formData.parameterOptions.saveLocationInfo}
                      onChange={(e) => handleParamOptionChange('saveLocationInfo' as ParameterOptionKeys, e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="saveLocationInfo" className="text-xs text-blue-600 cursor-pointer">Guardar información de ubicación</label>
                  </div>

                  <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                    <input
                      type="checkbox"
                      id="saveResponseTimes"
                      checked={formData.parameterOptions.saveResponseTimes}
                      onChange={(e) => handleParamOptionChange('saveResponseTimes' as ParameterOptionKeys, e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="saveResponseTimes" className="text-xs text-blue-600 cursor-pointer">Guardar tiempos de respuesta</label>
                  </div>

                  <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                    <input
                      type="checkbox"
                      id="saveUserJourney"
                      checked={formData.parameterOptions.saveUserJourney}
                      onChange={(e) => handleParamOptionChange('saveUserJourney' as ParameterOptionKeys, e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="saveUserJourney" className="text-xs text-blue-600 cursor-pointer">Guardar recorrido del usuario</label>
                  </div>
                </div>
                <div className="flex justify-end self-end">
                <button
                  type="button"
                  onClick={saveForm}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-neutral-900 text-white shadow hover:bg-neutral-800 text-sm font-medium disabled:opacity-50 flex items-center justify-center min-w-[160px] mt-8"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <Spinner size="sm" className="text-white" />
                      <span>Guardando...</span>
                    </div>
                  ) : getSaveButtonText()}
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para mostrar mensajes y errores */}
      <ErrorModal
        isOpen={modalVisible}
        onClose={closeModal}
        error={modalError}
      />
    </>
  );
} 