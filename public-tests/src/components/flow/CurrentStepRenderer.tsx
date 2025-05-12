import React, { useState, useEffect, useCallback } from 'react';
import { ParticipantLogin } from '../auth/ParticipantLogin';
import WelcomeScreenHandler from './WelcomeScreenHandler';
import { Participant } from '../../../../shared/interfaces/participant';
import { CSATView, ThankYouView, DifficultyScaleView, NPSView } from '../smartVoc';
import { DemographicsForm } from '../demographics/DemographicsForm';
import { DemographicResponses, DEFAULT_DEMOGRAPHICS_CONFIG } from '../../types/demographics';
import { eyeTrackingService } from '../../services/eyeTracking.service';
import { useParticipantStore } from '../../stores/participantStore';
import { useResponseAPI } from '../../hooks/useResponseAPI';
import { ApiClient, APIStatus } from '../../lib/api';

interface ApiDemographicQuestion {
  enabled: boolean;
  required: boolean;
  options?: string[];
}

interface ApiDemographicQuestions {
  age?: ApiDemographicQuestion;
  country?: ApiDemographicQuestion;
  gender?: ApiDemographicQuestion;
  educationLevel?: ApiDemographicQuestion;
  householdIncome?: ApiDemographicQuestion;
  employmentStatus?: ApiDemographicQuestion;
  dailyHoursOnline?: ApiDemographicQuestion;
  technicalProficiency?: ApiDemographicQuestion;
  [key: string]: ApiDemographicQuestion | undefined;
}

// Extender la interfaz EyeTrackingFormData
interface ExtendedEyeTrackingData {
  demographicQuestions?: ApiDemographicQuestions;
  id?: string;
  researchId?: string;
  backlinks?: {
    complete: string;
    disqualified: string;
    overquota: string;
  };
  createdAt?: string;
  updatedAt?: string;
  linkConfig?: {
    allowMobile: boolean;
    trackLocation: boolean;
    allowMultipleAttempts: boolean;
  };
  parameterOptions?: {
    saveDeviceInfo: boolean;
    saveLocationInfo: boolean;
    saveResponseTimes: boolean;
    saveUserJourney: boolean;
  };
  participantLimit?: {
    enabled: boolean;
    value: number;
  };
  metadata?: {
    createdAt: string;
    updatedAt: string;
    lastModifiedBy: string;
  };
}

const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';

const MockDataWarning: React.FC<{ message?: string }> = ({ message }) => (
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 mt-2 bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-1 rounded-md text-xs shadow z-20">
        ⚠️ {message || 'Mostrando datos de prueba'}
    </div>
);

interface CurrentStepRendererProps {
    stepType: string;
    stepConfig?: any;    
    stepId?: string;     
    stepName?: string;   
    researchId: string;
    token?: string | null; 
    onLoginSuccess?: (participant: Participant) => void;
    onStepComplete?: (answer?: any) => void;
    onError: (errorMessage: string, stepType: string) => void;
}

// Interfaz para las props de DemographicStep (para claridad)
interface DemographicStepProps {
    researchId: string;
    token?: string | null;
    stepConfig?: any;
    onStepComplete?: (answer?: any) => void;
    onError: (errorMessage: string, stepType: string) => void;
}

// === COMPONENTE DemographicStep MOVIDO FUERA ===
const DemographicStep: React.FC<DemographicStepProps> = ({ 
    researchId, 
    token, 
    stepConfig, 
    onStepComplete, 
    onError 
}) => {
    const [loading, setLoading] = useState(false); // Loading para el submit
    const [configLoading, setConfigLoading] = useState(true); // NUEVO: Loading para la configuración
    const savedResponses = stepConfig?.savedResponses || {};
    const [demographicResponses, setDemographicResponses] = useState<DemographicResponses>(savedResponses); 
    const [demographicsConfig, setDemographicsConfig] = useState(DEFAULT_DEMOGRAPHICS_CONFIG); 
    const participantId = useParticipantStore(state => state.participantId);
    
    useEffect(() => {
        if (stepConfig?.savedResponses) {
            setDemographicResponses(stepConfig.savedResponses);
        }
    }, [stepConfig?.savedResponses]);
    
    useEffect(() => {
        setConfigLoading(true);
        
        if (researchId && token) {
            eyeTrackingService.getEyeTrackingConfig(researchId, token)
                .then(response => {
                    const extendedData = response.data as ExtendedEyeTrackingData;
                    if (extendedData?.demographicQuestions) {
                        const apiQuestions = extendedData.demographicQuestions;
                        const updatedConfig = {...DEFAULT_DEMOGRAPHICS_CONFIG};
                        Object.keys(updatedConfig.questions).forEach(key => {
                            const typedKey = key as keyof typeof updatedConfig.questions;
                            updatedConfig.questions[typedKey].enabled = false;
                        });
                        // ... (resto del mapeo de preguntas API a config)
                        // 1. Edad (Age)
                        if (apiQuestions.age) {
                            updatedConfig.questions.age = {
                                id: 'age',
                                enabled: apiQuestions.age.enabled,
                                required: apiQuestions.age.required,
                                title: 'Edad'
                            };
                        }
                        // 2. Género (Gender)
                        if (apiQuestions.gender) {
                            updatedConfig.questions.gender = {
                                id: 'gender',
                                enabled: apiQuestions.gender.enabled,
                                required: apiQuestions.gender.required,
                                title: 'Género'
                            };
                        }
                        // 3. País (Country) -> Location
                        if (apiQuestions.country) {
                            updatedConfig.questions.location = {
                                id: 'location',
                                enabled: apiQuestions.country.enabled,
                                required: apiQuestions.country.required,
                                title: 'País'
                            };
                        }
                        // 4. Nivel educativo (educationLevel)
                        if (apiQuestions.educationLevel) {
                            updatedConfig.questions.education = {
                                id: 'education',
                                enabled: apiQuestions.educationLevel.enabled,
                                required: apiQuestions.educationLevel.required,
                                title: 'Nivel educativo'
                            };
                        }
                        // 5. Ingresos familiares (householdIncome)
                        if (apiQuestions.householdIncome) {
                            updatedConfig.questions.income = {
                                id: 'income',
                                enabled: apiQuestions.householdIncome.enabled,
                                required: apiQuestions.householdIncome.required,
                                title: 'Ingresos familiares anuales'
                            };
                        }
                        // 6. Situación laboral (employmentStatus)
                        if (apiQuestions.employmentStatus) {
                            updatedConfig.questions.occupation = {
                                id: 'occupation',
                                enabled: apiQuestions.employmentStatus.enabled,
                                required: apiQuestions.employmentStatus.required,
                                title: 'Situación laboral'
                            };
                        }
                        // 7. Horas diarias en línea (dailyHoursOnline)
                        if (apiQuestions.dailyHoursOnline) {
                            updatedConfig.questions.language = {
                                id: 'language',
                                enabled: apiQuestions.dailyHoursOnline.enabled,
                                required: apiQuestions.dailyHoursOnline.required,
                                title: 'Horas diarias en línea'
                            };
                        }
                        // 8. Competencia técnica (technicalProficiency)
                        if (apiQuestions.technicalProficiency) {
                            updatedConfig.questions.ethnicity = {
                                id: 'ethnicity',
                                enabled: apiQuestions.technicalProficiency.enabled,
                                required: apiQuestions.technicalProficiency.required,
                                title: 'Competencia técnica'
                            };
                        }
                        // --- Fin Mapeo --- 
                        setDemographicsConfig(updatedConfig);
                    } else {
                         console.warn('[DemographicStep] No demographicQuestions found in API response.');
                    }
                })
                .catch(error => {
                    console.error('[DemographicStep] Error al consultar la API de eye-tracking:', error);
                })
                .finally(() => {
                    setConfigLoading(false);
                });
        } else {
            setConfigLoading(false);
            console.warn('[DemographicStep] No se pudo cargar config de API (faltan ID/Token). Usando config por defecto.');
        }
    }, [researchId, token]); // Quitar demographicResponses de aquí si no se usa directamente
    
    const handleDemographicSubmit = async (responses: DemographicResponses) => {
        setLoading(true);
        try {
            if (onStepComplete) {
                onStepComplete(responses); // Llama a onStepComplete para avanzar al siguiente paso
            }
        } catch (error) {
            // Este catch es por si ocurre algún error inesperado en la lógica de handleDemographicSubmit,
            // no por errores de guardado de API (esos los maneja DemographicsForm).
            console.error('[DemographicStep] Error inesperado en handleDemographicSubmit:', error);
            onError(error instanceof Error ? error.message : 'Error procesando el paso demográfico.', 'demographic');
        } finally {
            setLoading(false);
        }
    };
    
    if (configLoading) {
        return (
            <div className="w-full max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Preguntas demográficas</h2>
                <p className="text-gray-600">Cargando preguntas...</p>
            </div>
        );
    }
    
    return (
        <DemographicsForm
            config={stepConfig?.demographicsConfig || demographicsConfig}
            initialValues={demographicResponses} // Pasar las respuestas actuales
            onSubmit={handleDemographicSubmit}
            isLoading={loading}
        />
    );
};
// === FIN COMPONENTE DemographicStep MOVIDO ===

// === COMPONENTES ELIMINADOS QUE YA ESTÁN IMPORTADOS ===

// Componente para texto largo
const LongTextQuestion: React.FC<{
    config: any; 
    stepName?: string;
    stepId?: string;
    stepType: string;
    onStepComplete: (answer: any) => void;
}> = ({ config, stepName: stepNameFromProps, stepId: stepIdFromProps, stepType, onStepComplete }) => {
    const title = config.title || stepNameFromProps || 'Pregunta de Texto Largo';
    const description = config.description;
    const questionText = config.questionText;
    const placeholder = config.answerPlaceholder || 'Escribe tu respuesta...';
    
    const [currentResponse, setCurrentResponse] = useState<string>('');

    // Estados para la API y carga de datos
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [dataExisted, setDataExisted] = useState(false);
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [moduleResponseId, setModuleResponseId] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false); // Nuevo estado

    const researchId = useParticipantStore(state => state.researchId);
    const participantId = useParticipantStore(state => state.participantId);

    const {
        saveResponse,
        updateResponse,
        isLoading: isApiLoading,
        error: apiHookError,
    } = useResponseAPI({ 
        researchId: researchId || '', 
        participantId: participantId || '' 
    });

    // useEffect para cargar datos existentes
    useEffect(() => {
        if (!researchId || !participantId || !stepType) {
            setDataLoading(false);
            console.warn('[LongTextQuestion] Faltan researchId, participantId o stepType para cargar datos.');
            return;
        }

        const apiClient = new ApiClient();
        setDataLoading(true);
        setApiError(null);

        apiClient.getModuleResponses(researchId, participantId)
            .then(apiResponse => {
                if (apiResponse.error || !apiResponse.data?.data) {
                    setDataExisted(false);
                    setDocumentId(null);
                    setModuleResponseId(null);
                    setCurrentResponse('');
                    if (apiResponse.apiStatus === APIStatus.NOT_FOUND) {
                        setApiError(null);
                    } else {
                        setApiError(apiResponse.message || 'Error cargando datos del módulo.');
                    }
                    return;
                }

                const fullDocument = apiResponse.data.data as { id: string, responses: Array<{id: string, stepType: string, response: any}> };
                setDocumentId(fullDocument.id);
                const foundStepData = fullDocument.responses.find(item => item.stepType === stepType);

                if (foundStepData) {
                    setCurrentResponse(typeof foundStepData.response === 'string' ? foundStepData.response : '');
                    setModuleResponseId(foundStepData.id || null);
                    setDataExisted(true);
                } else {
                    setCurrentResponse('');
                    setModuleResponseId(null);
                    setDataExisted(false);
                }
            })
            .catch(error => {
                console.error('[LongTextQuestion] Excepción al cargar datos:', error);
                setApiError(error.message || 'Excepción desconocida al cargar datos.');
                setDataExisted(false);
                setModuleResponseId(null);
                setCurrentResponse('');
            })
            .finally(() => {
                setDataLoading(false);
            });
    }, [researchId, participantId, stepType]);

    // Texto dinámico para el botón
    let buttonText = 'Siguiente'; // Valor por defecto
    if (isNavigating) {
        buttonText = 'Pasando al siguiente módulo...';
    } else if (isSaving || isApiLoading) {
        buttonText = 'Guardando...';
    } else if (dataExisted && moduleResponseId) {
        buttonText = 'Actualizar y continuar';
    } else {
        buttonText = 'Guardar y continuar';
    }

    const handleSaveAndProceed = async () => {
        if (!researchId || !participantId) {
            setApiError("Faltan researchId o participantId para guardar.");
            return;
        }
        
        const currentStepId = stepIdFromProps || stepType;
        const currentStepName = title; // Usamos el título del componente como stepName para el DTO

        setIsSaving(true);
        setApiError(null);

        try {
            let success = false;
            const payload = { response: currentResponse }; // Mover payload aquí para claridad

            if (dataExisted && moduleResponseId) {
                await updateResponse(moduleResponseId, currentStepId, stepType, currentStepName, payload.response);
                if (apiHookError) { 
                    setApiError(apiHookError);
                } else { // Asumir éxito si no hay error del hook para PUT, ya que puede no devolver contenido
                    success = true;
                }
            } else {
                const result = await saveResponse(currentStepId, stepType, currentStepName, payload.response);
                 if (apiHookError) {
                    setApiError(apiHookError);
                } else if (result && result.id) {
                    setModuleResponseId(result.id); 
                    setDataExisted(true); 
                    success = true;
                }
            }

            if (success) {
                setIsNavigating(true);
                setTimeout(() => {
                    if (onStepComplete) {
                        onStepComplete(currentResponse);
                    }
                }, 500); // Retardo para mostrar mensaje
            } else if (!apiHookError && !apiError) {
                 setApiError('La operación de guardado no parece haber tenido éxito.');
            }
        } catch (error: any) {
            console.error('[LongTextQuestion] Excepción al guardar:', error);
            setApiError(error.message || 'Error desconocido durante el guardado.');
        } finally {
            setIsSaving(false);
        }
    };

    if (dataLoading) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                <p className="text-gray-600">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            <p className="text-neutral-600 mb-4">{questionText}</p>

            {(apiError || apiHookError) && (
              <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-4 py-3 rounded mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span>{apiError || apiHookError}</span>
              </div>
            )}

            <textarea
                className="border border-neutral-300 p-2 rounded-md w-full mb-4 h-32 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder={placeholder}
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                disabled={isSaving || isApiLoading}
            />
            <button
                onClick={handleSaveAndProceed}
                disabled={isSaving || isApiLoading || !researchId || !participantId || dataLoading || isNavigating} // Añadir dataLoading y isNavigating
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {buttonText} {/* Usar buttonText dinámico */}
            </button>
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-2 bg-gray-50 text-xs text-gray-500 border rounded">
                    <p className="font-semibold">[Debug LongTextQuestion]</p>
                    <p>Research ID: {researchId || 'N/A'}, Participant ID: {participantId || 'N/A'}</p>
                    <p>StepType: {stepType}, StepIdProp: {stepIdFromProps || 'N/A'}, StepNameProp: {stepNameFromProps || 'N/A'}</p>
                    <p>Data Loading: {dataLoading.toString()}, Data Existed: {dataExisted.toString()}</p>
                    <p>Document ID: {documentId || 'N/A'}, ModuleResponse ID: {moduleResponseId || 'N/A'}</p>
                    <p>API Saving: {isSaving.toString()}, API Hook Loading: {isApiLoading.toString()}</p>
                    <p>API Error (Form): {apiError || 'No'}, API Error (Hook): {apiHookError || 'No'}</p>
                    <div>Response: <pre>{JSON.stringify(currentResponse, null, 2)}</pre></div>
                </div>
            )}
        </div>
    );
};

// Componente para Single Choice
const SingleChoiceQuestion: React.FC<{
    config: any; 
    stepId?: string; // Renombrado de stepId a stepIdFromProps para claridad interna
    stepName?: string; // Renombrado de stepName a stepNameFromProps para claridad interna
    stepType: string;
    onStepComplete: (answer: any) => void;
    isMock: boolean; // Se mantiene para la lógica de datos de prueba si no hay config
}> = ({ config: initialConfig, stepId: stepIdFromProps, stepName: stepNameFromProps, stepType, onStepComplete, isMock }) => {
    const componentTitle = initialConfig.title || stepNameFromProps || 'Pregunta de opción única';
    const description = initialConfig.description;
    const questionText = initialConfig.questionText || (isMock ? 'Pregunta de prueba' : '');
    const options = initialConfig.options || (isMock ? ['Opción 1', 'Opción 2', 'Opción 3'] : []);
    
    const [currentResponse, setCurrentResponse] = useState<string | null>(null); // Respuesta seleccionada

    // Estados para la API y carga de datos
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [dataExisted, setDataExisted] = useState(false);
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [moduleResponseId, setModuleResponseId] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const researchId = useParticipantStore(state => state.researchId);
    const participantId = useParticipantStore(state => state.participantId);

    const {
        saveResponse,
        updateResponse,
        isLoading: isApiLoading,
        error: apiHookError,
    } = useResponseAPI({ 
        researchId: researchId || '', 
        participantId: participantId || '' 
    });

    // useEffect para cargar datos existentes
    useEffect(() => {
        // Si es un mock, usar los datos de config y no hacer llamada API
        if (isMock) {
            setDataLoading(false);
            setCurrentResponse(initialConfig.savedResponses || null);
            return;
        }

        // Si no es mock pero faltan datos para la API, no cargar e indicar estado
        if (!researchId || !participantId || !stepType) {
            setDataLoading(false);
            setCurrentResponse(null);
            setDataExisted(false);
            setModuleResponseId(null);
            setDocumentId(null);
            console.warn('[SingleChoiceQuestion] Carga OMITIDA: Faltan researchId, participantId o stepType para cargar datos reales.');
            return;
        }

        // Proceder con la carga de datos reales desde la API
        const apiClient = new ApiClient();
        setDataLoading(true);
        setApiError(null);
        // Resetear estados antes de la carga
        setCurrentResponse(null);
        setDataExisted(false);
        setModuleResponseId(null);
        setDocumentId(null);

        apiClient.getModuleResponses(researchId, participantId)
            .then(apiResponse => {
                if (apiResponse.error || !apiResponse.data?.data) {
                    setDataExisted(false);
                    setDocumentId(null);
                    setModuleResponseId(null);
                    setCurrentResponse(null);
                    if (apiResponse.apiStatus === APIStatus.NOT_FOUND) {
                        setApiError(null);
                    } else {
                        setApiError(apiResponse.message || 'Error cargando datos del módulo.');
                    }
                    return;
                }

                const fullDocument = apiResponse.data.data as { id: string, responses: Array<{id: string, stepType: string, response: any}> };
                setDocumentId(fullDocument.id);
                const foundStepData = fullDocument.responses.find(item => item.stepType === stepType);

                if (foundStepData) {
                    setCurrentResponse(typeof foundStepData.response === 'string' ? foundStepData.response : null);
                    setModuleResponseId(foundStepData.id || null);
                    setDataExisted(true);
                } else {
                    setCurrentResponse(null);
                    setModuleResponseId(null);
                    setDataExisted(false);
                }
            })
            .catch(error => {
                console.error('[SingleChoiceQuestion] Excepción al cargar datos:', error);
                setApiError(error.message || 'Excepción desconocida al cargar datos.');
                setDataExisted(false);
                setModuleResponseId(null);
                setCurrentResponse(null);
            })
            .finally(() => {
                setDataLoading(false);
            });
    // Quitar initialConfig.savedResponses de las dependencias.
    // Mantener isMock para la lógica de carga inicial.
    }, [researchId, participantId, stepType, isMock]); // initialConfig.savedResponses eliminado


    // Texto dinámico para el botón
    let buttonText = 'Siguiente';
    if (isNavigating) {
        buttonText = 'Pasando al siguiente módulo...';
    } else if (isSaving || isApiLoading) {
        buttonText = 'Guardando...';
    } else if (dataExisted && moduleResponseId) {
        buttonText = 'Actualizar y continuar';
    } else {
        buttonText = 'Guardar y continuar';
    }

    const handleSaveAndProceed = async () => {
        if (!currentResponse && initialConfig.required !== false) { // Asumir requerido si no se especifica lo contrario
            setApiError("Por favor, selecciona una opción.");
            return;
        }
        if (!researchId || !participantId) {
            setApiError("Faltan researchId o participantId para guardar.");
            return;
        }
        
        const currentStepIdForApi = stepIdFromProps || stepType;
        const currentStepNameForApi = componentTitle;

        setIsSaving(true);
        setApiError(null);

        try {
            let success = false;
            const payload = { response: currentResponse };

            if (dataExisted && moduleResponseId) {
                await updateResponse(moduleResponseId, currentStepIdForApi, stepType, currentStepNameForApi, payload.response);
                if (apiHookError) { 
                    setApiError(apiHookError);
                } else { 
                    success = true;
                }
            } else {
                const result = await saveResponse(currentStepIdForApi, stepType, currentStepNameForApi, payload.response);
                 if (apiHookError) {
                    setApiError(apiHookError);
                } else if (result && result.id) {
                    setModuleResponseId(result.id); 
                    setDataExisted(true); 
                    success = true;
                }
            }

            if (success) {
                setIsNavigating(true);
                setTimeout(() => {
                    onStepComplete(currentResponse);
                }, 500);
            } else if (!apiHookError && !apiError) {
                 setApiError('La operación de guardado no parece haber tenido éxito.');
            }
        } catch (error: any) {
            console.error('[SingleChoiceQuestion] Excepción al guardar:', error);
            setApiError(error.message || 'Error desconocido durante el guardado.');
        } finally {
            setIsSaving(false);
        }
    };

    if (dataLoading && !isMock) { // Solo mostrar cargando si no es mock y está cargando datos reales
        return (
            <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                <p className="text-gray-600">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{componentTitle}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            <p className="text-neutral-600 mb-4">{questionText}</p>

            {(apiError || apiHookError) && (
              <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-4 py-3 rounded mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span>{apiError || apiHookError}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 mb-4">
                {options.map((option: string, index: number) => (
                    <button
                        key={index}
                        onClick={() => setCurrentResponse(option)} // Actualizar currentResponse
                        disabled={isSaving || isApiLoading || dataLoading || isNavigating}
                        className={`p-3 border rounded-md text-left transition-colors disabled:opacity-70 ${
                            currentResponse === option 
                                ? 'bg-primary-100 border-primary-300 text-primary-700'
                                : 'border-neutral-300 text-neutral-700 hover:bg-gray-50'
                        } ${ (isSaving || isApiLoading || dataLoading || isNavigating) ? 'cursor-not-allowed' : '' }`}
                    >
                        {option}
                    </button>
                ))}
            </div>
            <button
                onClick={handleSaveAndProceed}
                disabled={!currentResponse || isSaving || isApiLoading || dataLoading || isNavigating || (isMock && !currentResponse)}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
                {buttonText}
            </button>
            {process.env.NODE_ENV === 'development' && !isMock && (
                <div className="mt-4 p-2 bg-gray-50 text-xs text-gray-500 border rounded">
                    <p className="font-semibold">[Debug SingleChoiceQuestion]</p>
                    <p>Research ID: {researchId || 'N/A'}, Participant ID: {participantId || 'N/A'}</p>
                    <p>StepType: {stepType}, StepIdProp: {stepIdFromProps || 'N/A'}, StepNameProp: {stepNameFromProps || 'N/A'}</p>
                    <p>Data Loading: {dataLoading.toString()}, Data Existed: {dataExisted.toString()}</p>
                    <p>Document ID: {documentId || 'N/A'}, ModuleResponse ID: {moduleResponseId || 'N/A'}</p>
                    <p>API Saving: {isSaving.toString()}, API Hook Loading: {isApiLoading.toString()}</p>
                    <p>API Error (Form): {apiError || 'No'}, API Error (Hook): {apiHookError || 'No'}</p>
                    <p>Is Navigating: {isNavigating.toString()}</p>
                    <div>Response: <pre>{JSON.stringify(currentResponse, null, 2)}</pre></div>
                </div>
            )}
        </div>
    );
};

// Componente para Multiple Choice
const MultipleChoiceQuestion: React.FC<{
    config: any; 
    stepId?: string;    // stepId de la configuración del flujo
    stepName?: string;  // stepName de la configuración del flujo
    stepType: string;   // ej. cognitive_multiple_choice
    onStepComplete: (answer: any) => void; // Se llamará DESPUÉS de un guardado exitoso
    isMock: boolean;    // Determinado por CurrentStepRenderer basado en la validez de config
}> = ({ config: initialConfig, stepId: stepIdFromProps, stepName: stepNameFromProps, stepType, onStepComplete, isMock }) => {
    const componentTitle = initialConfig.title || stepNameFromProps || 'Pregunta de opciones múltiples';
    const description = initialConfig.description;
    const questionText = initialConfig.questionText || (isMock ? 'Selecciona todas las opciones que apliquen (Prueba)' : 'Pregunta sin texto');
    const optionsFromConfig = initialConfig.options || (isMock ? ['Opción Múltiple A', 'Opción Múltiple B', 'Opción Múltiple C'] : []);
    const minSelections = initialConfig.minSelections || 0;
    const maxSelections = initialConfig.maxSelections || optionsFromConfig.length;
    
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

    // Estados para la API y carga/guardado de datos
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(true); // Inicia en true si no es mock
    const [dataExisted, setDataExisted] = useState(false);
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [moduleResponseId, setModuleResponseId] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const researchId = useParticipantStore(state => state.researchId);
    const participantId = useParticipantStore(state => state.participantId);

    const {
        saveResponse,
        updateResponse,
        isLoading: isApiLoading, // Loading del hook useResponseAPI
        error: apiHookError,
    } = useResponseAPI({ 
        researchId: researchId || '', 
        participantId: participantId || '' 
    });

    // useEffect para cargar datos existentes o inicializar desde config.savedResponses
    useEffect(() => {
        if (isMock) {
            setSelectedOptions(initialConfig.savedResponses || []);
            setDataLoading(false);
            return;
        }

        if (!researchId || !participantId || !stepType) {
            setDataLoading(false);
            setSelectedOptions([]); // Reiniciar por si acaso
            setDataExisted(false);
            setModuleResponseId(null);
            setDocumentId(null);
            console.warn('[MultipleChoiceQuestion] Carga OMITIDA: Faltan researchId, participantId o stepType para cargar datos reales.');
            return;
        }

        const apiClient = new ApiClient();
        setDataLoading(true);
        setApiError(null);
        setSelectedOptions([]); // Resetear antes de la carga
        setDataExisted(false);
        setModuleResponseId(null);
        setDocumentId(null);

        apiClient.getModuleResponses(researchId, participantId)
            .then(apiResponse => {
                if (apiResponse.error || !apiResponse.data?.data) {
                    setDataExisted(false);
                    if (initialConfig.savedResponses && Array.isArray(initialConfig.savedResponses)) {
                         setSelectedOptions(initialConfig.savedResponses);
                    } else {
                        setSelectedOptions([]);
                    }

                    if (apiResponse.apiStatus === APIStatus.NOT_FOUND) {
                        setApiError(null);
                    } else {
                        setApiError(apiResponse.message || 'Error cargando datos del módulo.');
                    }
                    return;
                }

                const fullDocument = apiResponse.data.data as { id: string, responses: Array<{id: string, stepType: string, response: any}> };
                setDocumentId(fullDocument.id);
                const foundStepData = fullDocument.responses.find(item => item.stepType === stepType);

                if (foundStepData && Array.isArray(foundStepData.response)) {

                    setSelectedOptions(foundStepData.response);
                    setModuleResponseId(foundStepData.id || null);
                    setDataExisted(true);
                } else {

                    // Si no hay datos de API, pero initialConfig (que es el config real si no es mock) tiene savedResponses, usar eso.
                    if (initialConfig.savedResponses && Array.isArray(initialConfig.savedResponses)) {
                         setSelectedOptions(initialConfig.savedResponses);

                    } else {
                        setSelectedOptions([]);
                    }
                    setModuleResponseId(null);
                    setDataExisted(false);
                }
            })
            .catch(error => {
                console.error('[MultipleChoiceQuestion] Excepción al cargar datos:', error);
                setApiError(error.message || 'Excepción desconocida al cargar datos.');
                setDataExisted(false);
                setModuleResponseId(null);
                // setSelectedOptions(initialConfig.savedResponses || []);
                 if (initialConfig.savedResponses && Array.isArray(initialConfig.savedResponses)) {
                         setSelectedOptions(initialConfig.savedResponses);
                    } else {
                        setSelectedOptions([]);
                    }
            })
            .finally(() => {
                setDataLoading(false);
            });
    }, [researchId, participantId, stepType, isMock, initialConfig.savedResponses]); // Añadir initialConfig.savedResponses como dependencia

    const handleCheckboxChange = (option: string) => {
        setSelectedOptions(prev => {
            const newSelection = prev.includes(option)
                ? prev.filter(item => item !== option)
                : [...prev, option];
            
            if (newSelection.length > maxSelections) {
                return prev; // No permitir exceder el máximo
            }
            return newSelection;
        });
    };

    // Texto dinámico para el botón
    let buttonText = 'Siguiente';
    if (isNavigating) {
        buttonText = 'Pasando al siguiente módulo...';
    } else if (isSaving || isApiLoading) {
        buttonText = 'Guardando...';
    } else if (!isMock && dataExisted && moduleResponseId) {
        buttonText = 'Actualizar y continuar';
    } else if (!isMock) {
        buttonText = 'Guardar y continuar';
    }
    // Si es mock, el botón siempre dirá Siguiente (o el default que tenga el componente original)

    const handleSaveAndProceed = async () => {
        if (isMock) { // Si es mock, simplemente llamar a onStepComplete
            if (selectedOptions.length >= minSelections) {

                onStepComplete(selectedOptions);
            }
            return;
        }

        if (selectedOptions.length < minSelections && initialConfig.required !== false) {
            setApiError(`Por favor, selecciona al menos ${minSelections} opciones.`);
            return;
        }
        if (!researchId || !participantId) {
            setApiError("Faltan researchId o participantId para guardar.");
            return;
        }
        
        const currentStepIdForApi = stepIdFromProps || stepType;
        const currentStepNameForApi = componentTitle;

        setIsSaving(true);
        setApiError(null);

        try {
            let success = false;
            const payload = { response: selectedOptions }; // La respuesta es un array de strings

            if (dataExisted && moduleResponseId) {

                await updateResponse(moduleResponseId, currentStepIdForApi, stepType, currentStepNameForApi, payload.response);
                if (apiHookError) { 
                    setApiError(apiHookError);
                } else { 
                    success = true;
                }
            } else {

                const result = await saveResponse(currentStepIdForApi, stepType, currentStepNameForApi, payload.response);
                 if (apiHookError) {
                    setApiError(apiHookError);
                } else if (result && result.id) {
                    setModuleResponseId(result.id); 
                    setDataExisted(true); 
                    success = true;
                }
            }

            if (success) {
                setIsNavigating(true);
                setTimeout(() => {
                    onStepComplete(selectedOptions);
                }, 500);
            } else if (!apiHookError && !apiError) {
                 setApiError('La operación de guardado no parece haber tenido éxito.');
            }
        } catch (error: any) {
            console.error('[MultipleChoiceQuestion] Excepción al guardar:', error);
            setApiError(error.message || 'Error desconocido durante el guardado.');
        } finally {
            setIsSaving(false);
        }
    };

    if (dataLoading && !isMock) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                <p className="text-gray-600">Cargando opciones...</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
             {/* Quitar el MockDataWarning de aquí, ya lo maneja renderStepWithWarning */}
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{componentTitle}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            <p className="text-neutral-600 mb-4">{questionText}</p>

            {(apiError || apiHookError) && (
              <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-4 py-3 rounded mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span>{apiError || apiHookError}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 mb-4">
                {optionsFromConfig.map((option: string, index: number) => (
                    <label key={index} className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={selectedOptions.includes(option)}
                            onChange={() => handleCheckboxChange(option)}
                            disabled={isSaving || isApiLoading || dataLoading || isNavigating}
                            className="h-5 w-5 text-primary-600 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                        <span className="text-neutral-700">{option}</span>
                    </label>
                ))}
            </div>
            <div className="text-sm text-neutral-500 mb-4">
                {minSelections > 0 && `Selecciona al menos ${minSelections} opciones. `}
                {maxSelections < optionsFromConfig.length && `Puedes seleccionar hasta ${maxSelections} opciones. `}
                Seleccionadas: {selectedOptions.length}
            </div>
            <button
                onClick={handleSaveAndProceed} // Cambiado de handleSubmit a handleSaveAndProceed
                disabled={selectedOptions.length < minSelections || isSaving || isApiLoading || dataLoading || isNavigating || (isMock && selectedOptions.length < minSelections) }
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
                {buttonText} {/* Usar el texto dinámico del botón */}
            </button>
             {process.env.NODE_ENV === 'development' && !isMock && (
                <div className="mt-4 p-2 bg-gray-50 text-xs text-gray-500 border rounded">
                    <p className="font-semibold">[Debug MultipleChoiceQuestion]</p>
                    <p>Research ID: {researchId || 'N/A'}, Participant ID: {participantId || 'N/A'}</p>
                    <p>StepType: {stepType}, StepIdProp: {stepIdFromProps || 'N/A'}, StepNameProp: {stepNameFromProps || 'N/A'}</p>
                    <p>IsMock Flag: {isMock.toString()}</p>
                    <p>Data Loading: {dataLoading.toString()}, Data Existed: {dataExisted.toString()}</p>
                    <p>Document ID: {documentId || 'N/A'}, ModuleResponse ID: {moduleResponseId || 'N/A'}</p>
                    <p>API Saving: {isSaving.toString()}, API Hook Loading: {isApiLoading.toString()}</p>
                    <p>API Error (Form): {apiError || 'No'}, API Error (Hook): {apiHookError || 'No'}</p>
                    <p>Is Navigating: {isNavigating.toString()}</p>
                    <div>Selected Options: <pre>{JSON.stringify(selectedOptions, null, 2)}</pre></div>
                    <div>Initial Config Options: <pre>{JSON.stringify(optionsFromConfig, null, 2)}</pre></div>
                    <div>Initial Config Saved: <pre>{JSON.stringify(initialConfig.savedResponses, null, 2)}</pre></div>
                </div>
            )}
        </div>
    );
};

// Componente para Linear Scale
const LinearScaleQuestion: React.FC<{
    config: any; 
    stepId?: string;    // stepId del flujo
    stepName?: string;  // stepName del flujo
    stepType: string;
    onStepComplete: (answer: any) => void; // Se llamará DESPUÉS de un guardado exitoso
    isMock: boolean;    // Determinado por CurrentStepRenderer
}> = ({ config: initialConfig, stepId: stepIdFromProps, stepName: stepNameFromProps, stepType, onStepComplete, isMock }) => {
    const componentTitle = initialConfig.title || stepNameFromProps || 'Pregunta de escala lineal';
    const description = initialConfig.description;
    const questionText = initialConfig.questionText || (isMock ? 'Valora en una escala (Prueba)' : 'Pregunta de escala sin texto');
    const minValue = initialConfig.minValue || 1;
    const maxValue = initialConfig.maxValue || 5;
    const minLabel = initialConfig.minLabel || 'Mínimo';
    const maxLabel = initialConfig.maxLabel || 'Máximo';
    
    const [selectedValue, setSelectedValue] = useState<number | null>(null);

    // Estados para la API y carga/guardado de datos
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [dataExisted, setDataExisted] = useState(false);
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [moduleResponseId, setModuleResponseId] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const researchId = useParticipantStore(state => state.researchId);
    const participantId = useParticipantStore(state => state.participantId);

    const {
        saveResponse,
        updateResponse,
        isLoading: isApiLoading,
        error: apiHookError,
    } = useResponseAPI({ 
        researchId: researchId || '', 
        participantId: participantId || '' 
    });

    // useEffect para cargar datos existentes o inicializar desde config.savedResponses
    useEffect(() => {
        if (isMock) {
            const mockSavedValue = initialConfig.savedResponses;
            setSelectedValue(typeof mockSavedValue === 'number' ? mockSavedValue : null);
            setDataLoading(false);
            return;
        }

        if (!researchId || !participantId || !stepType) {
            setDataLoading(false);
            setSelectedValue(null); 
            setDataExisted(false);
            setModuleResponseId(null);
            setDocumentId(null);
            console.warn('[LinearScaleQuestion] Carga OMITIDA: Faltan researchId, participantId o stepType para cargar datos reales.');
            return;
        }

        const apiClient = new ApiClient();
        setDataLoading(true);
        setApiError(null);
        setSelectedValue(null); 
        setDataExisted(false);
        setModuleResponseId(null);
        setDocumentId(null);

        apiClient.getModuleResponses(researchId, participantId)
            .then(apiResponse => {
                let valueToSet: number | null = null;
                if (!apiResponse.error && apiResponse.data?.data) {
                    const fullDocument = apiResponse.data.data as { id: string, responses: Array<{id: string, stepType: string, response: any}> };
                    setDocumentId(fullDocument.id);
                    const foundStepData = fullDocument.responses.find(item => item.stepType === stepType);

                    if (foundStepData && typeof foundStepData.response === 'number') {
                        valueToSet = foundStepData.response;
                        setModuleResponseId(foundStepData.id || null);
                        setDataExisted(true);
                    } else {
                        setDataExisted(false);
                        setModuleResponseId(null);
                    }
                } else {
                     if (apiResponse.apiStatus !== APIStatus.NOT_FOUND) {
                        setApiError(apiResponse.message || 'Error cargando datos del módulo.');
                    }
                }

                if (valueToSet === null && initialConfig.savedResponses !== undefined && typeof initialConfig.savedResponses === 'number') {
                    
                    valueToSet = initialConfig.savedResponses;
                }
                setSelectedValue(valueToSet);
            })
            .catch(error => {
                console.error('[LinearScaleQuestion] Excepción al cargar datos:', error);
                setApiError(error.message || 'Excepción desconocida al cargar datos.');
                setDataExisted(false);
                setModuleResponseId(null);
                const fallbackSavedValue = initialConfig.savedResponses;
                setSelectedValue(typeof fallbackSavedValue === 'number' ? fallbackSavedValue : null);
            })
            .finally(() => {
                setDataLoading(false);
            });
    }, [researchId, participantId, stepType, isMock, initialConfig.savedResponses]);

    // Texto dinámico para el botón
    let buttonText = 'Siguiente';
    if (isNavigating) {
        buttonText = 'Pasando al siguiente módulo...';
    } else if (isSaving || isApiLoading) {
        buttonText = 'Guardando...';
    } else if (!isMock && dataExisted && moduleResponseId) {
        buttonText = 'Actualizar y continuar';
    } else if (!isMock) {
        buttonText = 'Guardar y continuar';
    }

    const handleSaveAndProceed = async () => {
        if (isMock) {
            if (selectedValue !== null) {
                onStepComplete(selectedValue);
            }
            return;
        }

        if (selectedValue === null && initialConfig.required !== false) { 
            setApiError("Por favor, selecciona un valor en la escala.");
            return;
        }
        if (!researchId || !participantId) {
            setApiError("Faltan researchId o participantId para guardar.");
            return;
        }
        
        const currentStepIdForApi = stepIdFromProps || stepType;
        const currentStepNameForApi = componentTitle;

        setIsSaving(true);
        setApiError(null);

        try {
            let success = false;
            const payload = { response: selectedValue }; 

            if (dataExisted && moduleResponseId) {
            
                await updateResponse(moduleResponseId, currentStepIdForApi, stepType, currentStepNameForApi, payload.response);
                if (apiHookError) { 
                    setApiError(apiHookError);
                } else { 
                    success = true;
                }
            } else {
            
                const result = await saveResponse(currentStepIdForApi, stepType, currentStepNameForApi, payload.response);
                 if (apiHookError) {
                    setApiError(apiHookError);
                } else if (result && result.id) {
                    setModuleResponseId(result.id); 
                    setDataExisted(true); 
                    success = true;
                }
            }

            if (success) {
            
                setIsNavigating(true);
                setTimeout(() => {
                    onStepComplete(selectedValue);
                }, 500);
            } else if (!apiHookError && !apiError) {
                 setApiError('La operación de guardado no parece haber tenido éxito.');
            }
        } catch (error: any) {
            console.error('[LinearScaleQuestion] Excepción al guardar:', error);
            setApiError(error.message || 'Error desconocido durante el guardado.');
        } finally {
            setIsSaving(false);
        }
    };

    const scaleValues = Array.from(
        { length: maxValue - minValue + 1 }, 
        (_, i) => minValue + i
    );

    if (dataLoading && !isMock) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                <p className="text-gray-600">Cargando escala...</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{componentTitle}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            <p className="text-neutral-600 mb-4">{questionText}</p>

            {(apiError || apiHookError) && (
              <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-4 py-3 rounded mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span>{apiError || apiHookError}</span>
              </div>
            )}

            <div className="mb-8">
                <div className="flex justify-between mb-2">
                    <span className="text-sm text-neutral-500">{minLabel}</span>
                    <span className="text-sm text-neutral-500">{maxLabel}</span>
                </div>
                <div className="flex justify-between">
                    {scaleValues.map(value => (
                        <button
                            key={value}
                            onClick={() => setSelectedValue(value)}
                            disabled={isSaving || isApiLoading || dataLoading || isNavigating}
                            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
                                selectedValue === value
                                    ? 'bg-primary-600 text-white border-primary-600'
                                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-gray-50'
                            }`}
                        >
                            {value}
                        </button>
                    ))}
                </div>
            </div>
            <button
                onClick={handleSaveAndProceed}
                disabled={selectedValue === null || isSaving || isApiLoading || dataLoading || isNavigating || (isMock && selectedValue === null)}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
                {buttonText}
            </button>
            {process.env.NODE_ENV === 'development' && !isMock && (
                <div className="mt-4 p-2 bg-gray-50 text-xs text-gray-500 border rounded">
                    <p className="font-semibold">[Debug LinearScaleQuestion]</p>
                    <p>Research ID: {researchId || 'N/A'}, Participant ID: {participantId || 'N/A'}</p>
                    <p>StepType: {stepType}, StepIdProp: {stepIdFromProps || 'N/A'}, StepNameProp: {stepNameFromProps || 'N/A'}</p>
                    <p>IsMock Flag: {isMock.toString()}</p>
                    <p>Data Loading: {dataLoading.toString()}, Data Existed: {dataExisted.toString()}</p>
                    <p>Document ID: {documentId || 'N/A'}, ModuleResponse ID: {moduleResponseId || 'N/A'}</p>
                    <p>API Saving: {isSaving.toString()}, API Hook Loading: {isApiLoading.toString()}</p>
                    <p>API Error (Form): {apiError || 'No'}, API Error (Hook): {apiHookError || 'No'}</p>
                    <p>Is Navigating: {isNavigating.toString()}</p>
                    <div>Selected Value: <pre>{JSON.stringify(selectedValue, null, 2)}</pre></div>
                    <div>Initial Config: <pre>{JSON.stringify(initialConfig, null, 2)}</pre></div>
                </div>
            )}
        </div>
    );
};

// Componente para SmartVOC Feedback
const SmartVocFeedbackQuestion: React.FC<{
    config: any; 
    stepId?: string;
    stepName?: string;
    stepType: string;
    onStepComplete: (answer: any) => void;
}> = ({ config, stepId: stepIdFromProps, stepName: stepNameFromProps, stepType, onStepComplete }) => {
    // Estados para el componente SmartVocFeedbackQuestion
    const [currentResponse, setCurrentResponse] = useState('');
    const [isSaving, setIsSaving] = useState(false); // Para el guardado local antes de la navegación
    const [dataLoading, setDataLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);
    const [documentId, setDocumentId] = useState<string | null>(null); // ID del documento general de ModuleResponse
    const [moduleResponseId, setModuleResponseId] = useState<string | null>(null); // ID específico de este módulo si ya existe
    const [dataExisted, setDataExisted] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false); // Nuevo estado para la navegación

    const researchId = useParticipantStore(state => state.researchId);
    const participantId = useParticipantStore(state => state.participantId);

    const {
        saveResponse,
        updateResponse,
        isLoading: isApiLoading,
        error: apiHookError,
    } = useResponseAPI({ 
        researchId: researchId || '',
        participantId: participantId || ''
    });

    // Texto dinámico para el botón
    let buttonText = 'Siguiente'; // Valor por defecto, podría ser 'Enviar' o 'Continuar'
    if (isNavigating) {
        buttonText = 'Pasando al siguiente módulo...';
    } else if (isSaving || isApiLoading) {
        buttonText = 'Guardando...';
    } else if (dataExisted && moduleResponseId) {
        buttonText = 'Actualizar y continuar';
    } else {
        buttonText = 'Guardar y continuar';
    }

    // useEffect para cargar datos existentes
    useEffect(() => {
        if (!researchId || !participantId || !stepType) {
            setDataLoading(false);
            console.warn('[SmartVocFeedbackQuestion] Carga de datos OMITIDA: Faltan researchId, participantId o stepType.');
            return;
        }

    
        const apiClient = new ApiClient();
        setDataLoading(true);
        setApiError(null);
        setCurrentResponse(''); // Limpiar respuesta previa al iniciar la carga
        setDocumentId(null);
        setModuleResponseId(null);
        setDataExisted(false);

        apiClient.getModuleResponses(researchId, participantId)
            .then(apiResponse => {


                if (apiResponse.error || !apiResponse.data?.data) {
                    console.warn(`[SmartVocFeedbackQuestion] No se encontraron respuestas previas o hubo un error al cargar. Mensaje: ${apiResponse.message || 'No message'}. API Status: ${apiResponse.apiStatus}`);
                    setDataExisted(false);
                    setDocumentId(null);
                    setModuleResponseId(null);
                    setCurrentResponse('');
                    if (apiResponse.apiStatus === APIStatus.NOT_FOUND) {
                        setApiError(null);
                    } else {
                        setApiError(apiResponse.message || 'Error cargando datos del módulo.');
                    }
                    return;
                }

                const fullDocument = apiResponse.data.data as { id: string, responses: Array<{id: string, stepType: string, stepTitle?: string, response: any, createdAt?: string, updatedAt?: string }> };
                setDocumentId(fullDocument.id);

                const foundStepData = fullDocument.responses.find(item => item.stepType === stepType);

                if (foundStepData) {
                  
                    setCurrentResponse(typeof foundStepData.response === 'string' ? foundStepData.response : '');
                    setModuleResponseId(foundStepData.id || null);
                    setDataExisted(true);
                  
                } else {
                  
                    setCurrentResponse('');
                    setModuleResponseId(null);
                    setDataExisted(false); // Aunque el documento exista, el módulo específico no tiene respuesta.
                     // DocumentId se mantiene porque el documento general sí existe.
                  
                }
            })
            .catch(error => {
                console.error('[SmartVocFeedbackQuestion] EXCEPCIÓN al cargar datos:', error);
                setApiError(error.message || 'Excepción desconocida al cargar datos.');
                setDataExisted(false);
                setModuleResponseId(null);
                setCurrentResponse('');
            })
            .finally(() => {
                setDataLoading(false);

            });

    }, [researchId, participantId, stepType]); // Dependencias clave para recargar


    const handleSaveAndProceed = async () => {

        if (!researchId || !participantId) {
            console.error('[SmartVocFeedbackQuestion] Faltan researchId o participantId');
            setApiError('Faltan researchId o participantId.');
            return;
        }
        if (!currentResponse && config.required) {
            setApiError('Por favor, ingresa una respuesta.');
            return;
        }

        setIsSaving(true);
        setApiError(null);

        const payload = { response: currentResponse };
        let success = false;

        try {
            if (dataExisted && moduleResponseId) {

                await updateResponse(moduleResponseId, stepIdFromProps || '', stepType, stepNameFromProps || 'Feedback Corto', payload);
                if (apiHookError) throw new Error(apiHookError);

                success = true;
            } else {

                const result = await saveResponse(stepIdFromProps || '', stepType, stepNameFromProps || 'Feedback Corto', payload);
                if (apiHookError) throw new Error(apiHookError);

                if (result && result.id) {
                    setDataExisted(true);
                    setModuleResponseId(result.id);

                }
                success = true;
            }
        } catch (error: any) {
            console.error('[SmartVocFeedbackQuestion] Error en operación de guardado/actualización:', error);
            setApiError(error.message || 'Error al guardar la respuesta.');
            success = false;
        } finally {
            setIsSaving(false); // Termina el estado de guardado del botón
        }

        if (success) {

            setIsNavigating(true);
            setTimeout(() => {
                onStepComplete(currentResponse);
            }, 500); // Retardo para mostrar el mensaje de navegación
        }
    };

    if (dataLoading) {
        return (
            <div className="w-full p-6 text-center">
                <p className="text-gray-600">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="w-full"> {/* Asegúrate que este div tenga el max-width deseado si es necesario, como en el 'case' original */}
            <h2 className="text-xl font-medium text-center mb-4">{stepNameFromProps || 'Feedback'}</h2>
            <p className="text-center mb-6">{stepType === 'smartvoc_feedback' ? 'Por favor, cuéntanos más sobre tu experiencia.' : 'Por favor, escribe tu respuesta aquí...'}</p>
            
            {(apiError || apiHookError) && (
              <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-4 py-3 rounded mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span>{apiError || apiHookError}</span>
              </div>
            )}

            <textarea
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-400 focus:border-primary-400 mb-6"
                placeholder={stepType === 'smartvoc_feedback' ? 'Por favor, cuéntanos más sobre tu experiencia...' : 'Por favor, escribe tu respuesta aquí...'}
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                disabled={isSaving || isApiLoading}
            />
            <div className="flex justify-center">
                <button
                    onClick={handleSaveAndProceed}
                    disabled={isSaving || isApiLoading || dataLoading || isNavigating} // Deshabilitar también con dataLoading y isNavigating
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {buttonText}
                </button>
            </div>
             {/* Sección de Debug (opcional, como en DemographicsForm) */}
             {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-2 bg-gray-50 text-xs text-gray-500 border rounded">
                    <p className="font-semibold">[Debug SmartVocFeedbackQuestion]</p>
                    <p>Research ID: {researchId || 'N/A'}, Participant ID: {participantId || 'N/A'}</p>
                    <p>StepType Prop: {stepType}, StepId Prop: {stepIdFromProps || 'N/A'}, StepName Prop: {stepNameFromProps || 'N/A'}</p>
                    <p>Data Loading: {dataLoading.toString()}</p>
                    <p>Data Existed (este módulo específico): {dataExisted.toString()}</p>
                    <p>Document ID (general): {documentId || 'N/A / No cargado'}</p>
                    <p>ModuleResponse ID (este módulo): {moduleResponseId || 'N/A / No cargado'}</p>
                    <hr className="my-1" />
                    <p>API Error (Formulario): {apiError || 'No'}</p>
                    <p>API Hook Error (useResponseAPI): {apiHookError || 'No'}</p>
                    <p>Guardando (Formulario): {isSaving.toString()}</p>
                    <p>Cargando (Hook useResponseAPI): {isApiLoading.toString()}</p>
                    <p>Método a usar (al guardar): {(dataExisted && moduleResponseId) ? 'PUT (actualizar)' : 'POST (crear)'}</p>
                    <hr className="my-1" />
                    <div>Respuesta actual en estado: <pre className="whitespace-pre-wrap">{JSON.stringify(currentResponse, null, 2)}</pre></div>
                </div>
            )}
        </div>
    );
};

// Componente para Ranking
const RankingQuestion: React.FC<{
    config: any; 
    stepId?: string;    // stepId del flujo
    stepName?: string;  // stepName del flujo
    stepType: string;
    onStepComplete: (answer: any) => void; // Se llamará DESPUÉS de un guardado exitoso
    isMock: boolean;    // Determinado por CurrentStepRenderer
}> = ({ config: initialConfig, stepId: stepIdFromProps, stepName: stepNameFromProps, stepType, onStepComplete, isMock }) => {
    const componentTitle = initialConfig.title || stepNameFromProps || 'Pregunta de ranking';
    const description = initialConfig.description;
    const questionText = initialConfig.questionText || (isMock ? 'Ordena las siguientes opciones por preferencia (Prueba)' : 'Pregunta de ranking sin texto');
    // initialConfig.items ya debería ser un array de strings gracias a la preparación en CurrentStepRenderer
    const itemsFromConfig = initialConfig.items || (isMock ? ['Item Mock 1', 'Item Mock 2', 'Item Mock 3'] : []);
    
    // El estado rankedItems almacenará el orden actual de los strings de los items.
    const [rankedItems, setRankedItems] = useState<string[]>([]); 

    // Estados para la API y carga/guardado de datos
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [dataExisted, setDataExisted] = useState(false);
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [moduleResponseId, setModuleResponseId] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);

    const researchId = useParticipantStore(state => state.researchId);
    const participantId = useParticipantStore(state => state.participantId);

    const {
        saveResponse,
        updateResponse,
        isLoading: isApiLoading,
        error: apiHookError,
    } = useResponseAPI({ 
        researchId: researchId || '', 
        participantId: participantId || '' 
    });

    // useEffect para cargar datos existentes o inicializar desde config
    useEffect(() => {

        if (isMock) {
            // Si es mock, usar el orden de itemsFromConfig o el savedResponses del mock
            const mockSavedOrder = initialConfig.savedResponses;
            setRankedItems(Array.isArray(mockSavedOrder) && mockSavedOrder.length > 0 ? mockSavedOrder : [...itemsFromConfig]);
            setDataLoading(false);
            return;
        }

        if (!researchId || !participantId || !stepType) {
            setDataLoading(false);
            setRankedItems([...itemsFromConfig]); // Fallback al orden original de config
            setDataExisted(false);
            setModuleResponseId(null);
            setDocumentId(null);
            console.warn('[RankingQuestion] Carga OMITIDA: Faltan researchId, participantId o stepType para cargar datos reales.');
            return;
        }

        const apiClient = new ApiClient();
        setDataLoading(true);
        setApiError(null);
        setRankedItems([]); // Resetear antes de la carga
        setDataExisted(false);
        setModuleResponseId(null);
        setDocumentId(null);

        apiClient.getModuleResponses(researchId, participantId)
            .then(apiResponse => {
                let finalOrderToSet: string[] = [...itemsFromConfig]; // Por defecto, el orden de la config original

                if (!apiResponse.error && apiResponse.data?.data) {
                    const fullDocument = apiResponse.data.data as { id: string, responses: Array<{id: string, stepType: string, response: any}> };
                    setDocumentId(fullDocument.id);
                    const foundStepData = fullDocument.responses.find(item => item.stepType === stepType);

                    if (foundStepData && Array.isArray(foundStepData.response) && foundStepData.response.length > 0) {
                        // Validar que los items guardados sean un subconjunto de los items actuales y no haya duplicados
                        const savedOrder = foundStepData.response as string[];
                        const currentItemSet = new Set(itemsFromConfig);
                        const isValidSavedOrder = savedOrder.every(item => currentItemSet.has(item)) && new Set(savedOrder).size === savedOrder.length;
                        
                        if (isValidSavedOrder && savedOrder.length === itemsFromConfig.length) { // Asegurar que tengan la misma cantidad de items

                           finalOrderToSet = savedOrder; // Usar el orden guardado
                           setModuleResponseId(foundStepData.id || null);
                           setDataExisted(true);
                        } else {
                            console.warn('[RankingQuestion] Orden guardado en API no es válido o no coincide con items actuales. Usando orden de config.', {savedOrder, itemsFromConfig});
                            setDataExisted(false); 
                            setModuleResponseId(null);
                        }
                    } else {

                        setDataExisted(false); 
                        setModuleResponseId(null);
                    }
                } else {

                     if (apiResponse.apiStatus !== APIStatus.NOT_FOUND) {
                        setApiError(apiResponse.message || 'Error cargando datos del módulo.');
                    }
                }
                
                // Fallback a initialConfig.savedResponses si no se cargó nada de la API y este existe y es válido
                if (!dataExisted && Array.isArray(initialConfig.savedResponses) && initialConfig.savedResponses.length > 0) {
                    const configSavedOrder = initialConfig.savedResponses as string[];
                     const currentItemSet = new Set(itemsFromConfig);
                     const isValidConfigSavedOrder = configSavedOrder.every(item => currentItemSet.has(item)) && new Set(configSavedOrder).size === configSavedOrder.length;
                    if (isValidConfigSavedOrder && configSavedOrder.length === itemsFromConfig.length) {

                        finalOrderToSet = configSavedOrder;
                    }
                }
                setRankedItems(finalOrderToSet);
            })
            .catch(error => {
                console.error('[RankingQuestion] Excepción al cargar datos:', error);
                setApiError(error.message || 'Excepción desconocida al cargar datos.');
                setDataExisted(false);
                setModuleResponseId(null);
                const fallbackSavedOrder = initialConfig.savedResponses;
                setRankedItems(Array.isArray(fallbackSavedOrder) && fallbackSavedOrder.length > 0 ? fallbackSavedOrder : [...itemsFromConfig]);
            })
            .finally(() => {
                setDataLoading(false);
            });
    // Dependencias: initialConfig.savedResponses y JSON.stringify(itemsFromConfig) para reaccionar si los items base cambian
    }, [researchId, participantId, stepType, isMock, initialConfig.savedResponses, JSON.stringify(itemsFromConfig)]);

    // Texto dinámico para el botón
    let buttonText = 'Siguiente';
    if (isNavigating) {
        buttonText = 'Pasando al siguiente módulo...';
    } else if (isSaving || isApiLoading) {
        buttonText = 'Guardando...';
    } else if (!isMock && dataExisted && moduleResponseId) {
        buttonText = 'Actualizar y continuar';
    } else if (!isMock) {
        buttonText = 'Guardar y continuar';
    }

    const handleSaveAndProceed = async () => {
        if (isMock) {
            onStepComplete(rankedItems); // En modo mock, solo se completa con el estado actual
            return;
        }

        // Aquí no hay validación de mínimo/máximo, se guarda el orden actual.
        if (!researchId || !participantId) {
            setApiError("Faltan researchId o participantId para guardar.");
            return;
        }
        
        const currentStepIdForApi = stepIdFromProps || stepType;
        const currentStepNameForApi = componentTitle;

        setIsSaving(true);
        setApiError(null);

        try {
            let success = false;
            const payload = { response: rankedItems }; // La respuesta es el array ordenado de strings

            if (dataExisted && moduleResponseId) {

                await updateResponse(moduleResponseId, currentStepIdForApi, stepType, currentStepNameForApi, payload.response);
                if (apiHookError) { 
                    setApiError(apiHookError);
                } else { 
                    success = true;
                }
            } else {

                const result = await saveResponse(currentStepIdForApi, stepType, currentStepNameForApi, payload.response);
                 if (apiHookError) {
                    setApiError(apiHookError);
                } else if (result && result.id) {
                    setModuleResponseId(result.id); 
                    setDataExisted(true); 
                    success = true;
                }
            }

            if (success) {

                setIsNavigating(true);
                setTimeout(() => {
                    onStepComplete(rankedItems);
                }, 500);
            } else if (!apiHookError && !apiError) {
                 setApiError('La operación de guardado no parece haber tenido éxito.');
            }
        } catch (error: any) {
            console.error('[RankingQuestion] Excepción al guardar:', error);
            setApiError(error.message || 'Error desconocido durante el guardado.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const moveItemUp = (index: number) => {
        if (index > 0) {
            const newRankedItems = [...rankedItems];
            [newRankedItems[index - 1], newRankedItems[index]] = [newRankedItems[index], newRankedItems[index - 1]];
            setRankedItems(newRankedItems);
        }
    };

    const moveItemDown = (index: number) => {
        if (index < rankedItems.length - 1) {
            const newRankedItems = [...rankedItems];
            [newRankedItems[index], newRankedItems[index + 1]] = [newRankedItems[index + 1], newRankedItems[index]];
            setRankedItems(newRankedItems);
        }
    };
    
    if (dataLoading && !isMock) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                <p className="text-gray-600">Cargando ítems...</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{componentTitle}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            <p className="text-neutral-600 mb-4">{questionText}</p>

            {(apiError || apiHookError) && (
              <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-4 py-3 rounded mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span>{apiError || apiHookError}</span>
              </div>
            )}

            <div className="mb-4">
                {rankedItems.map((item, index) => (
                    <div key={item} className="flex items-center border rounded-md p-3 mb-2 bg-white shadow-sm">
                        <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium mr-3 select-none">
                            {index + 1}
                        </span>
                        <span className="flex-grow text-neutral-700 select-none">{item}</span>
                        <div className="flex space-x-1">
                            <button 
                                onClick={() => moveItemUp(index)}
                                disabled={index === 0 || isSaving || isApiLoading || dataLoading || isNavigating}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent text-lg text-neutral-600 disabled:text-neutral-400 transition-colors"
                                aria-label={`Mover ${item} hacia arriba`}
                            >
                                ▲
                            </button>
                            <button 
                                onClick={() => moveItemDown(index)}
                                disabled={index === rankedItems.length - 1 || isSaving || isApiLoading || dataLoading || isNavigating}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent text-lg text-neutral-600 disabled:text-neutral-400 transition-colors"
                                aria-label={`Mover ${item} hacia abajo`}
                            >
                                ▼
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={handleSaveAndProceed} // Cambiado de handleSubmit
                // Para ranking, siempre se puede proceder si no está guardando/cargando y no es mock (o si es mock).
                disabled={isSaving || isApiLoading || dataLoading || isNavigating}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
                {buttonText}
            </button>
            {process.env.NODE_ENV === 'development' && !isMock && (
                <div className="mt-4 p-2 bg-gray-50 text-xs text-gray-500 border rounded">
                    <p className="font-semibold">[Debug RankingQuestion]</p>
                    <p>Research ID: {researchId || 'N/A'}, Participant ID: {participantId || 'N/A'}</p>
                    <p>StepType: {stepType}, StepIdProp: {stepIdFromProps || 'N/A'}, StepNameProp: {stepNameFromProps || 'N/A'}</p>
                    <p>IsMock Flag: {isMock.toString()}</p>
                    <p>Data Loading: {dataLoading.toString()}, Data Existed: {dataExisted.toString()}</p>
                    <p>Document ID: {documentId || 'N/A'}, ModuleResponse ID: {moduleResponseId || 'N/A'}</p>
                    <p>API Saving: {isSaving.toString()}, API Hook Loading: {isApiLoading.toString()}</p>
                    <p>API Error (Form): {apiError || 'No'}, API Error (Hook): {apiHookError || 'No'}</p>
                    <p>Is Navigating: {isNavigating.toString()}</p>
                    <div>Items from Config (initialConfig.items): <pre>{JSON.stringify(itemsFromConfig, null, 2)}</pre></div>
                    <div>Ranked Items (current state): <pre>{JSON.stringify(rankedItems, null, 2)}</pre></div>
                    <div>InitialConfig SavedResponses: <pre>{JSON.stringify(initialConfig.savedResponses, null, 2)}</pre></div>
                </div>
            )}
        </div>
    );
};

// Componente para Cognitive Preference Test
const CognitivePreferenceTestQuestion: React.FC<{
    config: any; 
    stepName?: string;
    stepId?: string;
    stepType: string;
    token?: string | null;
    onStepComplete: (answer: any) => void;
    isMock: boolean;
}> = ({ config, stepName, stepId, stepType, token, onStepComplete, isMock }) => {
    const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
    const [isUrlLoading, setIsUrlLoading] = useState<boolean>(false);
    const [urlError, setUrlError] = useState<string | null>(null);
    
    const title = config.title || stepName || 'Test de Preferencia';
    const description = config.description;
    const questionText = config.questionText || (isMock ? '¿Cuál de estas opciones prefieres?' : '');
    const useDeviceFrame = !isMock && config.deviceFrame === true;
    const fileId = !isMock ? config.files[0]?.id : null;
    const s3Key = !isMock ? config.files[0]?.s3Key : null;

    useEffect(() => {
        if (s3Key && token) {
            const fetchPresignedUrl = async () => {
                setIsUrlLoading(true);
                setPresignedUrl(null);
                setUrlError(null);
                try {
                    const encodedKey = encodeURIComponent(s3Key);
                    const url = `${API_BASE_URL}/s3/download?key=${encodedKey}`;
                    
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.success && result.data?.downloadUrl) {

                            setPresignedUrl(result.data.downloadUrl);
                        } else {
                            console.error("[PreferenceTest] Invalid response structure from backend:", result);
                            setUrlError('Respuesta inválida del servidor al obtener URL.');
                        }
                    } else if (response.status === 404) {
                        console.warn(`[PreferenceTest] File not found (404) for key: ${s3Key}`);
                        setUrlError('El archivo de imagen no fue encontrado.');
                    } else {
                        console.error(`[PreferenceTest] Error fetching presigned URL (${response.status}):`, await response.text());
                        setUrlError(`Error (${response.status}) al obtener la URL de la imagen.`);
                    }
                } catch (fetchError: any) {
                    console.error("[PreferenceTest] Network error fetching presigned URL:", fetchError);
                    setUrlError(fetchError.message || 'Error de red al obtener URL.');
                } finally {
                    setIsUrlLoading(false);
                }
            };
            fetchPresignedUrl();
        } else if (!isMock && !token) {
            console.warn("[PreferenceTest] Missing token to fetch presigned URL.");
            setUrlError("Se requiere autenticación para ver la imagen.");
            setIsUrlLoading(false);
        }
        return () => {
           setIsUrlLoading(false); 
           setPresignedUrl(null);
           setUrlError(null);
        }
    }, [s3Key, token, isMock]);

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-3xl w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800 text-center">{title}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3 text-center">{description}</p>}
            <p className="text-neutral-600 mb-6 text-center">{questionText}</p>
            
            <div className="flex justify-center items-center mb-6 min-h-[250px]">
                {isMock ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        {(config.options || ['Mock A', 'Mock B']).slice(0, 2).map((optionText: string, index: number) => (
                            <div key={index} className="border border-dashed border-neutral-300 rounded-md p-4 flex items-center justify-center min-h-[150px]">
                                <span className="text-neutral-500 italic">{optionText}</span> 
                            </div>
                        ))}
                    </div>
                ) : isUrlLoading ? (
                    <div className="flex flex-col items-center text-neutral-500">
                        <svg className="animate-spin h-8 w-8 text-primary-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Cargando imagen...</span>
                    </div>
                ) : urlError ? (
                     <div className="border border-dashed border-red-300 bg-red-50 rounded-md p-4 flex flex-col items-center justify-center min-h-[150px] text-red-700">
                        <span className="font-medium">Error al cargar imagen</span>
                        <span className="text-sm">{urlError}</span> 
                    </div>
                ) : presignedUrl ? (
                    <div className={`p-2 ${useDeviceFrame ? 'border-4 border-neutral-700 rounded-lg shadow-lg' : ''}`}> 
                       <img 
                           src={presignedUrl} 
                           alt={`Opción preferencia ${config.files[0]?.name || 1}`}
                           className="max-w-sm md:max-w-md max-h-[400px] object-contain rounded"
                       />
                    </div>
                ) : (
                    <div className="text-neutral-500 italic">No hay imagen disponible.</div>
                )}
            </div>
            
            <div className="flex justify-center">
                <button
                    onClick={() => onStepComplete(fileId || (isMock ? config.options[0] : 'selected_image_no_id'))} 
                    disabled={isUrlLoading || !!urlError || !presignedUrl} 
                    className={`bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors ${isUrlLoading || urlError || !presignedUrl ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    Siguiente
                </button>
            </div>
        </div>
    );
};

const CurrentStepRenderer: React.FC<CurrentStepRendererProps> = ({
    stepType,
    stepConfig,
    stepId,
    stepName,
    researchId,
    token,
    onLoginSuccess,
    onStepComplete,
    onError,
}) => {
    const [_loading, _setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Wrapper general para aplicar advertencia si es necesario
    const renderStepWithWarning = useCallback(
        (content: React.ReactNode, isMock: boolean, warningMessage?: string) => (
            <div className="relative w-full flex flex-col items-center justify-center min-h-full p-4 sm:p-8">
                {isMock && <MockDataWarning message={warningMessage} />}
                {content}
            </div>
        ),
        []
    );

    // Manejo unificado de errores
    const handleError = useCallback((message: string) => {
        setError(message);
        if (onError) {
            onError(message, stepType);
        }
    }, [onError, stepType]);

    // Función para renderizar el contenido basado en el tipo de paso
    const renderContent = useCallback(() => {
        if (error) {
            return <div className="p-6 text-center text-red-500">Error: {error}</div>;
        }

        if (_loading) {
            return <div className="p-6 text-center">Cargando...</div>;
        }

        switch (stepType) {
            case 'login':
                if (!onLoginSuccess) {
                    handleError("onLoginSuccess no fue proporcionado a CurrentStepRenderer para el paso LOGIN");
                    return <div className="p-6 text-center text-red-500">Error de configuración interna (Login).</div>;
                }
                return <ParticipantLogin researchId={researchId} onLogin={onLoginSuccess} />;
            case 'welcome': {
                if (!token || !onStepComplete) return null;
                const isWelcomeMock = !stepConfig; // Asumir que necesita config
                return renderStepWithWarning(
                     <WelcomeScreenHandler
                            researchId={researchId}
                            token={token}
                            onComplete={onStepComplete}
                            onError={(msg) => handleError(msg)}
                        />,
                     isWelcomeMock,
                     isWelcomeMock ? "Datos de bienvenida podrían ser de prueba si no se cargan." : undefined
                );
               }
            case 'instruction': {
                 if (!onStepComplete) return null;
                 const isInstructionMock = !stepConfig || !stepConfig.text;
                 const instructionConfig = isInstructionMock 
                    ? { title: 'Instrucciones (Prueba)', text: 'Texto de instrucciones de prueba.' }
                    : stepConfig;
                 
                 return renderStepWithWarning(
                     <div className="bg-white p-8 rounded-lg shadow-md max-w-lg">
                        <h1 className="text-2xl font-semibold mb-4 text-neutral-800">{instructionConfig.title}</h1>
                        <p className="text-neutral-600 mb-6">{instructionConfig.text}</p>
                        <button onClick={() => onStepComplete()} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                            Continuar
                        </button>
                    </div>,
                     isInstructionMock
                 );
                } // <<< Fin bloque

            case 'cognitive_short_text': { 
                if (!onStepComplete || !stepType) return null;
                const isMock = !stepConfig; // Es mock si no hay config real
                const configToUse = isMock
                    ? { questionText: 'Pregunta de texto corto (Prueba)?', placeholder: 'Escribe aquí...' }
                    : stepConfig;
                
                 return renderStepWithWarning(
                    <div className="w-full max-w-xl"> {/* Asegurar consistencia con el case smartvoc_feedback */}
                        <SmartVocFeedbackQuestion
                            config={configToUse}
                            stepId={stepId}
                            stepName={stepName}
                            stepType={stepType} // Se pasará 'cognitive_short_text'
                            onStepComplete={onStepComplete}
                        />
                    </div>,
                     isMock
                 );
            } 

            case 'cognitive_long_text': { 
                if (!onStepComplete) return null;
                const isCogLongTextMock = !stepConfig || !stepConfig.questionText;
                const cogLongTextConfig = isCogLongTextMock
                    ? { questionText: 'Pregunta de texto largo (Prueba)?', placeholder: 'Escribe tu respuesta detallada...' }
                    : stepConfig;
                
                return renderStepWithWarning(
                    <LongTextQuestion
                        config={cogLongTextConfig}
                        stepId={stepId}
                        stepName={stepName}
                        stepType={stepType}
                        onStepComplete={onStepComplete}
                    />,
                     isCogLongTextMock
                 );
                } 

            case 'cognitive_single_choice': { 
                if (!onStepComplete) return null;
                
                
                // <<< INICIO CAMBIOS >>>
                // Evaluar si el stepConfig tiene la estructura mínima necesaria, aunque el contenido esté vacío.
                const hasValidQuestionSource = stepConfig && (typeof stepConfig.questionText === 'string' || typeof stepConfig.title === 'string');
                const hasValidOptionsSource = stepConfig && 
                                           ( (Array.isArray(stepConfig.options) && stepConfig.options.every((opt: string) => typeof opt === 'string')) ||  // <<< Añadido (opt: string)
                                             (Array.isArray(stepConfig.choices) && stepConfig.choices.every((choice: { id?: string; text: string }) => choice && typeof choice.text === 'string')) ); // <<< Añadido tipo para choice
                
                // isMock será true si no hay stepConfig, o si falta una fuente válida para la pregunta o las opciones.
                const isMockBasedOnStructure = !stepConfig || !hasValidQuestionSource || !hasValidOptionsSource;

                let configForQuestion;
                if (isMockBasedOnStructure) {
                    configForQuestion = { 
                        questionText: 'Pregunta de opción única (Prueba)?', 
                        options: ['Opción A', 'Opción B', 'Opción C'],
                        title: 'Pregunta de opción única (Prueba)?', // Mantener consistencia para el mock
                        savedResponses: null // Para el mock, no hay respuestas guardadas inicialmente
                    };
                } else {
                    // Transformar el stepConfig recibido al formato que espera SingleChoiceQuestion
                    const questionText = stepConfig.questionText || stepConfig.title || 'Pregunta sin texto'; // Usar title si questionText no existe
                    const options = stepConfig.options || 
                                    (stepConfig.choices ? 
                                        stepConfig.choices.map((choice: { id?: string; text: string }, index: number) => choice.text || `Opción ${choice.id || index + 1}`) // <<< Añadido tipo para choice
                                        : []);
                    configForQuestion = {
                        ...stepConfig, // Mantener otras propiedades del stepConfig original
                        questionText: questionText,
                        options: options,
                        // savedResponses ya debería estar en stepConfig si existe (como vimos en el log)
                    };
                }
                
                return renderStepWithWarning(
                    <SingleChoiceQuestion
                        config={configForQuestion} // Usar el config transformado/mock
                        stepId={stepId}
                        stepName={stepName}
                        stepType={stepType}
                        onStepComplete={onStepComplete}
                        isMock={isMockBasedOnStructure} // Usar el nuevo flag de mock
                    />,
                     isMockBasedOnStructure // Usar el nuevo flag de mock para el warning general
                 );
                } 

            // <<< NUEVO CASE para cognitive_multiple_choice >>>
            case 'cognitive_multiple_choice': { 
                if (!onStepComplete) return null;


                const hasValidQuestionSource = stepConfig && (typeof stepConfig.questionText === 'string' || typeof stepConfig.title === 'string');
                const hasValidOptionsSource = stepConfig && 
                                           ( (Array.isArray(stepConfig.options) && stepConfig.options.every((opt: string) => typeof opt === 'string')) || 
                                             (Array.isArray(stepConfig.choices) && stepConfig.choices.every((choice: { id?: string; text: string }) => choice && typeof choice.text === 'string')) );
                
                const isMockBasedOnStructure = !stepConfig || !hasValidQuestionSource || !hasValidOptionsSource;

                let configForQuestion;
                if (isMockBasedOnStructure) {
                    configForQuestion = { 
                        questionText: 'Pregunta de opción múltiple (Prueba)?', 
                        options: ['Opción Múltiple 1', 'Opción Múltiple 2', 'Opción Múltiple 3'],
                        title: 'Pregunta de opción múltiple (Prueba)?',
                        savedResponses: [] // Para múltiple choice, es un array
                    };
                } else {
                    const questionText = stepConfig.questionText || stepConfig.title || 'Pregunta múltiple sin texto';
                    const options = stepConfig.options || 
                                    (stepConfig.choices ? 
                                        stepConfig.choices.map((choice: { id?: string; text: string }, index: number) => choice.text || `Opción ${choice.id || index + 1}`) 
                                        : []);
                    configForQuestion = {
                        ...stepConfig,
                        questionText: questionText,
                        options: options,
                        // savedResponses (array) ya debería estar en stepConfig si existe
                    };
                }
                
                 return renderStepWithWarning(
                     <MultipleChoiceQuestion
                        config={configForQuestion}
                        stepId={stepId}
                        stepName={stepName}
                        stepType={stepType}
                        onStepComplete={onStepComplete} // Esto se cambiará cuando refactoricemos MultipleChoiceQuestion
                        isMock={isMockBasedOnStructure} // MultipleChoiceQuestion usará esto para decidir si carga datos API
                    />,
                     isMockBasedOnStructure
                 );
                } 

            case 'cognitive_linear_scale': { 
                 if (!onStepComplete) return null;

                const hasValidQuestionSource = stepConfig && (typeof stepConfig.questionText === 'string' || typeof stepConfig.title === 'string');
                
                // <<< INICIO AJUSTE PARA LEER DESDE scaleConfig >>>
                const scaleConfig = stepConfig?.scaleConfig;
                const hasValidScaleDefinition = stepConfig && 
                                                ( (typeof stepConfig.minValue === 'number' && typeof stepConfig.maxValue === 'number') || // Legado
                                                  (scaleConfig && typeof scaleConfig.startValue === 'number' && typeof scaleConfig.endValue === 'number') || // Nuevo desde scaleConfig
                                                  typeof stepConfig.scaleSize === 'number' ||
                                                  (Array.isArray(stepConfig.scaleValues) && stepConfig.scaleValues.length > 0) );
                // <<< FIN AJUSTE PARA LEER DESDE scaleConfig >>>

                const isMockBasedOnStructure = !stepConfig || !hasValidQuestionSource || !hasValidScaleDefinition;

                let configForQuestion;
                if (isMockBasedOnStructure) {
                    configForQuestion = { 
                        questionText: 'Pregunta de escala lineal (Prueba)?', 
                        title: 'Pregunta de escala lineal (Prueba)?',
                        minValue: 1, 
                        maxValue: 5, 
                        minLabel: 'Mín (Prueba)', 
                        maxLabel: 'Máx (Prueba)',
                        savedResponses: null
                    }; 
                } else {
                    const questionText = stepConfig.questionText || stepConfig.title || 'Pregunta de escala sin texto';
                    // <<< INICIO AJUSTE PARA USAR scaleConfig SI EXISTE >>>
                    const minValue = scaleConfig?.startValue ?? stepConfig.minValue ?? 1;
                    const maxValue = scaleConfig?.endValue ?? stepConfig.maxValue ?? stepConfig.scaleSize ?? 5;
                    const minLabel = scaleConfig?.startLabel ?? stepConfig.minLabel ?? stepConfig.leftLabel ?? 'Mínimo';
                    const maxLabel = scaleConfig?.endLabel ?? stepConfig.maxLabel ?? stepConfig.rightLabel ?? 'Máximo';
                    // <<< FIN AJUSTE PARA USAR scaleConfig SI EXISTE >>>
                    
                    configForQuestion = {
                        ...stepConfig, // Propagar todo el stepConfig original
                        questionText: questionText,
                        title: questionText, // Asegurar que title también se popule si se usa como fuente
                        minValue: minValue,
                        maxValue: maxValue,
                        minLabel: minLabel,
                        maxLabel: maxLabel,
                        // savedResponses ya está en stepConfig (ej. stepConfig.savedResponses)
                    };
                }

                 return renderStepWithWarning(
                     <LinearScaleQuestion
                        config={configForQuestion}
                        stepId={stepId}
                        stepName={stepName}
                        stepType={stepType}
                        onStepComplete={onStepComplete}
                        isMock={isMockBasedOnStructure}
                    />,
                     isMockBasedOnStructure
                 );
            } 
            
            // <<< CASE para cognitive_ranking reemplazado >>>
            case 'cognitive_ranking': {
                if (!onStepComplete) return null;

                const hasValidQuestionSource = stepConfig && (typeof stepConfig.questionText === 'string' || typeof stepConfig.title === 'string');
                // Para ranking, necesitamos una lista de items/options/choices para ordenar.
                const hasValidItems = stepConfig && 
                                      ( (Array.isArray(stepConfig.items) && stepConfig.items.length > 0 && stepConfig.items.every((item: any) => typeof item === 'string' || (typeof item === 'object' && typeof item.text === 'string'))) ||
                                        (Array.isArray(stepConfig.options) && stepConfig.options.length > 0 && stepConfig.options.every((opt: any) => typeof opt === 'string' || (typeof opt === 'object' && typeof opt.text === 'string'))) ||
                                        (Array.isArray(stepConfig.choices) && stepConfig.choices.length > 0 && stepConfig.choices.every((choice: any) => choice && (typeof choice.text === 'string' && choice.text.trim() !== '' ) )) ); // <<< AÑADIDO SOPORTE PARA CHOICES CON TEXTO

                const isMockBasedOnStructure = !stepConfig || !hasValidQuestionSource || !hasValidItems;

                let configForQuestion;
                if (isMockBasedOnStructure) {

                    configForQuestion = { 
                        questionText: 'Pregunta de ranking (Prueba)?', 
                        title: 'Pregunta de ranking (Prueba)?',
                        items: ['Item de Prueba Mock 1', 'Item de Prueba Mock 2', 'Item de Prueba Mock 3'], // Items para el mock
                        savedResponses: [] // En mock, empezamos sin orden guardado o con un orden mock específico si se desea
                    };
                } else {
                    const questionText = stepConfig.questionText || stepConfig.title || 'Pregunta de ranking sin texto';
                    
                    let itemsToRank: string[] = [];
                    if (Array.isArray(stepConfig.items) && stepConfig.items.every((item: any) => typeof item === 'string')) {
                        itemsToRank = stepConfig.items;
                    } else if (Array.isArray(stepConfig.items)) { // Array de objetos {text: ...}
                        itemsToRank = stepConfig.items.map((item: any) => item.text || 'Item sin texto').filter((text: string) => text !== 'Item sin texto');
                    } else if (Array.isArray(stepConfig.options) && stepConfig.options.every((opt: any) => typeof opt === 'string')) {
                        itemsToRank = stepConfig.options;
                    } else if (Array.isArray(stepConfig.options)) { // Array de objetos {text: ...}
                        itemsToRank = stepConfig.options.map((opt: any) => opt.text || 'Opción sin texto').filter((text: string) => text !== 'Opción sin texto');
                    } else if (Array.isArray(stepConfig.choices)) { // <<< AÑADIDO MANEJO DE CHOICES
                        itemsToRank = stepConfig.choices
                            .map((choice: any) => choice.text || 'Choice sin texto')
                            .filter((text: string) => text.trim() !== '' && text !== 'Choice sin texto');
                    }
                    
                    // Si después de todo, itemsToRank está vacío pero savedResponses tiene algo, es una inconsistencia.
                    // Por ahora, priorizamos los items definidos en la pregunta.
                    // Si itemsToRank está vacío aquí, es un problema de configuración del flujo.
                    if(itemsToRank.length === 0) {
                         console.warn('[CurrentStepRenderer] cognitive_ranking - No se pudieron extraer items válidos de items, options o choices. Esto puede ser un error de configuración del flujo.');
                         // Forzar mock si no hay items válidos para rankear, incluso si otras condiciones de mock no se cumplieron.
                         // Esto evita pasar un array vacío de items a RankingQuestion si se espera data real.
                         // OJO: Esto significa que isMockBasedOnStructure podría necesitar reevaluarse aquí, o que RankingQuestion necesita manejar items vacíos.
                         // Por ahora, vamos a dejar que RankingQuestion reciba items vacíos y muestre un mensaje apropiado si es necesario.
                    }

                    configForQuestion = {
                        ...stepConfig, // Propagar el stepConfig original
                        questionText: questionText,
                        title: questionText,
                        items: itemsToRank, // Usar la lista normalizada de strings
                        // savedResponses (array de strings ordenado) se pasa tal cual desde stepConfig
                    };
                }
                return renderStepWithWarning(
                    <RankingQuestion
                        config={configForQuestion}
                        stepId={stepId}
                        stepName={stepName}
                        stepType={stepType}
                        onStepComplete={onStepComplete}
                        isMock={isMockBasedOnStructure} 
                    />,
                    isMockBasedOnStructure
                );
            }

            // <<< NUEVO CASE para cognitive_navigation_flow >>>
            case 'cognitive_navigation_flow': {
                if (!onStepComplete) return null;
                const isMock = !stepConfig || !stepConfig.taskDescription;
                const config = isMock ? { taskDescription: 'Tarea de flujo de navegación (Prueba).' } : stepConfig;

                const title = config.title || stepName || 'Flujo de Navegación';
                const description = config.description;
                const taskDescription = config.taskDescription || (isMock ? 'Descripción de prueba' : '');

                 return renderStepWithWarning(
                     <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full">
                         <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
                         {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
                         <p className="text-neutral-600 mb-4">{taskDescription}</p>
                         <p className="text-sm text-neutral-500 mb-4">(Placeholder: Aquí iría la interfaz/simulación para la tarea de navegación)</p>
                         <div className="border border-dashed border-neutral-300 p-4 rounded-md mb-6 min-h-[200px] flex items-center justify-center text-neutral-400">
                             Simulación de Navegación
                         </div>
                         <button onClick={() => onStepComplete({})} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">Siguiente</button>
                     </div>,
                     isMock
                 );
            }

            // <<< CASE MODIFICADO para cognitive_preference_test >>>
            case 'cognitive_preference_test': {
                if (!onStepComplete) return null;
                
                const hasRealFiles = stepConfig && Array.isArray(stepConfig.files) && stepConfig.files.length > 0 && stepConfig.files[0].s3Key;
                const isMock = !hasRealFiles;
                
                const configToUse = isMock ? { // Renombrado para evitar conflicto de nombres
                    questionText: 'Test de preferencia (Prueba)?', 
                    options: ['Opción A Placeholder', 'Opción B Placeholder'], 
                    files: [] 
                } : stepConfig;

                return renderStepWithWarning(
                     <CognitivePreferenceTestQuestion
                        config={configToUse}
                        stepId={stepId}
                        stepName={stepName}
                        stepType={stepType}
                        token={token}
                        onStepComplete={onStepComplete}
                        isMock={isMock}
                    />,
                     isMock
                 );
            }

            case 'smartvoc_csat': { 
                 if (!onStepComplete) return null;
                 const isCsatMock = !stepConfig || !stepConfig.questionText;
                 const csatConfig = isCsatMock
                    ? { 
                        questionText: 'Pregunta CSAT (Prueba)?', 
                        instructions: 'Por favor, califique su nivel de satisfacción.',
                        initialValue: null
                     }
                    : {
                        ...stepConfig,
                        initialValue: stepConfig.savedResponses
                     };

                 return renderStepWithWarning(
                     <CSATView
                        questionText={csatConfig.questionText}
                        instructions={csatConfig.instructions}
                        companyName={csatConfig.companyName}
                        initialValue={csatConfig.initialValue}
                        onNext={onStepComplete}
                        stepId={stepId}
                        stepType={stepType}
                        config={csatConfig}
                    />,
                     isCsatMock
                 );
                } 

            // <<< NUEVO CASE para smartvoc_cv >>>
            case 'smartvoc_cv': { 
                 if (!onStepComplete) return null;
                 const isMock = !stepConfig || !stepConfig.questionText;
                 const config = isMock ? { questionText: 'Pregunta Customer Value (Prueba)?' } : stepConfig;
                 return renderStepWithWarning(
                     <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                         <h2 className="text-xl font-medium mb-3 text-neutral-700">{stepName || 'Valor Percibido'}</h2>
                         <p className="text-neutral-600 mb-4">{config.questionText}</p>
                         <p className="text-sm text-neutral-500">(Placeholder: Vista para Customer Value)</p>
                         <button onClick={() => onStepComplete({})} className="mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">Siguiente</button>
                     </div>,
                     isMock
                 );
                } 
            
            // <<< NUEVO CASE para smartvoc_nps >>>
            case 'smartvoc_nps': { 
                 if (!onStepComplete) return null;
                 const isMock = !stepConfig || !stepConfig.questionText;
                 const config = isMock ? { 
                    questionText: 'Pregunta NPS (Prueba)?', 
                    leftLabel: 'Nada probable', 
                    rightLabel: 'Muy probable' 
                } : stepConfig;

                return renderStepWithWarning(
                     <NPSView
                        questionText={config.questionText}
                        instructions={config.instructions}
                        leftLabel={config.leftLabel}
                        rightLabel={config.rightLabel}
                        companyName={config.companyName} // Si aplica para NPSView
                        onNext={onStepComplete}
                        stepId={stepId}
                        stepType={stepType}
                     />,
                     isMock
                 );
                } 
            
            // <<< NUEVO CASE para smartvoc_nev >>>
            case 'smartvoc_nev': { 
                 if (!onStepComplete) return null;
                 const isMock = !stepConfig || !stepConfig.questionText;
                 const config = isMock ? { questionText: 'Pregunta NEV (Prueba)?' } : stepConfig;
                 return renderStepWithWarning(
                     <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                         <h2 className="text-xl font-medium mb-3 text-neutral-700">{stepName || 'Valor Emocional Neto'}</h2>
                         <p className="text-neutral-600 mb-4">{config.questionText}</p>
                         <p className="text-sm text-neutral-500">(Placeholder: Vista para NEV)</p>
                         <button onClick={() => onStepComplete({})} className="mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">Siguiente</button>
                     </div>,
                     isMock
                 );
                } 

            case 'smartvoc_feedback': {
                 if (!onStepComplete || !stepType) return null; // Asegurar que stepType también esté
                 const isFeedbackMock = !stepConfig || !stepConfig.questionText;
                 const feedbackConfig = isFeedbackMock
                    ? { questionText: 'Pregunta Feedback (Prueba)?', placeholder: 'Escribe aquí...' }
                    : stepConfig; // Ya no pasamos savedResponses desde aquí
                 
                 return renderStepWithWarning(
                    <div className="w-full max-w-xl">
                        <SmartVocFeedbackQuestion
                            config={feedbackConfig}
                            stepId={stepId} // stepId del flujo
                            stepName={stepName} // stepName del flujo (opcional, usado para el título por defecto)
                            stepType={stepType} // ej. 'smartvoc_feedback'
                            onStepComplete={onStepComplete}
                            // researchId y participantId se obtienen del store dentro del componente
                        />
                    </div>,
                    isFeedbackMock
                 );
            } 

            case 'smartvoc_ces': { 
                 if (!onStepComplete) return null;
                 const isCesMock = !stepConfig || !stepConfig.questionText;
                 const cesConfig = isCesMock
                    ? { 
                        questionText: 'Pregunta CES (Prueba)?', 
                        leftLabel: 'Muy Difícil', 
                        rightLabel: 'Muy Fácil',
                        initialValue: null
                      } 
                    : {
                        ...stepConfig,
                        initialValue: stepConfig.savedResponses
                     };

                 return renderStepWithWarning(
                     <DifficultyScaleView
                        questionText={cesConfig.questionText}
                        instructions={cesConfig.instructions}
                        leftLabel={cesConfig.leftLabel}
                        rightLabel={cesConfig.rightLabel}
                        companyName={cesConfig.companyName}
                        initialValue={cesConfig.initialValue}
                        onNext={onStepComplete}
                        stepId={stepId}
                        stepType={stepType}
                        config={cesConfig}
                    />,
                     isCesMock
                 );
                } // Fin del bloque para smartvoc_ces

            case 'thankyou': {
                const isThankYouMock = !stepConfig; // Asumir que necesita config para mensajes
                 // Eliminar _thankYouConfig ya que no se usa después
                 // const _thankYouConfig = isThankYouMock
                 //    ? { title: '¡Gracias! (Prueba)', message: 'Mensaje de agradecimiento de prueba.'}
                 //    : stepConfig;
                
                 // Verificar si tenemos datos de respuestas en la configuración
                 const responsesData = stepConfig?.responsesData;
                
                 return renderStepWithWarning(
                     <ThankYouView
                         onContinue={() => console.log("Acción final desde ThankYou")}
                         responsesData={responsesData} // responsesData se pasa aquí
                     />,
                     isThankYouMock
                 );
                } 

            case 'demographic': {
                return (
                    <DemographicStep
                        researchId={researchId}
                        token={token}
                        stepConfig={stepConfig}
                        onStepComplete={onStepComplete}
                        onError={onError}
                    />
                );
            }
            default:
                 // Manejar tipos no reconocidos
                 console.warn(`[CurrentStepRenderer] Tipo de paso no manejado en switch: ${stepType}`);
                 // NO llamar a onError aquí para evitar error de renderizado
                 // Devolver un componente de error visual o null
                 return (
                     <div className="flex items-center justify-center h-full w-full p-8 text-center">
                          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
                             <strong className="font-bold">Error de Renderizado:</strong>
                             <span className="block sm:inline"> Tipo de paso no reconocido: '{stepType}'.</span>
                         </div>
                      </div>
                 );
        }
    }, [stepType, stepConfig, stepId, stepName, researchId, token, onLoginSuccess, onStepComplete, error, _loading, handleError, renderStepWithWarning]);

    return renderContent();
};

export default CurrentStepRenderer; 