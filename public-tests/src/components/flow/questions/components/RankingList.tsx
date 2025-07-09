import React from 'react';

interface RankingListProps {
    items: string[];
    onMoveUp: (index: number) => void;
    onMoveDown: (index: number) => void;
    isSaving: boolean;
    isApiLoading: boolean;
    dataLoading: boolean;
}

export const RankingList: React.FC<RankingListProps> = ({
    items,
    onMoveUp,
    onMoveDown,
    isSaving,
    isApiLoading,
    dataLoading
}) => {
    console.log('[RankingList] Rendering with:', {
        itemsLength: items.length,
        items,
        isSaving,
        isApiLoading,
        dataLoading
    });

    return (
        <div className="mb-4">
            {items.length === 0 && <p className="text-red-500">⚠️ No hay opciones para mostrar</p>}
            {items.map((item, index) => (
                <div key={`${item}-${index}`} className="flex items-center justify-between border rounded-md p-3 mb-2 bg-white shadow-sm">
                    <span className="text-lg text-neutral-700">{item}</span>
                    <div className="flex space-x-1">
                        <button
                            onClick={() => onMoveUp(index)}
                            disabled={index === 0 || isSaving || isApiLoading || dataLoading}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent text-lg text-neutral-600 disabled:text-neutral-400 transition-colors"
                            aria-label={`Mover ${item.trim() === '' ? 'item sin texto' : item} hacia arriba`}
                        >
                            ▲
                        </button>
                        <button
                            onClick={() => onMoveDown(index)}
                            disabled={index === items.length - 1 || isSaving || isApiLoading || dataLoading}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent text-lg text-neutral-600 disabled:text-neutral-400 transition-colors"
                            aria-label={`Mover ${item.trim() === '' ? 'item sin texto' : item} hacia abajo`}
                        >
                            ▼
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
