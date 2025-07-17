import React, { useEffect, useState } from 'react';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';

// 🎯 INTERFAZ PARA RESPUESTAS DEL BACKEND
interface BackendResponse {
  questionKey: string;
  response: {
    selectedValue?: string;
    textValue?: string;
    [key: string]: unknown;
  };
}

interface RankingListProps {
    items: string[];
    onMoveUp: (index: number) => void;
    onMoveDown: (index: number) => void;
    isSaving: boolean;
    isApiLoading: boolean;
    dataLoading: boolean;
    currentQuestionKey?: string;
}

export const RankingList: React.FC<RankingListProps> = ({
    items,
    onMoveUp,
    onMoveDown,
    isSaving,
    isApiLoading,
    dataLoading,
    currentQuestionKey
}) => {
    const [rankedItems, setRankedItems] = useState<string[]>(items);
    const { setFormData, getFormData } = useFormDataStore();

    // 🎯 CARGAR RESPUESTA DEL BACKEND SI EXISTE
    useEffect(() => {
        if (currentQuestionKey) {
            // Buscar respuesta del backend para este step
            const store = useStepStore.getState();
            const backendResponse = store.backendResponses.find(
                (r: BackendResponse) => r.questionKey === currentQuestionKey
            );

            if (backendResponse?.response?.selectedValue) {
                // Parsear el ranking guardado
                try {
                    const savedRanking = JSON.parse(backendResponse.response.selectedValue);
                    if (Array.isArray(savedRanking)) {
                        setRankedItems(savedRanking);
                        return;
                    }
                } catch (error) {
                    console.warn('[RankingList] Error parsing saved ranking:', error);
                }
            }

            // Si no hay respuesta del backend, cargar del store local
            const localData = getFormData(currentQuestionKey);
            if (localData?.selectedValue) {
                try {
                    const savedRanking = JSON.parse(localData.selectedValue as string);
                    if (Array.isArray(savedRanking)) {
                        setRankedItems(savedRanking);
                    }
                } catch (error) {
                    console.warn('[RankingList] Error parsing local ranking:', error);
                }
            }
        }
    }, [currentQuestionKey, getFormData]);

    // 🎯 SINCRONIZAR CON ITEMS PROPS
    useEffect(() => {
        if (items.length > 0 && rankedItems.length === 0) {
            setRankedItems(items);
        }
    }, [items, rankedItems.length]);

    const handleMoveUp = (index: number) => {
        if (index === 0) return;

        const newRanking = [...rankedItems];
        [newRanking[index], newRanking[index - 1]] = [newRanking[index - 1], newRanking[index]];
        setRankedItems(newRanking);

        // 🎯 GUARDAR EN FORMDATA
        if (currentQuestionKey) {
            setFormData(currentQuestionKey, {
                selectedValue: JSON.stringify(newRanking)
            });
        }

        onMoveUp(index);
    };

    const handleMoveDown = (index: number) => {
        if (index === rankedItems.length - 1) return;

        const newRanking = [...rankedItems];
        [newRanking[index], newRanking[index + 1]] = [newRanking[index + 1], newRanking[index]];
        setRankedItems(newRanking);

        // 🎯 GUARDAR EN FORMDATA
        if (currentQuestionKey) {
            setFormData(currentQuestionKey, {
                selectedValue: JSON.stringify(newRanking)
            });
        }

        onMoveDown(index);
    };

    return (
        <div className="mb-4">
            {rankedItems.length === 0 && <p className="text-red-500">⚠️ No hay opciones para mostrar</p>}
            {rankedItems.map((item, index) => (
                <div key={`${item}-${index}`} className="flex items-center justify-between border rounded-md p-3 mb-2 bg-white shadow-sm">
                    <span className="text-lg text-neutral-700">{item}</span>
                    <div className="flex space-x-1">
                        <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0 || isSaving || isApiLoading || dataLoading}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent text-lg text-neutral-600 disabled:text-neutral-400 transition-colors"
                            aria-label={`Mover ${item.trim() === '' ? 'item sin texto' : item} hacia arriba`}
                        >
                            ▲
                        </button>
                        <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === rankedItems.length - 1 || isSaving || isApiLoading || dataLoading}
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
