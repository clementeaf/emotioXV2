import React, { useEffect, useState } from 'react';
import { useModuleResponsesQuery } from '../../hooks/useApiQueries';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useTestStore } from '../../stores/useTestStore';


interface RankingListProps {
    items: string[];
    onMoveUp: (index: number) => void;
    onMoveDown: (index: number) => void;
    isSaving: boolean;
    isApiLoading: boolean;
    dataLoading: boolean;
    currentQuestionKey?: string;
    initialFormData?: Record<string, unknown>;
}

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
    const [rankedItems, setRankedItems] = useState<string[]>(items);
    const { setFormData, getFormData } = useFormDataStore();
    const { researchId, participantId } = useTestStore();

    // 🎯 OBTENER RESPUESTAS DEL BACKEND EN TIEMPO REAL
    const { data: moduleResponses } = useModuleResponsesQuery(
        researchId || '',
        participantId || ''
    );

    // 🎯 CARGAR RESPUESTA (REACTIVO A CAMBIOS EN TIEMPO REAL)
    useEffect(() => {
        console.log('[RankingList] 🔄 useEffect triggered:', {
            currentQuestionKey,
            hasModuleResponses: !!moduleResponses,
            totalResponses: moduleResponses?.responses?.length || 0,
            hasInitialFormData: !!initialFormData,
            initialFormDataKeys: initialFormData ? Object.keys(initialFormData) : [],
            selectedValue: initialFormData?.selectedValue
        });

        if (currentQuestionKey) {
            let dataSource: Record<string, unknown> | null = null;
            let sourceType = 'none';

            // 🚨 PRIORIDAD 1: Datos directos del backend (más reactivo)
            if (moduleResponses?.responses) {
                const backendResponse = moduleResponses.responses.find(
                    (response: any) => response.questionKey === currentQuestionKey
                );
                if (backendResponse?.response && typeof backendResponse.response === 'object' && backendResponse.response !== null && 'selectedValue' in backendResponse.response) {
                    dataSource = backendResponse.response as Record<string, unknown>;
                    sourceType = 'moduleResponses';
                }
            }

            // 🚨 PRIORIDAD 2: initialFormData (fallback)
            if (!dataSource && initialFormData && Object.keys(initialFormData).length > 0 && initialFormData.selectedValue) {
                dataSource = initialFormData;
                sourceType = 'initialFormData';
            }

            // 🚨 PRIORIDAD 3: Store local (último recurso)
            if (!dataSource) {
                const localData = getFormData(currentQuestionKey);
                if (localData?.selectedValue) {
                    dataSource = localData as Record<string, unknown>;
                    sourceType = 'localStorage';
                }
            }

            if (dataSource?.selectedValue) {
                try {
                    let savedRanking;
                    
                    // 🚨 FIX: Manejar tanto string como array desde cualquier fuente
                    if (typeof dataSource.selectedValue === 'string') {
                        // Si es string, puede ser JSON o string separado por comas
                        if ((dataSource.selectedValue as string).startsWith('[')) {
                            // Es JSON array
                            savedRanking = JSON.parse(dataSource.selectedValue as string);
                        } else {
                            // Es string separado por comas
                            savedRanking = (dataSource.selectedValue as string).split(',').map((s: string) => s.trim());
                        }
                    } else if (Array.isArray(dataSource.selectedValue)) {
                        // Ya es array
                        savedRanking = dataSource.selectedValue;
                    }
                    
                    if (Array.isArray(savedRanking) && savedRanking.length > 0) {
                        console.log(`[RankingList] 🎯 Cargando desde ${sourceType}:`, savedRanking);
                        setRankedItems(savedRanking);
                        return;
                    }
                } catch (error) {
                    console.warn(`[RankingList] Error parsing ${sourceType} ranking:`, error);
                }
            }

            console.log('[RankingList] ⚠️ No data found from any source');
        }
    }, [currentQuestionKey, moduleResponses, initialFormData]);

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
