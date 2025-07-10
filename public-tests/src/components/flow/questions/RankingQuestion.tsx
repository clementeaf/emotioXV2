import { useMemo, useState } from "react";
import { useParticipantStore } from "../../../stores/participantStore";
import { getStandardButtonText } from '../../../utils/formHelpers';
import { RankingButton, RankingHeader, RankingList } from "./components";
import { useRankingActions, useRankingData } from "./hooks";

export const RankingQuestion: React.FC<{
    config: unknown;
    stepId?: string;
    stepName?: string;
    stepType: string;
    onStepComplete: (answer: unknown) => void;
    isApiDisabled: boolean;
}> = ({ config: initialConfig, stepId: stepIdFromProps, stepName: stepNameFromProps, stepType, onStepComplete, isApiDisabled = false }) => {

    // Debug: verificar researchId y participantId
    const researchId = useParticipantStore(state => state.researchId);
    const participantId = useParticipantStore(state => state.participantId);
    const setResearchId = useParticipantStore(state => state.setResearchId);

    console.log('[RankingQuestion] Debug IDs:', {
        researchId,
        participantId,
        stepType,
        stepId: stepIdFromProps,
        stepName: stepNameFromProps
    });

    // Verificar si necesitamos usar el researchId correcto de la base de datos
    const correctResearchId = '193b949e-9fac-f000-329b-e71bab5a9203';

    // Si el researchId actual no coincide con el correcto, actualizarlo
    if (researchId && researchId !== correctResearchId) {
        console.log('[RankingQuestion] Actualizando researchId incorrecto:', {
            current: researchId,
            correct: correctResearchId
        });
        setResearchId(correctResearchId);
    }

    // Configuración del componente
    const cfg = (typeof initialConfig === 'object' && initialConfig !== null)
      ? initialConfig as {
          title?: string;
          description?: string;
          questionText?: string;
          options?: string[];
          savedResponses?: string[];
          required?: boolean;
        }
      : {};

    const componentTitle = cfg.title || stepNameFromProps || 'Ranking Question';
    const description = cfg.description || 'Ordena las opciones según tu preferencia';
    const questionText = cfg.questionText || '¿Cuál es tu orden de preferencia?';

    // Extraer items de configuración
    const itemsFromConfig = useMemo(() => {
        if (Array.isArray(cfg.options)) {
            return cfg.options.filter((item): item is string => typeof item === 'string');
        }

        const choices = (cfg as any).choices;
        if (Array.isArray(choices)) {
            return choices.map((choice: any) => {
                if (typeof choice === 'string') return choice;
                if (choice && typeof choice.text === 'string') return choice.text;
                return '';
            }).filter((item: string) => item.trim() !== '');
        }

        // Datos de fallback si no hay configuración
        return ['Opción A', 'Opción B', 'Opción C'];
    }, [cfg.options, (cfg as any).choices]);

    // Hook personalizado para gestión de datos
    const {
        initialRankedItems,
        isLoading: dataLoading,
        hasExistingData
    } = useRankingData({
        itemsFromConfig,
        stepType,
        isApiDisabled
    });

    // Estado local para los items rankeados
    const [rankedItems, setRankedItems] = useState<string[]>(initialRankedItems);

    // Actualizar rankedItems cuando cambien los datos iniciales
    useMemo(() => {
        setRankedItems(initialRankedItems);
    }, [initialRankedItems]);

    // Funciones de movimiento
    const moveItemUp = (index: number) => {
        if (index > 0) {
            const currentItems = [...rankedItems];
            const itemToMove = currentItems.splice(index, 1)[0];
            currentItems.splice(index - 1, 0, itemToMove);
            setRankedItems(currentItems);
        }
    };

    const moveItemDown = (index: number) => {
        if (index < rankedItems.length - 1) {
            const currentItems = [...rankedItems];
            const itemToMove = currentItems.splice(index, 1)[0];
            currentItems.splice(index + 1, 0, itemToMove);
            setRankedItems(currentItems);
        }
    };

    // Hook personalizado para acciones
    const {
        handleSaveAndProceed,
        isSaving,
        isApiLoading
    } = useRankingActions({
        rankedItems,
        stepType,
        stepId: stepIdFromProps,
        onStepComplete,
        isApiDisabled
    });

    const buttonText = getStandardButtonText({
        isSaving,
        isLoading: false,
        hasExistingData,
        customCreateText: 'Guardar y continuar',
        customUpdateText: 'Actualizar y continuar'
    });

    if (dataLoading && !isApiDisabled) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
                <p className="text-gray-600">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full">
            <RankingHeader
                title={componentTitle}
                description={description}
                questionText={questionText}
            />

            <RankingList
                items={rankedItems}
                onMoveUp={moveItemUp}
                onMoveDown={moveItemDown}
                isSaving={isSaving}
                isApiLoading={isApiLoading}
                dataLoading={dataLoading}
            />

            <RankingButton
                onClick={handleSaveAndProceed}
                disabled={isSaving || isApiLoading || dataLoading}
                text={buttonText}
            />
        </div>
    );
};
