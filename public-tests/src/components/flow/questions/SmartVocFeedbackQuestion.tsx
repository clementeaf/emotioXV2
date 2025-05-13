import { useEffect, useState } from "react";
import { useParticipantStore } from "../../../stores/participantStore";
import { useResponseAPI } from "../../../hooks/useResponseAPI";
import { ApiClient, APIStatus } from "../../../lib/api";

// Componente para SmartVOC Feedback
export const SmartVocFeedbackQuestion: React.FC<{
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

                const fullDocument = apiResponse.data.data as { id: string, responses: Array<{ id: string, stepType: string, stepTitle?: string, response: any, createdAt?: string, updatedAt?: string }> };
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