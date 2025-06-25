import React from 'react';
import { QuestionHeaderProps } from '../../../types/cognitive-task.types';

const QuestionHeader: React.FC<QuestionHeaderProps> = ({ title, instructions, required }) => {
    // Si no hay título ni descripción, mostrar un texto por defecto
    if (!title && !instructions) {
        return (
            <div className="mb-4 space-y-1">
                <h3 className="text-lg font-semibold text-gray-800">
                    Pregunta
                    {required && <span className="text-red-500 ml-1">*</span>}
                </h3>
            </div>
        );
    }

    return (
        <div className="mb-4 space-y-1"> {/* Espacio debajo y entre título/descripción */}
             {title && (
                <h3 className="text-lg font-semibold text-gray-800">
                    {title} {required && <span className="text-red-500 ml-1">*</span>}
                </h3>
            )}
            {instructions && (
                <p className="text-base text-gray-600">
                    {instructions}
                </p>
            )}
        </div>
    );
};

export default QuestionHeader;
