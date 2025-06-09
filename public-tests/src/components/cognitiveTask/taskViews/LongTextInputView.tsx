import React from 'react';
import TextAreaField from '../../common/TextAreaField';
import CharacterCounter from '../../common/CharacterCounter';
import { LongTextInputViewProps } from '../../../types/cognitive-task.types';

const LongTextInputView: React.FC<LongTextInputViewProps> = ({
  description,
  placeholder,
  value,
  onChange,
  maxLength = 100, // Valor por defecto del original
  // error,
}) => {
  return (
    <div className="w-full max-w-md mb-6">
      <p className="text-neutral-600 mb-6 text-center">
        {description}
      </p>
      <TextAreaField
        id="long-text-input"
        name="long-text-input"
        label="Tu opinión" // Etiqueta para accesibilidad (se oculta por defecto en TextAreaField)
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4} // Ajustar según sea necesario (original era h-24)
        // maxLength={maxLength} // Eliminar esta prop de aquí
        // error={error}
        className="w-full mb-2" // Clases del div contenedor original
        textAreaClassName="h-24 p-3" // Usar textAreaClassName
      />
      <div className="w-full flex justify-end">
        <CharacterCounter currentLength={value.length} maxLength={maxLength} />
      </div>
    </div>
  );
};

export default LongTextInputView; 