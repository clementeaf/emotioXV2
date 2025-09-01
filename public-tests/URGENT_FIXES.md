# 🚨 Recomendaciones Urgentes - Public Tests

## Estado Actual
- ❌ **Build falla** por errores de tipos en Zustand store
- ❌ **103 errores ESLint** + 13 warnings
- ❌ **43 usos de `any`** sin tipado estricto
- ❌ **29 variables no usadas** (código muerto)

## 🔥 Prioridad 1: Errores Críticos de Compilación

### 1. Arreglar Zustand Store (`src/stores/useTestStore.ts`)
**Errores en líneas 218, 228, 241:**

```typescript
// ❌ Problema actual
partialize: (state) => ({
  researchId: state.researchId,
  // ... falta resto de propiedades
}),

// ✅ Solución
partialize: (state): Partial<TestState> => ({
  researchId: state.researchId,
  participantId: state.participantId,
  participantName: state.participantName,
  participantEmail: state.participantEmail,
  responses: state.responses,
  sessionStartTime: state.sessionStartTime,
}),
```

**Storage types:**
```typescript
// ❌ Problema actual
getItem: (key: string) => string | null
setItem: (key: string, value: string) => void

// ✅ Solución
getItem: (key: string) => StorageValue<TestState> | null
setItem: (key: string, value: StorageValue<TestState>) => void
```

## 🧹 Prioridad 2: Limpieza de Código

### 2. Eliminar Variables No Usadas
**Archivos afectados:**
- `ButtonSteps.tsx` - 5 variables no usadas
- `ComponentRenderers.tsx` - 3 variables no usadas
- `main.tsx` - `checkForUpdates`
- Multiple hooks con variables sin usar

### 3. Reemplazar Todos los `any` Types
**Ubicaciones principales:**
- `ComponentRenderers.tsx` - 8 usos de `any`
- `useOptimizedMonitoringWebSocket.ts` - 4 usos de `any`
- `useStepStore.ts` - 3 usos de `any`
- Utils files - 8 usos de `any`

**Ejemplo de fix:**
```typescript
// ❌ Antes
const handleData = (data: any) => { ... }

// ✅ Después
interface ExpectedData {
  id: string;
  value: number;
  // ... propiedades específicas
}
const handleData = (data: ExpectedData) => { ... }
```

## ⚙️ Prioridad 3: Configuración

### 4. Agregar Script TypeCheck
**En `package.json`:**
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build": "npm run typecheck && tsc -b && vite build"
  }
}
```

### 5. Configurar Pre-commit Hooks
```json
{
  "scripts": {
    "pre-commit": "npm run lint && npm run typecheck"
  }
}
```

## 🎯 Plan de Acción

1. **[URGENTE]** Arreglar store de Zustand para desbloquear build
2. **[ALTO]** Eliminar todos los `any` types (43 ocurrencias)
3. **[MEDIO]** Limpiar variables no usadas (29 ocurrencias)
4. **[BAJO]** Arreglar dependencias faltantes en hooks React
5. **[CONFIG]** Agregar scripts de typecheck y pre-commit

## 📊 Métricas
- **Errores TypeScript:** 3 críticos
- **Errores ESLint:** 103 
- **Warnings ESLint:** 13
- **Archivos afectados:** ~15 archivos principales

## ✅ Resultado Esperado
Después de estos fixes:
- ✅ Build exitoso
- ✅ 0 errores TypeScript
- ✅ 0 errores ESLint
- ✅ Tipado estricto completo
- ✅ Código limpio y mantenible