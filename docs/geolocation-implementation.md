# Implementación de Geolocalización - EmotioXV2

## Resumen

Se ha implementado completamente el sistema de solicitud de permiso de geolocalización al usuario usando la Geolocation API, con fallback a ubicación por IP y UI informativa.

## Componentes Implementados

### 1. Hook Personalizado: `useGeolocation`

**Archivo**: `public-tests/src/hooks/useGeolocation.ts`

**Funcionalidad**:
- Solicita permiso de geolocalización al usuario
- Maneja diferentes estados de permisos (granted, denied, prompt, unsupported)
- Implementa fallback a ubicación por IP cuando falla la geolocalización
- Proporciona funciones de retry y manejo de errores
- Optimizado con `useMemo` y `useCallback`

**Interfaz**:
```typescript
interface GeolocationState {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  city?: string;
  country?: string;
  region?: string;
  ipAddress?: string;
  isLoading: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unsupported';
}
```

### 2. Componente UI: `LocationPermissionRequest`

**Archivo**: `public-tests/src/components/common/LocationPermissionRequest.tsx`

**Características**:
- UI informativa y profesional para solicitar permisos
- Estados visuales diferenciados para cada situación
- Botones de acción (Permitir ubicación, Reintentar)
- Información de debug en desarrollo
- Diseño responsive y accesible
- Manejo de casos edge (navegador no soportado, permisos denegados)

### 3. Hook de Integración: `useLocationTracking`

**Archivo**: `public-tests/src/hooks/useLocationTracking.ts`

**Funcionalidad**:
- Integra la geolocalización con la configuración de la investigación
- Verifica si el tracking de ubicación está habilitado
- Guarda automáticamente la ubicación en el store
- Maneja el estado de tracking (enabled/disabled)

### 4. Utilidad Mejorada: `getLocationInfo`

**Archivo**: `public-tests/src/utils/deviceInfo.ts`

**Mejoras**:
- Verificación de soporte de geolocalización
- Fallback robusto a ubicación por IP
- Mejor manejo de errores
- Información completa de ubicación (coordenadas + ciudad/país)

## Flujo de Funcionamiento

### 1. Verificación de Configuración
```typescript
// En useLocationTracking.ts
const isLocationTrackingEnabled = useCallback(() => {
  const possiblePaths = [
    eyeTrackingConfig.linkConfig?.trackLocation,
    eyeTrackingConfig.parameterOptions?.saveLocationInfo,
    eyeTrackingConfig.trackLocation
  ];
  const trackLocation = possiblePaths.find(value => value !== undefined);
  return trackLocation !== undefined ? Boolean(trackLocation) : false;
}, [eyeTrackingConfig]);
```

### 2. Solicitud de Permiso
```typescript
// En useGeolocation.ts
const position = await new Promise<GeolocationPosition>((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(resolve, reject, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  });
});
```

### 3. Fallback a IP
```typescript
// En useGeolocation.ts
const getLocationByIP = useCallback(async () => {
  const response = await fetch('https://ipapi.co/json/');
  const data = await response.json();
  return {
    city: data.city,
    country: data.country_name,
    region: data.region,
    ipAddress: data.ip
  };
}, []);
```

### 4. Integración en ParticipantFlow
```typescript
// En ParticipantFlow.tsx
{isLocationTrackingEnabled && (
  <div className="mb-6">
    <LocationPermissionRequest
      onLocationGranted={(location) => {
        console.log('Ubicación obtenida:', location);
      }}
      onLocationDenied={() => {
        console.log('Permiso de ubicación denegado');
      }}
      showFallbackInfo={true}
    />
  </div>
)}
```

## Estados de la UI

### 1. **Solicitud de Permiso** (Azul)
- Mensaje: "Permiso de ubicación requerido"
- Botón: "Permitir ubicación"
- Explicación del propósito

### 2. **Obteniendo Ubicación** (Azul con spinner)
- Mensaje: "Obteniendo ubicación..."
- Instrucciones para el usuario
- Spinner animado

### 3. **Ubicación Obtenida** (Verde)
- Coordenadas precisas
- Información de ciudad/país
- Indicador de precisión

### 4. **Ubicación Aproximada** (Amarillo)
- Información por IP
- Botón para intentar ubicación precisa
- Explicación del fallback

### 5. **Permiso Denegado** (Rojo)
- Mensaje de error
- Instrucciones para habilitar
- Botón de reintento

### 6. **Error** (Rojo)
- Mensaje de error específico
- Botón de reintento
- Información de debug

### 7. **No Soportado** (Amarillo)
- Mensaje de incompatibilidad
- Explicación del fallback

## Configuración en Frontend

### Formulario de Reclutamiento
**Archivo**: `frontend/src/components/research/EyeTracking/Recruit/RecruitEyeTrackingForm.tsx`

**Campo**: "Rastrear la ubicación de los participantes"

```typescript
<input
  type="checkbox"
  id="trackLocation"
  checked={formData.linkConfig.trackLocation}
  onChange={(e) => handleLinkConfigChange('trackLocation', e.target.checked)}
/>
```

## Casos de Uso

### 1. Configuración Habilitada + Usuario Permite
- ✅ Se obtiene ubicación precisa (GPS)
- ✅ Se muestra información completa
- ✅ Se guarda en el store automáticamente

### 2. Configuración Habilitada + Usuario Deniega
- ❌ No se obtiene ubicación precisa
- ✅ Se obtiene ubicación aproximada por IP
- ✅ Se muestra información de fallback

### 3. Configuración Deshabilitada
- ❌ No se solicita ubicación
- ❌ No se muestra componente de ubicación

### 4. Navegador No Soportado
- ❌ No se puede usar Geolocation API
- ✅ Se obtiene ubicación aproximada por IP
- ✅ Se muestra mensaje informativo

## Características Técnicas

### Robustez
- Maneja múltiples formatos de configuración
- Fallback automático a ubicación por IP
- Verificaciones de soporte del navegador
- Manejo completo de errores

### UX/UI
- Estados visuales claros y diferenciados
- Información contextual para cada estado
- Botones de acción útiles
- Información de debug en desarrollo

### Performance
- Hooks optimizados con `useMemo` y `useCallback`
- Renderizado condicional eficiente
- Timeout configurable (10 segundos por defecto)
- Cache de ubicación (60 segundos por defecto)

### Privacidad
- Solicitud explícita de permiso
- Información clara sobre el uso de datos
- Fallback respetuoso cuando se deniega
- Cumplimiento con estándares web

## Servicios de IP Utilizados

### ipapi.co
- **Endpoint**: `https://ipapi.co/json/`
- **Datos**: ciudad, país, región, IP
- **Gratuito**: Sí (con límites)
- **Precisión**: Ciudad/región

### Alternativas Consideradas
- `ip-api.com` - Gratuito, buena precisión
- `ipinfo.io` - Requiere API key, alta precisión
- `freegeoip.app` - Gratuito, precisión media

## Testing

### Casos de Prueba Cubiertos
1. **Configuración habilitada**: Se muestra componente de ubicación
2. **Configuración deshabilitada**: No se muestra componente
3. **Permiso concedido**: Se obtiene ubicación precisa
4. **Permiso denegado**: Se obtiene ubicación aproximada
5. **Navegador no soportado**: Fallback a IP funciona
6. **Error de red**: Manejo de errores apropiado
7. **Timeout**: Manejo de timeout configurado

### Cómo Probar
1. Configurar una investigación con `trackLocation: true`
2. Acceder desde un dispositivo con GPS
3. Verificar que se solicita permiso de ubicación
4. Aceptar/denegar permiso y verificar comportamiento
5. Verificar fallback a IP cuando sea necesario

## Archivos Modificados

### Nuevos Archivos
- `public-tests/src/hooks/useGeolocation.ts`
- `public-tests/src/hooks/useLocationTracking.ts`
- `public-tests/src/components/common/LocationPermissionRequest.tsx`
- `docs/geolocation-implementation.md`

### Archivos Modificados
- `public-tests/src/utils/deviceInfo.ts`
- `public-tests/src/pages/ParticipantFlow.tsx`
- `docs/eye-tracking-participant-limit.md`

## Próximos Pasos

1. **Testing en producción**: Validar en ambiente real
2. **Métricas**: Implementar tracking de aceptación/denegación
3. **Analytics**: Registrar precisión de ubicación obtenida
4. **Optimización**: Considerar cache de ubicación por IP
5. **Privacidad**: Implementar aviso de privacidad más detallado

## Notas de Implementación

- La implementación es **backward compatible**
- No afecta investigaciones existentes
- El comportamiento por defecto es no solicitar ubicación
- La configuración se puede cambiar dinámicamente
- El fallback a IP es automático y transparente
- Cumple con estándares de privacidad web
