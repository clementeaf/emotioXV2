# 🎯 ESTRATEGIA FINAL TYPESCRIPT - ENFOQUE MÍNIMO

## ❌ PROBLEMA IDENTIFICADO
- Los conflictos de exportación están creando más problemas
- Necesitamos un enfoque **MÍNIMO** y **SEGURO**
- Objetivo: Arreglar errores sin romper la estructura existente

## ✅ NUEVA ESTRATEGIA: CORRECCIÓN PUNTUAL

### 1. NO TOCAR TIPOS BASE
- Mantener estructura de exports existente
- Solo agregar propiedades donde falten

### 2. CORREGIR ERRORES PUNTUALES
```typescript
// Para Research - agregar propiedades sin cambiar interface
type ResearchWithExtensions = Research & {
  title?: string;
  technique?: string;
}
```

### 3. ORDEN DE CORRECCIÓN MÍNIMO
1. **useClients.ts** → Agregar método getAllResearch
2. **eye-tracking.methods.ts** → Agregar métodos faltantes  
3. **eye-tracking.ts** → Agregar interfaces faltantes
4. **Componentes** → Usar casting temporal donde sea necesario

## 🚀 EJECUCIÓN INMEDIATA

### A. Corregir useClients - getAllResearch
```typescript
// En clients.methods.ts
export const getAllResearch = () => alova.Get('/research');
```

### B. Corregir eye-tracking methods
```typescript
// Agregar métodos específicos que faltan
getByResearchId, getResults, getParticipantResults
```

### C. Usar casting temporal en componentes
```typescript
// En lugar de cambiar interfaces base
const research = data as Research & { title?: string; technique?: string };
```

## 🎯 META: Reducir de 81 → <20 errores en 3 correcciones

---
**EJECUTAR AHORA**: Solo correcciones puntuales, sin cambios estructurales