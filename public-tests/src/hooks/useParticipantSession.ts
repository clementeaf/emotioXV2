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
        return storedToken;
    });

    // Sincronizar token del store con el estado local
    useEffect(() => {
        if (tokenFromStore && tokenFromStore !== token) {
            setToken(tokenFromStore);
        } else if (!tokenFromStore && token) {
            setToken(null);
        }
    }, [tokenFromStore, token]);

    const handleLoginSuccess = useCallback((participant: Participant & { id: string }) => {
        const storedTokenFromLogin = localStorage.getItem('participantToken');

        if (storedTokenFromLogin && participant.id) {
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
