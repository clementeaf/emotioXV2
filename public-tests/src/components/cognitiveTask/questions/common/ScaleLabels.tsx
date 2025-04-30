import React from 'react';

interface ScaleLabelsProps {
    minLabel?: string;
    maxLabel?: string;
    className?: string; // Para estilos adicionales del contenedor
}

const ScaleLabels: React.FC<ScaleLabelsProps> = ({
    minLabel,
    maxLabel,
    className = "flex justify-between w-full mt-2 px-1 max-w-lg mx-auto" // Clases por defecto
}) => {
    // No renderizar nada si no hay ninguna etiqueta
    if (!minLabel && !maxLabel) {
        return null;
    }

    return (
        <div className={className}>
            <span className="text-xs text-neutral-500">{minLabel || ''}</span>
            <span className="text-xs text-neutral-500">{maxLabel || ''}</span>
        </div>
    );
};

export default ScaleLabels; 