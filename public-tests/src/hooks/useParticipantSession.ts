import { useCallback, useEffect, useState } from 'react';
import { Participant } from '../../../shared/interfaces/participant';
import { useParticipantStore } from '../stores/participantStore';

export const useParticipantSession = () => {
    const storeGlobalSetToken = useParticipantStore(state => state.setToken);
    const storeGlobalSetParticipant = useParticipantStore(state => state.setParticipant);
    const participantIdFromStore = useParticipantStore(state => state.participantId);
    const tokenFromStore = useParticipantStore(state => state.token);

    const [token, setToken] = useState<string | null>(() => {
        const storedToken = localStorage.getItem('participantToken');
        console.log('[useParticipantSession] Inicializando token desde localStorage:', storedToken ? 'presente' : 'ausente');
        return storedToken;
    });

    // Sincronizar token del store con el estado local
    useEffect(() => {
        if (tokenFromStore && tokenFromStore !== token) {
            console.log('[useParticipantSession] Sincronizando token desde store:', tokenFromStore ? 'presente' : 'ausente');
            setToken(tokenFromStore);
        } else if (!tokenFromStore && token) {
            console.log('[useParticipantSession] Limpiando token local');
            setToken(null);
        }
    }, [tokenFromStore, token]);

    const handleLoginSuccess = useCallback((participant: Participant & { id: string }) => {
        console.log('[useParticipantSession] handleLoginSuccess llamado con:', participant);
        const storedTokenFromLogin = localStorage.getItem('participantToken');

        if (storedTokenFromLogin && participant.id) {
            console.log('[useParticipantSession] Configurando sesión con token y participante');
            storeGlobalSetToken(storedTokenFromLogin);
            storeGlobalSetParticipant({
                id: participant.id,
                name: participant.name,
                email: participant.email
            });
            setToken(storedTokenFromLogin);
        } else {
            console.error("[useParticipantSession] handleLoginSuccess error: token o participant.id faltante.");
            console.error("[useParticipantSession] storedTokenFromLogin:", storedTokenFromLogin);
            console.error("[useParticipantSession] participant.id:", participant.id);
        }
    }, [storeGlobalSetToken, storeGlobalSetParticipant]);

    const logoutAndClearSession = useCallback(() => {
        console.log('[useParticipantSession] logoutAndClearSession llamado');
        localStorage.removeItem('participantToken');
        localStorage.removeItem('participantId');
        setToken(null);
        storeGlobalSetToken(null);
        storeGlobalSetParticipant({ id: '' });
    }, [storeGlobalSetToken, storeGlobalSetParticipant]);

    return {
        token,
        setToken,
        participantIdFromStore,
        handleLoginSuccess,
        logoutAndClearSession,
    };
};
