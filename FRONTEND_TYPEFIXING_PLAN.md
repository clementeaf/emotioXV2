# 🔧 FRONTEND TYPESCRIPT FIXING PLAN

## Estado Actual
- 2 días trabajando en tipado frontend
- Correcciones repetitivas que rompen otros archivos
- Necesidad de plan sistemático definitivo

## 🎯 OBJETIVO
Arreglar TODOS los errores de TypeScript de una vez, sin romper nada más.

## 📋 METODOLOGÍA

### Fase 1: MAPEO COMPLETO DE ERRORES
```bash
cd frontend && npx tsc --noEmit > typescript_errors.log 2>&1
```

### Fase 2: CLASIFICACIÓN DE ERRORES
1. **Imports faltantes** (TS2307)
2. **Propiedades faltantes** (TS2339)
3. **Tipos implícitos any** (TS7006)
4. **Incompatibilidad de tipos** (TS2322)
5. **Módulos no encontrados** (TS2305)

### Fase 3: ORDEN DE CORRECCIÓN
1. **PRIMERO**: Crear/corregir tipos base en `/types/`
2. **SEGUNDO**: Crear/corregir servicios en `/services/`
3. **TERCERO**: Crear/corregir utilidades en `/utils/`
4. **CUARTO**: Corregir hooks en `/hooks/`
5. **ÚLTIMO**: Corregir componentes en `/components/`

### Fase 4: VERIFICACIÓN CONTINUA
Después de cada corrección:
```bash
npx tsc --noEmit --incremental
```

## 🗂️ ARCHIVOS CRÍTICOS IDENTIFICADOS

### A. Tipos Base (`/types/`)
- [x] `research.ts` - PARCIALMENTE CORREGIDO
- [x] `clients.ts` - PARCIALMENTE CORREGIDO  
- [x] `eye-tracking.ts` - NECESITA REVISIÓN PROFUNDA
- [ ] Verificar todas las exportaciones

### B. Servicios (`/services/`)
- [x] `clients.methods.ts` - CREADO
- [x] `research.methods.ts` - CREADO
- [x] `eye-tracking.methods.ts` - CREADO
- [ ] Verificar métodos usados en hooks

### C. Utilidades (`/utils/`)
- [x] `client.processors.ts` - CREADO
- [x] `data.processors.ts` - EXISTENTE, NECESITA VERIFICACIÓN

### D. Hooks (`/hooks/`)
- [ ] `useAuth.ts` - REVISAR IMPORTS
- [ ] `useClients.ts` - REVISAR MÉTODOS
- [ ] `useEyeTrackingData.ts` - REVISAR TIPOS
- [ ] `useResearchData.ts` - REVISAR MÉTODOS
- [ ] `useResearchList.ts` - REVISAR MÉTODOS
- [ ] `useWelcomeScreenData.ts` - REVISAR IMPORTS

### E. Componentes (`/components/`)
- [x] `clients/ClientSelector.tsx` - CORREGIDO
- [ ] `dashboard/ResearchTable.tsx` - REVISAR PROPS
- [ ] `dashboard/ResearchTypes.tsx` - REVISAR PROPS
- [ ] `layout/Sidebar.tsx` - REVISAR PROPS
- [ ] `research/CognitiveTaskResults/` - REVISAR NAVEGACIÓN

## ⚠️ REGLAS ESTRICTAS

### 🚫 NO HACER:
1. **NO** tocar archivos que ya funcionan
2. **NO** crear tipos duplicados
3. **NO** cambiar interfaces sin verificar dependencias
4. **NO** usar `any` como solución
5. **NO** eliminar archivos sin verificar referencias

### ✅ SÍ HACER:
1. **SÍ** verificar cada cambio con `npx tsc --noEmit`
2. **SÍ** seguir el orden establecido
3. **SÍ** documentar cada corrección
4. **SÍ** usar tipos estrictos
5. **SÍ** mantener compatibilidad con archivos existentes

## 🔄 PROCESO DE CORRECCIÓN

### Paso 1: Ejecutar diagnóstico completo
```bash
cd frontend
npx tsc --noEmit > ../TYPESCRIPT_ERRORS_COMPLETE.log 2>&1
cat ../TYPESCRIPT_ERRORS_COMPLETE.log | head -50
```

### Paso 2: Identificar errores únicos
```bash
grep -o "error TS[0-9]*:" ../TYPESCRIPT_ERRORS_COMPLETE.log | sort | uniq -c
```

### Paso 3: Corregir por categoría
- Empezar con errores TS2307 (módulos no encontrados)
- Continuar con TS2339 (propiedades faltantes)
- Terminar con TS7006 (tipos implícitos)

### Paso 4: Validación incremental
Después de cada 5 correcciones:
```bash
npx tsc --noEmit --incremental
```

## 📊 TRACKING DE PROGRESO

### Estado Inicial: ❌ MUCHOS ERRORES
### Estado Objetivo: ✅ 0 ERRORES TYPESCRIPT

### Categorías de Error:
- [ ] TS2307: Cannot find module
- [ ] TS2339: Property does not exist  
- [ ] TS7006: Parameter implicitly has 'any' type
- [ ] TS2322: Type is not assignable
- [ ] TS2305: Module has no exported member

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **Ejecutar diagnóstico completo**
2. **Clasificar errores por tipo**
3. **Corregir tipos base primero**
4. **Verificar cada paso**
5. **Documentar soluciones**

---
**IMPORTANTE**: Este plan debe seguirse SIN DESVIACIONES para evitar más ciclos de corrección-ruptura.