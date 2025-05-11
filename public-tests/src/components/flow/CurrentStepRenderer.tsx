import React, { useState, useEffect, useCallback } from 'react';
import { ParticipantLogin } from '../auth/ParticipantLogin';
import WelcomeScreenHandler from './WelcomeScreenHandler';
import { Participant } from '../../../../shared/interfaces/participant';
import { CSATView, FeedbackView, ThankYouView, DifficultyScaleView, NPSView } from '../smartVoc';
import { DemographicsForm } from '../demographics/DemographicsForm';
import { DemographicResponses, DEFAULT_DEMOGRAPHICS_CONFIG } from '../../types/demographics';
import { eyeTrackingService } from '../../services/eyeTracking.service';
import { demographicsService } from '../../services/demographics.service';
import { useParticipantStore } from '../../stores/participantStore';
import { useResponseAPI } from '../../hooks/useResponseAPI';
import { ApiClient, APIStatus } from '../../lib/api';

// === IMPORTAR COMPONENTES EXTRAÍDOS ===
import { ShortTextQuestion as ShortTextQuestionComponent } from './questions/ShortTextQuestion';
// ... (Importar los otros componentes cuando se muevan)

// Interfaz para las preguntas demográficas de la API de eye-tracking
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
            console.log('[DemographicStep] Cargando respuestas guardadas:', stepConfig.savedResponses);
            setDemographicResponses(stepConfig.savedResponses);
        }
    }, [stepConfig?.savedResponses]);
    
    useEffect(() => {
        console.log(`[DemographicStep] Realizando consulta a la API de eye-tracking, researchId: ${researchId}, token: ${token ? 'disponible' : 'no disponible'}`);
        console.log('[DemographicStep] Valores iniciales actuales:', demographicResponses);
        setConfigLoading(true);
        
        if (researchId && token) {
            eyeTrackingService.getEyeTrackingConfig(researchId, token)
                .then(response => {
                    console.log('[DemographicStep] Respuesta de la API de eye-tracking:', response);
                    const extendedData = response.data as ExtendedEyeTrackingData;
                    if (extendedData?.demographicQuestions) {
                        const apiQuestions = extendedData.demographicQuestions;
                        console.log('[DemographicStep] Preguntas demográficas de la API:', apiQuestions);
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
                        console.log('[DemographicStep] Configuración final de preguntas demográficas:', updatedConfig);
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
                    console.log('[DemographicStep] Carga de configuración finalizada.');
                });
        } else {
            setConfigLoading(false);
            console.warn('[DemographicStep] No se pudo cargar config de API (faltan ID/Token). Usando config por defecto.');
        }
    }, [researchId, token]); // Quitar demographicResponses de aquí si no se usa directamente
    
    const handleDemographicSubmit = async (responses: DemographicResponses) => {
        setLoading(true);
        try {
            console.log('[DemographicStep] Respuestas demográficas recibidas en CurrentStepRenderer:', responses);
            
            // La lógica de guardado/actualización ahora es manejada internamente por DemographicsForm usando useResponseAPI.
            // Ya no necesitamos llamar a demographicsService.saveDemographicResponses aquí.
            // DemographicsForm llamará a esta función (handleDemographicSubmit) a través de su prop onSubmit
            // SOLO DESPUÉS de que el guardado en el servidor haya sido exitoso.

            if (onStepComplete) {
                console.log('[DemographicStep] Guardado gestionado por DemographicsForm. Procediendo con onStepComplete.');
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
                    console.log('[LongTextQuestion] No se encontraron respuestas previas o hubo un error al cargar.', apiResponse.message);
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
                    console.log(`[LongTextQuestion] Datos encontrados para stepType '${stepType}':`, foundStepData);
                    setCurrentResponse(typeof foundStepData.response === 'string' ? foundStepData.response : '');
                    setModuleResponseId(foundStepData.id || null);
                    setDataExisted(true);
                } else {
                    console.log(`[LongTextQuestion] No se encontraron datos específicos para stepType '${stepType}'.`);
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
            if (dataExisted && moduleResponseId) {
                console.log(`[LongTextQuestion] Actualizando (PUT) para moduleResponseId: ${moduleResponseId}`);
                const result = await updateResponse(moduleResponseId, currentStepId, stepType, currentStepName, currentResponse);
                if (apiHookError) { 
                    setApiError(apiHookError);
                } else if ((result && result.id) || (result && result.success === true) || !apiHookError) { 
                    success = true;
                }
            } else {
                console.log(`[LongTextQuestion] Creando (POST) para stepType: ${stepType}`);
                const result = await saveResponse(currentStepId, stepType, currentStepName, currentResponse);
                 if (apiHookError) {
                    setApiError(apiHookError);
                } else if (result && result.id) {
                    setModuleResponseId(result.id); 
                    setDataExisted(true); 
                    success = true;
                }
            }

            if (success) {
                console.log('[LongTextQuestion] Guardado exitoso. Llamando a onStepComplete.');
                if (onStepComplete) {
                    onStepComplete(currentResponse);
                }
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
                disabled={isSaving || isApiLoading || !researchId || !participantId}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {(isSaving || isApiLoading) ? 'Guardando...' : 'Siguiente'}
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
    stepId?: string;
    stepName?: string;
    stepType: string;
    onStepComplete: (answer: any) => void;
    isMock: boolean;
}> = ({ config, stepId, stepName, stepType, onStepComplete, isMock }) => {
    const title = config.title || stepName || 'Pregunta de opción única';
    const description = config.description;
    const questionText = config.questionText || (isMock ? 'Pregunta de prueba' : '');
    const options = config.options || (isMock ? ['Opción 1', 'Opción 2', 'Opción 3'] : []);
    
    // Inicializar con respuestas guardadas o null
    const [selectedOption, setSelectedOption] = useState<string | null>(() => {
        return config.savedResponses || null;
    });
    
    // Si cambian las respuestas guardadas en config, actualizar el estado
    useEffect(() => {
        if (config.savedResponses !== undefined) {
            setSelectedOption(config.savedResponses);
        }
    }, [config.savedResponses]);

    const handleSubmit = () => {
        if (selectedOption) {
            onStepComplete(selectedOption);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            <p className="text-neutral-600 mb-4">{questionText}</p>
            <div className="flex flex-col gap-2 mb-4">
                {options.map((option: string, index: number) => (
                    <button
                        key={index}
                        onClick={() => setSelectedOption(option)}
                        className={`p-3 border rounded-md text-left transition-colors ${
                            selectedOption === option 
                                ? 'bg-primary-100 border-primary-300 text-primary-700'
                                : 'border-neutral-300 text-neutral-700 hover:bg-gray-50'
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>
            <button
                onClick={handleSubmit}
                disabled={!selectedOption}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
                Siguiente
            </button>
        </div>
    );
};

// Componente para Multiple Choice
const MultipleChoiceQuestion: React.FC<{
    config: any; 
    stepId?: string;
    stepName?: string;
    stepType: string;
    onStepComplete: (answer: any) => void;
    isMock: boolean;
}> = ({ config, stepId, stepName, stepType, onStepComplete, isMock }) => {
    const title = config.title || stepName || 'Pregunta de opciones múltiples';
    const description = config.description;
    const questionText = config.questionText || (isMock ? 'Selecciona todas las opciones que apliquen' : '');
    const options = config.options || (isMock ? ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'] : []);
    const minSelections = config.minSelections || 0;
    const maxSelections = config.maxSelections || options.length;
    
    // Inicializar con respuestas guardadas o array vacío
    const [selectedOptions, setSelectedOptions] = useState<string[]>(() => {
        return config.savedResponses || [];
    });
    
    // Si cambian las respuestas guardadas en config, actualizar el estado
    useEffect(() => {
        if (config.savedResponses !== undefined) {
            setSelectedOptions(config.savedResponses);
        }
    }, [config.savedResponses]);

    const handleCheckboxChange = (option: string) => {
        setSelectedOptions(prev => {
            return prev.includes(option)
                ? prev.filter(item => item !== option) // Quitar si ya está seleccionado
                : (prev.length < maxSelections ? [...prev, option] : prev); // Añadir si no excede el máximo
        });
    };

    const handleSubmit = () => {
        if (selectedOptions.length >= minSelections) {
            onStepComplete(selectedOptions);
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            <p className="text-neutral-600 mb-4">{questionText}</p>
            <div className="flex flex-col gap-2 mb-4">
                {options.map((option: string, index: number) => (
                    <label key={index} className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                        <input
                            type="checkbox"
                            checked={selectedOptions.includes(option)}
                            onChange={() => handleCheckboxChange(option)}
                            className="h-5 w-5 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-neutral-700">{option}</span>
                    </label>
                ))}
            </div>
            <div className="text-sm text-neutral-500 mb-4">
                {minSelections > 0 && `Selecciona al menos ${minSelections} opciones. `}
                {maxSelections < options.length && `Puedes seleccionar hasta ${maxSelections} opciones. `}
                Seleccionadas: {selectedOptions.length}
            </div>
            <button
                onClick={handleSubmit}
                disabled={selectedOptions.length < minSelections}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
                Siguiente
            </button>
        </div>
    );
};

// Componente para Linear Scale
const LinearScaleQuestion: React.FC<{
    config: any; 
    stepName?: string;
    stepId?: string;
    stepType: string;
    onStepComplete: (answer: any) => void;
    isMock: boolean;
}> = ({ config, stepName, stepId, stepType, onStepComplete, isMock }) => {
    const title = config.title || stepName || 'Pregunta de escala';
    const description = config.description;
    const questionText = config.questionText || (isMock ? 'Valora en una escala del 1 al 5' : '');
    const minValue = config.minValue || 1;
    const maxValue = config.maxValue || 5;
    const minLabel = config.minLabel || 'Mínimo';
    const maxLabel = config.maxLabel || 'Máximo';
    
    // Inicializar con respuestas guardadas o null
    const [selectedValue, setSelectedValue] = useState<number | null>(() => {
        return config.savedResponses || null;
    });
    
    // Si cambian las respuestas guardadas en config, actualizar el estado
    useEffect(() => {
        if (config.savedResponses !== undefined) {
            setSelectedValue(config.savedResponses);
        }
    }, [config.savedResponses]);

    const handleSubmit = () => {
        if (selectedValue !== null) {
            onStepComplete(selectedValue);
        }
    };

    // Crear array de los valores para la escala
    const scaleValues = Array.from(
        { length: maxValue - minValue + 1 }, 
        (_, i) => minValue + i
    );

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            <p className="text-neutral-600 mb-4">{questionText}</p>
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
                            className={`w-10 h-10 rounded-full border flex items-center justify-center ${
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
                onClick={handleSubmit}
                disabled={selectedValue === null}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
                Siguiente
            </button>
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
    const title = config.title || stepNameFromProps || 'Cuéntanos más';
    const questionText = config.questionText || '¿Hay algo más que quieras contarnos?';
    const placeholder = config.placeholder || 'Escribe tu respuesta aquí...';
    
    const [currentResponse, setCurrentResponse] = useState<string>('');
    
    // Estados para la API y carga de datos
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [dataExisted, setDataExisted] = useState(false);
    const [documentId, setDocumentId] = useState<string | null>(null); // ID del documento de respuestas general
    const [moduleResponseId, setModuleResponseId] = useState<string | null>(null); // ID específico de esta respuesta de módulo

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
    let buttonText = 'Siguiente';
    if (isSaving || isApiLoading) {
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

        console.log(`[SmartVocFeedbackQuestion] Iniciando carga de datos para research: ${researchId}, participant: ${participantId}, stepType: ${stepType}`);
        const apiClient = new ApiClient();
        setDataLoading(true);
        setApiError(null);
        setCurrentResponse(''); // Limpiar respuesta previa al iniciar la carga
        setDocumentId(null);
        setModuleResponseId(null);
        setDataExisted(false);

        apiClient.getModuleResponses(researchId, participantId)
            .then(apiResponse => {
                console.log('[SmartVocFeedbackQuestion] Respuesta completa de apiClient.getModuleResponses:', JSON.stringify(apiResponse, null, 2));

                if (apiResponse.error || !apiResponse.data?.data) {
                    console.warn(`[SmartVocFeedbackQuestion] No se encontraron respuestas previas o hubo un error al cargar. Mensaje: ${apiResponse.message || 'No message'}. API Status: ${apiResponse.apiStatus}`);
                    setDataExisted(false);
                    setDocumentId(null);
                    setModuleResponseId(null);
                    setCurrentResponse('');
                    if (apiResponse.apiStatus === APIStatus.NOT_FOUND) {
                        console.log('[SmartVocFeedbackQuestion] API Status es NOT_FOUND, se considera normal si no hay datos previos.');
                        setApiError(null);
                    } else {
                        setApiError(apiResponse.message || 'Error cargando datos del módulo.');
                    }
                    return;
                }

                const fullDocument = apiResponse.data.data as { id: string, responses: Array<{id: string, stepType: string, stepTitle?: string, response: any, createdAt?: string, updatedAt?: string }> };
                console.log('[SmartVocFeedbackQuestion] Documento completo obtenido:', JSON.stringify(fullDocument, null, 2));
                setDocumentId(fullDocument.id);

                const foundStepData = fullDocument.responses.find(item => item.stepType === stepType);

                if (foundStepData) {
                    console.log(`[SmartVocFeedbackQuestion] Datos específicos ENCONTRADOS para stepType '${stepType}':`, JSON.stringify(foundStepData, null, 2));
                    setCurrentResponse(typeof foundStepData.response === 'string' ? foundStepData.response : '');
                    setModuleResponseId(foundStepData.id || null);
                    setDataExisted(true);
                    console.log(`[SmartVocFeedbackQuestion] Estado actualizado: currentResponse='${typeof foundStepData.response === 'string' ? foundStepData.response : ''}', moduleResponseId='${foundStepData.id || null}', dataExisted=true`);
                } else {
                    console.log(`[SmartVocFeedbackQuestion] No se encontraron datos específicos para stepType '${stepType}' en el documento. Documento ID: ${fullDocument.id}.`);
                    setCurrentResponse('');
                    setModuleResponseId(null);
                    setDataExisted(false); // Aunque el documento exista, el módulo específico no tiene respuesta.
                     // DocumentId se mantiene porque el documento general sí existe.
                    console.log(`[SmartVocFeedbackQuestion] Estado actualizado: currentResponse='', moduleResponseId=null, dataExisted=false`);
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
                console.log('[SmartVocFeedbackQuestion] Carga de datos finalizada.');
            });

    }, [researchId, participantId, stepType]); // Dependencias clave para recargar


    const handleSaveAndProceed = async () => {
        if (!researchId || !participantId) {
            setApiError("Faltan researchId o participantId para guardar.");
            console.error("[SmartVocFeedbackQuestion] Guardado OMITIDO: Faltan researchId o participantId.");
            return;
        }
        
        const currentStepIdToSave = stepIdFromProps || stepType; 
        const currentStepNameToSave = title; 

        setIsSaving(true);
        setApiError(null);
        console.log(`[SmartVocFeedbackQuestion] Iniciando guardado. DataExisted: ${dataExisted}, ModuleResponseId: ${moduleResponseId}`);
        console.log(`[SmartVocFeedbackQuestion] Payload a guardar: stepId='${currentStepIdToSave}', stepType='${stepType}', stepName='${currentStepNameToSave}', response='${currentResponse}'`);

        try {
            let success = false;
            let operationType = '';
            let resultFromHook: any = null;

            if (dataExisted && moduleResponseId) {
                operationType = 'Actualización (PUT)';
                console.log(`[SmartVocFeedbackQuestion] Intentando ${operationType} para moduleResponseId: ${moduleResponseId}`);
                resultFromHook = await updateResponse(moduleResponseId, currentStepIdToSave, stepType, currentStepNameToSave, currentResponse);
            } else {
                operationType = dataExisted ? 'Creación (POST) porque moduleResponseId falta pero documento existe' : 'Creación (POST)';
                console.log(`[SmartVocFeedbackQuestion] Intentando ${operationType} para stepType: ${stepType}`);
                resultFromHook = await saveResponse(currentStepIdToSave, stepType, currentStepNameToSave, currentResponse);
            }
            
            console.log(`[SmartVocFeedbackQuestion] Respuesta del hook useResponseAPI (${operationType}):`, JSON.stringify(resultFromHook, null, 2));

            if (apiHookError) {
                console.error(`[SmartVocFeedbackQuestion] Error desde useResponseAPI durante ${operationType}:`, apiHookError);
                setApiError(apiHookError);
            } else if (resultFromHook && (resultFromHook.id || resultFromHook.success === true || (operationType === 'Actualización (PUT)' && !resultFromHook))) { // Para PUT, un 200 OK sin contenido es éxito
                success = true;
                console.log(`[SmartVocFeedbackQuestion] ${operationType} considerada exitosa.`);
                if (operationType.includes('Creación (POST)') && resultFromHook && resultFromHook.id) {
                    setModuleResponseId(resultFromHook.id); 
                    setDataExisted(true); 
                    console.log(`[SmartVocFeedbackQuestion] POST exitoso. Nuevo moduleResponseId: ${resultFromHook.id}. DataExisted: true`);
                }
            } else {
                 console.warn(`[SmartVocFeedbackQuestion] ${operationType} no confirmó éxito explícito y no hubo error del hook. Resultado:`, resultFromHook);
                 // No necesariamente un error, podría ser una respuesta inesperada.
                 // Si es un POST y no hay ID, es un problema. Si es PUT y no hay error, podría estar bien.
                 if (operationType.includes('Creación (POST)') && (!resultFromHook || !resultFromHook.id)){
                    setApiError(`Error en ${operationType}: No se recibió ID para la nueva respuesta.`);
                 } else {
                    // Para PUT, si no hay error explícito, lo consideramos éxito por ahora.
                    // Podríamos necesitar una lógica más robusta si el backend siempre debe devolver algo.
                    success = true; 
                    console.log(`[SmartVocFeedbackQuestion] ${operationType} (PUT sin contenido/id esperado) asumido como éxito al no haber error del hook.`);
                 }
            }


            if (success) {
                console.log('[SmartVocFeedbackQuestion] Operación con servidor exitosa. Llamando a onStepComplete.');
                if (onStepComplete) {
                    onStepComplete(currentResponse);
                }
            } else if (!apiHookError && !apiError) { 
                 console.error('[SmartVocFeedbackQuestion] La operación de guardado no tuvo éxito y no se establecieron errores específicos.');
                 setApiError('La operación de guardado no parece haber tenido éxito o la respuesta no fue la esperada.');
            }

        } catch (error: any) {
            console.error('[SmartVocFeedbackQuestion] EXCEPCIÓN al guardar/actualizar:', error);
            setApiError(error.message || 'Error desconocido durante el guardado/actualización.');
        } finally {
            setIsSaving(false);
            console.log('[SmartVocFeedbackQuestion] Proceso de guardado finalizado.');
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
            <h2 className="text-xl font-medium text-center mb-4">{title}</h2>
            <p className="text-center mb-6">{questionText}</p>
            
            {(apiError || apiHookError) && (
              <div className="bg-red-50 border border-red-200 text-sm text-red-700 px-4 py-3 rounded mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span>{apiError || apiHookError}</span>
              </div>
            )}

            <textarea
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-400 focus:border-primary-400 mb-6"
                placeholder={placeholder}
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                disabled={isSaving || isApiLoading}
            />
            <div className="flex justify-center">
                <button
                    onClick={handleSaveAndProceed}
                    disabled={isSaving || isApiLoading || !researchId || !participantId || dataLoading}
                    className="px-8 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
    stepId?: string;
    stepName?: string;
    stepType: string;
    onStepComplete: (answer: any) => void;
    isMock: boolean;
}> = ({ config, stepId, stepName, stepType, onStepComplete, isMock }) => {
    const title = config.title || stepName || 'Pregunta de ranking';
    const description = config.description;
    const questionText = config.questionText || (isMock ? 'Ordena las siguientes opciones por preferencia' : '');
    const itemsToRank = config.items || (isMock ? ['Elemento 1', 'Elemento 2', 'Elemento 3', 'Elemento 4'] : []);
    
    // Inicializar con respuestas guardadas o el array original de items
    const [rankedItems, setRankedItems] = useState<string[]>(() => {
        return config.savedResponses || [...itemsToRank];
    });
    
    // Si cambian las respuestas guardadas en config, actualizar el estado
    useEffect(() => {
        if (config.savedResponses !== undefined) {
            setRankedItems(config.savedResponses);
        } else if (config.items) {
            setRankedItems([...config.items]);
        }
    }, [config.savedResponses, config.items]);

    const handleSubmit = () => {
        onStepComplete(rankedItems);
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

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            <p className="text-neutral-600 mb-4">{questionText}</p>
            <div className="mb-4">
                {rankedItems.map((item, index) => (
                    <div key={index} className="flex items-center border rounded-md p-3 mb-2">
                        <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium mr-3">
                            {index + 1}
                        </span>
                        <span className="flex-grow">{item}</span>
                        <div className="flex space-x-1">
                            <button 
                                onClick={() => moveItemUp(index)}
                                disabled={index === 0}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                ▲
                            </button>
                            <button 
                                onClick={() => moveItemDown(index)}
                                disabled={index === rankedItems.length - 1}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                                ▼
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={handleSubmit}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
                Siguiente
            </button>
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
                console.log(`[PreferenceTest] Fetching presigned URL for key: ${s3Key}`);
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
                            console.log("[PreferenceTest] Presigned URL received.");
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
    // Hooks deben estar siempre al inicio del componente
    console.log(`[CurrentStepRenderer] Props recibidas: stepType='${stepType}', stepId='${stepId}', stepName='${stepName}', stepConfig:`, stepConfig);
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
                const isMock = !stepConfig || !stepConfig.questionText || !Array.isArray(stepConfig.options) || stepConfig.options.length === 0;
                const config = isMock
                    ? { questionText: 'Pregunta de opción única (Prueba)?', options: ['Opción A', 'Opción B', 'Opción C'] }
                    : stepConfig;
                
                return renderStepWithWarning(
                    <SingleChoiceQuestion
                        config={config}
                        stepId={stepId}
                        stepName={stepName}
                        stepType={stepType}
                        onStepComplete={onStepComplete}
                        isMock={isMock}
                    />,
                     isMock // Pasar el flag de mock
                 );
                } 

            // <<< NUEVO CASE para cognitive_multiple_choice >>>
            case 'cognitive_multiple_choice': { 
                if (!onStepComplete) return null;
                const isMock = !stepConfig || !stepConfig.questionText || !Array.isArray(stepConfig.options) || stepConfig.options.length === 0;
                const config = isMock
                    ? { questionText: 'Pregunta de opción múltiple (Prueba)?', options: ['Opción 1', 'Opción 2', 'Opción 3'] }
                    : stepConfig;
                
                 return renderStepWithWarning(
                     <MultipleChoiceQuestion
                        config={config}
                        stepId={stepId}
                        stepName={stepName}
                        stepType={stepType}
                        onStepComplete={onStepComplete}
                        isMock={isMock}
                    />,
                     isMock
                 );
                } 

            // <<< NUEVO CASE para cognitive_linear_scale >>>
            case 'cognitive_linear_scale': { 
                 if (!onStepComplete) return null;
                 const isMock = !stepConfig || !stepConfig.questionText || !stepConfig.scaleSize;
                 const config = isMock
                    ? { questionText: 'Pregunta escala lineal (Prueba)?', scaleSize: 5, leftLabel: 'Izquierda', rightLabel: 'Derecha' } 
                    : stepConfig;

                 return renderStepWithWarning(
                     <LinearScaleQuestion
                        config={config}
                        stepId={stepId}
                        stepName={stepName}
                        stepType={stepType}
                        onStepComplete={onStepComplete}
                        isMock={isMock}
                    />,
                     isMock
                 );
                } 
            
            // <<< CASE para cognitive_ranking reemplazado >>>
            case 'cognitive_ranking': {
                if (!onStepComplete) return null;
                const isMock = !stepConfig || !stepConfig.questionText || !Array.isArray(stepConfig.items) || stepConfig.items.length === 0;
                const config = isMock
                    ? { questionText: 'Pregunta de ranking (Prueba)?', items: ['Item 1', 'Item 2', 'Item 3'] }
                    : stepConfig;

                return renderStepWithWarning(
                    <RankingQuestion
                        config={config}
                        stepId={stepId}
                        stepName={stepName}
                        stepType={stepType}
                        onStepComplete={onStepComplete}
                        isMock={isMock}
                    />,
                    isMock
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

            // Eliminar casos antiguos basados en Enum si ya no son necesarios
            /*
            case ParticipantFlowStep.DONE:
                return (...);
            case ParticipantFlowStep.LOADING_SESSION:
                return (...);
            case ParticipantFlowStep.ERROR:
                return (...);
            */
            
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