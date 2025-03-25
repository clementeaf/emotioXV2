# Modelo de Pantallas de Bienvenida

Este documento describe el modelo de datos, la implementación y la estructura de las pantallas de bienvenida en EmotioXV2.

## Resumen

Las pantallas de bienvenida son componentes esenciales para la experiencia del participante en una investigación. Presentan información introductoria sobre el estudio y permiten al participante iniciar el proceso cuando esté listo.

## Estructura de datos

### Interfaces

```typescript
// Configuración básica de la pantalla de bienvenida
interface WelcomeScreenConfig {
  isEnabled: boolean;          // Si la pantalla está habilitada o no
  title: string;               // Título de la pantalla
  message: string;             // Mensaje descriptivo
  startButtonText: string;     // Texto del botón para comenzar
  metadata?: Record<string, any>; // Metadatos adicionales (opcional)
}

// Registro completo con IDs y timestamps
interface WelcomeScreenRecord extends WelcomeScreenConfig {
  id: string;                  // ID único de la pantalla
  researchId: string;          // ID de la investigación asociada
  createdAt: string;           // Fecha de creación (ISO 8601)
  updatedAt: string;           // Fecha de actualización (ISO 8601)
}

// Datos para formularios (sin metadatos)
type WelcomeScreenFormData = Omit<WelcomeScreenConfig, 'metadata'>;

// Formato para almacenamiento en DynamoDB
interface WelcomeScreenDynamoItem {
  id: string;                  // ID de la pantalla (partition key)
  sk: string;                  // Sort key (WELCOME_SCREEN#id)
  researchId: string;          // ID de la investigación (para GSI)
  isEnabled: boolean;          // Si está habilitada
  title: string;               // Título
  message: string;             // Mensaje
  startButtonText: string;     // Texto del botón
  metadata?: Record<string, any>; // Metadatos adicionales
  createdAt: string;           // Fecha de creación
  updatedAt: string;           // Fecha de actualización
}
```

### Valores predeterminados

```typescript
const DEFAULT_WELCOME_SCREEN_CONFIG: WelcomeScreenConfig = {
  isEnabled: true,
  title: 'Bienvenido',
  message: 'Gracias por participar en esta investigación.',
  startButtonText: 'Comenzar',
  metadata: {}
};
```

## Estructura en DynamoDB

Las pantallas de bienvenida se almacenan en la tabla principal de la aplicación con la siguiente estructura:

- **Partition Key (id)**: ID único generado para la pantalla
- **Sort Key (sk)**: Cadena con formato `WELCOME_SCREEN#${id}`
- **GSI (researchId-index)**: Índice utilizado para buscar pantallas por ID de investigación

## Métodos del modelo

### `create(data: WelcomeScreenFormData, researchId: string): Promise<WelcomeScreenRecord>`

Crea una nueva pantalla de bienvenida para una investigación específica.

- **Parámetros**:
  - `data`: Datos de la pantalla (título, mensaje, etc.)
  - `researchId`: ID de la investigación a la que pertenece
- **Retorna**: Objeto con la pantalla creada, incluyendo ID y timestamps
- **Comportamiento**:
  - Genera un UUID v4 para el nuevo registro
  - Completa los campos opcionales con valores predeterminados
  - Añade timestamps (createdAt, updatedAt)
  - Guarda en DynamoDB

### `getById(id: string): Promise<WelcomeScreenRecord | null>`

Recupera una pantalla de bienvenida por su ID.

- **Parámetros**:
  - `id`: ID de la pantalla a buscar
- **Retorna**: Objeto con la pantalla o null si no existe
- **Comportamiento**:
  - Realiza una consulta a DynamoDB con el ID
  - Transforma el resultado al formato WelcomeScreenRecord

### `getByResearchId(researchId: string): Promise<WelcomeScreenRecord | null>`

Obtiene la pantalla de bienvenida asociada a una investigación.

- **Parámetros**:
  - `researchId`: ID de la investigación
- **Retorna**: Objeto con la pantalla o null si no existe
- **Comportamiento**:
  - Utiliza el GSI `researchId-index` para buscar
  - Solo devuelve la primera coincidencia (normalmente habrá solo una)

### `update(id: string, data: Partial<WelcomeScreenFormData>): Promise<WelcomeScreenRecord>`

Actualiza una pantalla existente.

- **Parámetros**:
  - `id`: ID de la pantalla a actualizar
  - `data`: Datos parciales a actualizar
- **Retorna**: Objeto con la pantalla actualizada
- **Comportamiento**:
  - Verifica la existencia de la pantalla
  - Actualiza solo los campos proporcionados
  - Actualiza el timestamp (updatedAt)

### `delete(id: string): Promise<void>`

Elimina una pantalla de bienvenida.

- **Parámetros**:
  - `id`: ID de la pantalla a eliminar
- **Retorna**: Promesa vacía
- **Comportamiento**:
  - Elimina el registro de DynamoDB

### `createOrUpdate(researchId: string, data: WelcomeScreenFormData): Promise<WelcomeScreenRecord>`

Método combinado para crear o actualizar una pantalla según corresponda.

- **Parámetros**:
  - `researchId`: ID de la investigación
  - `data`: Datos completos de la pantalla
- **Retorna**: Objeto con la pantalla creada o actualizada
- **Comportamiento**:
  - Busca si ya existe una pantalla para la investigación
  - Si existe, la actualiza; si no, crea una nueva

## Validaciones en el Servicio

El servicio de pantallas de bienvenida realiza las siguientes validaciones:

### Validación de título
- No puede estar vacío
- Longitud mínima: 3 caracteres
- Longitud máxima: 100 caracteres

### Validación de mensaje
- Longitud máxima: 1000 caracteres

### Validación de texto del botón
- No puede estar vacío
- Longitud mínima: 2 caracteres
- Longitud máxima: 50 caracteres

## Errores específicos

```typescript
enum WelcomeScreenError {
  NOT_FOUND = 'WELCOME_SCREEN_NOT_FOUND',
  INVALID_DATA = 'INVALID_WELCOME_SCREEN_DATA',
  RESEARCH_REQUIRED = 'RESEARCH_ID_REQUIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DATABASE_ERROR = 'DATABASE_ERROR'
}
```

## Ejemplo de uso

```typescript
// Crear una pantalla de bienvenida
const welcomeScreen = await welcomeScreenModel.create({
  isEnabled: true,
  title: 'Bienvenido a nuestra investigación',
  message: 'Gracias por participar en este estudio.',
  startButtonText: 'Iniciar'
}, 'research-id-123');

// Obtener una pantalla por ID de investigación
const screen = await welcomeScreenModel.getByResearchId('research-id-123');

// Actualizar una pantalla existente
const updatedScreen = await welcomeScreenModel.update(welcomeScreen.id, {
  title: 'Título actualizado'
});

// Eliminar una pantalla
await welcomeScreenModel.delete(welcomeScreen.id);
```

## Integración con otros componentes

Las pantallas de bienvenida se relacionan con los siguientes componentes:

1. **Investigaciones**: Cada pantalla está asociada a una investigación específica
2. **Flujo de participante**: El participante ve la pantalla de bienvenida al iniciar su participación
3. **Configuración del estudio**: Los investigadores pueden personalizar la pantalla desde el panel de configuración

## Notas de implementación

- La pantalla de bienvenida es opcional y controlada por el campo `isEnabled`. Si está desactivada (`isEnabled: false`), el participante pasará directamente a la primera tarea.
- Una investigación puede tener como máximo una pantalla de bienvenida.
- Cuando se crea una nueva investigación, el sistema genera automáticamente una pantalla de bienvenida asociada a ella, pero esta se crea desactivada (`isEnabled: false`) por defecto. El investigador puede activarla mediante un switch en la interfaz de usuario.
- Si se solicita la pantalla de una investigación que no tiene una configurada, el sistema creará automáticamente una con valores predeterminados.
- Los metadatos son opcionales y pueden contener información adicional según las necesidades específicas de la implementación.

## Consideraciones futuras

Posibles mejoras para versiones futuras:

- Soporte para contenido enriquecido (HTML/Markdown) en el mensaje
- Personalización visual (colores, tamaños, etc.)
- Soporte para múltiples idiomas
- Inclusión de imágenes o logos 