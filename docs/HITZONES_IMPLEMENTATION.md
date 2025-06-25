# 🎯 Implementación Completa de Hitzones en CognitiveTasks

## 📋 Resumen

Se ha implementado el flujo completo para enviar, persistir y consumir hitzones marcados en CognitiveTasks desde el frontend hacia el backend y public-tests.

## 🔄 Flujo Completo

### 1. **Frontend (Configuración)**
- **Ubicación**: `frontend/src/components/research/CognitiveTask/`
- **Componentes**: `LocalHitzoneEditor.tsx`, `SvgHitzoneEditor.tsx`, `FileUploadQuestion.tsx`
- **Funcionalidad**: Los usuarios pueden dibujar, editar y configurar hitzones sobre imágenes

### 2. **Mapeo de Datos (Frontend → Backend)**
- **Archivo**: `frontend/src/lib/cognitive-task-api.ts`
- **Función**: `mapHitzoneAreasToHitZones()`
- **Conversión**:
  ```typescript
  // Frontend (HitzoneArea)
  {
    id: string;
    x: number;
    y: number; 
    width: number;
    height: number;
  }
  
  // Backend (HitZone)
  {
    id: string;
    name: string;
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    fileId: string;
  }
  ```

### 3. **Backend (Persistencia)**
- **Ubicación**: `backendV2/src/services/cognitiveTask.service.ts`
- **Funcionalidad**: Almacena hitzones en la estructura `UploadedFile.hitZones[]`
- **Clonación**: Los hitzones se preservan al clonar investigaciones

### 4. **Mapeo de Datos (Backend → Frontend)**
- **Función**: `mapHitZonesToHitzoneAreas()`
- **Conversión**: Inversa del mapeo anterior para cargar datos existentes

### 5. **Public-tests (Consumo)**
- **Componentes actualizados**:
  - `NavigationFlowTask.tsx` - Para preguntas `navigation_flow`
  - `CognitiveNavigationFlowStep.tsx` - Para preguntas `preference_test`
- **Funcionalidad**: Lee hitzones dinámicamente desde la configuración del backend

## 🛠️ Cambios Técnicos Implementados

### Frontend
1. **API Client** (`cognitive-task-api.ts`):
   - ✅ `mapHitzoneAreasToHitZones()` - Mapeo frontend → backend
   - ✅ `mapHitZonesToHitzoneAreas()` - Mapeo backend → frontend  
   - ✅ `processDataFromBackend()` - Procesamiento de datos recibidos
   - ✅ `sanitizeDataForSave()` - Limpieza antes del envío

2. **Hook** (`useCognitiveTaskForm.ts`):
   - ✅ Integración con mapeo automático de hitzones
   - ✅ Preservación de hitzones en localStorage

### Backend
1. **Servicio** (`cognitiveTask.service.ts`):
   - ✅ Clonación de hitzones en `cloneFiles()`
   - ✅ Persistencia automática de estructura `HitZone[]`

### Public-tests
1. **Componentes dinámicos**:
   - ✅ `NavigationFlowTask.tsx` - Lee configuración desde backend
   - ✅ `CognitiveNavigationFlowStep.tsx` - Soporte para preference_test
   - ✅ Función `convertHitZonesToCoordinates()` - Conversión para renderizado

## 📊 Estructuras de Datos

### Shared Interface (`cognitive-task.interface.ts`)
```typescript
export interface HitZone {
  id: string;
  name: string;
  region: {
    x: number;      // Coordenada X (0-1)
    y: number;      // Coordenada Y (0-1) 
    width: number;  // Ancho (0-1)
    height: number; // Alto (0-1)
  };
  fileId: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  hitZones?: HitZone[];  // ✅ Hitzones persistidos
  s3Key?: string;
}
```

### Frontend Types (`types.ts`)
```typescript
export interface HitzoneArea {
  id: string;
  x: number;      // Coordenada X (0-1)
  y: number;      // Coordenada Y (0-1)
  width: number;  // Ancho (0-1) 
  height: number; // Alto (0-1)
}

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  hitzones?: HitzoneArea[];  // ✅ Hitzones en frontend
  s3Key?: string;
}
```

## 🎮 Tipos de Preguntas Soportadas

### 1. Navigation Flow (`navigation_flow`)
- **Propósito**: Pruebas de flujo de navegación
- **Comportamiento**: Seleccionar imagen → Hacer clic en hitzone → Enviar respuesta
- **Componente**: `NavigationFlowTask.tsx`

### 2. Preference Test (`preference_test`)
- **Propósito**: Pruebas A/B de preferencia
- **Comportamiento**: Seleccionar opción → Hacer clic en hitzone → Modal de confirmación
- **Componente**: `CognitiveNavigationFlowStep.tsx`

## 🔧 Funcionalidades del Editor

### LocalHitzoneEditor
- ✅ Dibujar rectángulos con mouse
- ✅ Seleccionar y eliminar zonas
- ✅ Modo de prueba interactivo
- ✅ Guardar configuración

### SvgHitzoneEditor  
- ✅ Funcionalidad avanzada de edición
- ✅ Redimensionar con handles
- ✅ Mover zonas arrastrando
- ✅ Vista previa de prueba

## 📱 Responsive y Coordenadas

### Sistema de Coordenadas
- **Valores**: 0-1 (porcentajes relativos)
- **Conversión**: `left: ${x}%`, `top: ${y}%`, `width: ${width}%`, `height: ${height}%`
- **Ventaja**: Funciona en cualquier resolución de pantalla

### Renderizado en Public-tests
```typescript
const convertHitZonesToCoordinates = (hitZones: any[]) => {
  return hitZones.map(zone => ({
    id: zone.id,
    x: zone.region.x,
    y: zone.region.y, 
    width: zone.region.width,
    height: zone.region.height
  }));
};
```

## 🚀 Estado de Implementación

### ✅ Completado
- [x] Mapeo bidireccional de estructuras de datos
- [x] Persistencia en backend
- [x] Consumo dinámico en public-tests
- [x] Soporte para navigation_flow y preference_test
- [x] Editor de hitzones funcional
- [x] Clonación de hitzones entre investigaciones
- [x] Builds exitosos en todos los proyectos

### 🎯 Flujo de Trabajo
1. **Configurar**: Usuario dibuja hitzones en frontend
2. **Guardar**: Frontend mapea y envía al backend
3. **Persistir**: Backend almacena en estructura HitZone[]
4. **Cargar**: Public-tests lee configuración dinámicamente
5. **Ejecutar**: Participantes interactúan con hitzones reales

## 🔍 Testing y Validación

### Verificación Manual
1. Crear pregunta navigation_flow o preference_test
2. Subir imagen y configurar hitzones
3. Guardar configuración
4. Verificar en public-tests que los hitzones aparecen correctamente
5. Probar interacción y envío de respuestas

### Logs de Debug
- Frontend: `[LocalHitzoneEditor]`, `[CognitiveTaskFixedAPI]`
- Backend: `[CLONE_FILES]`, `[MODEL:update]`
- Public-tests: `[NavigationFlowTask]`, `[CognitiveNavigationFlowStep]`

## 📈 Beneficios de la Implementación

1. **Flexibilidad**: Hitzones configurables sin hardcodear
2. **Escalabilidad**: Soporte para múltiples tipos de preguntas
3. **Mantenibilidad**: Mapeo automático de estructuras
4. **Usabilidad**: Editor visual intuitivo
5. **Robustez**: Fallbacks con datos de ejemplo
6. **Consistencia**: Flujo unificado frontend → backend → public-tests 