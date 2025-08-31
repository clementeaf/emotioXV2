# 🎯 BackendV2 Cleanup Roadmap

## Estado Actual
✅ **TypeScript**: 0 errores, tipado estricto  
🔄 **Pendiente**: Issues de funcionalidad y calidad de código

---

## 🔴 PRIORIDAD ALTA - Funcionalidad Crítica

### 1. Monitoring Controller - Persistencia DynamoDB
**Archivos**: `src/controllers/monitoring.controller.ts`  
**Issue**: 7 TODOs críticos - eventos no se persisten  
**Líneas**: 96, 111, 126, 143, 158, 173, 236

**TODOs específicos**:
- [ ] `handleParticipantLogin`: Guardar en DynamoDB
- [ ] `handleParticipantStep`: Actualizar progreso en DynamoDB  
- [ ] `handleParticipantDisqualified`: Guardar descalificación
- [ ] `handleParticipantQuotaExceeded`: Guardar exceso de cuota
- [ ] `handleParticipantCompleted`: Guardar completación
- [ ] `handleParticipantError`: Guardar error
- [ ] `subscribeToResearch`: Guardar suscripción WebSocket

**Impacto**: Sistema de monitoreo en tiempo real no funcional

### 2. Controllers con Handlers Placeholder
**Archivos**: 7 controllers con "Not implemented"
- [ ] `researchInProgress.controller.ts`
- [ ] `quotaValidation.controller.ts` 
- [ ] `moduleResponse.controller.ts`
- [ ] `participant.controller.ts`
- [ ] `newResearch.controller.ts`
- [ ] `monitoring.controller.ts`
- [ ] `s3.controller.ts`

**Impacto**: Endpoints devuelven 501 - no funcionales

---

## 🟡 PRIORIDAD MEDIA - Calidad de Código

### 3. Console.log Cleanup
**Archivos**: ~50 archivos  
**Issue**: 568 console statements sin structuredLog  
**Impacto**: Logs no estructurados en producción

**Plan**:
- [ ] Reemplazar `console.log` → `structuredLog('info', ...)`
- [ ] Reemplazar `console.warn` → `structuredLog('warn', ...)`
- [ ] Reemplazar `console.error` → `structuredLog('error', ...)`

### 4. Debug Logs Excesivos
**Archivo**: `src/models/smartVocForm.model.ts`  
**Issue**: `SUPER_DEBUG` logs verbosos  
**Líneas**: 178, 182, 185, 193, 195, 201

**Plan**:
- [ ] Remover logs `SUPER_DEBUG`
- [ ] Mantener solo logs esenciales con `structuredLog`

---

## 🟢 PRIORIDAD BAJA - Refactoring

### 5. Template Controller Cleanup
**Archivo**: `src/utils/controller.template.ts`  
**Issue**: TODOs de esqueleto sin implementar  
**Líneas**: 36, 60, 78

**Plan**:
- [ ] Completar template o documentar como ejemplo
- [ ] Limpiar TODOs obsoletos

### 6. Método Legacy Comentado  
**Archivo**: `src/services/moduleResponse.service.ts`  
**Issue**: Método `createNewDocument` comentado  
**Líneas**: 67-158

**Plan**:
- [ ] Confirmar que no se necesita
- [ ] Eliminar código muerto

### 7. ESLint Suppression
**Archivo**: `src/services/auth.service.ts`  
**Issue**: eslint-disable presente

**Plan**:
- [ ] Revisar si supresión es necesaria
- [ ] Corregir issue subyacente si es posible

---

## 📋 ORDEN DE EJECUCIÓN

1. **Monitoring DynamoDB Implementation** (crítico)
2. **Placeholder Handlers Implementation** (crítico)  
3. **Console.log → structuredLog Migration** (calidad)
4. **Debug Logs Cleanup** (calidad)
5. **Template & Legacy Code Cleanup** (refactoring)

---

## ✅ CRITERIOS DE COMPLETION

- [ ] Todos los TODOs críticos implementados
- [ ] Todos los handlers funcionales (no 501)
- [ ] Logging consistente con structuredLog
- [ ] 0 logs de debug en producción
- [ ] Código muerto eliminado
- [ ] TypeScript estricto mantenido (0 `any` nuevos)

---

## 🚫 RESTRICCIONES

- ❌ NO usar tipado `any` o no estricto
- ❌ NO generar código inútil  
- ❌ NO romper funcionalidad existente
- ❌ NO saltar orden de prioridades
- ✅ Mantener enfoque sistemático
- ✅ Validar cada cambio con `npx tsc --noEmit`

---

**Status**: 🟡 En progreso  
**Última actualización**: $(date)