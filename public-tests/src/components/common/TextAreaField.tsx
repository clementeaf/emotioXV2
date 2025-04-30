import React from 'react';

interface TextAreaFieldProps {
    id: string;
    name?: string; // Name puede ser útil para formularios
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    label?: string; // Label principal, puede ser sr-only si es visualmente obvio
    rows?: number;
    required?: boolean;
    disabled?: boolean;
    maxLength?: number; // Añadir maxLength a las props
    className?: string; // Estilos para el div contenedor
    textAreaClassName?: string; // Estilos específicos para el textarea
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({
    id,
    name,
    value,
    onChange,
    placeholder,
    label,
    rows = 4, // Default rows
    required = false,
    disabled = false,
    maxLength, // Obtener maxLength de las props
    className = '',
    textAreaClassName // Añadir textAreaClassName aquí
}) => {
    // Clases base para el textarea (similares a input pero con resize)
    const baseTextAreaClasses = `w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out resize-y ${textAreaClassName || ''}`.trim();

    return (
        <div className={className}>
            {label && (
                <label htmlFor={id} className="sr-only">{/* Opcional: mostrar label si se necesita */}
                    {label}
                </label>
            )}
            <textarea
                id={id}
                name={name || id} // Usar name o id si name no se provee
                rows={rows}
                className={baseTextAreaClasses}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                aria-required={required}
                disabled={disabled}
                maxLength={maxLength} // Aplicar maxLength directamente al textarea
            />
             {/* Aquí no solemos mostrar errores específicos de textarea como en FormField, 
                 pero se podría añadir si fuera necesario */}
        </div>
    );
};

export default TextAreaField; 