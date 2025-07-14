# 🧹 PLAN DE LIMPIEZA DE HOOKS - EmotioXV2

## 📊 ANÁLISIS ACTUAL

### Hooks de Respuestas (DUPLICADOS - ELIMINAR)
- ❌ `useModuleResponse.ts` - Reemplazado por `useParticipantData`
- ❌ `useResponseManager.ts` - Reemplazado por `useParticipantData`
- ❌ `useResponseAPI.ts` - Reemplazado por `useParticipantData`
- ❌ `useStepResponseManager.ts` - Reemplazado por `useParticipantData`

### Hooks de Metadata (DUPLICADOS - ELIMINAR)
- ❌ `useGeolocation.ts` - Integrado en `useParticipantData`
- ❌ `useGeolocationWithConsent.ts` - Integrado en `useParticipantData`
- ❌ `useLocationTracking.ts` - Integrado en `useParticipantData`
- ❌ `useMobileDeviceCheck.ts` - Integrado en `useParticipantData`
- ❌ `useReentryTracking.ts` - Integrado en `useParticipantData`
- ❌ `usePermissionRejection.ts` - Integrado en `useParticipantData`

### Hooks de Timing (DUPLICADOS - ELIMINAR)
- ❌ `useResponseTiming.ts` - Integrado en `useParticipantData`
- ❌ `useStepTimeout.ts` - Integrado en `useParticipantData`
- ❌ `useStepTimeoutConfig.ts` - Integrado en `useParticipantData`

### Hooks de Flujo (MANTENER)
- ✅ `useParticipantFlow.ts` - Hook principal de flujo
- ✅ `useFlowNavigationAndState.ts` - Navegación de flujo
- ✅ `useParticipantLogin.ts` - Login de participantes

### Hooks de GDPR/Consentimiento (MANTENER)
- ✅ `useGDPRConsent.ts` - Consentimiento GDPR
- ✅ `useGDPRPreferences.ts` - Preferencias GDPR

### Hooks de Formularios (MANTENER)
- ✅ `useResearchForms.ts` - Formularios de investigación
- ✅ `useTestStep.ts` - Pasos de test

## 🎯 HOOK CONSOLIDADO: `useParticipantData`

### Funcionalidades Integradas:
1. **Respuestas**: Enviar, recibir, actualizar, eliminar
2. **Metadata Automática**:
   - 📱 Información del dispositivo
   - 📍 Ubicación geográfica (GPS + IP fallback)
   - ⏱️ Timing de sesión
   - 🔄 Tracking de reingresos
   - 📊 Progreso del test

### API Simplificada:
```typescript
const {
  // Respuestas
  sendResponse,
  getResponse,
  updateResponse,
  deleteAllResponses,

  // Metadata automática
  metadata,

  // Estados
  isLoading,
  error,

  // Control de sesión
  startSession,
  endSession,
  updateCurrentStep,
  updateProgress
} = useParticipantData();
```

## 🗑️ HOOKS A ELIMINAR

### Fase 1: Respuestas
```bash
rm public-tests/src/hooks/useModuleResponse.ts
rm public-tests/src/hooks/useResponseManager.ts
rm public-tests/src/hooks/useResponseAPI.ts
rm public-tests/src/hooks/useStepResponseManager.ts
```

### Fase 2: Metadata
```bash
rm public-tests/src/hooks/useGeolocation.ts
rm public-tests/src/hooks/useGeolocationWithConsent.ts
rm public-tests/src/hooks/useLocationTracking.ts
rm public-tests/src/hooks/useMobileDeviceCheck.ts
rm public-tests/src/hooks/useReentryTracking.ts
rm public-tests/src/hooks/usePermissionRejection.ts
```

### Fase 3: Timing
```bash
rm public-tests/src/hooks/useResponseTiming.ts
rm public-tests/src/hooks/useStepTimeout.ts
rm public-tests/src/hooks/useStepTimeoutConfig.ts
```

## 🔄 MIGRACIÓN DE COMPONENTES

### Componentes que usan hooks eliminados:
1. `TestLayoutRenderer.tsx` - Cambiar `useModuleResponse` → `useParticipantData`
2. `StepsComponents.tsx` - Cambiar `useModuleResponse` → `useParticipantData`
3. Cualquier componente que use los hooks de metadata

### Ejemplo de migración:
```typescript
// ANTES
const { sendResponse, getResponse } = useModuleResponse();

// DESPUÉS
const { sendResponse, getResponse, metadata } = useParticipantData();
```

## ✅ BENEFICIOS

1. **Menos código**: De 20+ hooks a 1 hook consolidado
2. **Metadata automática**: Se recolecta sin intervención del desarrollador
3. **API simplificada**: Una sola interfaz para todo
4. **Mejor performance**: Menos re-renders y efectos
5. **Mantenimiento**: Un solo lugar para cambios

## 🚀 IMPLEMENTACIÓN

1. ✅ Crear `useParticipantData.ts` (COMPLETADO)
2. 🔄 Migrar componentes principales
3. 🗑️ Eliminar hooks duplicados
4. 🧪 Probar funcionalidad
5. 📚 Actualizar documentación

## 📋 CHECKLIST

- [x] ✅ Crear hook consolidado
- [x] ✅ Migrar `TestLayoutRenderer.tsx`
- [x] ✅ Migrar `StepsComponents.tsx`
- [x] ✅ Eliminar hooks de respuestas (4 eliminados)
- [x] ✅ Eliminar hooks de metadata (6 eliminados)
- [x] ✅ Eliminar hooks de timing (3 eliminados)
- [ ] 🔄 Probar funcionalidad completa
- [ ] 📚 Actualizar documentación
