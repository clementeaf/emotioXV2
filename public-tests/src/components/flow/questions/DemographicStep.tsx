import { useEffect, useState } from "react";
import { DEFAULT_DEMOGRAPHICS_CONFIG, DemographicResponses } from "../../../types/demographics";
import { eyeTrackingService } from "../../../services/eyeTracking.service";
import { DemographicsForm } from "../../demographics/DemographicsForm";
import { DemographicStepProps, ExtendedEyeTrackingData } from "./types";

export const DemographicStep: React.FC<DemographicStepProps> = ({
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
                        const updatedConfig = { ...DEFAULT_DEMOGRAPHICS_CONFIG };
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