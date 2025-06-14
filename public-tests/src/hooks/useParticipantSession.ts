import { useCallback, useState } from 'react';
import { Participant } from '../../../shared/interfaces/participant';
import { useParticipantStore } from '../stores/participantStore';

export const useParticipantSession = () => {
    const storeGlobalSetToken = useParticipantStore(state => state.setToken);
    const storeGlobalSetParticipant = useParticipantStore(state => state.setParticipant);
    const participantIdFromStore = useParticipantStore(state => state.participantId);

    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('participantToken');
    });

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
