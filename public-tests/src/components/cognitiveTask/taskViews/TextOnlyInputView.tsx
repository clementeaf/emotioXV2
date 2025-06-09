import React from 'react';
import FormField from '../../common/FormField';

// Interface específica para este componente
interface TextOnlyInputViewComponentProps {
  description: string; // El texto descriptivo/instrucción
  placeholder: string;
  value: string; // Añadir value y onChange para que el padre gestione el estado
  onChange: (value: string) => void;
  // error?: string | null; // Opcional: para mostrar errores
}

const TextOnlyInputView: React.FC<TextOnlyInputViewComponentProps> = ({
  description,
  placeholder,
  value,
  onChange,
  // error,
}) => {
  return (
    <div className="w-full max-w-md mb-6">
      <p className="text-neutral-600 mb-6 text-center">
        {description}
      </p>
      <FormField
        id="text-only-input"
        name="text-only-input"
        label="Respuesta" // Etiqueta descriptiva para accesibilidad
        type="email" // Asumiendo tipo email
        placeholder={placeholder}
        value={value} // Pasar el valor
        onChange={(e) => onChange(e.target.value)} // Pasar el handler
        // required
        // error={error}
        className="w-full" 
        inputClassName="p-2.5"
      />
    </div>
  );
};

export default TextOnlyInputView; 