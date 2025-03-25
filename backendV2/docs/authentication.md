# Sistema de Autenticación de EmotioXV2

Este documento describe el sistema de autenticación utilizado en la API de EmotioXV2.

## Descripción General

El sistema de autenticación se basa en JSON Web Tokens (JWT) y sigue un proceso consistente en todos los controladores de la API. La implementación garantiza que los siguientes aspectos se manejen de manera uniforme:

1. Validación del token JWT
2. Extracción del ID de usuario
3. Verificación de permisos
4. Manejo de errores de autenticación

## Proceso de Autenticación

### 1. Obtención del Token

Los usuarios deben obtener un token JWT mediante el endpoint de login:

```
POST /auth/login
```

Con un payload que incluya credenciales válidas:

```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

La respuesta incluirá el token JWT:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1742904626000,
  "user": {
    "id": "user-id",
    "email": "usuario@ejemplo.com",
    "name": "Nombre Usuario",
    "role": "researcher"
  }
}
```

### 2. Uso del Token

Para las solicitudes autenticadas, el token debe incluirse en el header `Authorization` con el formato:

```
Authorization: Bearer <token>
```

### 3. Proceso de Validación

En cada controlador, el proceso de validación sigue este flujo:

1. Extracción del token del header `Authorization`
2. Validación del token utilizando la clave secreta
3. Extracción del ID de usuario y otros claims del payload
4. Asignación del ID de usuario al contexto de la solicitud
5. Verificación de permisos específicos según la ruta
6. Procesamiento de la solicitud o rechazo con error 401/403

## Implementación en Controladores

Todos los controladores (research, welcome-screen, etc.) implementan el mismo patrón para garantizar consistencia:

```typescript
// Extraer token de autorización
const authHeader = event.headers.Authorization || event.headers.authorization;
const token = authHeader ? authHeader.replace('Bearer ', '') : null;

// Verificar que existe token
if (!token) {
  return createResponse(401, { error: 'No autorizado' });
}

try {
  // Validar token y obtener información del usuario
  const payload = await authService.validateToken(token);
  userId = payload.id;
  
  // Añadir ID al contexto para los métodos del controlador
  event.requestContext.authorizer = event.requestContext.authorizer || {};
  event.requestContext.authorizer.claims = event.requestContext.authorizer.claims || {};
  event.requestContext.authorizer.claims.sub = userId;
  
  // Continuar con el procesamiento...
} catch (error) {
  return createResponse(401, { error: 'Token inválido o expirado' });
}
```

## Consideraciones de Seguridad

- Los tokens tienen un tiempo de expiración de 24 horas por defecto.
- La clave secreta para firmar tokens se configura mediante la variable de entorno `JWT_SECRET`.
- Se recomienda usar HTTPS para todas las comunicaciones.
- Los tokens no deben almacenarse en almacenamiento local inseguro (localStorage).

## Solución de Problemas

Si encuentras problemas con la autenticación:

1. Verifica que el token no ha expirado.
2. Asegúrate de incluir el prefijo `Bearer` antes del token.
3. Confirma que estás enviando el token en el header `Authorization`.
4. Revisa que el usuario tenga los permisos necesarios para la operación.

## Referencias

- [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [Documentación de jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) 