# Análisis de Impacto: Módulos Personalizados para SmartVOC y CognitiveTask

## 📋 Resumen Ejecutivo

Este documento analiza el impacto de permitir que los clientes configuren módulos personalizados (preguntas) para SmartVOC y CognitiveTask, incluyendo la capacidad de repetir tipos de módulos.

## 🔍 Estado Actual

### Estructura de Datos

#### SmartVOC
- **Formato de guardado**: Array `SmartVOCQuestion[]` serializado como JSON string en DynamoDB
- **Campos clave por pregunta**:
  - `id`: Identificador único (ej: `QuestionType.SMARTVOC_CSAT`)
  - `type`: Tipo de pregunta (enum `QuestionType`)
  - `title`, `description`, `instructions`
  - `config`: Configuración específica del tipo
  - `questionKey`: Generado automáticamente si no existe

#### CognitiveTask
- **Formato de guardado**: Array `Question[]` serializado como JSON string en DynamoDB
- **Campos clave por pregunta**:
  - `id`: Identificador único (ej: `'3.1'`, `'3.2'`)
  - `type`: Tipo de pregunta (ej: `'short_text'`, `'single_choice'`)
  - `title`, `description`
  - `choices`, `scaleConfig`, `files` (según tipo)
  - `questionKey`: Generado automáticamente si no existe

### Flujo de Datos

```
Frontend (Admin) 
  → POST /research/{researchId}/smart-voc
  → Backend guarda questions[] en DynamoDB
  
Backend (API)
  → GET /research/{researchId}/available-forms
  → Lee questions[] de DynamoDB
  → Genera StepConfiguration[] con questionKey único
  → Devuelve a public-tests
  
Public-Tests (Participante)
  → Lee StepConfiguration[]
  → Usa questionKey para identificar renderer
  → Renderiza cada pregunta según su tipo
```

## ✅ Compatibilidad Actual

### Backend

**✅ Ya soporta arrays de preguntas:**
- `SmartVOCFormData.questions: SmartVOCQuestion[]`
- `CognitiveTaskFormData.questions: Question[]`
- No hay restricción de duplicados en el código actual

**✅ Generación de questionKey:**
```typescript
// SmartVOC: smartvoc:{type}:{id}
const questionKey = question.questionKey || 
  (question.id && normalizedType 
    ? `smartvoc:${normalizedType}:${question.id}`
    : null);

// CognitiveTask: cognitive_{type}
const questionKey = type.startsWith('cognitive_') 
  ? type 
  : `cognitive_${type}`;
```

**⚠️ Problema potencial:**
- Si dos preguntas tienen el mismo `id` y `type`, generarán el mismo `questionKey`
- Esto causaría conflictos en public-tests

### Public-Tests

**✅ Ya lee arrays de preguntas:**
- `extractSmartVOCConfig()` itera sobre `questions[]`
- `extractCognitiveTaskConfig()` itera sobre `questions[]`
- Cada pregunta genera un `StepConfiguration` independiente

**✅ Renderers por tipo:**
- `SmartVOCRenderers`: `smartvoc_csat`, `smartvoc_ces`, `smartvoc_cv`, etc.
- `CognitiveRenderers`: `cognitive_short_text`, `cognitive_single_choice`, etc.
- Cada renderer es independiente y puede manejar múltiples instancias

**⚠️ Dependencia de questionKey único:**
- `TestLayoutRenderer` usa `questionKey` como identificador único
- Si hay duplicados, solo renderizará una instancia

## 🎯 Solución Propuesta

### Principio: Mantener Formato Actual

**No cambiar la estructura de datos existente.** Solo asegurar que cada pregunta tenga un `questionKey` único.

### Cambios Necesarios

#### 1. Frontend: Generación de IDs Únicos

**SmartVOC:**
```typescript
// Al agregar una nueva pregunta del mismo tipo
const newQuestion: SmartVOCQuestion = {
  id: `${questionType}_${Date.now()}`, // ID único basado en timestamp
  type: questionType,
  // ... resto de campos
};
```

**CognitiveTask:**
```typescript
// Al agregar una nueva pregunta del mismo tipo
const newQuestion: Question = {
  id: `${questionType}_${Date.now()}`, // ID único basado en timestamp
  type: questionType,
  // ... resto de campos
};
```

#### 2. Backend: Generación de questionKey Único

**SmartVOC:**
```typescript
// Asegurar questionKey único incluso con tipos duplicados
questions.forEach((question, index) => {
  const normalizedType = question.type.replace(/^smartvoc_/, '');
  const questionKey = question.questionKey || 
    `smartvoc:${normalizedType}:${question.id || index}`;
  // Usar index como fallback si id no es único
});
```

**CognitiveTask:**
```typescript
// Asegurar questionKey único incluso con tipos duplicados
questions.forEach((question, index) => {
  const type = question.type || 'unknown';
  const questionKey = question.questionKey || 
    `cognitive_${type}_${question.id || index}`;
  // Usar index como fallback si id no es único
});
```

#### 3. Validación Backend: Opcional

**No es estrictamente necesario**, pero podría agregarse validación opcional:
- Verificar que todos los `questionKey` sean únicos dentro del array
- Si hay duplicados, generar automáticamente uno único

## 📊 Impacto por Componente

### ✅ Frontend (Admin Panel)

**Cambios mínimos:**
- Modificar lógica de "Añadir pregunta" para permitir tipos duplicados
- Generar IDs únicos al crear nuevas preguntas
- Mantener UI/UX actual

**Archivos afectados:**
- `frontend/src/components/research/SmartVOC/components/SmartVOCQuestions.tsx`
- `frontend/src/components/research/CognitiveTask/components/CognitiveTaskQuestions.tsx`
- Hooks relacionados

### ✅ Backend

**Cambios mínimos:**
- Asegurar generación de `questionKey` único en `getResearchAvailableForms`
- Validación opcional de unicidad

**Archivos afectados:**
- `backendV2/src/controllers/getResearchAvailableForms.ts`
  - `extractSmartVOCConfig()`
  - `extractCognitiveTaskConfig()`

### ✅ Public-Tests

**Sin cambios necesarios:**
- Ya soporta arrays de preguntas
- Ya renderiza múltiples instancias del mismo tipo
- Solo requiere `questionKey` único (ya manejado por backend)

## 🔒 Garantías de Compatibilidad

### Formato de Envío al Backend

**✅ Se mantiene igual:**
```typescript
{
  researchId: string;
  questions: Array<SmartVOCQuestion | Question>;
  randomizeQuestions: boolean;
  // ... resto de campos
}
```

### Formato de Lectura en Public-Tests

**✅ Se mantiene igual:**
```typescript
{
  questionKey: string; // Único por pregunta
  contentConfiguration: {
    title: string;
    description: string;
    type: string;
    // ... resto de campos según tipo
  }
}
```

### Identificación de Preguntas

**✅ questionKey único garantizado:**
- Backend genera `questionKey` único incluso con tipos duplicados
- Public-tests usa `questionKey` como identificador único
- No hay conflictos de renderizado

## 🚀 Plan de Implementación

### Fase 1: Frontend - Permitir Módulos Personalizados
1. Modificar lógica de "Añadir pregunta" en SmartVOC
2. Modificar lógica de "Añadir pregunta" en CognitiveTask
3. Generar IDs únicos al crear nuevas preguntas
4. Agregar toggle "Default" vs "Custom"

### Fase 2: Backend - Asegurar questionKey Único
1. Modificar `extractSmartVOCConfig()` para generar `questionKey` único
2. Modificar `extractCognitiveTaskConfig()` para generar `questionKey` único
3. Agregar validación opcional de unicidad

### Fase 3: Testing
1. Probar agregar múltiples preguntas del mismo tipo
2. Verificar que public-tests renderiza todas correctamente
3. Verificar que las respuestas se guardan con `questionKey` correcto

## ⚠️ Consideraciones

### IDs de Preguntas Existentes

**Problema:** Las preguntas existentes tienen IDs fijos:
- SmartVOC: `QuestionType.SMARTVOC_CSAT`, etc.
- CognitiveTask: `'3.1'`, `'3.2'`, etc.

**Solución:** 
- Mantener compatibilidad con IDs existentes
- Solo generar IDs únicos para nuevas preguntas agregadas
- Si se duplica una pregunta existente, generar nuevo ID

### Migración de Datos

**No es necesaria:**
- Las preguntas existentes seguirán funcionando
- Solo las nuevas preguntas personalizadas necesitarán IDs únicos
- Backend maneja la generación de `questionKey` automáticamente

## ✅ Conclusión

**La solución es compatible con el formato actual:**
- ✅ No requiere cambios en la estructura de datos
- ✅ No requiere cambios en public-tests
- ✅ Solo requiere ajustes menores en frontend y backend
- ✅ Mantiene compatibilidad con datos existentes

**Riesgo: Bajo**
- Cambios son principalmente en lógica de generación de IDs
- Backend ya maneja arrays de preguntas correctamente
- Public-tests ya soporta múltiples instancias del mismo tipo

