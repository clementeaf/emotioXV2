# Documentación de WelcomeScreen en EmotioXV2

## Introducción

El componente WelcomeScreen permite configurar la pantalla de bienvenida que verán los participantes al iniciar una investigación. Esta documentación detalla el flujo completo desde el frontend hasta el backend, incluyendo la estructura de datos, validación, almacenamiento y recuperación.

## Arquitectura General

El sistema de WelcomeScreen está compuesto por las siguientes partes:

1. **Interfaces compartidas**: Definidas en `shared/interfaces/welcome-screen.interface.ts`
2. **Backend**:
   - Modelo: `backendV2/src/models/welcomeScreen.model.ts`
   - Servicio: `backendV2/src/services/welcomeScreen.service.ts`
   - Controlador: `backendV2/src/controllers/welcomeScreen.controller.ts`
3. **Frontend**:
   - Componentes: `frontend/src/components/research/WelcomeScreen/`
   - Servicio: `frontend/src/services/welcomeScreen.service.ts`
   - Hook personalizado: `frontend/src/components/research/WelcomeScreen/hooks/useWelcomeScreenForm.ts`

## Estructura de Datos

### Interfaces Principales

```typescript
// Configuración básica de la pantalla de bienvenida
export interface WelcomeScreenConfig {
  isEnabled: boolean;         // Si la pantalla está habilitada
  title: string;              // Título a mostrar
  message: string;            // Mensaje principal
  startButtonText: string;    // Texto del botón para comenzar
  metadata?: {                // Metadatos opcionales
    lastUpdated?: Date;
    version?: string;
    lastModifiedBy?: string;
  };
}

// Datos del formulario (sin metadatos)
export type WelcomeScreenFormData = Omit<WelcomeScreenConfig, 'metadata'>;

// Registro completo para almacenamiento
export interface WelcomeScreenRecord extends WelcomeScreenConfig {
  id: string;                 // ID único
  researchId: string;         // ID de la investigación asociada
  createdAt: Date;            // Fecha de creación
  updatedAt: Date;            // Fecha de última actualización 
}
```

## Ciclo de Vida de una Pantalla de Bienvenida

### 1. Creación Inicial

Cuando se accede a la configuración de pantalla de bienvenida para una nueva investigación:

1. El frontend carga el componente `WelcomeScreenForm` pasando el `researchId`
2. El hook `useWelcomeScreenForm` consulta al backend para verificar si existe una configuración:
   ```typescript
   const { data: welcomeScreenData } = useQuery({
     queryKey: ['welcomeScreen', researchId],
     queryFn: async () => {
       return await welcomeScreenService.getByResearchId(researchId);
     }
   });
   ```
3. Al no encontrar configuración existente, se inicializa el formulario con valores predeterminados:
   ```typescript
   setFormData({ 
     ...DEFAULT_WELCOME_SCREEN_CONFIG,
     researchId 
   });
   ```

### 2. Guardado Inicial (POST)

Cuando el usuario completa el formulario y guarda por primera vez:

1. Se validan los datos en el frontend:
   ```typescript
   const validateForm = () => {
     const errors = {};
     if (formData.isEnabled) {
       if (!formData.title?.trim()) errors.title = 'El título es obligatorio';
       // otras validaciones...
     }
     return Object.keys(errors).length === 0;
   };
   ```

2. Se envía una petición POST al backend:
   ```typescript
   // En el frontend
   const savedData = await welcomeScreenService.create(formData);
   
   // El servicio en el frontend realiza:
   async create(data) {
     const response = await fetch(this.baseUrl, {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${token}`, ... },
       body: JSON.stringify(data)
     });
     // ...
   }
   ```

3. El backend procesa la solicitud:
   - El controlador `welcomeScreen.controller.ts` recibe la petición
   - Llama al servicio `welcomeScreenService.create(data, researchId, userId)`
   - El servicio valida los datos y llama al modelo `welcomeScreenModel.create(data, researchId)`
   - El modelo guarda en DynamoDB y devuelve el registro creado

4. El frontend actualiza la UI con los datos guardados

### 3. Consulta de Configuración Existente

Cuando se accede a una investigación que ya tiene configuración de pantalla de bienvenida:

1. El hook `useWelcomeScreenForm` consulta igual que en el paso 1
2. Al encontrar configuración existente, inicializa el formulario con esos datos:
   ```typescript
   if (welcomeScreenData) {
     setExistingScreen(welcomeScreenData);
     setFormData({
       id: welcomeScreenData.id,
       researchId: welcomeScreenData.researchId,
       isEnabled: welcomeScreenData.isEnabled,
       title: welcomeScreenData.title,
       message: welcomeScreenData.message,
       startButtonText: welcomeScreenData.startButtonText
     });
   }
   ```

### 4. Actualización (PUT)

Cuando el usuario modifica una configuración existente:

1. Se validan los datos igual que en el paso 2.1
2. Se detecta que hay una configuración existente y se envía una petición PUT:
   ```typescript
   // En el frontend (en handleSave)
   if (existingScreen) {
     savedData = await welcomeScreenService.update(researchId, formData);
   }
   
   // El servicio en el frontend realiza:
   async update(researchId, data) {
     const response = await fetch(`${this.baseUrl}/${data.id}`, {
       method: 'PUT',
       // headers, body, etc.
     });
     // ...
   }
   ```
3. El backend procesa de forma similar al paso 2.3 pero llamando a `welcomeScreenModel.update()`

### 5. Previsualización

El sistema permite previsualizar la pantalla de bienvenida antes de guardar:

1. El usuario hace clic en "Vista previa"
2. Se validan los datos
3. Se genera una representación HTML simple:
   ```typescript
   const generateHtmlPreview = () => {
     const html = `
       <html>
         <head>
           <title>Vista previa: ${formData.title}</title>
           <style>/* ... */</style>
         </head>
         <body>
           <h1>${formData.title}</h1>
           <p>${formData.message}</p>
           <button>${formData.startButtonText}</button>
         </body>
       </html>
     `;
     // Crear y abrir el blob HTML
   };
   ```

## Rutas API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/welcome-screens/research/:researchId` | Obtiene la pantalla de bienvenida por ID de investigación |
| POST | `/welcome-screens` | Crea una nueva pantalla de bienvenida |
| PUT | `/welcome-screens/:id` | Actualiza una pantalla existente |
| GET | `/welcome-screens/:id` | Obtiene pantalla por ID |
| DELETE | `/welcome-screens/:id` | Elimina una pantalla de bienvenida |

## Modelo de DynamoDB

Las pantallas de bienvenida se almacenan en la tabla principal con la siguiente estructura:

```
{
  id: "uuid-de-la-pantalla",          // Partition key
  sk: "WELCOME_SCREEN#uuid",          // Sort key
  researchId: "uuid-investigacion",   // GSI para búsquedas
  isEnabled: boolean,
  title: string,
  message: string,
  startButtonText: string,
  metadata: string,                   // JSON serializado
  createdAt: string,                  // ISO date string
  updatedAt: string                   // ISO date string
}
```

Se utiliza un GSI (Índice Secundario Global) sobre `researchId` para permitir búsquedas eficientes por investigación.

## Validación

### Backend

El backend valida:
- Título: No vacío, longitud mínima 3, máxima 100
- Mensaje: Longitud máxima 1000
- Texto de botón: No vacío, longitud mínima 2, máxima 50

### Frontend

El frontend valida:
- Campos requeridos cuando la pantalla está habilitada
- Formato y longitud de los campos

## Consideraciones

1. **Una pantalla por investigación**: Cada investigación puede tener como máximo una pantalla de bienvenida.
2. **Habilitación/deshabilitación**: Una pantalla puede estar deshabilitada pero seguir existiendo en la base de datos.
3. **Versionado**: El sistema mantiene un control de versiones simple mediante el campo `metadata.version`.

## Flujo de Datos Completo

```
┌─────────────┐      ┌───────────────┐      ┌────────────────┐      ┌─────────┐
│  Componente  │─────▶│     Hook      │─────▶│    Servicio    │─────▶│   API   │
│  React UI    │◀─────│  React Query  │◀─────│    Frontend    │◀─────│Backend  │
└─────────────┘      └───────────────┘      └────────────────┘      └────┬────┘
                                                                         │
                                                                         ▼
                                                                    ┌────────────┐
                                                                    │ Controlador│
                                                                    │  Backend   │
                                                                    └────┬───────┘
                                                                         │
                                                                         ▼
                                                                    ┌────────────┐
                                                                    │  Servicio  │
                                                                    │  Backend   │
                                                                    └────┬───────┘
                                                                         │
                                                                         ▼
                                                                    ┌────────────┐
                                                                    │   Modelo   │
                                                                    │  Backend   │
                                                                    └────┬───────┘
                                                                         │
                                                                         ▼
                                                                    ┌────────────┐
                                                                    │  DynamoDB  │
                                                                    └────────────┘
``` 