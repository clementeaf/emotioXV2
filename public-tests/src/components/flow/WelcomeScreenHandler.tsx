import React, { useState, useEffect, useCallback } from 'react';

// Reutilizar la interfaz temporal (o idealmente importar la real)
interface WelcomeScreenConfig {
    id?: string;
    researchId: string;
    isEnabled?: boolean;
    title?: string;
    message?: string;
    startButtonText?: string;
    metadata?: any;
}

interface WelcomeScreenHandlerProps {
    researchId: string;
    token: string;
    onComplete: () => void; // Llamado cuando se completa con éxito (o no existe)
    onError: (message: string) => void; // Llamado si hay un error de carga
}

const WelcomeScreenHandler: React.FC<WelcomeScreenHandlerProps> = ({
    researchId,
    token,
    onComplete,
    onError,
}) => {
    const [config, setConfig] = useState<WelcomeScreenConfig | null | undefined>(undefined); // undefined: loading, null: not found, object: found
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isNavigating, setIsNavigating] = useState<boolean>(false); // Nuevo estado

    const fetchConfig = useCallback(async () => {
        setIsLoading(true);
        setConfig(undefined);

        try {
            const apiUrl = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';
            const url = `${apiUrl}/research/${researchId}/welcome-screen`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const result = await response.json();
                const configData = result.data || result;
                if (configData && typeof configData === 'object') {
                    setConfig(configData as WelcomeScreenConfig);
                } else {
                    console.warn('[WelcomeHandler] Respuesta OK pero formato inesperado', configData);
                    setConfig(null); // Tratar como no encontrado
                    onComplete(); // Considerar completado si el formato es inválido pero la llamada fue OK? O llamar onError? Decidimos onComplete por ahora.
                }
            } else if (response.status === 404) {
                setConfig(null);
                onComplete(); // No es un error del flujo, simplemente no existe
            } else {
                const errorText = await response.text();
                console.error(`[WelcomeHandler] Error ${response.status}: ${errorText}`);
                throw new Error(`Error ${response.status} al cargar la pantalla de bienvenida.`);
            }
        } catch (err: any) {
            console.error('[WelcomeHandler] Excepción en fetchConfig:', err);
            setConfig(undefined); // Marcar como no cargado
            onError(err.message || 'Error al cargar la configuración de bienvenida.');
        } finally {
            setIsLoading(false);
        }
    }, [researchId, token, onComplete, onError]);

    useEffect(() => {
        if (token && researchId) {
            fetchConfig();
        } else {
           onError("Token o Research ID no disponibles para Welcome Screen.");
        }
    }, [fetchConfig, token, researchId, onError]);

    // --- Renderizado del Handler ---
    if (isLoading) {
        return <div className="p-6 text-center">Cargando bienvenida...</div>;
    }

    // Si no está cargando y config es null (404 o formato inválido), ya se llamó a onComplete, no renderizar nada aquí.
    // El padre (ParticipantFlow) decidirá qué hacer (pasar al siguiente paso).
    // Sin embargo, podríamos mostrar un mensaje opcional si es null, pero el flujo principal lo maneja mejor.

    // Si tenemos configuración, mostrarla
    if (config) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-semibold mb-4">{config.title || 'Bienvenida'}</h2>
                <p className="mb-4">{config.message || 'Por favor, lee la información y continúa.'}</p>
                <button
                    onClick={() => {
                        setIsNavigating(true);
                        setTimeout(() => {
                            onComplete();
                        }, 500); // Retardo para mostrar el mensaje
                    }}
                    disabled={isNavigating} // Deshabilitar si está navegando
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isNavigating ? 'Pasando al siguiente módulo...' : (config.startButtonText || 'Continuar')}
                </button>
            </div>
        );
    }

    // Si no está cargando, no hay config (y no es null), probablemente hubo un error que ya llamó a onError.
    // Podríamos mostrar un fallback, pero ParticipantFlow manejará el estado de error.
    // Devolver null aquí para que el padre controle el renderizado en caso de error.
    return null;
};

export default WelcomeScreenHandler; 