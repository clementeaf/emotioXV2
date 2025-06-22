import { useCallback, useEffect, useState } from 'react';
import { useParticipantStore } from '../stores/participantStore';
import { SmartVOCConfig, SmartVOCQuestion, UseSmartVOCConfigReturn } from '../types/smart-voc.types';

interface ParticipantState {
  token: string | null;
}

// Props para el hook
interface UseSmartVOCDataProps {
  researchId?: string | null;
  config?: SmartVOCConfig;
}

export const useSmartVOCData = ({ researchId, config }: UseSmartVOCDataProps): UseSmartVOCConfigReturn => {
    const [questions, setQuestions] = useState<SmartVOCQuestion[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Obtener el token directamente del store de Zustand
    const token = useParticipantStore((state: ParticipantState) => state.token);

    const fetchConfig = useCallback(async () => {
        // No hacer fetch si no hay researchId o token.
        if (!researchId || !token) {
            setError("Token o Research ID no proporcionados para el fetch.");
            setIsLoading(false);
            return;
        }

        console.log(`[useSmartVOCData] Obteniendo config para researchId: ${researchId}`);
        setIsLoading(true);

        try {
            // La URL de la API debe ser una variable de entorno
            const apiUrl = import.meta.env.VITE_API_URL || 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
            const url = `${apiUrl}/research/${researchId}/smart-voc`;

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('[useSmartVOCData] No se encontró configuración SmartVOC (404). Se asume que no hay preguntas.');
                    setQuestions([]);
                } else {
                    throw new Error(`Error ${response.status} al cargar la configuración.`);
                }
            } else {
                const result = await response.json();
                const fetchedQuestions = result?.questions as SmartVOCQuestion[] | undefined;

                if (fetchedQuestions && Array.isArray(fetchedQuestions)) {
                    setQuestions(fetchedQuestions);
                } else {
                    console.warn('[useSmartVOCData] No se encontraron preguntas en la respuesta.');
                    setQuestions([]);
                }
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido.';
            setError(errorMsg);
            setQuestions([]);
        } finally {
            setIsLoading(false);
        }
    }, [researchId, token]);

    useEffect(() => {
        // Prioridad 1: Usar preguntas del 'config' si existen.
        if (config?.questions && Array.isArray(config.questions)) {
            console.log('[useSmartVOCData] Usando preguntas desde la prop de configuración.');
            setQuestions(config.questions);
            setIsLoading(false);
        }
        // Prioridad 2: Hacer fetch si no hay preguntas en 'config'.
        else if (researchId) {
            fetchConfig();
        }
        // Caso final: No hay nada que cargar.
        else {
            setIsLoading(false);
            setQuestions([]);
        }
    }, [researchId, config, fetchConfig]);

    // Devolvemos un objeto que no incluye 'config' para coincidir con UseSmartVOCConfigReturn
    return { isLoading, questions, error, config: null };
};
