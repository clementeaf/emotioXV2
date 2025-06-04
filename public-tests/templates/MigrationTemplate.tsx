import React from 'react';
import { 
  useStandardizedForm, 
  valueExtractors, 
  validationRules, 
  StandardizedFormProps 
} from '../src/hooks/useStandardizedForm';
import { 
  getStandardButtonText, 
  getButtonDisabledState, 
  getErrorDisplayProps, 
  getFormContainerClass, 
  formSpacing 
} from '../src/utils/formHelpers';
import FormField from '../src/components/common/FormField';
import LoadingScreen from '../src/components/LoadingScreen';

/**
 * Template de Migración para useStandardizedForm
 * 
 * Instrucciones de uso:
 * 1. Copiar este template
 * 2. Reemplazar TYourFormData con el tipo de datos real
 * 3. Configurar valueExtractor y validationRules apropiados
 * 4. Implementar el renderizado específico del formulario
 * 5. Adaptar props y callbacks según necesidades
 */

// 🔧 PASO 1: Definir tipos de datos
interface TYourFormData {
  // Definir la estructura de datos del formulario
  // Ejemplo:
  email?: string;
  name?: string;
  selectedOptions?: string[];
  scale?: number | null;
}

// 🔧 PASO 2: Definir props del componente
interface YourFormComponentProps extends StandardizedFormProps {
  // Props específicas del componente
  questionText?: string;
  instructions?: string;
  config?: unknown;
  onStepComplete?: (data?: unknown) => void;
  onNext?: (data: TYourFormData) => void;
  // ... otras props específicas
}

const YourFormComponent: React.FC<YourFormComponentProps> = ({
  // Props específicas del componente
  questionText = 'Pregunta por defecto',
  instructions,
  config,
  onStepComplete,
  onNext,
  
  // Resto de props estandarizadas se pasan directamente
  ...standardProps
}) => {

  // 🔧 PASO 3: Configurar el hook useStandardizedForm
  const [state, actions] = useStandardizedForm<TYourFormData>(
    standardProps,
    {
      // Valor inicial del formulario
      initialValue: {
        email: '',
        name: '',
        selectedOptions: [],
        scale: null
      } as TYourFormData,
      
      // Extractor de valores para respuestas guardadas
      extractValueFromResponse: (response: unknown): TYourFormData => {
        // 🔧 Adaptar según el tipo de datos esperado
        if (typeof response === 'object' && response !== null) {
          return response as TYourFormData;
        }
        return {
          email: '',
          name: '',
          selectedOptions: [],
          scale: null
        };
      },
      // Opciones disponibles: textValue, numericScale, singleChoice, multipleChoice, demographicData, etc.
      
      // Reglas de validación
      validationRules: standardProps.required ? [
        validationRules.required('Este campo es obligatorio'),
        // 🔧 Añadir más reglas según necesidades:
        // validationRules.emailFormat('Email inválido'),
        // validationRules.minLength(3, 'Mínimo 3 caracteres'),
        // validationRules.minSelections(1, 'Selecciona al menos una opción'),
      ] : [],
      
      // ID del módulo (para SmartVOC u otros sistemas modulares)
      moduleId: typeof config === 'object' && config !== null && 'moduleId' in config 
        ? (config as { moduleId?: string }).moduleId 
        : undefined
    }
  );

  // 🔧 PASO 4: Extraer estado y acciones
  const { value, isSaving, isLoading, error, hasExistingData, isDataLoaded } = state;
  const { setValue, validateAndSave } = actions;

  // 🔧 PASO 5: Implementar handlers específicos
  const handleFieldChange = (field: keyof TYourFormData, newValue: any) => {
    setValue({
      ...value,
      [field]: newValue
    });
  };

  const handleSubmit = async () => {
    const result = await validateAndSave();
    if (result.success) {
      // Llamar a callbacks apropiados
      if (onStepComplete) {
        onStepComplete(result.data);
      }
      if (onNext) {
        onNext(result.data as TYourFormData);
      }
    }
  };

  // 🔧 PASO 6: Configurar textos y estados de UI
  const buttonText = getStandardButtonText({ 
    isSaving, 
    isLoading, 
    hasExistingData 
  });
  
  const isButtonDisabled = getButtonDisabledState({
    isRequired: standardProps.required || false,
    value, // 🔧 Adaptar lógica de validación si es necesario
    isSaving,
    isLoading,
    hasError: !!error
  });

  const errorDisplay = getErrorDisplayProps(error);

  // 🔧 PASO 7: Renderizado condicional para loading
  if (isLoading && !isDataLoaded) {
    return (
      <div className={getFormContainerClass('centered')}>
        <LoadingScreen />
      </div>
    );
  }

  // 🔧 PASO 8: Renderizado principal del formulario
  return (
    <div className={getFormContainerClass('centered')}>
      {/* Título principal */}
      <h2 className={`text-xl font-medium text-center text-neutral-800 ${formSpacing.field}`}>
        {questionText}
      </h2>

      {/* Instrucciones opcionales */}
      {instructions && (
        <p className={`text-sm text-center text-neutral-600 ${formSpacing.field}`}>
          {instructions}
        </p>
      )}

      {/* Mostrar errores si existen */}
      {errorDisplay.hasError && (
        <div className={`${errorDisplay.errorClassName} ${formSpacing.error}`}>
          {errorDisplay.errorMessage}
        </div>
      )}

      {/* 🔧 PASO 9: Implementar campos específicos del formulario */}
      <div className={formSpacing.section}>
        {/* Ejemplo de campo de texto */}
        <FormField
          id="example-field"
          label="Campo de ejemplo"
          name="example"
          type="text"
          value={value.email || ''} // 🔧 Adaptar según estructura de datos
          onChange={(e) => handleFieldChange('email', e.target.value)} // 🔧 Adaptar
          placeholder="Ingresa el valor..."
          error={null} // Los errores se manejan a nivel de formulario
          disabled={isSaving || isLoading}
          required={standardProps.required || false}
        />

        {/* Ejemplo de botones de escala */}
        {/* 
        <div className={`flex justify-center ${formSpacing.scaleGap}`}>
          {[1, 2, 3, 4, 5].map((option) => (
            <button
              key={option}
              onClick={() => handleFieldChange('scale', option)}
              className={`scale-button ${value.scale === option ? 'selected' : ''}`}
              disabled={isSaving || isLoading}
            >
              {option}
            </button>
          ))}
        </div>
        */}

        {/* Ejemplo de selección múltiple */}
        {/* 
        <CheckboxGroup
          name="multiple-choice"
          options={mockOptions}
          selectedIds={value.selectedOptions || []}
          onChange={(optionId, isChecked) => {
            const currentSelections = value.selectedOptions || [];
            const newSelections = isChecked
              ? [...currentSelections, optionId]
              : currentSelections.filter(id => id !== optionId);
            handleFieldChange('selectedOptions', newSelections);
          }}
          disabled={isSaving || isLoading}
        />
        */}
      </div>

      {/* Botón de envío */}
      <button
        className={`bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-8 rounded-md transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${formSpacing.button}`}
        onClick={handleSubmit}
        disabled={isButtonDisabled}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default YourFormComponent;

/**
 * 📋 CHECKLIST DE MIGRACIÓN
 * 
 * Pre-migración:
 * - [ ] Identificar tipo de datos del formulario original
 * - [ ] Documentar validaciones actuales
 * - [ ] Crear tests de regresión para funcionalidad actual
 * - [ ] Verificar componentes que usan este formulario
 * 
 * Durante migración:
 * - [ ] Reemplazar TYourFormData con tipos reales
 * - [ ] Configurar valueExtractor apropiado
 * - [ ] Migrar validaciones a validationRules
 * - [ ] Implementar campos específicos
 * - [ ] Mantener API pública idéntica
 * 
 * Post-migración:
 * - [ ] Ejecutar tests de regresión
 * - [ ] Verificar funcionalidad en navegador
 * - [ ] Validar performance
 * - [ ] Documentar cambios
 * - [ ] Code review
 * 
 * Cleanup:
 * - [ ] Remover código legacy
 * - [ ] Actualizar imports
 * - [ ] Optimizar si es necesario
 */

/**
 * 🔍 EJEMPLOS DE CONFIGURACIÓN COMÚN
 * 
 * Para diferentes tipos de formularios:
 * 
 * // Formulario de texto simple
 * extractValueFromResponse: valueExtractors.textValue,
 * validationRules: [validationRules.required(), validationRules.minLength(3)]
 * 
 * // Escala numérica (NPS, CSAT, etc.)
 * extractValueFromResponse: valueExtractors.numericScale,
 * validationRules: [validationRules.required(), validationRules.range(1, 10)]
 * 
 * // Selección única
 * extractValueFromResponse: valueExtractors.singleChoice,
 * validationRules: [validationRules.required()]
 * 
 * // Selección múltiple
 * extractValueFromResponse: valueExtractors.multipleChoice,
 * validationRules: [validationRules.minSelections(1), validationRules.maxSelections(3)]
 * 
 * // Datos demográficos
 * extractValueFromResponse: valueExtractors.demographicData,
 * validationRules: [validationRules.demographicRequired(['age', 'gender'])]
 * 
 * // Autenticación/Login
 * extractValueFromResponse: valueExtractors.participantAuth,
 * validationRules: [validationRules.required(), validationRules.emailFormat()]
 */ 