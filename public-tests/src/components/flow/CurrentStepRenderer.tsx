import React, { useState, useEffect, useCallback } from 'react';
import { ParticipantLogin } from '../auth/ParticipantLogin';
import WelcomeScreenHandler from './WelcomeScreenHandler';
import { Participant } from '../../../../shared/interfaces/participant';
import { CSATView, FeedbackView, ThankYouView, DifficultyScaleView, NPSView } from '../smartVoc';
import { DemographicsForm } from '../demographics/DemographicsForm';
import { DemographicResponses, DEFAULT_DEMOGRAPHICS_CONFIG } from '../../types/demographics';
import { eyeTrackingService } from '../../services/eyeTracking.service';

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
            console.log('[DemographicStep] Respuestas demográficas:', responses);
            if (onStepComplete) {
                onStepComplete(responses);
            }
        } catch (error) {
            console.error('[DemographicStep] Error guardando respuestas demográficas:', error);
            if (onError) {
                onError('Error al guardar las respuestas demográficas.', 'demographic');
            }
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
}> = ({ config, stepName, stepId, stepType, onStepComplete }) => {
    const localStorageKey = `form-${stepType}-${stepId || stepName?.replace(/\s+/g, '_') || 'defaultLongText'}`;
    
    const [currentResponse, setCurrentResponse] = useState(() => {
        try {
            const saved = localStorage.getItem(localStorageKey);
            if (saved !== null) return JSON.parse(saved);
        } catch (e) { console.error("Error reading from localStorage", e); }
        return config.savedResponses || '';
    });

    useEffect(() => {
        try {
            localStorage.setItem(localStorageKey, JSON.stringify(currentResponse));
        } catch (e) { console.error("Error saving to localStorage", e); }
    }, [currentResponse, localStorageKey]);

    const handleSubmit = () => {
        onStepComplete(currentResponse);
        // Opcional: localStorage.removeItem(localStorageKey);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-medium mb-3 text-neutral-700">{stepName || 'Pregunta'}</h2>
            <p className="text-neutral-600 mb-4">{config.questionText}</p>
            <textarea
                className="border border-neutral-300 p-2 rounded-md w-full mb-4 h-32 resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder={config.placeholder}
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
            />
            <button
                onClick={handleSubmit}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
                Siguiente
            </button>
            {/* DEBUG: Mostrar datos de localStorage */}
            <details className="mt-2 text-xs w-full">
                <summary className="cursor-pointer font-medium">localStorage Data ({localStorageKey})</summary>
                <pre className="mt-1 bg-gray-100 p-2 rounded text-gray-700 overflow-auto text-xs">
                    {JSON.stringify(JSON.parse(localStorage.getItem(localStorageKey) || 'null'), null, 2)}
                </pre>
            </details>
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
    const localStorageKey = `form-${stepType}-${stepId || stepName?.replace(/\s+/g, '_') || 'defaultSingleChoice'}`;
    const title = config.title || stepName || 'Selecciona una opción';
    const description = config.description;
    const questionText = config.questionText || (isMock ? 'Pregunta de prueba' : '');
    const options = config.options || [];
    
    const [selectedOption, setSelectedOption] = useState<string | undefined>(() => {
        try {
            const saved = localStorage.getItem(localStorageKey);
            if (saved !== null) return JSON.parse(saved);
        } catch (e) { console.error("Error reading from localStorage", e); }
        return config.savedResponses;
    });

    useEffect(() => {
        try {
            localStorage.setItem(localStorageKey, JSON.stringify(selectedOption));
        } catch (e) { console.error("Error saving to localStorage", e); }
    }, [selectedOption, localStorageKey]);

    const handleSubmit = () => {
        onStepComplete(selectedOption);
        // Opcional: localStorage.removeItem(localStorageKey);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            <p className="text-neutral-600 mb-4">{questionText}</p>
            <div className="space-y-3 mb-6">
                {options.map((option: string, index: number) => (
                    <label key={index} className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-md hover:bg-neutral-50 cursor-pointer">
                        <input 
                            type="radio" 
                            name={`single-choice-${stepId}`} 
                            value={option} 
                            className="form-radio h-4 w-4 text-primary-600 border-neutral-300 focus:ring-primary-500" 
                            checked={selectedOption === option}
                            onChange={() => setSelectedOption(option)}
                        />
                        <span className="text-neutral-700">{option}</span>
                    </label>
                ))}
            </div>
            <button
                onClick={handleSubmit}
                disabled={!selectedOption}
                className={`bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors ${!selectedOption ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                Siguiente
            </button>
            {/* DEBUG: Mostrar datos de localStorage */}
            <details className="mt-2 text-xs w-full">
                <summary className="cursor-pointer font-medium">localStorage Data ({localStorageKey})</summary>
                <pre className="mt-1 bg-gray-100 p-2 rounded text-gray-700 overflow-auto text-xs">
                    {JSON.stringify(JSON.parse(localStorage.getItem(localStorageKey) || 'null'), null, 2)}
                </pre>
            </details>
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
    const localStorageKey = `form-${stepType}-${stepId || stepName?.replace(/\s+/g, '_') || 'defaultMultipleChoice'}`;
    const title = config.title || stepName || 'Selecciona una o más opciones';
    const description = config.description;
    const questionText = config.questionText || (isMock ? 'Pregunta de prueba' : '');
    const options = config.options || [];
    
    const [selectedOptions, setSelectedOptions] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(localStorageKey);
            if (saved !== null) {
                const parsed = JSON.parse(saved);
                return Array.isArray(parsed) ? parsed : [];
            }
        } catch (e) { console.error("Error reading from localStorage", e); }
        const initialSaved = config.savedResponses || [];
        return Array.isArray(initialSaved) ? initialSaved : [];
    });

    useEffect(() => {
        try {
            localStorage.setItem(localStorageKey, JSON.stringify(selectedOptions));
        } catch (e) { console.error("Error saving to localStorage", e); }
    }, [selectedOptions, localStorageKey]);

    const handleCheckboxChange = (option: string) => {
        setSelectedOptions(prev => 
            prev.includes(option)
                ? prev.filter(item => item !== option)
                : [...prev, option]
        );
    };

    const handleSubmit = () => {
        onStepComplete(selectedOptions);
        // Opcional: localStorage.removeItem(localStorageKey);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            <p className="text-neutral-600 mb-4">{questionText}</p>
            <div className="space-y-3 mb-6">
                {options.map((option: string, index: number) => (
                    <label key={index} className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-md hover:bg-neutral-50 cursor-pointer">
                        <input 
                            type="checkbox" 
                            name={`multiple-choice-${stepId}-${index}`} 
                            value={option} 
                            className="form-checkbox h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500" 
                            checked={selectedOptions.includes(option)}
                            onChange={() => handleCheckboxChange(option)}
                        />
                        <span className="text-neutral-700">{option}</span>
                    </label>
                ))}
            </div>
            <button
                onClick={handleSubmit}
                disabled={selectedOptions.length === 0}
                className={`bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors ${selectedOptions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                Siguiente
            </button>
            {/* DEBUG: Mostrar datos de localStorage */}
            <details className="mt-2 text-xs w-full">
                <summary className="cursor-pointer font-medium">localStorage Data ({localStorageKey})</summary>
                <pre className="mt-1 bg-gray-100 p-2 rounded text-gray-700 overflow-auto text-xs">
                    {JSON.stringify(JSON.parse(localStorage.getItem(localStorageKey) || '[]'), null, 2)} 
                </pre>
            </details>
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
    const localStorageKey = `form-${stepType}-${stepId || stepName?.replace(/\s+/g, '_') || 'defaultLinearScale'}`;
    const title = config.title || stepName || 'Valora en la escala';
    const description = config.description;
    const questionText = config.questionText || (isMock ? 'Pregunta de prueba' : '');
    
    const [selectedValue, setSelectedValue] = useState<number | null>(() => {
        try {
            const saved = localStorage.getItem(localStorageKey);
            if (saved !== null) {
                 const parsed = JSON.parse(saved);
                 return typeof parsed === 'number' ? parsed : null;
            }
        } catch (e) { console.error("Error reading from localStorage", e); }
        const initialSaved = config.savedResponses;
        return initialSaved !== undefined && typeof initialSaved === 'number' ? Number(initialSaved) : null;
    });

    useEffect(() => {
        try {
            localStorage.setItem(localStorageKey, JSON.stringify(selectedValue));
        } catch (e) { console.error("Error saving to localStorage", e); }
    }, [selectedValue, localStorageKey]);

    const handleSubmit = () => {
        onStepComplete(selectedValue);
        // Opcional: localStorage.removeItem(localStorageKey);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
            {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
            <p className="text-neutral-600 mb-4">{questionText}</p>
            <div className="flex justify-between text-xs text-neutral-500 mb-1">
                <span>{config.leftLabel}</span>
                <span>{config.rightLabel}</span>
            </div>
            <div className="flex justify-between space-x-2 mb-4">
                {[...Array(config.scaleSize)].map((_, i) => {
                    const value = i + 1;
                    return (
                        <button 
                            key={i} 
                            className={`w-8 h-8 border border-neutral-300 rounded-full hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                                selectedValue === value ? 'bg-primary-600 text-white' : ''
                            }`}
                            onClick={() => setSelectedValue(value)}
                        >
                            {value}
                        </button>
                    );
                })}
            </div>
            <button 
                onClick={handleSubmit}
                disabled={selectedValue === null}
                className={`bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors ${selectedValue === null ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                Siguiente
            </button>
            {/* DEBUG: Mostrar datos de localStorage */}
            <details className="mt-2 text-xs w-full">
                <summary className="cursor-pointer font-medium">localStorage Data ({localStorageKey})</summary>
                <pre className="mt-1 bg-gray-100 p-2 rounded text-gray-700 overflow-auto text-xs">
                    {JSON.stringify(JSON.parse(localStorage.getItem(localStorageKey) || 'null'), null, 2)}
                </pre>
            </details>
        </div>
    );
};

// Componente para SmartVOC Feedback
const SmartVocFeedbackQuestion: React.FC<{
    config: any; 
    stepId?: string;
    stepType: string;
    onStepComplete: (answer: any) => void;
}> = ({ config, stepId, stepType, onStepComplete }) => {
    const localStorageKey = `form-${stepType}-${stepId || 'defaultFeedback'}`;
    
    const [currentResponse, setCurrentResponse] = useState(() => {
        try {
            const saved = localStorage.getItem(localStorageKey);
            if (saved !== null) return JSON.parse(saved);
        } catch (e) { console.error("Error reading from localStorage", e); }
        return config.savedResponses || '';
    });

    useEffect(() => {
        try {
            localStorage.setItem(localStorageKey, JSON.stringify(currentResponse));
        } catch (e) { console.error("Error saving to localStorage", e); }
    }, [currentResponse, localStorageKey]);
    
    const handleNext = () => {
        onStepComplete(currentResponse);
        // Opcional: localStorage.removeItem(localStorageKey);
    };

    return (
        <FeedbackView
            questionText={config.questionText}
            placeholder={config.placeholder} 
            initialValue={currentResponse}
            onChange={(value) => setCurrentResponse(value)}
            onNext={handleNext}
        />
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
    const [_presignedUrl, setPresignedUrl] = useState<string | null>(null);
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
                ) : _presignedUrl ? (
                    <div className={`p-2 ${useDeviceFrame ? 'border-4 border-neutral-700 rounded-lg shadow-lg' : ''}`}> 
                       <img 
                           src={_presignedUrl} 
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
                    disabled={isUrlLoading || !!urlError || !_presignedUrl} 
                    className={`bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors ${isUrlLoading || urlError || !_presignedUrl ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
                if (!onStepComplete) return null;
                const isMock = !stepConfig; // Es mock si no hay config real
                const config = isMock
                    ? { questionText: 'Pregunta de texto corto (Prueba)?' }
                    : stepConfig;
                
                 return renderStepWithWarning(
                     <ShortTextQuestionComponent
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
            
            // <<< NUEVO CASE para cognitive_ranking >>>
            case 'cognitive_ranking': {
                if (!onStepComplete) return null;
                const localStorageKey = `form-${stepType}-${stepId || stepName?.replace(/\s+/g, '_') || 'defaultRanking'}`;
                const isMock = !stepConfig || !stepConfig.questionText || !Array.isArray(stepConfig.items) || stepConfig.items.length === 0;
                const config = isMock
                    ? { questionText: 'Pregunta de ranking (Prueba)?', items: ['Item 1', 'Item 2', 'Item 3'] }
                    : stepConfig;

                const title = config.title || stepName || 'Ordena los elementos';
                const description = config.description;
                const questionText = config.questionText || (isMock ? 'Pregunta de prueba' : '');
                
                const [rankedItems, setRankedItems] = useState<string[]>(() => {
                    try {
                        const saved = localStorage.getItem(localStorageKey);
                        if (saved !== null) {
                            const parsed = JSON.parse(saved);
                            return Array.isArray(parsed) ? parsed : (config.items || []);
                        }
                    } catch (e) { console.error("Error reading from localStorage for ranking", e); }
                    return config.items || [];
                });

                useEffect(() => {
                    // Aquí iría la lógica para actualizar `rankedItems` si se implementa drag and drop.
                    // Por ahora, guardamos el estado inicial o cargado.
                    try {
                        localStorage.setItem(localStorageKey, JSON.stringify(rankedItems));
                    } catch (e) { console.error("Error saving to localStorage for ranking", e); }
                }, [rankedItems, localStorageKey]);
                
                const handleSubmit = () => {
                    onStepComplete(rankedItems); // En una implementación real, `rankedItems` se actualizaría con el orden del usuario.
                    // Opcional: localStorage.removeItem(localStorageKey);
                };

                // Placeholder para la funcionalidad de drag and drop
                // En una implementación real, se usaría una librería como react-beautiful-dnd
                // y `setRankedItems` se llamaría en onDragEnd.

                return renderStepWithWarning(
                     <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
                         <h2 className="text-xl font-medium mb-1 text-neutral-800">{title}</h2>
                         {description && <p className="text-sm text-neutral-500 mb-3">{description}</p>}
                         <p className="text-neutral-600 mb-4">{questionText}</p>
                         <p className="text-sm text-neutral-500 mb-4">(Placeholder: Arrastra y suelta para ordenar)</p>
                         <div className="space-y-2 border border-dashed border-neutral-300 p-4 rounded-md mb-6 min-h-[100px]">
                             {rankedItems.map((item: string, index: number) => (
                                 <div key={index} className="bg-neutral-100 p-2 rounded border border-neutral-200 cursor-grab">{item}</div>
                             ))}
                         </div>
                         <button onClick={handleSubmit} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">Siguiente</button>
                         {/* DEBUG: Mostrar datos de localStorage */}
                         <details className="mt-2 text-xs w-full">
                             <summary className="cursor-pointer font-medium">localStorage Data ({localStorageKey})</summary>
                             <pre className="mt-1 bg-gray-100 p-2 rounded text-gray-700 overflow-auto text-xs">
                                 {JSON.stringify(JSON.parse(localStorage.getItem(localStorageKey) || '[]'), null, 2)}
                             </pre>
                         </details>
                     </div>,
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
                 const isCsatMock = !stepConfig || !stepConfig.questionText || !stepConfig.scaleSize;
                 const csatConfig = isCsatMock
                    ? { questionText: 'Pregunta CSAT (Prueba)?', scaleSize: 5 }
                    : stepConfig;

                 return renderStepWithWarning(
                     <CSATView
                        questionText={csatConfig.questionText}
                        scaleSize={csatConfig.scaleSize}
                        onNext={onStepComplete}
                        stepId={stepId}
                        stepType={stepType}
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
                 if (!onStepComplete) return null;
                 const isFeedbackMock = !stepConfig || !stepConfig.questionText;
                 const feedbackConfig = isFeedbackMock
                    ? { questionText: 'Pregunta Feedback (Prueba)?', placeholder: 'Escribe aquí...' }
                    : stepConfig;
                 
                 // Clave para debug, debe coincidir con la usada en SmartVocFeedbackQuestion
                 const debugLocalStorageKey = `form-${stepType}-${stepId || 'defaultFeedback'}`;

                 return renderStepWithWarning(
                    <div className="w-full max-w-xl"> {/* Wrapper div */}
                        <SmartVocFeedbackQuestion
                            config={feedbackConfig}
                            stepId={stepId}
                            stepType={stepType}
                            onStepComplete={onStepComplete}
                        />
                        {/* DEBUG: Mostrar datos de localStorage */}
                        <details className="mt-2 text-xs w-full">
                            <summary className="cursor-pointer font-medium">localStorage Data ({debugLocalStorageKey})</summary>
                            <pre className="mt-1 bg-gray-100 p-2 rounded text-gray-700 overflow-auto text-xs">
                                {JSON.stringify(JSON.parse(localStorage.getItem(debugLocalStorageKey) || 'null'), null, 2)}
                            </pre>
                        </details>
                    </div>,
                    isFeedbackMock
                 );
            } 

            case 'smartvoc_ces': { 
                 if (!onStepComplete) return null;
                 const isCesMock = !stepConfig || !stepConfig.questionText || !stepConfig.scaleSize;
                 const cesConfig = isCesMock
                    ? { 
                        questionText: 'Pregunta CES (Prueba)?', 
                        scaleSize: 7, 
                        leftLabel: 'Muy Difícil', 
                        rightLabel: 'Muy Fácil' 
                      } 
                    : stepConfig;

                 return renderStepWithWarning(
                     <DifficultyScaleView
                        questionText={cesConfig.questionText}
                        instructions={cesConfig.instructions}
                        scaleSize={cesConfig.scaleSize}
                        leftLabel={cesConfig.leftLabel}
                        rightLabel={cesConfig.rightLabel}
                        onNext={onStepComplete}
                        stepId={stepId}
                        stepType={stepType}
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