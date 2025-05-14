import { useState, useEffect, useCallback } from 'react';
import { SmartVOCConfig, SmartVOCQuestion } from '../components/flow/types'; // Ajusta la ruta si es necesario

interface UseSmartVOCDataReturn {
    isLoading: boolean;
    questions: SmartVOCQuestion[];
    error: string | null;
    config: SmartVOCConfig | null; // Puede ser útil mantener la config si se necesita en el futuro
}

export const useSmartVOCData = (researchId?: string, token?: string): UseSmartVOCDataReturn => {
    const [config, setConfig] = useState<SmartVOCConfig | null>(null);
    const [questions, setQuestions] = useState<SmartVOCQuestion[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConfig = useCallback(async () => {
        if (!researchId || !token) {
            setError("Token o Research ID no proporcionados.");
            setIsLoading(false);
            setQuestions([]);
            setConfig(null);
            return;
        }

        console.log(`[useSmartVOCData] Obteniendo config para researchId: ${researchId}`);
        setIsLoading(true);
        setError(null);
        setConfig(null);
        setQuestions([]);

        try {
            const apiUrl = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
            const url = `${apiUrl}/research/${researchId}/smart-voc`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            console.log('[useSmartVOCData] Response:', response);

            if (response.ok) {
                const result = await response.json();
                const configData = result.data || result;
                console.log('[useSmartVOCData] Config obtenida:', configData);

                if (configData && typeof configData === 'object') {
                    const typedConfig = configData as SmartVOCConfig;
                    setConfig(typedConfig);
                    const fetchedQuestions = typedConfig.questions as SmartVOCQuestion[] | undefined;

                    if (fetchedQuestions && Array.isArray(fetchedQuestions) && fetchedQuestions.length > 0) {
                        console.log(`[useSmartVOCData] ${fetchedQuestions.length} preguntas encontradas.`);
                        setQuestions(fetchedQuestions);
                    } else {
                        console.warn('[useSmartVOCData] No se encontraron preguntas válidas en la configuración.');
                        setQuestions([]); // No hay preguntas, pero la carga fue exitosa
                    }
                } else {
                    console.warn('[useSmartVOCData] Respuesta OK pero formato inesperado', configData);
                    setConfig(null);
                    setQuestions([]);
                    // Considerar si esto debería ser un error
                    setError('Formato de configuración inesperado.');
                }
            } else if (response.status === 404) {
                console.log('[useSmartVOCData] No se encontró config (404).');
                setConfig(null);
                setQuestions([]); // No encontrado, no es necesariamente un error de fetch
            } else {
                const errorText = await response.text();
                console.error(`[useSmartVOCData] Error ${response.status}: ${errorText}`);
                throw new Error(`Error ${response.status} al cargar SmartVOC.`);
            }
        } catch (err: any) {
            console.error('[useSmartVOCData] Excepción en fetchConfig:', err);
            setError(err.message || 'Error desconocido al cargar la configuración de SmartVOC.');
            setQuestions([]);
            setConfig(null);
        } finally {
            setIsLoading(false);
        }
    }, [researchId, token]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]); // fetchConfig ya incluye researchId y token como dependencias

    return { isLoading, questions, error, config };
}; 