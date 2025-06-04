# ✅ Checklist de Testing: Corrección de Renderizado de Respuestas

## Objetivo
Verificar que todos los formularios corregidos ahora muestren correctamente las respuestas previamente guardadas cuando se cargan desde `useModuleResponses`.

---

## 🔧 Componentes SmartVOC Corregidos

### NEV Question (Emoji Selection)
**Archivo**: `src/components/smartVoc/questions/NEVQuestion.tsx`

**Test Steps**:
1. [ ] Navegar a una pregunta NEV
2. [ ] Seleccionar un emoji (😞, 😐, o 😊)
3. [ ] Guardar la respuesta
4. [ ] Recargar la página o navegar away/back
5. [ ] **Verificar**: El emoji previamente seleccionado debe estar marcado
6. [ ] **Console Log**: Debe mostrar `[NEVQuestion] Cargando respuesta existente para {questionId}: {valor}`

**Estructura de respuesta esperada**:
```typescript
{
  stepType: 'smartvoc_nev', 
  response: { value: -1 | 0 | 1 }
}
```

---

### NPS Question (0-10 Scale)
**Archivo**: `src/components/smartVoc/questions/NPSQuestion.tsx`

**Test Steps**:
1. [ ] Navegar a una pregunta NPS
2. [ ] Seleccionar un valor en la escala 0-10
3. [ ] Guardar la respuesta
4. [ ] Recargar la página o navegar away/back
5. [ ] **Verificar**: El valor previamente seleccionado debe estar marcado
6. [ ] **Console Log**: Debe mostrar `[NPSQuestion] Cargando respuesta existente para {questionId}: {valor}`

**Estructura de respuesta esperada**:
```typescript
{
  stepType: 'smartvoc_nps',
  response: { value: number } // 0-10
}
```

---

### CV Question (Customer Value Scale)
**Archivo**: `src/components/smartVoc/questions/CVQuestion.tsx`

**Test Steps**:
1. [ ] Navegar a una pregunta CV
2. [ ] Seleccionar un valor en la escala (típicamente 1-7)
3. [ ] Guardar la respuesta
4. [ ] Recargar la página o navegar away/back
5. [ ] **Verificar**: El valor previamente seleccionado debe estar marcado
6. [ ] **Console Log**: Debe mostrar `[CVQuestion] Cargando respuesta existente para {questionId}: {valor}`

**Estructura de respuesta esperada**:
```typescript
{
  stepType: 'smartvoc_cv',
  response: { value: number } // 1-7
}
```

---

### VOC Text Question (Open Text)
**Archivo**: `src/components/smartVoc/questions/VOCTextQuestion_ORIGINAL.tsx`

**Test Steps**:
1. [ ] Navegar a una pregunta de texto VOC
2. [ ] Escribir texto en el textarea
3. [ ] Guardar la respuesta
4. [ ] Recargar la página o navegar away/back
5. [ ] **Verificar**: El texto previamente escrito debe aparecer en el textarea
6. [ ] **Console Log**: Debe mostrar `[VOCTextQuestion] Cargando respuesta existente para {questionId}: {texto}`

**Estructura de respuesta esperada**:
```typescript
{
  stepType: 'smartvoc_feedback',
  response: { value: string }
}
```

---

### Agreement Scale View (Likert Scale)
**Archivo**: `src/components/smartVoc/AgreementScaleView.tsx`

**Test Steps**:
1. [ ] Navegar a una escala de acuerdo/Likert
2. [ ] Seleccionar un valor (típicamente 1-7)
3. [ ] Guardar la respuesta
4. [ ] Recargar la página o navegar away/back
5. [ ] **Verificar**: El valor previamente seleccionado debe estar marcado
6. [ ] **Console Log**: Debe mostrar `[AgreementScaleView] Cargando respuesta existente para {stepId}: {valor}`

**Estructura de respuesta esperada**:
```typescript
{
  stepType: '{dynamic}',
  response: { value: number } // 1-7
}
```

---

### Difficulty Scale View (Original)
**Archivo**: `src/components/smartVoc/DifficultyScaleView_ORIGINAL.tsx`

**Test Steps**:
1. [ ] Navegar a una escala de dificultad
2. [ ] Seleccionar un valor (típicamente 1-7)
3. [ ] Guardar la respuesta
4. [ ] Recargar la página o navegar away/back
5. [ ] **Verificar**: El valor previamente seleccionado debe estar marcado
6. [ ] **Console Log**: Debe mostrar `[DifficultyScaleView_ORIGINAL] Cargando respuesta existente para {stepId}: {valor}`

**Estructura de respuesta esperada**:
```typescript
{
  stepType: 'smartvoc_{moduleId}',
  response: { value: number } // 1-7
}
```

---

### ⭐ SmartVocFeedbackQuestion (COMPONENTE PRINCIPAL VOC)
**Archivo**: `src/components/flow/questions/SmartVocFeedbackQuestion.tsx`

**Test Steps**:
1. [ ] Navegar al formulario "Voice of Customer (VOC)" 
2. [ ] Verificar que aparece la pregunta "¿Cómo podemos mejorar el servicio?"
3. [ ] Escribir texto en el textarea (ej: "El servicio podría ser más rápido")
4. [ ] Hacer clic en "Guardar y continuar" 
5. [ ] Recargar la página o navegar away/back
6. [ ] **Verificar**: El texto previamente escrito debe aparecer en el textarea
7. [ ] **Console Log**: Debe mostrar `[SmartVocFeedbackQuestion] Cargando respuesta existente para {stepId}: {texto}`
8. [ ] **Editar texto**: Modificar el contenido y guardar nuevamente
9. [ ] **Verificar botón**: Debe mostrar "Actualizar y continuar" cuando hay texto existente

**Estructura de respuesta esperada**:
```typescript
{
  stepType: 'smartvoc_feedback', // o similar según configuración
  response: { value: string } // texto del usuario
}
```

**⚠️ Notas importantes**:
- Este era el componente que **NO** funcionaba antes de la corrección
- Anteriormente usaba `useResponseStorage` (localStorage solamente)
- Ahora usa `useModuleResponses` + `useResponseAPI` como los demás
- Es el componente **principal** usado en el flujo para preguntas VOC

---

## 🚀 Componentes con useStandardizedForm

Los siguientes componentes se benefician automáticamente de las correcciones:

### Difficulty Scale View (Migrated)
**Archivo**: `src/components/smartVoc/DifficultyScaleView.tsx`

**Test Steps**:
1. [ ] Navegar a una escala de dificultad (versión migrada)
2. [ ] Seleccionar un valor
3. [ ] Guardar la respuesta
4. [ ] Recargar la página o navegar away/back
5. [ ] **Verificar**: El valor debe persistir automáticamente

### NPS View (Migrated)
**Archivo**: `src/components/smartVoc/NPSView.tsx`

**Test Steps**:
1. [ ] Navegar a una pregunta NPS (versión migrada)
2. [ ] Seleccionar un valor 0-10
3. [ ] Guardar la respuesta
4. [ ] Recargar la página o navegar away/back
5. [ ] **Verificar**: El valor debe persistir automáticamente

### Demographic Forms
**Archivos**: `src/components/demographics/*`

**Test Steps**:
1. [ ] Llenar formulario demográfico
2. [ ] Guardar respuestas
3. [ ] Recargar la página o navegar away/back
4. [ ] **Verificar**: Todos los campos deben mostrar valores guardados

---

## 🔍 Debugging Information

### Console Logs Esperados

**Carga Exitosa**:
```
[ComponentName] Cargando respuesta existente para {questionId}: {valor}
```

**No se encuentra respuesta**:
```
[ComponentName] No se encontró respuesta previa para {questionId}
```

### Browser DevTools

1. **Network Tab**: Verificar que `getModuleResponses` retorna datos
2. **Console**: Monitorear logs de carga de respuestas
3. **Application/Storage**: Revisar localStorage para datos temporales

---

## ❌ Problemas Conocidos a Verificar

### Casos Edge a Testear

1. [ ] **Respuestas con estructura anidada**: Verificar que se extraigan valores correctamente
2. [ ] **Respuestas legacy**: Confirmar compatibilidad con formato anterior
3. [ ] **Respuestas vacías/null**: Verificar graceful fallback
4. [ ] **Conexión lenta**: Confirmar que loading states funcionan
5. [ ] **Errores de API**: Verificar que se muestran apropiadamente

### Compatibilidad entre Formatos

1. [ ] **stepType vs stepId**: Ambos criterios de búsqueda funcionan
2. [ ] **moduleId legacy**: Formato anterior sigue siendo compatible
3. [ ] **stepTitle matching**: Búsqueda por título funciona como fallback

---

## 🎯 Criterios de Éxito

### ✅ Funcionamiento Correcto
- [ ] **100% de formularios** muestran respuestas previamente guardadas
- [ ] **Zero data loss** al navegar entre pasos
- [ ] **Experiencia fluida** sin flashes de loading innecesarios
- [ ] **Logs informativos** en consola para debugging

### ✅ Performance
- [ ] **Carga rápida** de respuestas existentes
- [ ] **No llamadas duplicadas** a la API
- [ ] **Memory usage** estable sin leaks

### ✅ UX/UI
- [ ] **Loading states** apropiados durante carga inicial
- [ ] **Button states** correctos (create vs update)
- [ ] **Error handling** claro y útil
- [ ] **Visual feedback** cuando se cargan datos existentes

---

## 🔄 Flujo de Testing Completo

### Escenario de Testing Integral

1. **Setup**: Comenzar con participant data limpia
2. **Fill Forms**: Completar múltiples formularios SmartVOC
3. **Save All**: Asegurar que todas las respuestas se guardan
4. **Navigate Away**: Salir completamente de la aplicación
5. **Return**: Volver y navegar por los mismos formularios
6. **Verify All**: Confirmar que todos muestran datos guardados
7. **Edit Some**: Modificar algunas respuestas
8. **Repeat**: Repetir ciclo de navegación y verificación

### Condiciones de Testing

- [ ] **Browser refresh** completo
- [ ] **Tab close/reopen**
- [ ] **Network interruption** simulada
- [ ] **Multiple research flows** diferentes
- [ ] **Different participant sessions**

---

## 📋 Reporte de Resultados

Completar después del testing:

```
□ Todas las correcciones funcionan según lo esperado
□ No se encontraron regresiones
□ Performance es aceptable
□ UX es fluida y clara
□ Logs proporcionan información útil

Issues encontrados:
- [ ] Issue 1: _descripción_
- [ ] Issue 2: _descripción_
- [ ] Issue 3: _descripción_

Fecha de testing: ___________
Tester: ___________
Environment: ___________
``` 