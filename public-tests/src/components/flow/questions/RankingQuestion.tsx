import React, { useMemo, useState } from "react";
import { useStepResponseManager } from "../../../hooks/useStepResponseManager";
import { MappedStepComponentProps } from "../../../types/flow.types";
import FormSubmitButton from "../../common/FormSubmitButton";
import { RankingHeader, RankingList } from "./components";

export const RankingQuestion: React.FC<MappedStepComponentProps> = (props) => {
  const { stepConfig, onStepComplete, savedResponse, questionKey } = props;
  const config = stepConfig as any;

  const id = questionKey || config.id || '';
  const title = config.title || 'Ranking Question';
  const description = config.description || 'Ordena las opciones según tu preferencia';
  const questionText = config.questionText || '¿Cuál es tu orden de preferencia?';
  const required = config.required;

  const {
    responseData,
    isSaving,
    isLoading,
    error,
    saveCurrentStepResponse,
    hasExistingData
  } = useStepResponseManager<string[]>({
    stepId: id,
    stepType: config.type || 'cognitive_ranking',
    stepName: title,
    initialData: savedResponse as string[] | null | undefined,
    questionKey: id
  });

  // Extraer items de configuración
  const itemsFromConfig = useMemo(() => {
    if (Array.isArray(config.options)) {
      return config.options.filter((item: any) => typeof item === 'string' && item.trim() !== '');
    }
    if (Array.isArray(config.choices)) {
      return config.choices
        .map((choice: any) => (typeof choice === 'string' ? choice : choice.text || choice.label || choice.id))
        .filter((item: string) => typeof item === 'string' && item.trim() !== '');
    }
    return [];
  }, [config.options, config.choices]);

  // Estado local para los items rankeados (solo inicializar una vez)
  const [rankedItems, setRankedItems] = useState<string[]>(itemsFromConfig);
  const [localError, setLocalError] = useState<string | null>(null);

  // Eliminar el useEffect de sincronización para NO sobrescribir el estado local

  if (!id) {
    console.error('[RankingQuestion] Configuración inválida (sin ID):', config);
    return <div className="p-4 text-red-600">Error: Pregunta mal configurada.</div>;
  }

  // Funciones de movimiento
  const moveItemUp = (index: number) => {
    if (index > 0) {
      const currentItems = [...rankedItems];
      const itemToMove = currentItems.splice(index, 1)[0];
      currentItems.splice(index - 1, 0, itemToMove);
      setRankedItems(currentItems);
      setLocalError(null);
    }
  };

  const moveItemDown = (index: number) => {
    if (index < rankedItems.length - 1) {
      const currentItems = [...rankedItems];
      const itemToMove = currentItems.splice(index, 1)[0];
      currentItems.splice(index + 1, 0, itemToMove);
      setRankedItems(currentItems);
      setLocalError(null);
    }
  };

  const handleSubmit = async () => {
    if (required && rankedItems.length === 0) {
      setLocalError('Por favor, ordena al menos una opción.');
      return;
    }
    const result = await saveCurrentStepResponse(rankedItems);
    if (result.success && onStepComplete) {
      onStepComplete(rankedItems);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <RankingHeader
        title={title}
        description={description}
        questionText={questionText}
      />

      <RankingList
        items={rankedItems}
        onMoveUp={moveItemUp}
        onMoveDown={moveItemDown}
        isSaving={isSaving}
        isApiLoading={isLoading}
        dataLoading={false}
      />

      {(localError || error) && (
        <div className="text-red-600 text-sm mt-2">{localError || error}</div>
      )}

      <FormSubmitButton
        isSaving={!!isSaving || !!isLoading}
        hasExistingData={!!hasExistingData}
        onClick={handleSubmit}
        disabled={isSaving || isLoading || (required && rankedItems.length === 0)}
      />
    </div>
  );
};
