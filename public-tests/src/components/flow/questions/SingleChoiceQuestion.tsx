import React, { useEffect, useMemo } from "react";
import { useStandardizedForm, validationRules, valueExtractors } from "../../../hooks/useStandardizedForm";
import { ComponentSingleChoiceQuestionProps } from '../../../types/flow.types';
import { StandardizedFormProps } from "../../../types/hooks.types";
import { formSpacing, getButtonDisabledState, getErrorDisplayProps, getFormContainerClass, getMockOptions, getStandardButtonText } from "../../../utils/formHelpers";

export const SingleChoiceQuestion: React.FC<ComponentSingleChoiceQuestionProps> = ({
    stepConfig,
    stepName,
    onStepComplete,
    isMock,
    ...standardProps
}) => {
    // Log temporal para ver el contenido real de stepConfig
    console.log('[SingleChoiceQuestion] stepConfig recibido:', stepConfig);
    // Unificar todas las props de stepConfig en un solo objeto seguro
    const cfg = (typeof stepConfig === 'object' && stepConfig !== null)
      ? stepConfig as {
          title?: string;
          description?: string;
          questionText?: string;
          choices?: unknown[];
          savedResponses?: string;
          required?: boolean;
        }
      : {};

    const componentTitle = cfg.title ?? stepName ?? '';
    const description = cfg.description;
    const questionText = cfg.questionText ?? '';
    const required = cfg.required !== false; // Asumir requerido por defecto

    // Utilidad para extraer el texto de una opción
    function getOptionText(option: any, index: number): string {
        if (typeof option === 'string' && option.trim() !== '') return option;
        if (option && typeof option === 'object' && 'text' in option && typeof option.text === 'string') return option.text;
        return `Opción ${String.fromCharCode(65 + index)} (sin texto)`;
    }

    // Utilidad para extraer el valor de la respuesta previa
    function extractStringResponse(resp: any): string | null {
        if (typeof resp === 'string') return resp;
        if (resp && typeof resp === 'object') {
            if ('value' in resp && typeof resp.value === 'string') return resp.value;
            if ('response' in resp && typeof resp.response === 'string') return resp.response;
        }
        return null;
    }

    // Generar opciones de display usando el texto real
    const displayOptions = useMemo(() => {
        const choices = Array.isArray(cfg.choices) ? cfg.choices : [];
        if (choices.length === 0) {
            if (isMock) {
                return getMockOptions<string>('single', 3, 'Opción').map((opt) => ({ value: opt, label: opt }));
            }
            return [
                { value: 'Opción A (sin texto)', label: 'Opción A (sin texto)' },
                { value: 'Opción B (sin texto)', label: 'Opción B (sin texto)' },
                { value: 'Opción C (sin texto)', label: 'Opción C (sin texto)' }
            ];
        }
        return choices.map((choice, index) => {
            if (typeof choice === 'string') return { value: choice, label: choice };
            if (choice && typeof choice === 'object' && 'text' in choice) return { value: choice.text, label: choice.text };
            return { value: `Opción ${String.fromCharCode(65 + index)} (sin texto)`, label: `Opción ${String.fromCharCode(65 + index)} (sin texto)` };
        });
    }, [cfg.choices, isMock]);

    // Inicializar el valor con la respuesta previa real
    const initialValue = extractStringResponse(cfg.savedResponses);

    const formProps: StandardizedFormProps = {
        stepId: stepName || 'single-choice',
        stepType: stepName || 'single-choice',
        stepName: componentTitle,
        required,
        isMock,
        ...standardProps
    };

    const [state, actions] = useStandardizedForm<string | null>(formProps, {
        initialValue,
        extractValueFromResponse: valueExtractors.singleChoice,
        validationRules: required ? [validationRules.required('Por favor, selecciona una opción.')] : []
    });

    const { value, isSaving, isLoading, error, hasExistingData, isDataLoaded } = state;
    const { setValue, validateAndSave } = actions;

    // 🔍 LOGGING TEMPORAL para debugging SingleChoiceQuestion
    console.log('[SingleChoiceQuestion] estado actual:', {
        stepType: stepName || 'single-choice',
        value,
        hasExistingData,
        isLoading,
        isSaving,
        optionsLength: displayOptions.length,
        displayOptions: displayOptions.slice(0, 3), // Solo las primeras 3 para no saturar
        searchCriteria: {
            stepId: stepName || 'single-choice',
            stepType: stepName || 'single-choice',
            stepName: componentTitle
        }
    });

    // Limpiar valor si no coincide con las opciones actuales - VERSION AGRESIVA
    useEffect(() => {

        if (value && !displayOptions.some(option => option.value === value)) {
            setValue(null);
        }
    }, [value, displayOptions, setValue]);

    const handleOptionSelect = (selectedOption: unknown) => {
        setValue(typeof selectedOption === 'string' ? selectedOption : null);
    };

    const handleSubmit = async () => {
        const result = await validateAndSave();
        if (result.success) {
            setTimeout(() => {
                onStepComplete(value);
            }, 100);
        }
    };

    const hasExistingDataForButton = hasExistingData && !!value;

    const buttonText = getStandardButtonText({
        isSaving,
        isLoading,
        hasExistingData: hasExistingDataForButton,
        customCreateText: 'Guardar y continuar',
        customUpdateText: 'Actualizar y continuar'
    });

    const isButtonDisabled = getButtonDisabledState({
        isRequired: required,
        value,
        isSaving,
        isLoading,
        hasError: !!error
    });

    const errorDisplay = getErrorDisplayProps(error);

    // Loading state
    if (isLoading && !isDataLoaded && !isMock) {
        return (
            <div className={getFormContainerClass('centered')}>
                <div className="text-center text-neutral-500">Cargando...</div>
            </div>
        );
    }

    return (
        <div className={getFormContainerClass('centered')}>
            <h2 className={`text-xl font-medium text-neutral-800 ${formSpacing.field}`}>
                {componentTitle}
            </h2>

            {description && (
                <p className={`text-sm text-neutral-500 ${formSpacing.field}`}>
                    {description}
                </p>
            )}

            {questionText && (
                <p className={`text-neutral-600 ${formSpacing.section}`}>
                    {questionText}
                </p>
            )}

            {/* Opciones */}
            <div className={`space-y-3 ${formSpacing.section}`}>
                {displayOptions.map((option, index) => {
                    const optionValue = String(option.value);
                    const isSelected = value === optionValue;

                    return (
                        <label
                            key={index}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-neutral-300 hover:bg-neutral-50'
                            } ${(isSaving || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <input
                                type="radio"
                                name={`single-choice-${stepName || 'default'}`}
                                value={optionValue}
                                checked={isSelected}
                                onChange={() => handleOptionSelect(optionValue)}
                                disabled={isSaving || isLoading}
                                className="mr-3 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-neutral-700">{String(option.label)}</span>
                        </label>
                    );
                })}
            </div>

            {/* Error display */}
            {errorDisplay.hasError && (
                <div className={errorDisplay.errorClassName}>
                    {errorDisplay.errorMessage}
                </div>
            )}

            {/* Submit button */}
            <button
                className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${formSpacing.button}`}
                onClick={handleSubmit}
                disabled={isButtonDisabled}
            >
                {buttonText}
            </button>
        </div>
    );
};
