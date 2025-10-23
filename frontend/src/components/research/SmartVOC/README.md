# Smart VOC - Sistema Genérico

## 🎯 Migración a Sistema Genérico

El componente Smart VOC ha sido migrado para usar el **sistema genérico de formularios dinámicos**.

### ✅ **Ventajas de la Migración:**

- **Código reducido**: De ~500 líneas a ~20 líneas
- **Mantenimiento simplificado**: Un solo lugar para cambios
- **Consistencia**: Misma UX en todos los módulos
- **Escalabilidad**: Fácil agregar nuevos tipos de preguntas

### 🚀 **Uso del Nuevo Componente:**

```tsx
import { SmartVOCFormGeneric } from './SmartVOCFormGeneric';

// Uso básico
<SmartVOCFormGeneric 
  researchId={researchId} 
  onSave={handleSave} 
/>

// Con className personalizado
<SmartVOCFormGeneric 
  researchId={researchId}
  className="custom-class"
  onSave={handleSave} 
/>
```

### 📋 **Tipos de Preguntas Disponibles:**

1. **CSAT** - Customer Satisfaction
   - Campos: title, description, instructions, config.type, config.companyName
   - Visualización: Estrellas, números, emojis

2. **CES** - Customer Effort Score  
   - Campos: title, description, instructions, config.scaleRange
   - Escala: 1-5, 1-7, 1-10

3. **CV** - Customer Value
   - Campos: title, description, instructions
   - Info: 3 escalas principales de valoración

4. **NEV** - Net Emotional Value
   - Campos: title, description, instructions
   - Info: Jerarquía de Valor Emocional

5. **NPS** - Net Promoter Score
   - Campos: title, description, instructions, config.companyName
   - Escala: 0-10

6. **VOC** - Voice of Customer
   - Campos: title, description, instructions, config.maxLength
   - Info: Comentarios abiertos

### 🔧 **Configuración JSON:**

Todos los tipos están definidos en `shared/schema.json`:

```json
{
  "modules": {
    "smart-voc": {
      "questionTypes": {
        "CSAT": { "fields": [...], "previewType": "CSAT" },
        "CES": { "fields": [...], "previewType": "CES" },
        // ... resto de tipos
      }
    }
  }
}
```

### 🎯 **Funcionalidades Incluidas:**

- ✅ CRUD completo de preguntas
- ✅ Validación automática
- ✅ Preview en tiempo real
- ✅ Duplicar preguntas
- ✅ Reordenar preguntas
- ✅ Modales de confirmación
- ✅ Manejo de errores
- ✅ Estados de carga
- ✅ Sidebar educativo

### 🔄 **Migración Gradual:**

1. **Fase 1**: Nuevo componente disponible ✅
2. **Fase 2**: Reemplazar uso en páginas principales
3. **Fase 3**: Deprecar componentes antiguos
4. **Fase 4**: Limpiar código legacy

### 📊 **Comparación:**

| Aspecto | Antes | Después |
|---------|-------|---------|
| Líneas de código | ~500 | ~20 |
| Archivos | 8+ | 1 |
| Mantenimiento | Complejo | Simple |
| Consistencia | Variable | Uniforme |
| Escalabilidad | Limitada | Ilimitada |
