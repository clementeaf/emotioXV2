import React from 'react';
import { useStandardizedForm, valueExtractors, StandardizedFormProps } from '../../hooks/useStandardizedForm';
import { getStandardButtonText, getButtonDisabledState, formatQuestionText, getErrorDisplayProps, formSpacing } from '../../utils/formHelpers';

interface CSATViewProps extends StandardizedFormProps {
  questionText: string;
  instructions?: string;
  companyName?: string;
  config?: unknown;
  scaleSize?: number;
  onStepComplete: (data?: unknown) => void;
}

const CSATView: React.FC<CSATViewProps> = ({
  questionText,
  instructions,
  companyName,
  config,
  onStepComplete,
  ...standardProps
}) => {

  const satisfactionLevels = [
    { value: 1, label: 'Muy insatisfecho' },
    { value: 2, label: 'Insatisfecho' },
    { value: 3, label: 'Neutral' },
    { value: 4, label: 'Satisfecho' },
    { value: 5, label: 'Muy satisfecho' }
  ];

  const [state, actions] = useStandardizedForm<number | null>(standardProps, {
    initialValue: null,
    extractValueFromResponse: valueExtractors.numericScale,
    moduleId: typeof config === 'object' && config !== null && 'moduleId' in config 
      ? (config as { moduleId?: string }).moduleId 
      : undefined
  });

  const { value, isSaving, isLoading, error, hasExistingData } = state;
  const { setValue, validateAndSave } = actions;

  const handleSelect = (selectedValue: number) => {
    setValue(selectedValue);
  };

  const handleSubmit = async () => {
    const result = await validateAndSave();
    if (result.success) {
      onStepComplete({ 
        success: true, 
        data: result.data, 
        value: value 
      });
    }
  };

  const formattedQuestionText = formatQuestionText(questionText, companyName);
  const buttonText = getStandardButtonText({ 
    isSaving, 
    isLoading, 
    hasExistingData 
  });
  const isButtonDisabled = getButtonDisabledState({
    isRequired: true,
    value,
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
      <div className="max-w-2xl w-full flex flex-col items-center">
        <h2 className={`text-xl font-medium text-center text-neutral-800 ${formSpacing.field}`}>
          {formattedQuestionText}
        </h2>

        {instructions && (
          <p className={`text-sm text-center text-neutral-600 ${formSpacing.section}`}>
            {instructions}
          </p>
        )}

        <div className={`flex flex-col sm:flex-row justify-center ${formSpacing.scaleGap} ${formSpacing.section} w-full`}>
          {satisfactionLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => handleSelect(level.value)}
              className={`px-4 py-3 rounded-md border flex flex-col items-center justify-center transition-colors ${
                value === level.value
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
              } ${(isSaving || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isSaving || isLoading}
            >
              <span className="font-medium">{level.value}</span>
              <span className="text-xs mt-1">{level.label}</span>
            </button>
          ))}
        </div>

        {errorDisplay.hasError && (
          <p className={errorDisplay.errorClassName}>
            Error: {errorDisplay.errorMessage}
          </p>
        )}

        <button
          className={`${formSpacing.button} bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-10 rounded-md w-fit transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handleSubmit}
          disabled={isButtonDisabled}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default CSATView; 