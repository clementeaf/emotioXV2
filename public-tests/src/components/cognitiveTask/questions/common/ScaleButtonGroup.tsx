import React from 'react';
import { ScaleButtonGroupProps } from '../../../../types/cognitive-task.types';

const ScaleButtonGroup: React.FC<ScaleButtonGroupProps> = ({
    buttons,
    selectedValue,
    onSelect,
    buttonClassName = "w-9 h-9 rounded-full border flex items-center justify-center font-medium transition-colors text-sm",
    activeButtonClassName = "bg-blue-600 text-white border-blue-600",
    inactiveButtonClassName = "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
}) => {
    return (
        <div className="flex flex-wrap justify-center gap-2 mb-4">
            {buttons.map((numValue) => (
                <button
                    key={numValue}
                    onClick={() => onSelect(numValue)}
                    className={`${buttonClassName} ${selectedValue === numValue
                        ? activeButtonClassName
                        : inactiveButtonClassName
                    }`}
                >
                    {numValue}
                </button>
            ))}
        </div>
    );
};

export default ScaleButtonGroup; 