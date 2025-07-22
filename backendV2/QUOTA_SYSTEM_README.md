# 🎯 Sistema de Cuotas Dinámicas - EmotioXV2

## 📋 Descripción General

El sistema de cuotas dinámicas permite establecer límites específicos para participantes basados en criterios demográficos. Cuando se alcanza una cuota para un criterio específico, los participantes de esa categoría son automáticamente descalificados.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **QuotaValidationService** (`src/services/quotaValidation.service.ts`)
   - Servicio principal para validación de cuotas
   - Manejo de contadores automáticos
   - Validación en tiempo real

2. **QuotaValidationController** (`src/controllers/quotaValidation.controller.ts`)
   - Controlador para manejar requests HTTP
   - Validación de entrada
   - Respuestas estructuradas

3. **Funciones Lambda** (`src/functions/quotaValidation.ts`)
   - `validateParticipantQuotas`: Valida participantes contra cuotas
   - `getQuotaStats`: Obtiene estadísticas de cuotas
   - `resetQuotaCounters`: Reinicia contadores

### Estructura de Datos

#### Cuotas por Criterio Demográfico

```typescript
// Ejemplo para cuotas de edad
{
  ageRange: "18-24",
  quota: 10,
  isActive: true
}

// Ejemplo para cuotas de país
{
  country: "ES",
  quota: 15,
  isActive: true
}
```

#### Contadores en DynamoDB

```typescript
{
  id: "research-123-age-18-24",
  sk: "QUOTA_COUNTER",
  researchId: "research-123",
  demographicType: "age",
  demographicValue: "18-24",
  currentCount: 8,
  maxQuota: 10,
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

## 🚀 API Endpoints

### 1. Validar Participante
```http
POST /quota-validation/validate
Content-Type: application/json

{
  "researchId": "research-123",
  "demographics": {
    "age": "18-24",
    "country": "ES",
    "gender": "M",
    "educationLevel": "3",
    "householdIncome": "2",
    "employmentStatus": "employed",
    "dailyHoursOnline": "4-6",
    "technicalProficiency": "intermediate"
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "reason": null,
    "quotaInfo": null
  }
}
```

### 2. Obtener Estadísticas
```http
GET /quota-validation/stats/{researchId}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "researchId": "research-123",
    "stats": [
      {
        "demographicType": "age",
        "demographicValue": "18-24",
        "currentCount": 8,
        "maxQuota": 10,
        "isActive": true
      }
    ],
    "totalCounters": 1
  }
}
```

### 3. Reiniciar Contadores
```http
POST /quota-validation/reset
Content-Type: application/json

{
  "researchId": "research-123",
  "confirmReset": true
}
```

## 🔧 Configuración en Frontend

### Estructura de Cuotas en Formulario

```typescript
// En el formulario de eye-tracking
demographicQuestions: {
  age: {
    enabled: true,
    required: false,
    options: ['18-24', '25-34', '35-44'],
    quotas: [
      { ageRange: '18-24', quota: 10, isActive: true },
      { ageRange: '25-34', quota: 15, isActive: true }
    ],
    quotasEnabled: true
  },
  country: {
    enabled: true,
    required: false,
    options: ['ES', 'MX', 'AR'],
    quotas: [
      { country: 'ES', quota: 20, isActive: true },
      { country: 'MX', quota: 15, isActive: true }
    ],
    quotasEnabled: true
  }
}
```

## 🧪 Testing

### Script de Pruebas
```bash
# Ejecutar tests de validación de cuotas
cd backendV2
node scripts/test-quota-validation.js

# Con variables de entorno personalizadas
API_URL=http://localhost:3000 TEST_RESEARCH_ID=my-research-123 node scripts/test-quota-validation.js
```

### Tests Incluidos

1. **Test de Validación por Edad**: Prueba cuotas específicas por rango de edad
2. **Test de Validación por País**: Prueba cuotas específicas por país
3. **Test de Estadísticas**: Obtiene y muestra estadísticas de cuotas
4. **Test sin Configuración**: Valida comportamiento sin configuración de cuotas
5. **Test de Reinicio**: Reinicia todos los contadores

## 🔄 Flujo de Validación

### 1. Registro de Participante
```
Participante se registra → Validar contra cuotas → Incrementar contadores → Permitir/Descalificar
```

### 2. Proceso de Validación
1. **Obtener Configuración**: Leer configuración de eye-tracking desde DynamoDB
2. **Validar Cada Criterio**: Verificar cuotas para cada criterio demográfico
3. **Verificar Contadores**: Consultar contadores actuales en DynamoDB
4. **Tomar Decisión**: Permitir o descalificar basado en cuotas
5. **Incrementar Contadores**: Si es válido, incrementar contadores automáticamente

### 3. Lógica de Descalificación
- Si `currentCount >= quota` → **DESCALIFICAR**
- Si `currentCount < quota` → **PERMITIR**
- Si no hay cuota configurada → **PERMITIR**

## 📊 Monitoreo y Estadísticas

### Métricas Disponibles
- **Contadores por Criterio**: Cuántos participantes por cada valor demográfico
- **Cuotas Configuradas**: Límites establecidos para cada criterio
- **Estado de Cuotas**: Activas/inactivas
- **Tasa de Descalificación**: Porcentaje de participantes descalificados por cuotas

### Logs Estructurados
```json
{
  "level": "info",
  "message": "Quota validation completed",
  "researchId": "research-123",
  "isValid": true,
  "reason": null
}
```

## 🛠️ Deployment

### 1. Compilar y Desplegar
```bash
cd backendV2
npm run build
serverless deploy --stage dev
```

### 2. Verificar Funciones
```bash
# Listar funciones desplegadas
serverless info --stage dev

# Ver logs de una función específica
serverless logs -f validateParticipantQuotas --stage dev
```

### 3. Probar Endpoints
```bash
# Probar validación
curl -X POST https://api.example.com/quota-validation/validate \
  -H "Content-Type: application/json" \
  -d '{"researchId":"test","demographics":{"age":"18-24"}}'
```

## 🔒 Seguridad y Consideraciones

### Validación de Entrada
- Todos los campos demográficos son opcionales
- Validación de tipos de datos
- Sanitización de entrada

### Manejo de Errores
- Errores de red manejados graciosamente
- Logs estructurados para debugging
- Respuestas consistentes en caso de error

### Performance
- Consultas optimizadas a DynamoDB
- Contadores incrementales eficientes
- Caché de configuración cuando sea apropiado

## 🔄 Integración con Frontend

### Hook de Validación
```typescript
// En el frontend, integrar con el flujo de participantes
const validateParticipantQuotas = async (demographics) => {
  const response = await fetch('/api/quota-validation/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ researchId, demographics })
  });

  const result = await response.json();
  return result.data.isValid;
};
```

### UI de Configuración
- Modales con tabs para configuración de cuotas
- Interfaz intuitiva para establecer límites
- Visualización de estadísticas en tiempo real

## 📈 Próximas Mejoras

### Funcionalidades Planificadas
1. **Dashboard de Cuotas**: Interfaz para monitorear cuotas en tiempo real
2. **Alertas Automáticas**: Notificaciones cuando se alcancen cuotas
3. **Cuotas Dinámicas**: Ajuste automático de cuotas basado en demanda
4. **Análisis Predictivo**: Predicción de cuándo se alcanzarán las cuotas
5. **Exportación de Datos**: Reportes detallados de cuotas y descalificaciones

### Optimizaciones Técnicas
1. **Caché Redis**: Para mejorar performance de consultas
2. **WebSockets**: Actualizaciones en tiempo real
3. **Batch Processing**: Procesamiento en lote para grandes volúmenes
4. **Métricas Avanzadas**: Análisis de tendencias y patrones

---

## 🎯 Resumen

El sistema de cuotas dinámicas proporciona:

✅ **Validación en Tiempo Real**: Verificación automática contra cuotas configuradas
✅ **Contadores Automáticos**: Incremento automático de contadores en DynamoDB
✅ **Descalificación Inteligente**: Lógica automática de descalificación
✅ **Estadísticas Detalladas**: Monitoreo completo de cuotas y contadores
✅ **API RESTful**: Endpoints bien documentados y consistentes
✅ **Testing Completo**: Scripts de prueba para validar funcionalidad
✅ **Integración Frontend**: Interfaz de usuario para configuración de cuotas

El sistema está listo para producción y puede manejar validaciones de cuotas para múltiples criterios demográficos de manera eficiente y escalable.
