import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../lib/api';

const apiClient = new ApiClient();

export const useLoadResearchFormsConfig = (researchId: string, { enabled }: { enabled: boolean }) => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['researchFlow', researchId],
        queryFn: () => apiClient.getResearchFlow(researchId),
        enabled,
    });

    // >>>>>>>>> DEBUGGING: Mostrar los datos crudos del flujo <<<<<<<<<<
    if (data) {
        console.log('%c[useLoadResearchFormsConfig] Raw API Response:', 'color: #FF0000; font-weight: bold;', JSON.stringify(data, null, 2));
    }
    // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

    return { data, isLoading, isError, error };
};
