# 🚀 Guía de Migración: API Simplificada

## ❌ ANTES (Sobrecomplicado)

### Múltiples archivos de configuración:
- `api-client.ts` (376 líneas)
- `api.config.ts` (216 líneas)
- `api-endpoints.ts` (127 líneas)
- `api-endpoints.js` (61 líneas)
- `endpoints.json` (67 líneas)
- `outputs.json` (9 líneas)

### Uso complejo:
```typescript
// Configuración compleja
import { ApiClient, ApiEndpointManager } from './config/api-client';
import API_CONFIG from './config/api.config';

const endpointManager = new ApiEndpointManager();
const apiClient = new ApiClient();

// Uso con múltiples capas de abstracción
const url = endpointManager.getEndpoint('cognitiveTask', 'getByResearch', { researchId: '123' });
const response = await apiClient.get('cognitiveTask', 'getByResearch', { researchId: '123' });
```

## ✅ AHORA (Simplificado)

### Un solo archivo de configuración:
- `api.ts` (280 líneas) - **TODO EN UNO**

### Uso simple y directo:
```typescript
// Importación simple
import { apiClient, API_ENDPOINTS } from './config/api';

// Uso directo y claro
const response = await apiClient.get('cognitiveTask', 'getByResearch', { researchId: '123' });
```

## 🔄 MIGRACIÓN PASO A PASO

### 1. **Reemplazar importaciones**

**ANTES:**
```typescript
import { ApiClient } from './config/api-client';
import API_CONFIG from './config/api.config';
import { API_HTTP_ENDPOINT } from './api/endpoints';
```

**AHORA:**
```typescript
import { apiClient, API_ENDPOINTS, API_BASE_URL } from './config/api';
```

### 2. **Simplificar llamadas a la API**

**ANTES:**
```typescript
// Configuración compleja
const endpointManager = new ApiEndpointManager();
const apiClient = new ApiClient();

// Llamada con múltiples parámetros
const url = endpointManager.getEndpoint('research', 'getById', { id: '123' });
const research = await apiClient.get<Research>('research', 'getById', { id: '123' });
```

**AHORA:**
```typescript
// Llamada directa y simple
const research = await apiClient.get<Research>('research', 'getById', { id: '123' });
```

### 3. **Autenticación simplificada**

**ANTES:**
```typescript
// Manejo complejo de tokens
apiClient.setAuthToken(token);
apiClient.ensureAuthToken(); // Método interno complejo
```

**AHORA:**
```typescript
// Manejo directo
apiClient.setAuthToken(token);
// El token se usa automáticamente en todas las peticiones
```

### 4. **Manejo de errores**

**ANTES:**
```typescript
try {
  const data = await apiClient.get('research', 'getById', { id: '123' });
} catch (error) {
  if (error instanceof ApiError && error.statusCode === 404) {
    // Manejo específico
  }
}
```

**AHORA:**
```typescript
try {
  const data = await apiClient.get('research', 'getById', { id: '123' });
} catch (error) {
  if (error instanceof ApiError && error.statusCode === 404) {
    // Mismo manejo, pero más simple
  }
}
```

## 📋 EJEMPLOS DE USO

### **Autenticación:**
```typescript
import { apiClient } from './config/api';

// Login
const authResponse = await apiClient.post('auth', 'login', {
  email: 'user@example.com',
  password: 'password'
});

// Establecer token
apiClient.setAuthToken(authResponse.token);
```

### **Investigaciones:**
```typescript
// Obtener todas las investigaciones
const researches = await apiClient.get('research', 'getAll');

// Obtener investigación específica
const research = await apiClient.get('research', 'getById', { id: '123' });

// Crear nueva investigación
const newResearch = await apiClient.post('research', 'create', {
  title: 'Nueva Investigación',
  description: 'Descripción'
});
```

### **Eye Tracking:**
```typescript
// Obtener configuración por investigación
const config = await apiClient.get('eyeTrackingRecruit', 'getConfigByResearch', {
  researchId: '123'
});

// Crear configuración
const newConfig = await apiClient.post('eyeTrackingRecruit', 'createConfig', {
  researchId: '123',
  settings: { /* configuración */ }
}, { researchId: '123' });
```

### **SmartVOC:**
```typescript
// Obtener SmartVOC por investigación
const smartVoc = await apiClient.get('smartVoc', 'getByResearch', {
  researchId: '123'
});

// Actualizar SmartVOC
const updatedSmartVoc = await apiClient.put('smartVoc', 'update', {
  questions: [/* nuevas preguntas */]
}, { researchId: '123' });
```

## 🗑️ ARCHIVOS A ELIMINAR

Una vez migrado, puedes eliminar estos archivos:

- `api-client.ts` (376 líneas)
- `api.config.ts` (216 líneas)
- `api-endpoints.ts` (127 líneas)
- `api-endpoints.js` (61 líneas)
- `endpoints.json` (67 líneas)
- `outputs.json` (9 líneas)
- `alova.config.ts` (15 líneas) - ya deprecated
- `api-setup.ts` (21 líneas) - funcionalidad mínima

**Total a eliminar: ~1,000 líneas de código sobrecomplicado**

## ✅ BENEFICIOS DE LA MIGRACIÓN

1. **Reducción de complejidad:** De 8 archivos a 1
2. **Menos líneas de código:** De ~1,000 a ~280 líneas
3. **Uso más simple:** Una sola importación
4. **Mantenimiento más fácil:** Un solo archivo para mantener
5. **Menos errores:** Eliminación de configuraciones duplicadas
6. **Mejor tipado:** TypeScript más directo y claro

## 🚨 IMPORTANTE

- **Mantener compatibilidad:** La nueva API mantiene la misma funcionalidad
- **Migración gradual:** Puedes migrar archivo por archivo
- **Testing:** Verificar que todas las llamadas funcionen correctamente
- **Documentación:** Actualizar documentación de servicios

---

**Resultado:** Configuración API **70% más simple** y **más fácil de mantener** 🎉
