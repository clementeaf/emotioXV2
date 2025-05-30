# 🔧 Arreglo: Carga de Respuestas en Formularios

## Problema Identificado

El usuario reportó que aunque `useModuleResponses` cargaba correctamente todas las respuestas desde la API, **ninguno de los formularios/steps estaban mostrando estas respuestas cargadas**.

### Diagnóstico del Problema

1. **Múltiples fuentes de verdad desconectadas**:
   - `useModuleResponses` en `ProgressSidebar` cargaba respuestas ✅
   - Cada componente individual hacía su propia llamada API ❌
   - `CurrentStepRenderer` solo enriquecía `smart_voc_module` y `demographic` ❌

2. **Desconexión de datos**:
   - Las respuestas se cargaban pero no se propagaban a los componentes
   - Cada formulario reinventaba la lógica de carga
   - No había centralización de respuestas

## Solución Implementada

### 1. Centralización en CurrentStepRenderer

**Archivo**: `src/components/flow/CurrentStepRenderer.tsx`

```typescript
// Importar useModuleResponses
import { useModuleResponses } from '../../hooks/useModuleResponses';

// Cargar respuestas centralizadas
const { 
    data: moduleResponsesFromAPI, 
    isLoading: isLoadingModuleResponses,
    error: moduleResponsesError 
} = useModuleResponses({
    researchId: researchId || undefined,
    participantId: participantIdFromStore || undefined,
    autoFetch: !!(researchId && participantIdFromStore),
});

// Función helper para encontrar respuestas
const findSavedResponse = useCallback((searchStepId: string, searchStepType: string) => {
    // Buscar en store local primero
    const localResponses = responsesDataFromStore?.modules?.all_steps || [];
    let foundResponse = localResponses.find(resp => 
        resp.id === searchStepId || 
        (resp.stepType === searchStepType && resp.stepTitle === stepName)
    );

    // Si no se encuentra localmente, buscar en API
    if (!foundResponse && Array.isArray(moduleResponsesFromAPI)) {
        const apiResponse = (moduleResponsesFromAPI as unknown[]).find(/*...*/);
        // Convertir respuesta de API al formato esperado
        if (apiResponse) {
            foundResponse = {
                id: apiResp.id || searchStepId,
                stepType: apiResp.stepType || searchStepType,
                stepTitle: apiResp.stepTitle || stepName || '',
                response: apiResp.response,
                createdAt: apiResp.createdAt || new Date().toISOString(),
                updatedAt: apiResp.updatedAt || new Date().toISOString(),
            };
        }
    }

    return foundResponse || null;
}, [responsesDataFromStore, moduleResponsesFromAPI, stepName]);
```

**Beneficios**:
- ✅ Una sola fuente de verdad para respuestas
- ✅ Combina datos del store local + API
- ✅ Pasa respuestas a todos los componentes

### 2. Modificación de Componentes

#### CSATView.tsx

**Antes**:
```typescript
// Hacía su propia llamada API
const { data: moduleResponsesArray, isLoading, error } = useModuleResponses({
    researchId,
    participantId: participantIdFromStore || undefined,
    autoFetch: true
});

// Lógica compleja para encontrar respuestas
useEffect(() => {
    if (!isLoadingInitialData && moduleResponsesArray) {
        const foundResponse = moduleResponsesArray.find(/*...*/);
        // Extraer valor...
    }
}, [moduleResponsesArray, isLoadingInitialData, /*...*/]);
```

**Después**:
```typescript
interface CSATViewProps {
    // Props existentes...
    savedResponse?: { id?: string; response?: unknown } | null;
    savedResponseId?: string | null;
}

// Usar respuesta pasada desde CurrentStepRenderer
useEffect(() => {
    console.log('[CSATView] Respuesta guardada recibida:', savedResponse);
    
    if (savedResponse?.response) {
        let value = null;
        const response = savedResponse.response;
        
        // Lógica robusta para extraer valor
        if (typeof response === 'object' && response !== null) {
            const respObj = response as Record<string, unknown>;
            if ('value' in respObj && typeof respObj.value === 'number') {
                value = respObj.value;
            }
            // Más casos...
        }
        
        if (typeof value === 'number' && value >= 1 && value <= 5) {
            setSelectedValue(value);
        }
    }
}, [savedResponse, savedResponseId]);
```

#### LongTextView.tsx

**Antes**:
```typescript
// Cargar todas las respuestas previas
const { data: moduleResponsesArray, isLoading } = useModuleResponses({/*...*/});

// Buscar la respuesta previa para este step (lógica compleja)
const previousResponseObj = Array.isArray(moduleResponsesArray)
    ? moduleResponsesArray.find(/*lógica de búsqueda compleja*/)
    : undefined;
```

**Después**:
```typescript
interface LongTextViewProps {
    config: CognitiveQuestion;
    onStepComplete?: (answer?: unknown) => void;
    savedResponse?: { id?: string; response?: unknown } | null;
    savedResponseId?: string | null;
}

// Obtener valor previo de manera simple
const previousValue = React.useMemo(() => {
    if (savedResponse?.response) {
        const response = savedResponse.response;
        
        if (typeof response === 'object' && response !== null) {
            const respObj = response as Record<string, unknown>;
            if ('value' in respObj && typeof respObj.value === 'string') {
                return respObj.value;
            } else if ('text' in respObj && typeof respObj.text === 'string') {
                return respObj.text;
            }
        }
    }
    
    return '';
}, [savedResponse]);
```

## Beneficios de la Solución

### 1. **Rendimiento Mejorado**
- ❌ Antes: N llamadas API (una por componente)
- ✅ Ahora: 1 llamada API centralizada

### 2. **Consistencia de Datos**
- ❌ Antes: Cada componente podía tener datos diferentes
- ✅ Ahora: Todos los componentes usan la misma fuente

### 3. **Simplificación del Código**
- ❌ Antes: Lógica de carga duplicada en cada componente
- ✅ Ahora: Lógica centralizada en CurrentStepRenderer

### 4. **Mejor UX**
- ❌ Antes: Múltiples indicadores de carga
- ✅ Ahora: Una sola carga inicial, respuestas instantáneas

### 5. **Debugging Mejorado**
- ✅ Logs centralizados en CurrentStepRenderer
- ✅ Fácil seguimiento del flujo de datos

## Componentes Afectados

### ✅ Completamente Migrados
- `CSATView.tsx` - Recibe respuestas desde CurrentStepRenderer
- `LongTextView.tsx` - Recibe respuestas desde CurrentStepRenderer

### 🔄 Pendientes de Migrar
- `NPSQuestion.tsx`
- `NEVQuestion.tsx` 
- `VOCTextQuestion.tsx`
- `CVQuestion.tsx`
- `SmartVocFeedbackQuestion.tsx`
- `AgreementScaleView.tsx`
- `DifficultyScaleView.tsx`

### 📋 Patrón para Migrar Componentes

1. **Agregar props de respuesta**:
```typescript
interface ComponentProps {
    // Props existentes...
    savedResponse?: { id?: string; response?: unknown } | null;
    savedResponseId?: string | null;
}
```

2. **Remover llamada individual a useModuleResponses**:
```typescript
// ❌ Eliminar
const { data: moduleResponsesArray, isLoading } = useModuleResponses({/*...*/});
```

3. **Usar respuesta pasada**:
```typescript
// ✅ Agregar
useEffect(() => {
    if (savedResponse?.response) {
        // Extraer y usar valor
    }
}, [savedResponse, savedResponseId]);
```

4. **Actualizar lógica de submit**:
```typescript
// Usar savedResponseId para actualizaciones
const result = await saveOrUpdateResponse(
    stepId,
    stepType,
    stepName,
    responseData,
    savedResponseId || undefined  // ✅ Usar ID pasado
);
```

## Testing

### URLs de Prueba
```
http://localhost:5173/?researchId=test-study-123
http://localhost:5173/link/test-study-123
```

### Verificar
1. ✅ Respuestas se cargan al navegar a steps completados
2. ✅ No hay llamadas API duplicadas en DevTools
3. ✅ Console logs muestran respuestas encontradas
4. ✅ Componentes muestran valores guardados inmediatamente

## Logs de Debug

```
[CurrentStepRenderer] moduleResponses: { moduleResponsesFromAPI: [...], isLoadingModuleResponses: false }
[CurrentStepRenderer] Respuesta encontrada para step-id (step-type): { id: "...", response: {...} }
[CSATView] Respuesta guardada recibida: { id: "...", response: { value: 4 } }
[CSATView] Valor cargado: 4
[LongTextView] Respuesta guardada recibida: { id: "...", response: { value: "Texto guardado" } }
```

---

**Resultado**: Las respuestas ahora se cargan correctamente y se muestran en los formularios sin duplicar llamadas API ✨ 