# 🚀 PLAN DE REFACTORIZACIÓN DE HOOKS RESEARCH

## 📊 **ESTADO ACTUAL**

### **HOOKS ANALIZADOS:**
1. **useWelcomeScreen** - 224 líneas
2. **useThankYouScreenForm** - 320 líneas  
3. **useCognitiveTaskForm** - 480 líneas
4. **useSmartVOCForm** - 314 líneas

**TOTAL:** ~1,338 líneas de código con lógica duplicada

## 🎯 **OBJETIVOS DE REFACTORIZACIÓN**

### **PRIMARY GOALS:**
- ✅ Eliminar duplicación de código
- ✅ Centralizar lógica común
- ✅ Mejorar mantenibilidad
- ✅ Asegurar consistencia
- ✅ Reducir líneas de código

### **SECONDARY GOALS:**
- ✅ Mejorar testing
- ✅ Documentar patrones
- ✅ Crear ejemplos de uso
- ✅ Optimizar imports

## 🔧 **ESTRATEGIA DE REFACTORIZACIÓN**

### **FASE 1: WELCOME SCREEN (PRIORIDAD ALTA)**
```typescript
// ANTES: useWelcomeScreen.ts (224 líneas)
- Estado manual: formData, isLoading, isSaving, isDeleting
- Modales manuales: modalError, modalVisible, confirmModalVisible
- Validación manual: useState para errores
- API directa: apiClient

// DESPUÉS: useWelcomeScreenRefactored.ts (~100 líneas)
- useFormManager: Gestión de formulario
- useModalManager: Gestión de modales
- Validación centralizada
- API domain hook
```

### **FASE 2: THANK YOU SCREEN (PRIORIDAD ALTA)**
```typescript
// ANTES: useThankYouScreenForm.ts (320 líneas)
- Estado manual: formData, thankYouScreenId, validationErrors
- Modales manuales: modalError, modalVisible, confirmModalVisible
- Validación manual: useState para errores
- API domain: useThankYouScreenData

// DESPUÉS: useThankYouScreenFormRefactored.ts (~150 líneas)
- useFormManager: Gestión de formulario
- useModalManager: Gestión de modales
- Validación centralizada
- API domain hook existente
```

### **FASE 3: COGNITIVE TASK (PRIORIDAD MEDIA)**
```typescript
// ANTES: useCognitiveTaskForm.ts (480 líneas)
- Estado manual: formData, cognitiveTaskId, isLoading, isSaving
- Modales manuales: modalError, modalVisible, showJsonPreview
- Validación manual: useState para errores
- API domain: useCreateCognitiveTask, useUpdateCognitiveTask
- Hooks auxiliares: useCognitiveTaskFileUpload, useCognitiveTaskModals

// DESPUÉS: useCognitiveTaskFormRefactored.ts (~200 líneas)
- useFormManager: Gestión de formulario
- useModalManager: Gestión de modales
- Validación centralizada
- Hooks auxiliares específicos mantenidos
- API domain hooks existentes
```

### **FASE 4: SMART VOC (PRIORIDAD MEDIA)**
```typescript
// ANTES: useSmartVOCForm.ts (314 líneas)
- Estado manual: formData, smartVocId, validationErrors
- Modales manuales: modalError, modalVisible, isDeleteModalOpen
- Validación manual: useState para errores
- API domain: useSmartVOCData

// DESPUÉS: useSmartVOCFormRefactored.ts (~150 líneas)
- useFormManager: Gestión de formulario
- useModalManager: Gestión de modales
- Validación centralizada
- API domain hook existente
```

## 📋 **CHECKLIST DE REFACTORIZACIÓN**

### **WELCOME SCREEN:**
- [ ] Crear `useWelcomeScreenRefactored.ts`
- [ ] Implementar `useFormManager`
- [ ] Implementar `useModalManager`
- [ ] Mantener funcionalidad específica
- [ ] Probar que compila
- [ ] Probar funcionalidad
- [ ] Reemplazar hook original
- [ ] Eliminar hook original

### **THANK YOU SCREEN:**
- [ ] Crear `useThankYouScreenFormRefactored.ts`
- [ ] Implementar `useFormManager`
- [ ] Implementar `useModalManager`
- [ ] Mantener funcionalidad específica
- [ ] Probar que compila
- [ ] Probar funcionalidad
- [ ] Reemplazar hook original
- [ ] Eliminar hook original

### **COGNITIVE TASK:**
- [ ] Crear `useCognitiveTaskFormRefactored.ts`
- [ ] Implementar `useFormManager`
- [ ] Implementar `useModalManager`
- [ ] Mantener hooks auxiliares específicos
- [ ] Probar que compila
- [ ] Probar funcionalidad
- [ ] Reemplazar hook original
- [ ] Eliminar hook original

### **SMART VOC:**
- [ ] Crear `useSmartVOCFormRefactored.ts`
- [ ] Implementar `useFormManager`
- [ ] Implementar `useModalManager`
- [ ] Mantener funcionalidad específica
- [ ] Probar que compila
- [ ] Probar funcionalidad
- [ ] Reemplazar hook original
- [ ] Eliminar hook original

## 🎯 **RESULTADO ESPERADO**

### **MÉTRICAS:**
- **Líneas de código:** 1,338 → ~600 (-55%)
- **Duplicación:** Eliminada
- **Mantenibilidad:** Mejorada
- **Consistencia:** Asegurada
- **Testing:** Simplificado

### **BENEFICIOS:**
- ✅ Código más limpio y mantenible
- ✅ Lógica común centralizada
- ✅ Comportamiento consistente
- ✅ Hooks genéricos reutilizables
- ✅ Mejor testing y debugging
- ✅ Documentación clara

## 🚀 **PRÓXIMOS PASOS**

1. **Implementar Fase 1** - WelcomeScreen
2. **Implementar Fase 2** - ThankYouScreen  
3. **Implementar Fase 3** - CognitiveTask
4. **Implementar Fase 4** - SmartVOC
5. **Testing completo** - Verificar funcionalidad
6. **Documentación** - Crear guías de uso
7. **Cleanup** - Eliminar hooks originales
