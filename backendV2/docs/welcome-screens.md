# Pantallas de Bienvenida - Guía de API

Este documento describe en detalle la API para gestionar pantallas de bienvenida en EmotioXV2.

## Descripción General

Las pantallas de bienvenida son componentes configurables que se muestran a los participantes al inicio de una investigación. Cada investigación puede tener una pantalla de bienvenida asociada.

## Endpoints

### Crear una pantalla de bienvenida

```
POST /welcome-screens
```

**Autenticación requerida**: Sí (Bearer Token)

**Permisos requeridos**: `researcher`

**Request Body**:

```json
{
  "title": "Bienvenido a la Investigación",
  "message": "Gracias por participar en este estudio...",
  "startButtonText": "Comenzar Experimento",
  "isEnabled": true,
  "researchId": "id-de-la-investigacion"
}
```

**Respuesta exitosa** (201 Created):

```json
{
  "message": "Pantalla de bienvenida creada exitosamente",
  "data": {
    "id": "id-de-la-pantalla",
    "researchId": "id-de-la-investigacion",
    "isEnabled": true,
    "title": "Bienvenido a la Investigación",
    "message": "Gracias por participar en este estudio...",
    "startButtonText": "Comenzar Experimento",
    "metadata": {
      "version": "1.0.0",
      "lastUpdated": "2025-03-24T12:22:10.226Z",
      "lastModifiedBy": "system"
    },
    "createdAt": "2025-03-24T12:22:10.226Z",
    "updatedAt": "2025-03-24T12:22:10.226Z"
  }
}
```

### Obtener pantalla de bienvenida por ID

```
GET /welcome-screens/{id}
```

**Autenticación requerida**: Sí (Bearer Token)

**Respuesta exitosa** (200 OK):

```json
{
  "data": {
    "id": "id-de-la-pantalla",
    "researchId": "id-de-la-investigacion",
    "isEnabled": true,
    "title": "Bienvenido a la Investigación",
    "message": "Gracias por participar en este estudio...",
    "startButtonText": "Comenzar Experimento",
    "metadata": {
      "version": "1.0.0",
      "lastUpdated": "2025-03-24T12:22:10.226Z",
      "lastModifiedBy": "system"
    },
    "createdAt": "2025-03-24T12:22:10.226Z",
    "updatedAt": "2025-03-24T12:22:10.226Z"
  }
}
```

### Obtener pantalla de bienvenida por ID de investigación

```
GET /welcome-screens/research/{researchId}
```

**Autenticación requerida**: Sí (Bearer Token)

**Respuesta exitosa** (200 OK):

```json
{
  "data": {
    "id": "id-de-la-pantalla",
    "researchId": "id-de-la-investigacion",
    "isEnabled": true,
    "title": "Bienvenido a la Investigación",
    "message": "Gracias por participar en este estudio...",
    "startButtonText": "Comenzar Experimento",
    "metadata": {
      "version": "1.0.0",
      "lastUpdated": "2025-03-24T12:22:10.226Z",
      "lastModifiedBy": "system"
    },
    "createdAt": "2025-03-24T12:22:10.226Z",
    "updatedAt": "2025-03-24T12:22:10.226Z"
  }
}
```

### Actualizar pantalla de bienvenida

```
PUT /welcome-screens/{id}
```

**Autenticación requerida**: Sí (Bearer Token)

**Permisos requeridos**: `researcher` y ser propietario de la pantalla

**Request Body**:

```json
{
  "title": "Título actualizado",
  "message": "Mensaje actualizado",
  "startButtonText": "Continuar",
  "isEnabled": false
}
```

**Respuesta exitosa** (200 OK):

```json
{
  "message": "Pantalla de bienvenida actualizada exitosamente",
  "data": {
    "id": "id-de-la-pantalla",
    "researchId": "id-de-la-investigacion",
    "isEnabled": false,
    "title": "Título actualizado",
    "message": "Mensaje actualizado",
    "startButtonText": "Continuar",
    "metadata": {
      "version": "1.0.0",
      "lastUpdated": "2025-03-24T13:15:45.000Z",
      "lastModifiedBy": "user-id"
    },
    "createdAt": "2025-03-24T12:22:10.226Z",
    "updatedAt": "2025-03-24T13:15:45.000Z"
  }
}
```

### Eliminar pantalla de bienvenida

```
DELETE /welcome-screens/{id}
```

**Autenticación requerida**: Sí (Bearer Token)

**Permisos requeridos**: `researcher` y ser propietario de la pantalla

**Respuesta exitosa** (200 OK):

```json
{
  "message": "Pantalla de bienvenida eliminada exitosamente"
}
```

## Modelo de Datos

Las pantallas de bienvenida tienen los siguientes campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | Identificador único (UUID) |
| researchId | string | ID de la investigación asociada |
| isEnabled | boolean | Si la pantalla está habilitada |
| title | string | Título principal de la pantalla |
| message | string | Mensaje descriptivo |
| startButtonText | string | Texto del botón de inicio |
| metadata | object | Metadatos adicionales |
| createdAt | string | Fecha de creación (ISO 8601) |
| updatedAt | string | Fecha de última actualización (ISO 8601) |

## Mensajes de Error

| Código | Mensaje | Descripción |
|--------|---------|-------------|
| 400 | Se requieren datos para crear la pantalla de bienvenida | El cuerpo de la petición está vacío |
| 400 | Se requiere un ID de investigación | No se proporcionó el ID de investigación |
| 401 | Usuario no autenticado | No se proporcionó un token válido |
| 403 | No tiene permisos para esta operación | El usuario no tiene permisos suficientes |
| 404 | Pantalla de bienvenida no encontrada | El ID proporcionado no existe |
| 500 | Error interno del servidor | Error inesperado en el servidor |

## Ejemplos de Uso

### curl

```bash
# Crear una pantalla de bienvenida
curl -X POST "https://api.ejemplo.com/welcome-screens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Bienvenido a la Investigación",
    "message": "Gracias por participar en este estudio...",
    "startButtonText": "Comenzar",
    "isEnabled": true,
    "researchId": "id-de-la-investigacion"
  }'

# Obtener por ID de investigación
curl -X GET "https://api.ejemplo.com/welcome-screens/research/id-de-la-investigacion" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notas Adicionales

- Cada investigación solo puede tener una pantalla de bienvenida asociada.
- Si se intenta crear una pantalla para una investigación que ya tiene una, se rechazará la solicitud.
- La actualización de una pantalla no permite cambiar el ID de investigación asociado. 