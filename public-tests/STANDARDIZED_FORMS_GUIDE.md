# 📋 Guía de Formularios Estandarizados

Esta guía documenta el nuevo sistema estandarizado para formularios en public-tests, que reemplaza los patrones inconsistentes anteriores con una solución unificada y robusta.

## 🎯 **Objetivos Alcanzados**

✅ **Patrones consistentes** para cargar respuestas guardadas  
✅ **Validaciones estandarizadas** reutilizables  
✅ **Eliminación de lógica duplicada** en componentes  
✅ **Manejo unificado de errores** y estados de carga  
✅ **API simplificada** para desarrolladores  

---

## 🏗️ **Arquitectura del Sistema**

### **1. Hook Principal: `useStandardizedForm`**

Centraliza toda la lógica común de formularios:

```typescript
const [state, actions] = useStandardizedForm<T>(props, options);
```

**Props requeridas:**
```typescript
interface StandardizedFormProps {
  stepId: string;
  stepType: string;
  stepName?: string;
  researchId?: string;
  participantId?: string;
  savedResponse?: { id?: string; response?: unknown } | null;
  savedResponseId?: string | null;
  required?: boolean;
  isMock?: boolean;
}
```

**Opciones de configuración:**
```typescript
interface UseStandardizedFormOptions<T> {
  initialValue: T;
  extractValueFromResponse: (response: unknown) => T;
  validationRules?: ValidationRule<T>[];
  enableAutoSave?: boolean;
  moduleId?: string;
}
```

### **2. Utilidades de Formulario: `formHelpers.ts`**

Funciones estandarizadas para comportamientos comunes:

```typescript
// Texto de botones dinámico
const buttonText = getStandardButtonText({ 
  isSaving, 
  isLoading, 
  hasExistingData 
});

// Estado de botón deshabilitado
const isDisabled = getButtonDisabledState({
  isRequired: true,
  value,
  isSaving,
  isLoading,
  hasError: !!error
});

// Estilos de botones de escala
const buttonClass = getScaleButtonClass({
  isSelected: value === option,
  isDisabled: isSaving
});
```

---

## 🔄 **Extractores de Valores Predefinidos**

Para manejar diferentes estructuras de respuestas API:

```typescript
import { valueExtractors } from '../hooks/useStandardizedForm';

// Para escalas numéricas (CSAT, NPS, Linear Scale)
extractValueFromResponse: valueExtractors.numericScale

// Para respuestas de texto
extractValueFromResponse: valueExtractors.textValue

// Para opciones únicas
extractValueFromResponse: valueExtractors.singleChoice

// Para opciones múltiples
extractValueFromResponse: valueExtractors.multipleChoice

// Para rankings
extractValueFromResponse: valueExtractors.ranking
```

---

## ✅ **Reglas de Validación Reutilizables**

```typescript
import { validationRules } from '../hooks/useStandardizedForm';

// Campo requerido
validationRules.required('Mensaje personalizado')

// Longitud de texto
validationRules.minLength(10)
validationRules.maxLength(500)

// Selecciones múltiples
validationRules.minSelections(2, 'Selecciona al menos 2 opciones')
validationRules.maxSelections(5)

// Rangos numéricos
validationRules.range(1, 10, 'Valor debe estar entre 1 y 10')
```

---

## 📝 **Ejemplos de Implementación**

### **Formulario de Escala Numérica (CSAT/NPS)**

```typescript
const CSATView: React.FC<CSATViewProps> = ({
  questionText,
  instructions,
  companyName,
  onStepComplete,
  ...standardProps
}) => {
  const [state, actions] = useStandardizedForm<number | null>(standardProps, {
    initialValue: null,
    extractValueFromResponse: valueExtractors.numericScale,
    moduleId: config?.moduleId
  });

  const { value, isSaving, isLoading, error, hasExistingData } = state;
  const { setValue, validateAndSave } = actions;

  const handleSubmit = async () => {
    const result = await validateAndSave();
    if (result.success) {
      onStepComplete({ success: true, data: result.data, value });
    }
  };

  const buttonText = getStandardButtonText({ 
    isSaving, 
    isLoading, 
    hasExistingData 
  });

  // Render del formulario...
};
```

### **Formulario de Texto**

```typescript
const LongTextView: React.FC<LongTextViewProps> = ({ 
  config, 
  onStepComplete,
  savedResponse,
  savedResponseId 
}) => {
  const standardProps: StandardizedFormProps = {
    stepId: config.id,
    stepType: config.type,
    stepName: config.title,
    savedResponse,
    savedResponseId,
    required: config.required
  };

  const [state, actions] = useStandardizedForm<string>(standardProps, {
    initialValue: '',
    extractValueFromResponse: valueExtractors.textValue,
    validationRules: config.required ? [
      validationRules.required('Por favor, escribe una respuesta.')
    ] : []
  });

  // Lógica del componente...
};
```

### **Formulario de Opciones Múltiples**

```typescript
const MultipleChoiceQuestion: React.FC<Props> = ({
  config,
  onStepComplete,
  ...standardProps
}) => {
  const [state, actions] = useStandardizedForm<string[]>(formProps, {
    initialValue: [],
    extractValueFromResponse: valueExtractors.multipleChoice,
    validationRules: [
      validationRules.minSelections(1, 'Selecciona al menos una opción'),
      validationRules.maxSelections(maxSelections)
    ]
  });

  // Implementación específica...
};
```

---

## 🎨 **Estilos y Espaciado Estandarizados**

```typescript
import { formSpacing, getFormContainerClass } from '../utils/formHelpers';

// Contenedores de formulario
<div className={getFormContainerClass('centered')}> // o 'default', 'wide'

// Espaciado consistente
<h2 className={`text-xl font-medium ${formSpacing.field}`}>
<p className={`text-sm ${formSpacing.section}`}>
<button className={`bg-primary-600 ${formSpacing.button}`}>

// Espaciado disponible:
formSpacing = {
  section: 'mb-8',
  field: 'mb-4', 
  label: 'mb-2',
  error: 'mt-2',
  button: 'mt-6',
  scaleGap: 'gap-2',
  scaleLabels: 'mt-2 px-1'
}
```

---

## 🚨 **Manejo de Errores Estandarizado**

```typescript
const errorDisplay = getErrorDisplayProps(error);

// En el render:
{errorDisplay.hasError && (
  <div className={errorDisplay.errorClassName}>
    Error: {errorDisplay.errorMessage}
  </div>
)}
```

---

## 🔄 **Estados de Carga y Guardado**

El hook maneja automáticamente:

- ✅ **Carga inicial** de respuestas guardadas
- ✅ **Estados de guardado** (saving/loading)
- ✅ **Detección automática** de datos existentes vs nuevos
- ✅ **Texto de botones dinámico** según el estado
- ✅ **Validación en tiempo real**
- ✅ **Manejo de errores** unificado

```typescript
const { 
  value,           // Valor actual del formulario
  isLoading,       // Cargando datos iniciales
  isSaving,        // Guardando cambios
  isDataLoaded,    // Datos iniciales cargados
  error,           // Error actual (si existe)
  responseId,      // ID de respuesta existente
  hasExistingData  // Si hay datos previos
} = state;
```

---

## 📊 **Beneficios del Nuevo Sistema**

### **Para Desarrolladores:**
- 🎯 **API consistente** en todos los formularios
- 🔧 **Menos código boilerplate** repetitivo
- 🐛 **Debugging simplificado** con patrones unificados
- 📚 **Documentación centralizada** y ejemplos claros

### **Para la Aplicación:**
- ⚡ **Performance mejorada** con hooks optimizados
- 🔄 **Gestión de estado más robusta**
- 🛡️ **Validaciones consistentes** en toda la app
- 🎨 **UI/UX uniforme** en todos los formularios

### **Para el Mantenimiento:**
- 🧹 **Código más limpio** y fácil de mantener
- 🔍 **Menos duplicación** de lógica
- 🚀 **Desarrollo más rápido** de nuevos formularios
- 🛠️ **Refactoring seguro** con tipos TypeScript

---

## 🚀 **Migración de Formularios Existentes**

### **Pasos para migrar un formulario:**

1. **Identificar el tipo de valor:** `number`, `string`, `string[]`, etc.

2. **Seleccionar el extractor apropiado:**
   ```typescript
   // Para escalas: valueExtractors.numericScale
   // Para texto: valueExtractors.textValue
   // Para opciones: valueExtractors.singleChoice
   ```

3. **Reemplazar hooks anteriores:**
   ```typescript
   // Antes:
   const [value, setValue] = useState(null);
   const { saveResponse, isLoading } = useResponseAPI(...);
   
   // Después:
   const [state, actions] = useStandardizedForm(props, options);
   ```

4. **Usar helpers para UI:**
   ```typescript
   const buttonText = getStandardButtonText({ isSaving, isLoading, hasExistingData });
   const isDisabled = getButtonDisabledState({ isRequired, value, isSaving, isLoading });
   ```

5. **Aplicar estilos estandarizados:**
   ```typescript
   <div className={getFormContainerClass('centered')}>
   <button className={getScaleButtonClass({ isSelected, isDisabled })}>
   ```

---

## 📋 **Checklist de Migración**

- [ ] Reemplazar hooks personalizados con `useStandardizedForm`
- [ ] Usar `valueExtractors` apropiados
- [ ] Implementar validaciones con `validationRules`
- [ ] Aplicar helpers de UI (`getStandardButtonText`, etc.)
- [ ] Usar clases de espaciado estandarizadas (`formSpacing`)
- [ ] Testear carga de respuestas guardadas
- [ ] Verificar manejo de errores
- [ ] Confirmar estados de loading/saving

---

## 🎯 **Próximos Pasos**

1. **Migrar formularios restantes** al nuevo patrón
2. **Agregar tests unitarios** para hooks estandarizados
3. **Documentar casos edge** y patrones avanzados
4. **Optimizar performance** con `useMemo` y `useCallback`
5. **Extender validaciones** para casos específicos

Este sistema estandarizado garantiza **consistencia**, **mantenibilidad** y **extensibilidad** en todos los formularios de la aplicación. 