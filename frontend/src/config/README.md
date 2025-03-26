# Cliente API Dinámico para EmotioX

Este módulo implementa un cliente API dinámico que obtiene la configuración de endpoints directamente del archivo JSON generado por el backend. Esto elimina la necesidad de actualizar manualmente los endpoints cuando cambia la configuración del backend.

## Estructura

- `api-client.ts`: Implementación principal del cliente API dinámico
- `api-setup.ts`: Utilidades para inicializar el cliente API
- `endpoints.json`: Archivo generado por el backend con los endpoints disponibles

## Clases Principales

### `ApiEndpointManager`

Gestiona los endpoints de la API de forma dinámica, leyendo la configuración desde un archivo JSON.

```typescript
const endpointManager = new ApiEndpointManager(endpointsConfig);
const url = endpointManager.getEndpoint('auth', 'login');
```

### `ApiClient`

Cliente de API que utiliza el `ApiEndpointManager` para realizar peticiones HTTP.

```typescript
const response = await apiClient.get<User, 'users'>('users', 'getUser', { id: '123' });
```

## Servicios

Los servicios son módulos que utilizan el cliente API para realizar operaciones específicas:

- `authService`: Operaciones de autenticación y gestión de usuarios
- `researchService`: Gestión de investigaciones
- `smartVOCFormService`: Gestión de formularios SmartVOC
- `eyeTrackingService`: Gestión de configuraciones de Eye Tracking
- `welcomeScreenService`: Gestión de pantallas de bienvenida
- `thankYouScreenService`: Gestión de pantallas de agradecimiento

## Inicialización

Para inicializar el cliente API en tu aplicación:

```typescript
import { setupApiClient } from './config/api-setup';

// En el punto de entrada de la aplicación
setupApiClient();
```

## Uso de Servicios

```typescript
import { authService, researchService } from './services';

// Autenticación
await authService.login({ email: 'user@example.com', password: 'password' });

// Obtener investigaciones
const researches = await researchService.getAll();
```

## Gestión de Errores

Todos los servicios implementan un manejo de errores consistente. Los errores son capturados, registrados y luego propagados para que puedan ser manejados por los componentes.

El cliente API incluye una clase `ApiError` que proporciona información detallada sobre los errores:

```typescript
try {
  await researchService.getById(id);
} catch (error) {
  if (error instanceof ApiError && error.statusCode === 404) {
    // Manejar error de no encontrado
  } else {
    // Manejar otros errores
  }
}
```

## Autenticación

La autenticación se maneja automáticamente. El token se almacena en localStorage y se incluye en todas las peticiones. Cuando se cierra la sesión, el token se elimina.

## Extensión

Para agregar un nuevo servicio:

1. Crear un archivo en `src/services` con la interfaz de datos y las operaciones necesarias
2. Utilizar el cliente API para implementar las operaciones
3. Exportar el servicio desde `src/services/index.ts`

---

Este sistema ofrece una gestión completa de la comunicación con el backend, eliminando la necesidad de actualizar manualmente los endpoints y proporcionando una experiencia de desarrollo más agradable con tipado completo y manejo de errores consistente. 