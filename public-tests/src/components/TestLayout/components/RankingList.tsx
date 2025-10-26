import React, { useState } from 'react';
import { RankingListProps } from './RankingListTypes';
// import { useRankingData } from './useRankingData'; // Removed
// import { useRankingActions } from './useRankingActions'; // Removed
import { RankingListUI } from './RankingListUI';

export const RankingList: React.FC<RankingListProps> = ({
    items,
    onMoveUp,
    onMoveDown,
    isSaving,
    isApiLoading,
    dataLoading,
    currentQuestionKey,
    initialFormData
}) => {
    // TODO: Implementar useRankingData y useRankingActions o usar alternativas
    const rankedItems: string[] = React.useMemo(() => [], []); // Temporal: array vacío hasta implementar hooks
    const isLoading = false;
    const error = null;

    const [localRankedItems, setLocalRankedItems] = useState<string[]>(rankedItems);

    // TODO: Implementar useRankingActions o usar alternativas
    const handleMoveUp = () => {
        // Temporal: implementación básica
        console.log('handleMoveUp not implemented yet');
    };
    
    const handleMoveDown = () => {
        // Temporal: implementación básica
        console.log('handleMoveDown not implemented yet');
    };

    React.useEffect(() => {
        setLocalRankedItems(rankedItems);
    }, [rankedItems]);

    if (error) {
        return (
            <div className="mb-4">
                <p className="text-red-500">⚠️ {error}</p>
            </div>
        );
    }

    return (
        <RankingListUI
            rankedItems={localRankedItems}
            isSaving={isSaving}
            isApiLoading={isApiLoading}
            dataLoading={dataLoading || isLoading}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
        />
    );
};
