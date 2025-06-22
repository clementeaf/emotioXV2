import React from 'react';

interface RenderErrorProps {
    stepType?: string;
    message?: string;
}

export const RenderError: React.FC<RenderErrorProps> = ({ stepType, message }) => {
    const errorMessage = message || `Error al renderizar el tipo de paso: ${stepType || 'desconocido'}`;

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-red-50 text-red-700 p-4">
            <h3 className="font-bold text-lg mb-2">Ocurrió un error</h3>
            <p className="text-center">{errorMessage}</p>
        </div>
    );
};
