import React, { useEffect, useMemo } from "react";
import { useStandardizedForm, validationRules, valueExtractors } from "../../../hooks/useStandardizedForm";
import { ComponentSingleChoiceQuestionProps } from '../../../types/flow.types';
import { StandardizedFormProps } from "../../../types/hooks.types";
import { formSpacing, getButtonDisabledState, getErrorDisplayProps, getFormContainerClass, getMockOptions, getStandardButtonText } from "../../../utils/formHelpers";

export const SingleChoiceQuestion: React.FC<ComponentSingleChoiceQuestionProps> = ({
    config,
    stepName,
    onStepComplete,
    isMock,
    ...standardProps
}) => {
    // Unificar todas las props de config en un solo objeto seguro
    const cfg = (typeof config === 'object' && config !== null)
      ? config as {
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

    // Generar opciones de display - moviendo la lógica dentro del useMemo
    const displayOptions = useMemo(() => {
        const choices = Array.isArray(cfg.choices) ? cfg.choices : [];
        if (choices.length === 0) {
            if (isMock) {
                return getMockOptions<string>('single', 3, 'Opción');
            }
            return ['Opción A (sin texto)', 'Opción B (sin texto)', 'Opción C (sin texto)'];
        }

        // Convertir objetos a strings si es necesario, pero generar nombres consistentes
        return choices.map((choice, index) => {
            if (typeof choice === 'string' && choice.trim() !== '') return choice;
            if (typeof choice === 'object' && choice !== null) {
                const obj = choice as { text?: string; id?: string };
                if (obj.text && obj.text.trim() !== '') return obj.text;
            }
            // Si no hay texto válido, generar el formato que está guardado en DB
            const letter = String.fromCharCode(65 + index); // A, B, C...
            return `Opción ${letter} (sin texto)`;
        });
    }, [cfg.choices, isMock]);

    // Props estandarizadas para el hook
    const formProps: StandardizedFormProps = {
        stepId: stepName || 'single-choice',
        stepType: stepName || 'single-choice',
        stepName: componentTitle,
        required,
        isMock,
        ...standardProps
    };

    const [state, actions] = useStandardizedForm<string | null>(formProps, {
        initialValue: null,
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

        if (value && !displayOptions.includes(value)) {
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
                    const optionValue = typeof option === 'string' ? option : `Opción ${index + 1}`;
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
                            <span className="text-neutral-700">{optionValue}</span>
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
