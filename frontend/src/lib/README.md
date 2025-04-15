# API Client

## Estructura de la API

Este directorio contiene la configuración centralizada del cliente HTTP para la aplicación frontend. 
La implementación utiliza [Alova](https://github.com/alovajs/alova), un cliente HTTP para React.

## Archivos principales

- `api.ts`: Contiene la configuración de la instancia de Alova y todas las APIs disponibles
- `config/api.config.ts`: Contiene los endpoints configurados para cada servicio

## APIs disponibles

- `authAPI`: Autenticación (login, logout, refreshToken)
- `userAPI`: Gestión de usuarios
- `researchAPI`: Gestión de investigaciones
- `welcomeScreenAPI`: Pantallas de bienvenida 
- `thankYouScreenAPI`: Pantallas de agradecimiento
- `eyeTrackingAPI`: Funcionalidades de seguimiento ocular
- `smartVocAPI`: Funcionalidades de SmartVOC

## Compatibilidad

Nota: La importación debe hacerse desde `lib/api.ts`. El archivo `config/alova.config.ts` 
se mantiene solo por compatibilidad pero está marcado como obsoleto y será eliminado en el futuro.

## Ejemplo de uso

```typescript
import alovaInstance, { researchAPI } from '@/lib/api';

// Obtener investigaciones
const fetchResearches = async () => {
  try {
    const response = await researchAPI.list();
    return response.data;
  } catch (error) {
    console.error('Error al obtener investigaciones:', error);
    return [];
  }
};

// Llamada directa a endpoint personalizado
const customCall = async () => {
  const response = await alovaInstance.Get('/custom-endpoint');
  return response.data;
};
``` 