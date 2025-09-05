# 🚀 Pull Request - EmotioXV2

## 📋 Descripción

### ¿Qué cambia?
<!-- Describe brevemente qué hace este PR -->

### ¿Por qué es necesario?
<!-- Explica la razón del cambio -->

### ¿Cómo se puede probar?
<!-- Pasos específicos para verificar el cambio -->

---

## ✅ Checklist Obligatorio

### **Pre-commit (TODOS OBLIGATORIOS)**
- [ ] `npx tsc --noEmit` pasa en todos los proyectos
- [ ] `npm run lint` pasa sin errores ni warnings  
- [ ] `npm run build` exitoso en todos los proyectos
- [ ] **0 tipos `any` o `unknown`** en el código modificado
- [ ] Tests unitarios pasan (cuando aplique)

### **Código (TODOS OBLIGATORIOS)**
- [ ] Principio de responsabilidad única aplicado
- [ ] Nombres descriptivos en variables y funciones
- [ ] Interfaces completas y específicas
- [ ] No hay código comentado o duplicado
- [ ] Importaciones organizadas y limpias

### **Arquitectura (TODOS OBLIGATORIOS)**
- [ ] Principios SOLID aplicados
- [ ] Clean Architecture respetada
- [ ] Separación correcta de responsabilidades
- [ ] Dependencias invertidas (depende de abstracciones)

### **Documentación**
- [ ] README actualizado si es necesario
- [ ] Tipos exportados correctamente
- [ ] JSDoc en interfaces complejas

---

## 🎯 Tipo de Cambio

- [ ] 🚀 **feat**: Nueva funcionalidad
- [ ] 🐛 **fix**: Corrección de bug
- [ ] 📝 **docs**: Cambios en documentación
- [ ] 🎨 **style**: Cambios de formateo
- [ ] ♻️ **refactor**: Refactorización de código
- [ ] ⚡ **perf**: Mejora de rendimiento
- [ ] 🧪 **test**: Agregar o corregir tests
- [ ] 🔧 **chore**: Cambios en build/CI

---

## 📊 Impacto

### **Breaking Changes**
- [ ] Sí - Requiere actualización en otros componentes
- [ ] No - Compatible hacia atrás

### **Rendimiento**
- [ ] Mejora el rendimiento
- [ ] Sin impacto en rendimiento
- [ ] Podría afectar rendimiento (justificar abajo)

### **Compatibilidad**
- [ ] Compatible con todos los navegadores objetivo
- [ ] Compatible con versiones anteriores de la API
- [ ] Requiere migración de datos

---

## 🧪 Testing

### **Qué se probó**
- [ ] Funcionalidad nueva/modificada
- [ ] Casos edge conocidos
- [ ] Integración con otros componentes
- [ ] Regresión de funcionalidad existente

### **Cómo se probó**
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Tests manuales
- [ ] Tests end-to-end

---

## 📸 Screenshots/Videos (si aplica)

<!-- Agregar capturas de pantalla o videos para cambios de UI -->

---

## 📋 Notas Adicionales

<!-- Cualquier información adicional que el reviewer deba saber -->

---

## 🚨 Para el Reviewer

### **Puntos críticos a revisar**
- [ ] Tipado estricto (0 `any`/`unknown`)
- [ ] Principios SOLID aplicados
- [ ] Clean Architecture respetada
- [ ] Rendimiento no degradado
- [ ] Security best practices

### **CI/CD debe estar ✅ VERDE antes del merge**
- [ ] TypeScript compilation
- [ ] Linting
- [ ] Build verification
- [ ] Type safety audit
- [ ] Clean architecture check

---

**⚠️ Este PR será automaticamente rechazado si:**
- CI/CD pipeline falla
- Contiene tipos `any` o `unknown`
- No cumple estándares de código
- Falta documentación crítica