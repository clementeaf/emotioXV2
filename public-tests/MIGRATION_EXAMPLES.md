# Ejemplos Prácticos de Migración

## 🔄 Patrones de Migración por Categoría

### 1. Estado Local Puro → useStandardizedForm

#### ANTES: LoginForm.tsx (Estado Local Puro)
```typescript
const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, researchId }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Por favor, introduce tu email');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Lógica de login manual...
      const participant = await loginUser(email, researchId);
      onLoginSuccess(participant);
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      {error && <p>{error}</p>}
      <button disabled={isLoading}>
        {isLoading ? 'Iniciando...' : 'Iniciar sesión'}
      </button>
    </form>
  );
};
```

#### DESPUÉS: LoginForm.tsx (useStandardizedForm)
```typescript
const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, researchId }) => {
  const standardProps: StandardizedFormProps = {
    stepId: 'participant-login',
    stepType: 'auth',
    stepName: 'Inicio de Sesión',
    required: true
  };

  const [state, actions] = useStandardizedForm<{email: string}>(standardProps, {
    initialValue: { email: '' },
    extractValueFromResponse: valueExtractors.participantAuth,
    validationRules: [
      validationRules.required('El email es requerido'),
      validationRules.emailFormat('Formato de email inválido')
    ],
    customSubmitHandler: async (data) => {
      const participant = await loginUser(data.email, researchId);
      onLoginSuccess(participant);
      return { success: true, data: participant };
    }
  });

  const { value, isSaving, isLoading, error } = state;
  const { setValue, validateAndSave } = actions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await validateAndSave();
  };

  const buttonText = getStandardButtonText({ isSaving, isLoading });
  const errorDisplay = getErrorDisplayProps(error);

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        id="email"
        label="Email"
        name="email"
        type="email"
        value={value.email}
        onChange={(e) => setValue({ email: e.target.value })}
        error={errorDisplay.errorMessage}
        disabled={isSaving || isLoading}
      />
      
      <button disabled={isSaving || isLoading}>
        {buttonText}
      </button>
    </form>
  );
};
```

---

### 2. useResponseAPI Manual → useStandardizedForm

#### ANTES: AgreementScaleView.tsx (useResponseAPI Manual)
```typescript
const AgreementScaleView: React.FC<AgreementScaleViewProps> = ({
  questionText, researchId, stepId, stepName, stepType, onStepComplete
}) => {
  const participantId = useParticipantStore(state => state.participantId);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [moduleResponseId, setModuleResponseId] = useState<string | null>(null);

  const {
    saveOrUpdateResponse,
    isLoading: isSubmitting,
    error: submissionError,
    setError: setSubmissionError
  } = useResponseAPI({ researchId, participantId: participantId || '' });

  const {
    data: moduleResponsesArray,
    isLoading: isLoadingInitialData,
  } = useModuleResponses({ researchId, participantId });

  // Efectos complejos para cargar datos iniciales
  useEffect(() => {
    if (moduleResponsesArray && moduleResponsesArray.length > 0) {
      const existingResponse = moduleResponsesArray.find(/* lógica compleja */);
      if (existingResponse) {
        setSelectedValue(existingResponse.response.value);
        setModuleResponseId(existingResponse.id);
      }
    }
  }, [moduleResponsesArray, stepId]);

  const handleSubmit = async () => {
    // Validación manual
    if (selectedValue === null) {
      setSubmissionError("Por favor, selecciona una opción.");
      return;
    }

    // Guardado manual
    const result = await saveOrUpdateResponse(
      stepId, stepType, stepName, 
      { value: selectedValue }, 
      moduleResponseId
    );

    if (result && !submissionError) {
      onStepComplete({ success: true, data: result, value: selectedValue });
    }
  };

  // Renderizado con estados manuales
  if (isLoadingInitialData) {
    return <div>Cargando datos...</div>;
  }

  return (
    <div>
      <h2>{questionText}</h2>
      {[1,2,3,4,5,6,7].map(value => (
        <button
          key={value}
          onClick={() => setSelectedValue(value)}
          className={selectedValue === value ? 'selected' : ''}
        >
          {value}
        </button>
      ))}
      {submissionError && <p>{submissionError}</p>}
      <button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Continuar'}
      </button>
    </div>
  );
};
```

#### DESPUÉS: AgreementScaleView.tsx (useStandardizedForm)
```typescript
const AgreementScaleView: React.FC<AgreementScaleViewProps> = ({
  questionText, onStepComplete, ...standardProps
}) => {
  const scaleOptions = [1, 2, 3, 4, 5, 6, 7];
  
  const [state, actions] = useStandardizedForm<number | null>(standardProps, {
    initialValue: null,
    extractValueFromResponse: valueExtractors.numericScale,
    validationRules: [
      validationRules.required('Por favor, selecciona una opción')
    ]
  });

  const { value, isSaving, isLoading, error } = state;
  const { setValue, validateAndSave } = actions;

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

  const buttonText = getStandardButtonText({ isSaving, isLoading });
  const errorDisplay = getErrorDisplayProps(error);

  if (isLoading && !state.isDataLoaded) {
    return <LoadingScreen />;
  }

  return (
    <div className={getFormContainerClass('centered')}>
      <h2 className={formSpacing.title}>{questionText}</h2>
      
      <div className={`${formSpacing.scaleGap} ${formSpacing.section}`}>
        {scaleOptions.map(option => (
          <button
            key={option}
            onClick={() => setValue(option)}
            className={`scale-button ${value === option ? 'selected' : ''}`}
            disabled={isSaving || isLoading}
          >
            {option}
          </button>
        ))}
      </div>

      {errorDisplay.hasError && (
        <div className={errorDisplay.errorClassName}>
          {errorDisplay.errorMessage}
        </div>
      )}

      <button
        className="primary-button"
        onClick={handleSubmit}
        disabled={!value || isSaving || isLoading}
      >
        {buttonText}
      </button>
    </div>
  );
};
```

---

### 3. useStepResponseManager + Duplicación → useStandardizedForm

#### ANTES: DemographicsForm.tsx (Duplicación de Estado)
```typescript
export const DemographicsForm: React.FC<DemographicsFormProps> = ({
  config, initialValues = {}, onSubmit, stepId = 'demographic',
}) => {
  // DUPLICACIÓN: Estado local + hook manager
  const [formFieldResponses, setFormFieldResponses] = useState<DemographicResponses>(initialValues);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmittingToServer, setIsSubmittingToServer] = useState(false);

  const {
    responseData,
    isLoading,
    isSaving,
    error: stepResponseError,
    saveCurrentStepResponse,
    responseSpecificId
  } = useStepResponseManager<DemographicResponses>({
    stepId, stepType: 'demographic', stepName: config?.title, initialData: initialValues,
  });

  // SINCRONIZACIÓN MANUAL
  useEffect(() => {
    if (responseData) {
      setFormFieldResponses(responseData);
    }
  }, [responseData]);

  // VALIDACIÓN MANUAL
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    Object.entries(config.questions).forEach(([key, questionConfig]) => {
      if (questionConfig.enabled && questionConfig.required && !formFieldResponses[key]) {
        errors[key] = `El campo ${questionConfig.title || key} es obligatorio.`;
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // GUARDADO MANUAL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmittingToServer(true);
    const { success } = await saveCurrentStepResponse(formFieldResponses);
    
    if (success) {
      onSubmit(formFieldResponses); 
    }
    setIsSubmittingToServer(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {enabledQuestions.map(({ key, config: questionConfig }) => (
        <div key={key}>
          <DemographicQuestion 
            config={questionConfig} 
            value={formFieldResponses[key]} 
            onChange={(id, value) => {
              setFormFieldResponses(prev => ({ ...prev, [id]: value }));
              if (formErrors[id]) {
                setFormErrors(prev => { const updated = { ...prev }; delete updated[id]; return updated; });
              }
            }} 
          />
          {formErrors[key] && <p className="error">{formErrors[key]}</p>}
        </div>
      ))}
      
      <button type="submit" disabled={isSaving || isLoading || isSubmittingToServer}>
        {getStandardButtonText({ isSaving, isLoading, hasExistingData: !!responseSpecificId })}
      </button>
    </form>
  );
};
```

#### DESPUÉS: DemographicsForm.tsx (useStandardizedForm Unificado)
```typescript
export const DemographicsForm: React.FC<DemographicsFormProps> = ({
  config, onSubmit, ...standardProps
}) => {
  const enabledQuestions = useMemo(() => 
    Object.entries(config.questions)
      .filter(([, questionConfig]) => questionConfig.enabled)
      .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
  , [config.questions]);

  const [state, actions] = useStandardizedForm<DemographicResponses>(standardProps, {
    initialValue: {},
    extractValueFromResponse: valueExtractors.demographicData,
    validationRules: [
      validationRules.demographicRequired(
        enabledQuestions
          .filter(([, cfg]) => cfg.required)
          .map(([key]) => key),
        'Todos los campos requeridos deben completarse'
      )
    ]
  });

  const { value, isSaving, isLoading, error } = state;
  const { setValue, validateAndSave } = actions;

  const handleFieldChange = (id: string, fieldValue: string | number | boolean | undefined) => {
    setValue({ ...value, [id]: fieldValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await validateAndSave();
    if (result.success) {
      onSubmit(result.data as DemographicResponses);
    }
  };

  const buttonText = getStandardButtonText({ isSaving, isLoading, hasExistingData: !!state.hasExistingData });
  const errorDisplay = getErrorDisplayProps(error);

  if (isLoading && !state.isDataLoaded) {
    return <LoadingScreen message="Cargando respuestas previas..." />;
  }

  return (
    <div className={getFormContainerClass('standard')}>
      <h2 className={formSpacing.title}>{config?.title || 'Preguntas Demográficas'}</h2>
      
      {config?.description && (
        <p className={formSpacing.description}>{config.description}</p>
      )}

      {errorDisplay.hasError && (
        <div className={errorDisplay.errorClassName}>
          {errorDisplay.errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className={formSpacing.form}>
        {enabledQuestions.map(([key, questionConfig]) => (
          <DemographicQuestion
            key={key}
            config={{
              ...questionConfig,
              id: questionConfig.id || key,
              options: getOptionsForQuestion(key, questionConfig.options)
            }}
            value={value[key]}
            onChange={handleFieldChange}
            disabled={isSaving || isLoading}
          />
        ))}
        
        <button 
          type="submit" 
          disabled={isSaving || isLoading}
          className={`primary-button ${formSpacing.button}`}
        >
          {buttonText}
        </button>
      </form>
    </div>
  );
};
```

---

## 🔧 Nuevas Extensiones Necesarias

### Value Extractors Adicionales
```typescript
// public-tests/src/hooks/valueExtractors.ts
export const valueExtractors = {
  // ... existentes

  demographicData: (response: unknown): DemographicResponses => {
    if (typeof response === 'object' && response !== null) {
      return response as DemographicResponses;
    }
    return {};
  },

  participantAuth: (response: unknown): {email: string, name?: string} => {
    if (typeof response === 'object' && response !== null && 'email' in response) {
      return {
        email: String((response as {email: unknown}).email),
        name: 'name' in response ? String((response as {name: unknown}).name) : undefined
      };
    }
    return { email: '' };
  },

  multipleChoice: (response: unknown): string[] => {
    if (Array.isArray(response)) {
      return response.map(String);
    }
    if (typeof response === 'object' && response !== null && 'selections' in response) {
      return Array.isArray((response as {selections: unknown}).selections) 
        ? (response as {selections: unknown[]}).selections.map(String)
        : [];
    }
    return [];
  },

  ranking: (response: unknown): Array<{id: string, order: number}> => {
    if (Array.isArray(response)) {
      return response.map((item, index) => ({
        id: typeof item === 'string' ? item : String(item),
        order: index
      }));
    }
    return [];
  }
};
```

### Validation Rules Adicionales
```typescript
// public-tests/src/hooks/validationRules.ts
export const validationRules = {
  // ... existentes

  emailFormat: (message = 'Formato de email inválido'): ValidationRule<string> => ({
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),

  demographicRequired: (
    requiredFields: string[], 
    message = 'Todos los campos requeridos deben completarse'
  ): ValidationRule<DemographicResponses> => ({
    validate: (value: DemographicResponses) => {
      return requiredFields.every(field => 
        value[field] !== undefined && 
        value[field] !== null && 
        String(value[field]).trim() !== ''
      );
    },
    message
  }),

  minSelections: <T>(min: number, message?: string): ValidationRule<T[]> => ({
    validate: (value: T[]) => value.length >= min,
    message: message || `Debe seleccionar al menos ${min} opciones`
  }),

  rankingComplete: (
    expectedItems: number, 
    message?: string
  ): ValidationRule<Array<{id: string, order: number}>> => ({
    validate: (value) => value.length === expectedItems,
    message: message || `Debe ordenar todos los ${expectedItems} elementos`
  })
};
```

---

## 📋 Checklist de Migración

### Para cada componente migrado:

#### ✅ Pre-migración
- [ ] Identificar patrón actual (estado local, useResponseAPI, useStepResponseManager, etc.)
- [ ] Documentar funcionalidad específica y casos edge
- [ ] Crear tests de regresión para funcionalidad actual
- [ ] Verificar dependencias y componentes que lo usan

#### ✅ Durante migración
- [ ] Implementar con `useStandardizedForm`
- [ ] Crear/usar `valueExtractors` y `validationRules` apropiados
- [ ] Mantener API pública idéntica
- [ ] Preservar funcionalidad específica (auto-save, validación, etc.)
- [ ] Aplicar estilos consistentes con `formSpacing` y utilidades

#### ✅ Post-migración
- [ ] Ejecutar tests de regresión
- [ ] Verificar performance (render time, API calls)
- [ ] Validar accesibilidad
- [ ] Documentar cambios en CHANGELOG
- [ ] Código review con enfoque en consistencia

#### ✅ Cleanup
- [ ] Remover código legacy no utilizado
- [ ] Actualizar imports y dependencias
- [ ] Optimizar re-renders si es necesario
- [ ] Actualizar documentación de componente

---

**Este plan proporciona una hoja de ruta clara y ejemplos concretos para migrar todos los formularios a un patrón consistente y mantenible.** 