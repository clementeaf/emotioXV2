import React from 'react';
import { useStandardizedForm, valueExtractors, StandardizedFormProps } from '../../hooks/useStandardizedForm';
import { getStandardButtonText, getButtonDisabledState, formatQuestionText, getErrorDisplayProps, formSpacing } from '../../utils/formHelpers';

interface NPSViewProps extends StandardizedFormProps {
  questionText: string;
  instructions?: string;
  companyName?: string;
  leftLabel?: string; // Etiqueta izquierda (NPS)
  rightLabel?: string; // Etiqueta derecha (NPS)
  onNext: (selectedValue: number) => void; // Callback con el valor 0-10
  config?: unknown; // Configuración adicional si necesaria
}

const NPSView: React.FC<NPSViewProps> = ({
  questionText,
  instructions,
  companyName,
  leftLabel = "Muy poco probable",
  rightLabel = "Extremadamente probable",
  onNext,
  config,
  ...standardProps
}) => {

  const [state, actions] = useStandardizedForm<number | null>(standardProps, {
    initialValue: null,
    extractValueFromResponse: valueExtractors.numericScale,
    moduleId: typeof config === 'object' && config !== null && 'moduleId' in config 
      ? (config as { moduleId?: string }).moduleId 
      : undefined
  });

  const { value: selectedValue, isSaving, isLoading, error, hasExistingData } = state;
  const { setValue, validateAndSave } = actions;

  const scaleButtons = Array.from({ length: 11 }, (_, i) => i); // Crea [0, 1, ..., 10]

  const handleSelect = (value: number) => {
    setValue(value);
  };

  const handleNextClick = async () => {
    if (selectedValue !== null) {
      const result = await validateAndSave();
      if (result.success) {
        onNext(selectedValue);
      }
    }
  };

  // Formatear el texto de la pregunta (reemplazo simple)
  const formattedQuestionText = formatQuestionText(questionText, companyName);
  const buttonText = getStandardButtonText({ 
    isSaving, 
    isLoading, 
    hasExistingData 
  });
  const isButtonDisabled = getButtonDisabledState({
    isRequired: true,
    value: selectedValue,
    isSaving,
    isLoading,
    hasError: !!error
  });
  const errorDisplay = getErrorDisplayProps(error);

  if (isLoading && !state.isDataLoaded) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
        <div className="text-center text-neutral-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
      <div className="max-w-2xl w-full flex flex-col items-center"> {/* Max-width un poco mayor para acomodar 11 botones */}
        <h2 className={`text-xl font-medium text-center text-neutral-800 ${formSpacing.field}`}>
          {formattedQuestionText}
        </h2>

        {instructions && (
          <p className={`text-sm text-center text-neutral-600 ${formSpacing.section}`}>
            {instructions}
          </p>
        )}

        {/* Contenedor para los botones numéricos 0-10 */}
        <div className={`flex flex-wrap justify-center ${formSpacing.scaleGap} ${formSpacing.section}`}>
          {scaleButtons.map((value) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              disabled={isSaving || isLoading}
              // Estilo ligeramente más pequeño para acomodar 11 botones
              className={`w-9 h-9 rounded-full border flex items-center justify-center font-medium transition-colors text-sm ${selectedValue === value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
              } ${(isSaving || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {value}
            </button>
          ))}
        </div>

        {/* Etiquetas de los extremos */}
        <div className={`flex justify-between w-full max-w-lg ${formSpacing.scaleLabels}`}>
          <span className="text-xs text-neutral-500">{leftLabel}</span>
          <span className="text-xs text-neutral-500">{rightLabel}</span>
        </div>

        {errorDisplay.hasError && (
          <p className={errorDisplay.errorClassName}>
            Error: {errorDisplay.errorMessage}
          </p>
        )}

        <button
          className={`${formSpacing.button} bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handleNextClick}
          disabled={isButtonDisabled}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default NPSView; 