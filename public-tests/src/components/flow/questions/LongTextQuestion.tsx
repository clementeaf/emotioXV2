import { useEffect, useState } from "react";
import { useParticipantStore } from "../../../stores/participantStore";
import { useResponseAPI } from "../../../hooks/useResponseAPI";
import { ApiClient, APIStatus } from "../../../lib/api";

export const LongTextQuestion: React.FC<{
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

                const fullDocument = apiResponse.data.data as { id: string, responses: Array<{ id: string, stepType: string, response: any }> };
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