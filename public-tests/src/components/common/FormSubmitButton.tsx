import React from 'react';

interface FormSubmitButtonProps {
  isSaving: boolean;
  hasExistingData: boolean;
  onClick: () => void;
  disabled?: boolean;
  customCreateText?: string;
  customUpdateText?: string;
}

/**
 * Botón universal para formularios de public-tests.
 * Muestra 'Guardar y continuar' o 'Actualizar y continuar' según el estado.
 * Deshabilita y muestra 'Guardando...' si isSaving es true.
 */
const FormSubmitButton: React.FC<FormSubmitButtonProps> = ({
  isSaving,
  hasExistingData,
  onClick,
  disabled = false,
  customCreateText,
  customUpdateText,
}) => {
  const getButtonText = () => {
    if (isSaving) return 'Guardando...';
    if (hasExistingData) return customUpdateText || 'Actualizar y continuar';
    return customCreateText || 'Guardar y continuar';
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSaving || disabled}
      className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      {getButtonText()}
    </button>
  );
};

export default FormSubmitButton;
