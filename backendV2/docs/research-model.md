# Modelo de Investigación (Research)

## Descripción

El modelo de investigación (`Research`) representa un estudio de seguimiento ocular, análisis cognitivo o predicción de atención. Este documento detalla la estructura de datos, las validaciones aplicadas y las operaciones disponibles sobre este modelo.

## Estructura de datos

| Campo | Tipo | Descripción | Requerido | Validaciones |
|-------|------|-------------|-----------|--------------|
| `id` | String | Identificador único de la investigación | Sí (generado) | Formato UUID v4 |
| `userId` | String | ID del usuario propietario | Sí | Formato UUID v4 |
| `name` | String | Nombre de la investigación | Sí | Mínimo 3 caracteres |
| `enterprise` | String | Nombre de la empresa | Sí | Mínimo 2 caracteres |
| `type` | String | Tipo de investigación | Sí | Debe ser uno de: "eye-tracking", "attention-prediction", "cognitive-analysis", "behavioural" |
| `technique` | String | Técnica utilizada | No | - |
| `description` | String | Descripción detallada | No | - |
| `targetParticipants` | Number | Número objetivo de participantes | No | Debe ser un número positivo |
| `currentParticipants` | Number | Número actual de participantes | No (default: 0) | Debe ser un número positivo |
| `objectives` | Array<String> | Lista de objetivos | No | - |
| `tags` | Array<String> | Etiquetas para categorizar | No | - |
| `status` | String | Estado de la investigación | No (default: "draft") | Debe ser uno de: "draft", "active", "completed", "canceled" |
| `createdAt` | Number | Fecha de creación (timestamp) | Sí (generado) | - |
| `updatedAt` | Number | Fecha de última actualización (timestamp) | Sí (generado) | - |
| `completedAt` | Number | Fecha de finalización (timestamp) | No | - |

## Tipos de investigación

### Seguimiento ocular (eye-tracking)

Estudios que registran y analizan los movimientos oculares de los participantes para entender su atención visual y comportamiento.

### Predicción de atención (attention-prediction)

Estudios que utilizan algoritmos para predecir dónde se centrará la atención de los usuarios en diferentes estímulos visuales.

### Análisis cognitivo (cognitive-analysis)

Estudios que evalúan los procesos cognitivos de los participantes al interactuar con estímulos o interfaces.

### Comportamental (behavioural)

Estudios que analizan patrones de comportamiento general de los usuarios frente a diferentes situaciones o interfaces.

## Estados de la investigación

| Estado | Descripción |
|--------|-------------|
| `draft` | Borrador - La investigación está en fase de configuración |
| `active` | Activa - La investigación está en curso |
| `completed` | Completada - La investigación ha finalizado satisfactoriamente |
| `canceled` | Cancelada - La investigación ha sido cancelada |

## Validaciones

El modelo implementa las siguientes validaciones:

1. **Campos requeridos**: 
   - `name`
   - `enterprise`
   - `type`

2. **Longitud mínima**:
   - `name`: 3 caracteres
   - `enterprise`: 2 caracteres

3. **Valores permitidos**:
   - `type`: ["eye-tracking", "attention-prediction", "cognitive-analysis", "behavioural"]
   - `status`: ["draft", "active", "completed", "canceled"]

4. **Valores numéricos**:
   - `targetParticipants`: Debe ser un número entero positivo
   - `currentParticipants`: Debe ser un número entero positivo

## Métodos CRUD

### Crear investigación

```typescript
async create(data: Partial<Research>): Promise<Research>
```

Crea una nueva investigación con los datos proporcionados. Genera automáticamente:
- `id`: UUID v4
- `createdAt`: Timestamp actual
- `updatedAt`: Mismo valor que `createdAt`
- `status`: "draft" (si no se especifica)
- `currentParticipants`: 0 (si no se especifica)

### Obtener todas las investigaciones de un usuario

```typescript
async getByUserId(userId: string): Promise<Research[]>
```

Recupera todas las investigaciones asociadas a un usuario específico.

### Obtener una investigación por ID

```typescript
async getById(id: string): Promise<Research | null>
```

Recupera una investigación específica por su ID. Retorna `null` si no existe.

### Actualizar una investigación

```typescript
async update(id: string, data: Partial<Research>): Promise<Research | null>
```

Actualiza una investigación existente con los datos proporcionados. Actualiza automáticamente el campo `updatedAt`. Retorna `null` si la investigación no existe.

### Eliminar una investigación

```typescript
async delete(id: string): Promise<boolean>
```

Elimina una investigación específica. Retorna `true` si se eliminó correctamente, `false` si la investigación no existía.

## Ejemplos de uso

### Ejemplo de objeto de investigación completo

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "7a1b9dc2-d1f3-4c4d-8a7e-9b8c6d5f4e3d",
  "name": "Estudio de usabilidad web",
  "enterprise": "TechCorp",
  "type": "eye-tracking",
  "technique": "Webcam eye-tracking remoto",
  "description": "Estudio para evaluar la usabilidad del nuevo diseño del sitio web corporativo",
  "targetParticipants": 50,
  "currentParticipants": 12,
  "objectives": [
    "Identificar problemas de navegación",
    "Evaluar la claridad de la jerarquía visual",
    "Medir el tiempo para completar tareas clave"
  ],
  "tags": ["usabilidad", "website", "eyetracking", "remoto"],
  "status": "active",
  "createdAt": 1684123456789,
  "updatedAt": 1684234567890,
  "completedAt": null
}
```

### Ejemplo de creación de investigación

```typescript
const newResearch = await researchModel.create({
  userId: "7a1b9dc2-d1f3-4c4d-8a7e-9b8c6d5f4e3d",
  name: "Estudio de usabilidad web",
  enterprise: "TechCorp",
  type: "eye-tracking",
  technique: "Webcam eye-tracking remoto",
  description: "Estudio para evaluar la usabilidad del nuevo diseño del sitio web corporativo",
  targetParticipants: 50,
  objectives: [
    "Identificar problemas de navegación",
    "Evaluar la claridad de la jerarquía visual",
    "Medir el tiempo para completar tareas clave"
  ],
  tags: ["usabilidad", "website", "eyetracking", "remoto"]
});
```

## Errores comunes

| Código | Mensaje | Causa |
|--------|---------|-------|
| `VALIDATION_ERROR` | "El campo 'name' es requerido" | Faltan campos obligatorios |
| `VALIDATION_ERROR` | "El tipo debe ser uno de los siguientes: eye-tracking, attention-prediction, cognitive-analysis, behavioural" | Valor no válido para el campo `type` |
| `NOT_FOUND` | "Investigación no encontrada" | El ID especificado no existe |
| `PERMISSION_DENIED` | "No tienes permiso para acceder a esta investigación" | El usuario no es propietario de la investigación |
| `DATABASE_ERROR` | "Error al conectar con la base de datos" | Problemas de conexión con DynamoDB |

## Recomendaciones para desarrolladores

1. **Validación de datos**: Siempre valide los datos recibidos antes de intentar operaciones de creación o actualización.
2. **Gestión de errores**: Implemente un manejo adecuado de excepciones para proporcionar mensajes de error claros.
3. **Índices secundarios**: Para consultas frecuentes, considere crear índices secundarios globales en DynamoDB.
4. **Transacciones**: Para operaciones complejas que modifican múltiples elementos, utilice transacciones para garantizar la consistencia de los datos.
5. **Paginación**: Implemente paginación para la recuperación de grandes conjuntos de datos.

## Extensiones futuras

El modelo de investigación puede extenderse en el futuro para incluir:

1. **Participantes**: Relación con un modelo de participantes que almacene información detallada.
2. **Resultados**: Almacenamiento de datos de resultados relacionados con cada investigación.
3. **Sesiones**: Registro de sesiones individuales de seguimiento ocular o análisis.
4. **Estímulos**: Catálogo de estímulos (imágenes, videos, sitios web) utilizados en la investigación.
5. **Colaboradores**: Permitir que múltiples usuarios colaboren en una misma investigación. 