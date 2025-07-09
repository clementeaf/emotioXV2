import { useEffect, useState } from "react";
import { ApiClient, APIStatus } from "../../../../lib/api";
import { useParticipantStore } from "../../../../stores/participantStore";

interface UseRankingDataProps {
    itemsFromConfig: string[];
    stepType: string;
    isApiDisabled: boolean;
}

interface UseRankingDataReturn {
    initialRankedItems: string[];
    isLoading: boolean;
    hasExistingData: boolean;
}

export const useRankingData = ({
    itemsFromConfig,
    stepType,
    isApiDisabled
}: UseRankingDataProps): UseRankingDataReturn => {
    const [rankedItems, setRankedItems] = useState<string[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [moduleResponseId, setModuleResponseId] = useState<string | null>(null);

    const researchId = useParticipantStore(state => state.researchId);
    const participantId = useParticipantStore(state => state.participantId);

    console.log('[useRankingData] Hook initialized with:', {
        itemsFromConfig,
        stepType,
        isApiDisabled,
        researchId,
        participantId
    });

    useEffect(() => {
        if (isApiDisabled) {
            console.log('[useRankingData] API disabled, using config items');
            setRankedItems([...itemsFromConfig]);
            setModuleResponseId(null);
            setDataLoading(false);
            return;
        }

        if (!researchId || !participantId || !stepType) {
            console.warn('[useRankingData] API enabled, but missing IDs/Type. Using items from config.');
            setRankedItems([...itemsFromConfig]);
            setDataLoading(false);
            setModuleResponseId(null);
            return;
        }

        const apiClient = new ApiClient();
        setDataLoading(true);
        setRankedItems([]);
        setModuleResponseId(null);

        apiClient.getModuleResponses(researchId, participantId)
            .then(apiResponse => {
                let finalOrderToSet: string[] = [...itemsFromConfig];

                if (
                  !apiResponse.error &&
                  typeof apiResponse.data === 'object' && apiResponse.data !== null &&
                  'data' in apiResponse.data &&
                  typeof (apiResponse.data as { data?: unknown }).data === 'object' &&
                  (apiResponse.data as { data?: unknown }).data !== null
                ) {
                    const fullDocument = (apiResponse.data as { data: { id: string, responses: Array<{id: string, stepType: string, response: unknown}> } }).data;
                    const foundStepData = fullDocument.responses.find(item => item.stepType === stepType);

                    if (foundStepData && Array.isArray(foundStepData.response) && foundStepData.response.length > 0) {
                        const savedOrderFromApi = foundStepData.response as string[];

                        if (savedOrderFromApi.every(item => typeof item === 'string')) {
                            finalOrderToSet = savedOrderFromApi;
                            setModuleResponseId(foundStepData.id || null);
                            console.log('[useRankingData] Using saved order from API:', finalOrderToSet);
                        } else {
                             console.warn('[useRankingData] API response for step exists, but response format is invalid (not array of strings). Using order from config as fallback.');
                             setModuleResponseId(null);
                        }
                    } else {
                        setModuleResponseId(null);
                        console.log('[useRankingData] No saved data found for step type:', stepType);
                    }
                } else {
                    if (apiResponse.apiStatus !== APIStatus.NOT_FOUND) {
                        console.error('[useRankingData] Error loading module data:', apiResponse.message);
                    }
                    setModuleResponseId(null);
                }

                setRankedItems(finalOrderToSet);
            })
            .catch(error => {
                console.error('[useRankingData] EXCEPTION during API call:', error);
                setModuleResponseId(null);
                const finalFallback = [...itemsFromConfig];
                setRankedItems(finalFallback);
            })
            .finally(() => {
                setDataLoading(false);
            });
    }, [researchId, participantId, stepType, isApiDisabled, itemsFromConfig]);

    const hasExistingData = !!moduleResponseId && rankedItems.length > 0;

    return {
        initialRankedItems: rankedItems,
        isLoading: dataLoading,
        hasExistingData
    };
};
