import React from 'react';

interface FormFieldProps {
    id: string;
    label: string;
    name: string;
    type?: string; // default to 'text'
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string | null; // Mensaje de error para mostrar
    disabled?: boolean;
    required?: boolean; // <-- Añadir prop requerida
    className?: string; // Para estilos adicionales del contenedor
    inputClassName?: string; // Para estilos adicionales del input
}

const FormField: React.FC<FormFieldProps> = ({
    id,
    label,
    name,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    disabled = false,
    required = false, // <-- Añadir valor por defecto
    className = ''
}) => {
    const baseInputClasses = "w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900";
    const errorInputClasses = "border-red-500";
    const normalInputClasses = "border-neutral-300";

    return (
        <div className={`mb-4 ${className}`}> {/* Añadir margen inferior por defecto */}
            <label 
              htmlFor={id} 
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              {label}
            </label>
            <input
              id={id}
              name={name}
              type={type}
              value={value}
              onChange={onChange}
              className={`${baseInputClasses} ${error ? errorInputClasses : normalInputClasses}`}
              placeholder={placeholder}
              disabled={disabled}
              aria-required={required} // <-- Usar la prop para aria-required
            />
            {error && (
              <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

export default FormField; 