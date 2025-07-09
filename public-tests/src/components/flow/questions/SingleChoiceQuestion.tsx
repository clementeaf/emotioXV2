import React, { useState } from "react";
import { ComponentSingleChoiceQuestionProps } from '../../../types/flow.types';

interface Choice {
    id: string;
    text: string;
}

interface StepConfig {
    title?: string;
    description?: string;
    choices?: Choice[];
    savedResponses?: string;
    required?: boolean;
}

interface Option {
    value: string;
    label: string;
}

export const SingleChoiceQuestion: React.FC<ComponentSingleChoiceQuestionProps> = ({
    stepConfig,
    stepName,
    onStepComplete,
}) => {
    const cfg: StepConfig = (stepConfig as StepConfig) || {};

    const title = cfg.title || stepName || 'Opción Única';
    const description = cfg.description;
    const choices = cfg.choices || [];
    const required = cfg.required !== false;

    const options: Option[] = choices.map((choice: Choice) => ({
        value: choice.id,
        label: choice.text
    }));

    // Valor inicial: si es id, úsalo; si es texto, busca el id correspondiente
    const initialValue = (() => {
        if (!cfg.savedResponses) return null;
        if (options.some(opt => opt.value === cfg.savedResponses)) return cfg.savedResponses;
        const found = options.find(opt => opt.label === cfg.savedResponses);
        return found ? found.value : null;
    })();
    const [selectedValue, setSelectedValue] = useState<string | null>(initialValue);
    const [isSaving, setIsSaving] = useState(false);

    console.log('[SingleChoiceQuestion] SIMPLE:', { savedResponses: cfg.savedResponses, selectedValue, options });

    const handleSubmit = async () => {
        if (!selectedValue && required) return;

        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        onStepComplete(selectedValue);
        setIsSaving(false);
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-medium text-neutral-800 mb-4">{title}</h2>

            {description && (
                <p className="text-sm text-neutral-500 mb-4">{description}</p>
            )}

            <div className="space-y-3 mb-6">
                {options.map((option: Option, index: number) => (
                    <label key={index} className="flex items-center p-3 border rounded-lg cursor-pointer">
                        <input
                            type="radio"
                            name="single-choice"
                            value={option.value}
                            checked={selectedValue === option.value}
                            onChange={() => setSelectedValue(option.value)}
                            disabled={isSaving}
                            className="mr-3"
                        />
                        <span>{option.label}</span>
                    </label>
                ))}
            </div>

            <button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg disabled:opacity-50"
                onClick={handleSubmit}
                disabled={isSaving || (required && !selectedValue)}
            >
                {isSaving ? 'Guardando...' : 'Continuar'}
            </button>
        </div>
    );
};
