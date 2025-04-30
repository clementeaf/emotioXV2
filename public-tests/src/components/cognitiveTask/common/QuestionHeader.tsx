import React from 'react';

interface QuestionHeaderProps {
    title?: string;
    description?: string;
    required?: boolean;
}

const QuestionHeader: React.FC<QuestionHeaderProps> = ({ title, description, required }) => {
    // No renderizar nada si no hay título ni descripción
    if (!title && !description) {
        return null;
    }

    return (
        <div className="mb-4 space-y-1"> {/* Espacio debajo y entre título/descripción */} 
             {title && (
                <h3 className="text-lg font-semibold text-gray-800">
                    {title} {required && <span className="text-red-500 ml-1">*</span>} 
                </h3>
            )}
            {description && (
                <p className="text-base text-gray-600">
                    {description}
                </p>
            )}
        </div>
    );
};

export default QuestionHeader; 