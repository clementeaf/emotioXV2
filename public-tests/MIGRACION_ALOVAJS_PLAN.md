# 🚀 PLAN DE MIGRACIÓN CUIDADOSA: TanStack Query → AlovaJS en Public-Tests

## 🎯 **OBJETIVO**

Migrar public-tests de TanStack React Query + fetch personalizado a AlovaJS + useQuery, manteniendo 100% la funcionalidad existente sin interrupciones.

---

## 📋 **PRINCIPIOS DE MIGRACIÓN SEGURA**

### ✅ **RESPONSABILIDAD Y MESURA**
- Migración incremental paso a paso
- Testear cada paso antes del siguiente
- Mantener sistema actual funcionando durante transición
- Rollback instantáneo si hay problemas

### ✅ **COHERENCIA CON FRONTEND**
- Usar misma configuración AlovaJS que frontend
- Mantener mismas convenciones de código
- Reutilizar patrones ya establecidos

### ✅ **CONECTIVIDAD GARANTIZADA**
- Verificar cada endpoint antes y después
- Mantener mismos tipos TypeScript
- Preservar toda la lógica de negocio existente

---

## 📊 **ANÁLISIS ACTUAL (SIN CAMBIOS)**

### **SISTEMA ACTUAL FUNCIONANDO:**
```typescript
// ✅ ACTUAL - FUNCIONANDO
TanStack Query + Custom Fetch
├── hooks/useApiQueries.ts (useQuery, useMutation)
├── lib/routes.ts (getAvailableForms, saveModuleResponse)  
├── lib/alova.ts (apiRequest wrapper)
└── config/endpoints.ts (URLs)
```

### **ENDPOINTS ACTUALES QUE FUNCIONAN:**
- `GET /research/{researchId}/forms` - ✅ Funcional
- `POST /module-responses` - ✅ Funcional  
- `PUT /module-responses/{id}` - ✅ Funcional
- `DELETE /module-responses` - ✅ Funcional
- `GET /module-responses` - ✅ Funcional

---

## 🗺️ **HOJA DE RUTA - 6 FASES SEGURAS**

### **FASE 1: PREPARACIÓN SIN CAMBIOS** ⏱️ 30min
**Objetivo**: Instalar y configurar AlovaJS sin tocar código existente

#### 1.1 Instalar dependencias
```bash
npm install alova alova/react
# NO desinstalar @tanstack/react-query aún
```

#### 1.2 Crear configuración AlovaJS paralela
```typescript
// lib/alova-config.ts (NUEVO - paralelo)
import { createAlova } from 'alova';
import ReactHook from 'alova/react';
import { API_HTTP_ENDPOINT } from '../config/endpoints';

export const alovaInstance = createAlova({
  baseURL: API_HTTP_ENDPOINT,
  statesHook: ReactHook,
  // Misma configuración que frontend
});
```

#### 1.3 Verificación
- [ ] AlovaJS instalado correctamente
- [ ] Configuración creada sin errores
- [ ] Sistema actual sigue funcionando 100%

---

### **FASE 2: API WRAPPER PARALELO** ⏱️ 45min  
**Objetivo**: Crear funciones AlovaJS paralelas sin tocar las existentes

#### 2.1 Crear funciones AlovaJS paralelas
```typescript
// lib/routes-alova.ts (NUEVO - paralelo)
import { alovaInstance } from './alova-config';

// ✅ PARALELO - no reemplaza lib/routes.ts
export const getAvailableFormsAlova = (researchId: string) => {
  return alovaInstance.Get(`/research/${researchId}/forms`);
};

export const saveModuleResponseAlova = (data: CreateModuleResponseDto) => {
  return alovaInstance.Post('/module-responses', data);
};
```

#### 2.2 Hooks AlovaJS paralelos
```typescript
// hooks/useApiQueries-alova.ts (NUEVO - paralelo)
import { useRequest } from 'alova/react';
import { getAvailableFormsAlova } from '../lib/routes-alova';

// ✅ PARALELO - no reemplaza useApiQueries.ts
export function useAvailableFormsQueryAlova(researchId: string) {
  return useRequest(getAvailableFormsAlova(researchId), {
    immediate: !!researchId
  });
}
```

#### 2.3 Verificación
- [ ] Funciones AlovaJS creadas correctamente
- [ ] Hooks paralelos funcionando
- [ ] Sistema TanStack sigue funcionando
- [ ] Ningún import cambiado en componentes

---

### **FASE 3: TESTING PARALELO** ⏱️ 30min
**Objetivo**: Probar sistema AlovaJS sin afectar producción

#### 3.1 Crear componente de prueba
```typescript
// components/TestAlova.tsx (TEMPORAL)
import { useAvailableFormsQueryAlova } from '../hooks/useApiQueries-alova';

export const TestAlova = ({ researchId }: { researchId: string }) => {
  const { data, loading, error } = useAvailableFormsQueryAlova(researchId);
  
  return (
    <div style={{ display: 'none' }}>
      {/* Solo para testing, invisible */}
      Test: {JSON.stringify(data)}
    </div>
  );
};
```

#### 3.2 Verificación de conectividad
- [ ] AlovaJS conecta correctamente con backend
- [ ] Misma respuesta que TanStack Query
- [ ] Sin errores de red o tipos
- [ ] Performance similar

---

### **FASE 4: MIGRACIÓN GRADUAL POR ARCHIVO** ⏱️ 60min
**Objetivo**: Migrar un archivo a la vez, con rollback inmediato

#### 4.1 Migrar primer hook (useAvailableFormsQuery)
```typescript
// hooks/useApiQueries.ts (MODIFICAR GRADUALMENTE)

// ❌ REMOVER GRADUALMENTE
// import { useQuery } from '@tanstack/react-query';
// import { getAvailableForms } from '../lib/routes';

// ✅ AGREGAR GRADUALMENTE  
import { useRequest } from 'alova/react';
import { getAvailableFormsAlova } from '../lib/routes-alova';

export function useAvailableFormsQuery(researchId: string, options?: any) {
  // ✅ NUEVA IMPLEMENTACIÓN
  return useRequest(getAvailableFormsAlova(researchId), {
    immediate: !!researchId,
    ...options
  });
}
```

#### 4.2 Verificación por hook
- [ ] Hook migrado funciona correctamente
- [ ] Componentes que lo usan siguen funcionando
- [ ] Sin errores en consola
- [ ] Misma funcionalidad que antes

#### 4.3 Rollback si hay problemas
```bash
git stash  # Rollback inmediato
# Investigar problema
# Corregir y reintentar
```

---

### **FASE 5: MIGRACIÓN COMPLETA** ⏱️ 90min
**Objetivo**: Completar migración de todos los hooks y funciones

#### 5.1 Migrar hooks restantes uno por uno
- [ ] `useModuleResponsesQuery`
- [ ] `useSaveModuleResponseMutation`  
- [ ] `useUpdateModuleResponseMutation`
- [ ] `useDeleteAllResponsesMutation`
- [ ] `useQuotaVerification`
- [ ] `useEyeTrackingConfigQuery`

#### 5.2 Verificación completa
```bash
# Test todos los flows críticos
npm run test:e2e
# Test manual de cada funcionalidad
```

#### 5.3 Cada migración incluye:
- [ ] Hook migrado funciona
- [ ] Componentes que lo usan funcionan
- [ ] Tests pasan
- [ ] Sin regresiones

---

### **FASE 6: LIMPIEZA Y OPTIMIZACIÓN** ⏱️ 30min
**Objetivo**: Remover código legacy y optimizar

#### 6.1 Remover archivos legacy
```bash
# Solo después de verificar que todo funciona
rm lib/alova.ts  # (era solo wrapper fetch)
rm lib/routes.ts  # Reemplazado por routes-alova.ts
rm hooks/useApiQueries-alova.ts  # Merged a useApiQueries.ts
```

#### 6.2 Desinstalar dependencias no usadas
```bash
npm uninstall @tanstack/react-query @tanstack/react-query-devtools
```

#### 6.3 Renombrar archivos finales
```bash
mv lib/routes-alova.ts lib/routes.ts
mv lib/alova-config.ts lib/alova.ts
```

---

## 🧪 **CRITERIOS DE ÉXITO POR FASE**

### **FASE 1** ✅
- [ ] AlovaJS instalado sin conflictos
- [ ] Configuración creada exitosamente
- [ ] `npm run dev` funciona sin errores
- [ ] Todas las funcionalidades existentes funcionan

### **FASE 2** ✅  
- [ ] Funciones AlovaJS paralelas creadas
- [ ] Hooks paralelos responden correctamente
- [ ] Tipos TypeScript coherentes
- [ ] Sin warnings ni errores

### **FASE 3** ✅
- [ ] Componente de prueba conecta con backend
- [ ] Respuesta idéntica a TanStack Query
- [ ] Performance aceptable (similar o mejor)
- [ ] Sin errores de red

### **FASE 4** ✅
- [ ] Primer hook migrado correctamente
- [ ] Componentes siguen funcionando
- [ ] Misma funcionalidad preservada
- [ ] Rollback probado y funcionando

### **FASE 5** ✅
- [ ] Todos los hooks migrados
- [ ] Todos los tests pasan
- [ ] Funcionalidad 100% preservada
- [ ] Sin regresiones detectadas

### **FASE 6** ✅
- [ ] Código legacy removido
- [ ] Dependencias optimizadas
- [ ] Estructura de archivos limpia
- [ ] Documentación actualizada

---

## 🚨 **PLAN DE ROLLBACK INMEDIATO**

### **En caso de problemas en cualquier fase:**

```bash
# 1. Rollback inmediato
git stash

# 2. Verificar que sistema original funciona
npm run dev

# 3. Testear endpoints críticos
curl /research/{id}/forms

# 4. Si todo funciona, investigar problema
git stash pop
# Debuggear y corregir

# 5. Si no funciona, rollback completo
git reset --hard HEAD~1
```

---

## 🎯 **BENEFICIOS ESPERADOS POST-MIGRACIÓN**

### **✅ COHERENCIA**
- Misma tecnología que frontend
- Patrones de código unificados
- Configuración centralizada

### **✅ PERFORMANCE**
- Mejor cache management
- Request deduplication
- Optimizaciones automáticas

### **✅ MANTENIBILIDAD**
- Menos dependencias
- Código más limpio
- Mejor developer experience

---

## ⏰ **CRONOGRAMA ESTIMADO**

| Fase | Tiempo | Total Acumulado |
|------|--------|-----------------|
| Fase 1 | 30min | 30min |
| Fase 2 | 45min | 1h 15min |
| Fase 3 | 30min | 1h 45min |  
| Fase 4 | 60min | 2h 45min |
| Fase 5 | 90min | 4h 15min |
| Fase 6 | 30min | 4h 45min |

**TIEMPO TOTAL: ~5 horas con testing exhaustivo**

---

## 🎯 **CONFIRMACIÓN PARA PROCEDER**

**¿Confirmas que proceda con esta migración cuidadosa y responsable?**

- ✅ Sin precipitaciones
- ✅ Paso a paso verificado
- ✅ Rollback garantizado
- ✅ Funcionalidad preservada
- ✅ Coherencia con frontend
- ✅ Conectividad mantenida