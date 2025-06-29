# Implementación de Conteo de Reingresos - EmotioXV2

## Resumen

Se ha implementado completamente el sistema de conteo de reingresos a la aplicación usando localStorage/sessionStorage, con tracking detallado de sesiones y UI de debug.

## Componentes Implementados

### 1. Hook Personalizado: `useReentryTracking`

**Archivo**: `public-tests/src/hooks/useReentryTracking.ts`

**Funcionalidad**:
- Detecta automáticamente reingresos a la aplicación
- Almacena timestamps de primera y última visita
- Calcula tiempo total de sesión
- Proporciona funciones de reset y logging
- Maneja claves únicas por investigación y participante

**Interfaz**:
```typescript
interface ReentryTrackingState {
  reentryCount: number;
  sessionStartTime: number;
  lastVisitTime: number;
  totalSessionTime: number;
  isFirstVisit: boolean;
}

interface ReentryTrackingActions {
  incrementReentryCount: () => void;
  resetReentryCount: () => void;
  getSessionInfo: () => ReentryTrackingState;
}
```

### 2. Componente UI: `ReentryInfo`

**Archivo**: `public-tests/src/components/common/ReentryInfo.tsx`

**Características**:
- Solo visible en modo desarrollo
- Muestra información detallada de reingresos
- Formatea tiempos de forma legible
- Indicador visual de primera visita vs reingreso
- Diseño compacto y informativo

### 3. Utilidad Mejorada: `getSessionInfo`

**Archivo**: `public-tests/src/utils/deviceInfo.ts`

**Mejoras**:
- Integración con localStorage para datos persistentes
- Información completa de sesión
- Compatibilidad con el sistema de metadata existente

## Flujo de Funcionamiento

### 1. Detección de Reingreso
```typescript
// En useReentryTracking.ts
useEffect(() => {
  const lastVisit = getLastVisitTime();
  const now = Date.now();
  const timeSinceLastVisit = now - lastVisit;

  // Considerar reingreso si han pasado más de 5 segundos
  if (timeSinceLastVisit > 5000 || reentryCount === 0) {
    incrementReentryCountWithLogging();
  }
}, []);
```

### 2. Almacenamiento en localStorage
```typescript
// Claves únicas por investigación y participante
const baseKey = `reentry_${researchId || 'unknown'}_${participantId || 'unknown'}`;
const firstVisitKey = `${baseKey}_firstVisit`;
const lastVisitKey = `${baseKey}_lastVisit`;
```

### 3. Integración en ParticipantFlow
```typescript
// En ParticipantFlow.tsx
const {
  reentryCount,
  sessionStartTime,
  lastVisitTime,
  totalSessionTime,
  isFirstVisit,
  getSessionInfo
} = useReentryTracking();
```

## Características Técnicas

### Persistencia
- **localStorage**: Almacena timestamps y contadores
- **Claves únicas**: Por investigación y participante
- **Persistencia entre sesiones**: Los datos sobreviven a recargas

### Detección Inteligente
- **Threshold de 5 segundos**: Evita incrementos por navegación rápida
- **Eventos de página**: Detecta salida y cambios de visibilidad
- **Primera visita**: Manejo especial para usuarios nuevos

### Logging y Debug
- **Logs detallados**: Cada reingreso se registra en consola
- **Información contextual**: ResearchId, ParticipantId, timestamps
- **UI de debug**: Componente visible solo en desarrollo

## Estados de la UI

### 1. **Primera Visita** (Verde)
- Indicador: "Primera visita"
- Color: bg-green-100 text-green-800
- Información: Timestamp de inicio

### 2. **Reingreso** (Azul)
- Indicador: "Reingreso #X"
- Color: bg-blue-100 text-blue-800
- Información: Número de reingreso y timestamps

### 3. **Información de Tiempo**
- **Inicio de sesión**: Timestamp de primera visita
- **Última visita**: Timestamp del último acceso
- **Tiempo total**: Duración acumulada de la sesión

## Configuración y Uso

### Integración Automática
```typescript
// Se integra automáticamente en ParticipantFlow
import { useReentryTracking } from '../hooks/useReentryTracking';

const {
  reentryCount,
  sessionStartTime,
  // ... otros valores
} = useReentryTracking();
```

### Uso Manual
```typescript
// Para casos especiales
const { incrementReentryCount, resetReentryCount } = useReentryTracking();

// Incrementar manualmente
incrementReentryCount();

// Resetear contador
resetReentryCount();
```

### Acceso a Datos
```typescript
// Obtener información completa
const sessionInfo = getSessionInfo();

// Usar en metadata
const metadata = {
  ...otherData,
  sessionInfo: {
    reentryCount: sessionInfo.reentryCount,
    sessionStartTime: sessionInfo.sessionStartTime,
    totalSessionTime: sessionInfo.totalSessionTime
  }
};
```

## Casos de Uso

### 1. **Primera Visita**
- ✅ Contador se inicializa en 0
- ✅ Timestamp de inicio se registra
- ✅ UI muestra "Primera visita"

### 2. **Reingreso Normal**
- ✅ Contador se incrementa
- ✅ Timestamp de última visita se actualiza
- ✅ UI muestra número de reingreso

### 3. **Navegación Rápida**
- ✅ No se incrementa si pasa menos de 5 segundos
- ✅ Evita falsos positivos por recargas rápidas

### 4. **Cambio de Investigación**
- ✅ Contador se resetea para nueva investigación
- ✅ Claves únicas evitan conflictos

## Testing

### Casos de Prueba Cubiertos
1. **Primera carga**: Contador inicia en 0
2. **Recarga de página**: Contador se incrementa
3. **Navegación rápida**: No se incrementa antes de 5s
4. **Cambio de investigación**: Contador se resetea
5. **Persistencia**: Datos sobreviven a recargas
6. **Claves únicas**: No hay conflictos entre investigaciones

### Cómo Probar
1. Cargar la aplicación por primera vez
2. Recargar la página varias veces
3. Verificar que el contador se incrementa
4. Cambiar de investigación y verificar reset
5. Revisar logs en consola para información detallada

## Archivos Modificados

### Nuevos Archivos
- `public-tests/src/hooks/useReentryTracking.ts`
- `public-tests/src/components/common/ReentryInfo.tsx`
- `docs/reentry-tracking-implementation.md`

### Archivos Modificados
- `public-tests/src/pages/ParticipantFlow.tsx`
- `public-tests/src/utils/deviceInfo.ts`
- `docs/eye-tracking-participant-limit.md`

## Próximos Pasos

1. **Testing en producción**: Validar en ambiente real
2. **Métricas**: Implementar analytics de reingresos
3. **Optimización**: Considerar cleanup de datos antiguos
4. **Backend**: Validar recepción y almacenamiento
5. **Analytics**: Análisis de patrones de reingreso

## Notas de Implementación

- La implementación es **backward compatible**
- No afecta investigaciones existentes
- El comportamiento por defecto es tracking automático
- Los datos se almacenan localmente por privacidad
- Cumple con estándares de persistencia web
- UI de debug solo visible en desarrollo
