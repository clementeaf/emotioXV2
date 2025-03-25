# API de EmotioXV2 - Documentación de Referencia

## Introducción

La API de EmotioXV2 permite gestionar investigaciones de seguimiento ocular, análisis cognitivo y predicción de atención. Esta API proporciona endpoints para la autenticación de usuarios y para realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre investigaciones.

**URL Base**: `http://localhost:3000/dev` (entorno de desarrollo local)

## Autenticación

Todos los endpoints de la API, excepto los de registro e inicio de sesión, requieren autenticación mediante un token JWT. El token debe incluirse en el encabezado de la solicitud de la siguiente manera:

```
Authorization: Bearer <token>
```

### Obtener un token (Inicio de sesión)

**Endpoint**: `POST /auth/login`

**Cuerpo de la solicitud**:
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

**Respuesta exitosa (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1742859331000,
  "user": {
    "id": "user-id",
    "email": "usuario@ejemplo.com",
    "name": "Nombre Usuario",
    "role": "user",
    "isActive": true,
    "isVerified": false,
    "tokens": [],
    "createdAt": 1742772894937,
    "updatedAt": 1742772894937,
    "loginCount": 0,
    "preferences": {
      "language": "es",
      "notifications": true,
      "theme": "light"
    }
  }
}
```

**Respuesta de error (400 Bad Request)**:
```json
{
  "message": "Credenciales inválidas"
}
```

### Registro de usuario

**Endpoint**: `POST /auth/register`

**Cuerpo de la solicitud**:
```json
{
  "name": "Nombre Usuario",
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

**Respuesta exitosa (200 OK)**:
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": "user-id",
    "email": "usuario@ejemplo.com",
    "name": "Nombre Usuario",
    "role": "user",
    "isActive": true,
    "isVerified": false,
    "tokens": [],
    "createdAt": 1742772894937,
    "updatedAt": 1742772894937,
    "loginCount": 0,
    "preferences": {
      "language": "es",
      "notifications": true,
      "theme": "light"
    }
  }
}
```

**Respuesta de error (400 Bad Request)**:
```json
{
  "message": "El correo electrónico ya está registrado"
}
```

### Obtener perfil de usuario actual

**Endpoint**: `GET /auth/me`

**Encabezados**:
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200 OK)**:
```json
{
  "user": {
    "id": "user-id",
    "email": "usuario@ejemplo.com",
    "name": "Nombre Usuario",
    "role": "user",
    "isActive": true,
    "isVerified": false,
    "tokens": [],
    "createdAt": 1742772894937,
    "updatedAt": 1742772894937,
    "loginCount": 0,
    "preferences": {
      "language": "es",
      "notifications": true,
      "theme": "light"
    }
  }
}
```

**Respuesta de error (401 Unauthorized)**:
```json
{
  "message": "Token inválido o expirado"
}
```

---

## Investigaciones (Research)

La API proporciona endpoints para gestionar investigaciones.

### Crear una nueva investigación

**Endpoint**: `POST /research`

**Encabezados**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Cuerpo de la solicitud**:
```json
{
  "name": "Nombre de la investigación",
  "enterprise": "Nombre de la empresa",
  "type": "eye-tracking",
  "technique": "Técnica utilizada",
  "description": "Descripción detallada de la investigación",
  "targetParticipants": 50,
  "objectives": ["Objetivo 1", "Objetivo 2"],
  "tags": ["tag1", "tag2"]
}
```

**Valores válidos para `type`**:
- `eye-tracking`: Seguimiento ocular
- `attention-prediction`: Predicción de atención
- `cognitive-analysis`: Análisis cognitivo
- `behavioural`: Comportamental

**Respuesta exitosa (201 Created)**:
```json
{
  "message": "Investigación creada exitosamente",
  "data": {
    "id": "research-id",
    "name": "Nombre de la investigación",
    "enterprise": "Nombre de la empresa",
    "type": "eye-tracking",
    "technique": "Técnica utilizada",
    "description": "Descripción detallada de la investigación",
    "targetParticipants": 50,
    "objectives": ["Objetivo 1", "Objetivo 2"],
    "tags": ["tag1", "tag2"],
    "status": "draft"
  }
}
```

**Nota**: Al crear una nueva investigación, se genera automáticamente una pantalla de bienvenida asociada a la investigación, pero esta se crea desactivada (`isEnabled: false`) por defecto. El investigador puede activarla y personalizar su contenido mediante los endpoints de pantallas de bienvenida o a través del switch en la interfaz de usuario.

**Respuesta de error (400 Bad Request)**:
```json
{
  "message": "Error de validación en los datos",
  "errors": {
    "name": "El nombre debe tener al menos 3 caracteres",
    "type": "El tipo debe ser uno de los siguientes: eye-tracking, attention-prediction, cognitive-analysis, behavioural"
  }
}
```

### Obtener todas las investigaciones del usuario

**Endpoint**: `GET /research/user`

**Encabezados**:
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200 OK)**:
```json
{
  "data": [
    {
      "id": "research-id-1",
      "name": "Investigación 1",
      "enterprise": "Empresa 1",
      "type": "eye-tracking",
      "technique": "Técnica 1",
      "description": "Descripción 1",
      "targetParticipants": 50,
      "objectives": ["Objetivo 1", "Objetivo 2"],
      "tags": ["tag1", "tag2"],
      "status": "draft"
    },
    {
      "id": "research-id-2",
      "name": "Investigación 2",
      "enterprise": "Empresa 2",
      "type": "attention-prediction",
      "technique": "Técnica 2",
      "description": "Descripción 2",
      "targetParticipants": 100,
      "objectives": ["Objetivo 1", "Objetivo 2"],
      "tags": ["tag3", "tag4"],
      "status": "active"
    }
  ]
}
```

**Respuesta cuando no hay investigaciones (200 OK)**:
```json
{
  "data": []
}
```

### Obtener una investigación por ID

**Endpoint**: `GET /research/:id`

**Parámetros de ruta**:
- `id`: ID de la investigación

**Encabezados**:
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200 OK)**:
```json
{
  "data": {
    "id": "research-id",
    "name": "Nombre de la investigación",
    "enterprise": "Nombre de la empresa",
    "type": "eye-tracking",
    "technique": "Técnica utilizada",
    "description": "Descripción detallada de la investigación",
    "targetParticipants": 50,
    "objectives": ["Objetivo 1", "Objetivo 2"],
    "tags": ["tag1", "tag2"],
    "status": "draft"
  }
}
```

**Respuesta de error (404 Not Found)**:
```json
{
  "message": "Investigación no encontrada"
}
```

### Actualizar una investigación

**Endpoint**: `PUT /research/:id`

**Parámetros de ruta**:
- `id`: ID de la investigación

**Encabezados**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Cuerpo de la solicitud** (solo es necesario incluir los campos que se desean actualizar):
```json
{
  "name": "Nuevo nombre",
  "description": "Nueva descripción",
  "status": "active"
}
```

**Valores válidos para `status`**:
- `draft`: Borrador
- `active`: Activa
- `completed`: Completada
- `canceled`: Cancelada

**Respuesta exitosa (200 OK)**:
```json
{
  "message": "Investigación actualizada exitosamente",
  "data": {
    "id": "research-id",
    "name": "Nuevo nombre",
    "enterprise": "Nombre de la empresa",
    "type": "eye-tracking",
    "technique": "Técnica utilizada",
    "description": "Nueva descripción",
    "targetParticipants": 50,
    "objectives": ["Objetivo 1", "Objetivo 2"],
    "tags": ["tag1", "tag2"],
    "status": "active"
  }
}
```

**Respuesta de error (400 Bad Request)**:
```json
{
  "message": "Error de validación en los datos",
  "errors": {
    "name": "El nombre debe tener al menos 3 caracteres",
    "status": "El estado debe ser uno de los siguientes: draft, active, completed, canceled"
  }
}
```

### Eliminar una investigación

**Endpoint**: `DELETE /research/:id`

**Parámetros de ruta**:
- `id`: ID de la investigación

**Encabezados**:
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200 OK)**:
```json
{
  "message": "Investigación eliminada exitosamente"
}
```

**Respuesta de error (404 Not Found)**:
```json
{
  "message": "Investigación no encontrada"
}
```

---

## Códigos de estado HTTP

La API utiliza los siguientes códigos de estado HTTP:

- `200 OK`: La solicitud se completó con éxito
- `201 Created`: El recurso se creó con éxito
- `400 Bad Request`: La solicitud contiene datos inválidos o falta algún campo requerido
- `401 Unauthorized`: No se proporcionó un token de autenticación válido
- `403 Forbidden`: El token es válido pero no tiene permisos para acceder al recurso
- `404 Not Found`: El recurso solicitado no existe
- `500 Internal Server Error`: Error interno del servidor

## Ejemplos de uso

### Flujo completo de operaciones CRUD

A continuación, se muestra un ejemplo de un flujo completo de operaciones CRUD utilizando curl.

#### 1. Iniciar sesión

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@ejemplo.com","password":"contraseña"}' \
  http://localhost:3000/dev/auth/login
```

#### 2. Crear una nueva investigación

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Investigación de usabilidad",
    "enterprise": "Mi Empresa",
    "type": "eye-tracking",
    "technique": "Seguimiento ocular",
    "description": "Estudio de usabilidad de nuestra aplicación web",
    "targetParticipants": 50,
    "objectives": ["Identificar problemas de usabilidad", "Mejorar la experiencia de usuario"],
    "tags": ["usabilidad", "web", "eyetracking"]
  }' \
  http://localhost:3000/dev/auth/research
```

#### 3. Obtener todas las investigaciones del usuario

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/dev/research/user
```

#### 4. Obtener una investigación específica

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/dev/research/<id>
```

#### 5. Actualizar una investigación

```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Investigación de usabilidad actualizada",
    "status": "active"
  }' \
  http://localhost:3000/dev/research/<id>
```

#### 6. Eliminar una investigación

```bash
curl -X DELETE \
  -H "Authorization: Bearer <token>" \
  http://localhost:3000/dev/research/<id>
```

## Scripts de utilidad para pruebas

Para facilitar las pruebas, se han desarrollado scripts de utilidad disponibles en el directorio `scripts/`:

- `login.sh`: Script para iniciar sesión y obtener un token
- `export-token.sh`: Script para exportar el token como variable de entorno

Consulta el archivo `scripts/README.md` para más información sobre cómo utilizar estos scripts.

## Pantallas de Bienvenida

Las pantallas de bienvenida permiten configurar la experiencia inicial de los participantes en una investigación. Estos endpoints permiten crear, obtener, actualizar y eliminar pantallas de bienvenida.

### Crear una pantalla de bienvenida

**Endpoint**: `POST /welcome-screens`

**Encabezados**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Parámetros de la URL**:
- `researchId`: ID de la investigación asociada (requerido)

**Cuerpo de la solicitud**:
```json
{
  "isEnabled": true,
  "title": "Bienvenido a nuestra investigación",
  "message": "Gracias por participar en este estudio. A continuación, le presentaremos una serie de tareas para evaluar su percepción visual.",
  "startButtonText": "Comenzar"
}
```

**Campos opcionales**:
- `isEnabled`: Booleano que indica si la pantalla está habilitada (predeterminado: `true`)
- `title`: Título de la pantalla (predeterminado: "Bienvenido")
- `message`: Texto descriptivo de la investigación
- `startButtonText`: Texto del botón para iniciar (predeterminado: "Comenzar")

**Respuesta exitosa (201 Created)**:
```json
{
  "message": "Pantalla de bienvenida creada exitosamente",
  "data": {
    "id": "welcome-screen-id",
    "researchId": "research-id",
    "isEnabled": true,
    "title": "Bienvenido a nuestra investigación",
    "message": "Gracias por participar en este estudio. A continuación, le presentaremos una serie de tareas para evaluar su percepción visual.",
    "startButtonText": "Comenzar",
    "createdAt": "2023-04-01T12:00:00Z",
    "updatedAt": "2023-04-01T12:00:00Z"
  }
}
```

### Obtener una pantalla de bienvenida por ID

**Endpoint**: `GET /welcome-screens/{id}`

**Encabezados**:
```
Authorization: Bearer <token>
```

**Parámetros de la URL**:
- `id`: ID de la pantalla de bienvenida

**Respuesta exitosa (200 OK)**:
```json
{
  "data": {
    "id": "welcome-screen-id",
    "researchId": "research-id",
    "isEnabled": true,
    "title": "Bienvenido a nuestra investigación",
    "message": "Gracias por participar en este estudio. A continuación, le presentaremos una serie de tareas para evaluar su percepción visual.",
    "startButtonText": "Comenzar",
    "createdAt": "2023-04-01T12:00:00Z",
    "updatedAt": "2023-04-01T12:00:00Z"
  }
}
```

### Obtener la pantalla de bienvenida de una investigación

**Endpoint**: `GET /research/{researchId}/welcome-screen`

**Encabezados**:
```
Authorization: Bearer <token>
```

**Parámetros de la URL**:
- `researchId`: ID de la investigación

**Respuesta exitosa (200 OK)**:
```json
{
  "data": {
    "id": "welcome-screen-id",
    "researchId": "research-id",
    "isEnabled": true,
    "title": "Bienvenido a nuestra investigación",
    "message": "Gracias por participar en este estudio. A continuación, le presentaremos una serie de tareas para evaluar su percepción visual.",
    "startButtonText": "Comenzar",
    "createdAt": "2023-04-01T12:00:00Z",
    "updatedAt": "2023-04-01T12:00:00Z"
  }
}
```

**Nota**: Si la investigación no tiene una pantalla de bienvenida configurada, se creará una predeterminada.

### Actualizar una pantalla de bienvenida

**Endpoint**: `PUT /welcome-screens/{id}`

**Encabezados**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Parámetros de la URL**:
- `id`: ID de la pantalla de bienvenida

**Cuerpo de la solicitud** (solo es necesario incluir los campos que se desean actualizar):
```json
{
  "isEnabled": false,
  "title": "Título actualizado",
  "message": "Mensaje actualizado",
  "startButtonText": "Iniciar ahora"
}
```

**Respuesta exitosa (200 OK)**:
```json
{
  "message": "Pantalla de bienvenida actualizada exitosamente",
  "data": {
    "id": "welcome-screen-id",
    "researchId": "research-id",
    "isEnabled": false,
    "title": "Título actualizado",
    "message": "Mensaje actualizado",
    "startButtonText": "Iniciar ahora",
    "createdAt": "2023-04-01T12:00:00Z",
    "updatedAt": "2023-04-01T12:30:00Z"
  }
}
```

### Actualizar o crear la pantalla de bienvenida de una investigación

**Endpoint**: `PUT /research/{researchId}/welcome-screen`

**Encabezados**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Parámetros de la URL**:
- `researchId`: ID de la investigación

**Cuerpo de la solicitud**:
```json
{
  "isEnabled": true,
  "title": "Título para la investigación específica",
  "message": "Bienvenido a la investigación específica",
  "startButtonText": "Iniciar"
}
```

**Respuesta exitosa (200 OK)**:
```json
{
  "message": "Pantalla de bienvenida actualizada exitosamente",
  "data": {
    "id": "welcome-screen-id",
    "researchId": "research-id",
    "isEnabled": true,
    "title": "Título para la investigación específica",
    "message": "Bienvenido a la investigación específica",
    "startButtonText": "Iniciar",
    "createdAt": "2023-04-01T12:00:00Z",
    "updatedAt": "2023-04-01T12:45:00Z"
  }
}
```

**Nota**: Si la investigación no tiene una pantalla de bienvenida, se creará una nueva. Si ya existe, se actualizará.

### Eliminar una pantalla de bienvenida

**Endpoint**: `DELETE /welcome-screens/{id}`

**Encabezados**:
```
Authorization: Bearer <token>
```

**Parámetros de la URL**:
- `id`: ID de la pantalla de bienvenida

**Respuesta exitosa (200 OK)**:
```json
{
  "message": "Pantalla de bienvenida eliminada exitosamente"
}
```

## Códigos de error comunes

Para todos los endpoints, los siguientes códigos de error pueden ocurrir:

- **400 Bad Request**: Datos inválidos o faltantes
- **401 Unauthorized**: Token de autenticación faltante o inválido
- **403 Forbidden**: No tiene permisos para acceder al recurso
- **404 Not Found**: Recurso no encontrado
- **500 Internal Server Error**: Error interno del servidor

### Errores específicos de pantallas de bienvenida

- **WELCOME_SCREEN_NOT_FOUND**: La pantalla de bienvenida solicitada no existe
- **INVALID_WELCOME_SCREEN_DATA**: Datos inválidos para la pantalla de bienvenida
- **RESEARCH_ID_REQUIRED**: Se requiere un ID de investigación
- **PERMISSION_DENIED**: No tiene permisos para gestionar esta pantalla de bienvenida
- **DATABASE_ERROR**: Error en la base de datos al procesar la operación 