import React, { useEffect } from 'react';
import { useStandardizedForm } from '../../hooks/useStandardizedForm';
import { NPSViewProps } from '../../types/smart-voc.types';
import { formatQuestionText, formSpacing, getButtonDisabledState, getErrorDisplayProps } from '../../utils/formHelpers';

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
    extractValueFromResponse: (response: unknown): number | null => {
      console.log(`🔍 [NPSView] extractValueFromResponse called with:`, response, typeof response);

      if (typeof response === 'number') {
        console.log(`✅ [NPSView] Direct number:`, response);
        return response;
      }

      if (typeof response === 'object' && response !== null && 'response' in response) {
        const innerResponse = (response as { response: unknown }).response;
        console.log(`🔍 [NPSView] Found nested response:`, innerResponse, typeof innerResponse);
        if (typeof innerResponse === 'number') {
          console.log(`✅ [NPSView] Nested number:`, innerResponse);
          return innerResponse;
        }
      }

      if (typeof response === 'object' && response !== null) {
        const obj = response as Record<string, unknown>;
        if ('N' in obj && typeof obj.N === 'string') {
          const parsed = parseInt(obj.N, 10);
          console.log(`🔍 [NPSView] DynamoDB format N:`, obj.N, '→', parsed);
          if (!isNaN(parsed)) {
            console.log(`✅ [NPSView] DynamoDB parsed:`, parsed);
            return parsed;
          }
        }
      }

      console.log(`⚠️ [NPSView] Could not extract number from:`, response);
      return null;
    },
    moduleId: typeof config === 'object' && config !== null && 'moduleId' in config
      ? (config as { moduleId?: string }).moduleId
      : undefined
  });

  const { value: selectedValue, isSaving, isLoading, error, hasExistingData } = state;
  const { setValue, validateAndSave } = actions;

  // Efecto de inicialización robusto (igual que NEV)
  useEffect(() => {
    if (selectedValue !== null && selectedValue !== undefined) return;
    if (typeof standardProps.savedResponse === 'number') {
      setValue(standardProps.savedResponse, false);
    } else if (
      typeof standardProps.savedResponse === 'object' &&
      standardProps.savedResponse !== null &&
      'value' in standardProps.savedResponse &&
      typeof (standardProps.savedResponse as any).value === 'number'
    ) {
      setValue((standardProps.savedResponse as any).value, false);
    }
  }, [standardProps.savedResponse, setValue, selectedValue]);

  const scaleButtons = Array.from({ length: 11 }, (_, i) => i); // Crea [0, 1, ..., 10]

  const handleSelect = (value: number) => {
    console.log(`🎯 [NPSView] User selecting value:`, value);
    setValue(value, true); // 🚨 Marcar como interacción del usuario
  };

  const handleNextClick = async () => {
    if (selectedValue !== null) {
      const result = await validateAndSave();
      if (result.success) {
        onNext(selectedValue);
      }
    }
  };

  // Formatear el texto de la pregunta
  const formattedQuestionText = formatQuestionText(questionText, companyName);
  // const _buttonText = getStandardButtonText({
  //   isSaving,
  //   isLoading,
  //   isAnswered,
  //   questionType: 'NPS'
  // });
  const isButtonDisabled = getButtonDisabledState({
    isRequired: true,
    value: selectedValue,
    isSaving,
    isLoading,
    hasError: !!error
  });
  const errorDisplay = getErrorDisplayProps(error);

  // Determinar el texto del botón basado en si hay datos existentes
  const getButtonText = () => {
    if (isSaving) return 'Guardando...';
    if (hasExistingData || selectedValue !== null) return 'Actualizar y continuar';
    return 'Guardar y continuar';
  };

  if (isLoading && !state.isDataLoaded) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-white p-8">
        <div className="text-center text-neutral-500">Cargando...</div>
      </div>
    );
  }

  console.log('[NPSView] Configuración recibida:', formattedQuestionText);

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
          {getButtonText()}
        </button>
      </div>
    </div>
  );
};

export default NPSView;
