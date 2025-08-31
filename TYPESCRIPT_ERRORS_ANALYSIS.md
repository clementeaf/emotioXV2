# 🎯 ANÁLISIS COMPLETO DE ERRORES TYPESCRIPT

## 📊 RESUMEN DE ERRORES
```
31 error TS2339: Property does not exist
 9 error TS2304: Cannot find name  
 8 error TS2353: Object literal may only specify known properties
 5 error TS2552: Cannot find name (typos)
 3 error TS2739: Type is missing properties
 3 error TS2614: Module is not a namespace
 3 error TS2305: Module has no exported member
 1 error TS2554: Expected arguments
 1 error TS2322: Type is not assignable
```

## 🔥 ERRORES CRÍTICOS IDENTIFICADOS

### A. TS2339 (31 errores) - PROPIEDADES FALTANTES
**PROBLEMA**: Interfaces incompletas en tipos base

**ARCHIVOS AFECTADOS**:
- `components/dashboard/ResearchTypes.tsx` → `technique` falta en `Research`
- `components/layout/Sidebar.tsx` → `title`, `technique` faltan en `Research`  
- `hooks/useEyeTrackingData.ts` → múltiples propiedades faltantes
- `hooks/useClients.ts` → métodos faltantes en servicios

**SOLUCIÓN**: Corregir interfaces base primero

### B. TS2304 (9 errores) - NOMBRES NO ENCONTRADOS  
**PROBLEMA**: Tipos no definidos o mal importados

**PATRONES**:
- `Research`, `ResearchStatus`, `ResearchType`
- `CreateResearchRequest`  
- `DemographicQuestions`, `LinkConfig`, etc.

**SOLUCIÓN**: Crear/exportar tipos faltantes

### C. TS2353 (8 errores) - PROPIEDADES DESCONOCIDAS
**PROBLEMA**: Objetos con propiedades no definidas en interfaces

**PATRONES**:
- `type` no existe en `UseEyeTrackingDataOptions`
- `data` no existe en `UseEyeTrackingDataReturn`
- `build`, `recruit` no existen en `EyeTrackingData`

**SOLUCIÓN**: Extender interfaces o corregir uso

## 🎯 PLAN DE CORRECCIÓN SISTEMÁTICA

### FASE 1: CORREGIR TIPOS BASE (Prioridad 1)
```typescript
// 1. Extender Research interface
export interface Research extends ResearchRecord {
  title?: string;
  technique?: string;
}

// 2. Corregir UseEyeTrackingDataOptions
export interface UseEyeTrackingDataOptions {
  enabled?: boolean;
  type?: string;
}

// 3. Corregir UseEyeTrackingDataReturn  
export interface UseEyeTrackingDataReturn {
  data?: EyeTrackingData;
  // ... otros campos
}

// 4. Extender EyeTrackingData
export interface EyeTrackingData {
  id: string;
  researchId: string;
  createdAt: string;
  updatedAt: string;
  build?: any;
  recruit?: any;
}
```

### FASE 2: CORREGIR SERVICIOS (Prioridad 2)
```typescript
// 1. Agregar método faltante a researchForClientsMethods
export const researchForClientsMethods = {
  // ... métodos existentes
  getAllResearch: () => alova.Get('/research')
}

// 2. Agregar métodos faltantes a eyeTrackingBuildMethods
export const eyeTrackingBuildMethods = {
  // ... métodos existentes  
  getByResearchId: (researchId: string) => alova.Get(`/eye-tracking/build/${researchId}`)
}

// 3. Agregar métodos faltantes a eyeTrackingResultsMethods
export const eyeTrackingResultsMethods = {
  // ... métodos existentes
  getResults: (researchId: string) => alova.Get(`/eye-tracking/results/${researchId}`),
  getParticipantResults: (researchId: string, participantId: string) => 
    alova.Get(`/eye-tracking/results/${researchId}/participant/${participantId}`)
}
```

### FASE 3: CORREGIR COMPONENTES (Prioridad 3)
```typescript
// 1. Usar Research extendida en componentes
import type { Research } from '@/types/research';

// 2. Corregir NavigationFlowData usage
// Cambiar array por objeto único donde sea necesario
```

## 🚀 EJECUCIÓN INMEDIATA

### Orden exacto de corrección:
1. **research.ts** → Extender Research interface
2. **eye-tracking.ts** → Corregir interfaces UseEyeTracking*
3. **clients.methods.ts** → Agregar getAllResearch
4. **eye-tracking.methods.ts** → Agregar métodos faltantes  
5. **Verificar** → `npx tsc --noEmit`
6. **Componentes** → Solo si quedan errores

### ⚠️ REGLA CRÍTICA
**DESPUÉS DE CADA CORRECCIÓN**: Ejecutar `npx tsc --noEmit` y verificar que no se agregaron nuevos errores.

---
**RESULTADO ESPERADO**: 0 errores TypeScript en máximo 6 correcciones puntuales.