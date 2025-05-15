import React, { useState } from 'react';
import { WelcomeScreenHandlerProps } from './types';

const WelcomeScreenHandler: React.FC<WelcomeScreenHandlerProps> = ({
    stepConfig,
    onStepComplete,
}) => {
    const [isNavigating, setIsNavigating] = useState<boolean>(false);

    const title = stepConfig?.title || 'Bienvenida';
    const message = stepConfig?.message || 'Por favor, lee la información y continúa.';
    const startButtonText = stepConfig?.startButtonText || 'Continuar';

    return (
        <div className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            <p className="mb-4">{message}</p>
            <button
                onClick={() => {
                    setIsNavigating(true);
                    setTimeout(() => {
                        onStepComplete();
                    }, 300); 
                }}
                disabled={isNavigating}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isNavigating ? 'Cargando...' : startButtonText}
            </button>
        </div>
    );
};

export default WelcomeScreenHandler; 