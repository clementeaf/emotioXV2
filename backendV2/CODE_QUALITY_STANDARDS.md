# 🚨 ESTÁNDARES DE CALIDAD DE CÓDIGO - OBLIGATORIOS

## ⚠️ REGLAS CRÍTICAS - CUMPLIMIENTO OBLIGATORIO

**PROHIBIDO ABSOLUTAMENTE** subir código que no cumpla con estos estándares. Cualquier violación bloqueará el deployment.

---

## 📋 CHECKLIST PRE-DEPLOY (OBLIGATORIO)

Antes de cualquier commit o deploy a AWS, **TODOS** estos comandos deben ejecutarse sin errores:

### 1. ✅ TypeScript Compilation
```bash
tsc
# ó
npx tsc --noEmit
```
- **❌ PROHIBIDO**: Cualquier error de TypeScript
- **❌ PROHIBIDO**: Cualquier warning de tipos
- **✅ REQUERIDO**: Salida limpia sin mensajes

### 2. ✅ ESLint Validation  
```bash
npm run lint
```
- **❌ PROHIBIDO**: Cualquier error de linting
- **❌ PROHIBIDO**: Cualquier warning de código
- **✅ REQUERIDO**: "✨ 0 problems (0 errors, 0 warnings)"

### 3. ✅ ESLint Auto-Fix
```bash
npm run lint -- --fix
```
- **✅ REQUERIDO**: Aplicar todas las correcciones automáticas
- **✅ REQUERIDO**: Verificar que no quedan issues pendientes

---

## 🎯 ESTÁNDARES DE CÓDIGO

### TypeScript - Tipado Estricto
- **✅ OBLIGATORIO**: Tipado explícito en todas las funciones
- **❌ PROHIBIDO**: Uso de `any` (usar `unknown` si es necesario)
- **❌ PROHIBIDO**: Type assertions inseguros (`as` sin validación)
- **✅ REQUERIDO**: Interfaces bien definidas para todos los objetos
- **✅ REQUERIDO**: Manejo de errores tipado correctamente

### Estructura de Código
- **✅ REQUERIDO**: Funciones con un solo propósito (Single Responsibility)
- **✅ REQUERIDO**: Validación de entrada en todas las funciones públicas
- **✅ REQUERIDO**: Manejo de errores explícito
- **❌ PROHIBIDO**: Código duplicado
- **❌ PROHIBIDO**: Funciones de más de 50 líneas sin justificación

### Validación de Datos
- **✅ OBLIGATORIO**: Verificar tipos antes de usar propiedades
- **✅ OBLIGATORIO**: Validar null/undefined antes de acceso
- **✅ OBLIGATORIO**: Sanitización de inputs externos
- **❌ PROHIBIDO**: Casting directo sin verificación

---

## 🛠️ FLUJO DE TRABAJO OBLIGATORIO

### Antes de cada commit:
```bash
# 1. Compilación TypeScript
tsc
echo "✅ TypeScript: OK"

# 2. Linting
npm run lint
echo "✅ ESLint: OK"  

# 3. Auto-fix
npm run lint -- --fix
echo "✅ Auto-fix aplicado"

# 4. Verificación final
npm run lint
echo "✅ Verificación final: OK"
```

### Antes de deploy a AWS:
```bash
# Ejecutar TODOS los checks
tsc && npm run lint && npm run lint -- --fix && npm run lint
echo "🚀 LISTO PARA DEPLOY"
```

---

## ❌ VIOLACIONES CRÍTICAS

### Errores que BLOQUEAN el deploy:

1. **Errores de TypeScript**
   - Tipos incorrectos o faltantes
   - Propiedades inexistentes  
   - Type mismatches

2. **Errores de ESLint**
   - Código no utilizado
   - Imports incorrectos
   - Violaciones de estilo

3. **Warnings no resueltos**
   - Cualquier warning debe ser corregido
   - No se permiten excepciones

4. **Código inseguro**
   - Type assertions sin validación
   - Acceso a propiedades sin verificar null
   - Manejo inadecuado de errores

---

## 🎯 OBJETIVOS DE CALIDAD

- **🔒 Seguridad**: Código sin vulnerabilidades
- **🚀 Estabilidad**: Sin errores en runtime  
- **🔧 Mantenibilidad**: Código limpio y consistente
- **📊 Confiabilidad**: Comportamiento predecible
- **⚡ Rendimiento**: Código eficiente

---

## 📞 RESPONSABILIDADES

### Desarrolladores:
- ✅ Ejecutar todos los checks antes de commit
- ✅ Corregir TODOS los errores y warnings  
- ✅ Mantener código limpio y bien tipado
- ✅ Documentar funciones complejas

### Code Review:
- ✅ Verificar que se ejecutaron los checks
- ✅ Validar cumplimiento de estándares
- ✅ Rechazar código que no cumple criterios

---

## 🚨 RECORDATORIO FINAL

**CERO TOLERANCIA** a errores de TypeScript, ESLint warnings o código de baja calidad.

La calidad del código es **NO NEGOCIABLE**.

---

*Documento de cumplimiento obligatorio - Actualizado: $(date)*