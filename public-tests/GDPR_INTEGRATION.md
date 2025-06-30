# 🔒 Integración de Consentimiento GDPR para Geolocalización

## 📋 Descripción General

Este documento describe la implementación del sistema de consentimiento GDPR para geolocalización en el proyecto EmotioXV2. El sistema incluye un modal de consentimiento, hooks personalizados para gestión de estado, y integración completa con el sistema de geolocalización existente.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **`GDPRConsentModal`** - Modal de consentimiento con texto legal GDPR
2. **`useGDPRConsent`** - Hook para gestión de estado de consentimiento
3. **`useGeolocationWithGDPR`** - Hook combinado de geolocalización + GDPR
4. **`GDPRGeolocationExample`** - Componente de ejemplo y testing

### Flujo de Funcionamiento

```
Usuario accede → Verificar consentimiento → Mostrar modal si es necesario →
Usuario decide → Guardar en localStorage → Proceder con geolocalización
```

## 📁 Estructura de Archivos

```
src/
├── components/
│   └── common/
│       ├── GDPRConsentModal.tsx          # Modal de consentimiento
│       └── GDPRGeolocationExample.tsx    # Componente de ejemplo
├── hooks/
│   ├── useGDPRConsent.ts                 # Hook de consentimiento
│   └── useGeolocationWithGDPR.ts         # Hook combinado
└── pages/
    └── GDPRTestPage.tsx                  # Página de testing
```

## 🔧 Uso Básico

### 1. Modal de Consentimiento Simple

```tsx
import { GDPRConsentModal } from './components/common/GDPRConsentModal';

function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAccept = () => {
    console.log('Usuario aceptó el consentimiento');
    setIsModalOpen(false);
  };

  const handleReject = () => {
    console.log('Usuario rechazó el consentimiento');
    setIsModalOpen(false);
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Solicitar Consentimiento
      </button>

      <GDPRConsentModal
        isOpen={isModalOpen}
        onAccept={handleAccept}
        onReject={handleReject}
        onClose={() => setIsModalOpen(false)}
        researchTitle="Mi Investigación"
      />
    </div>
  );
}
```

### 2. Hook de Consentimiento GDPR

```tsx
import { useGDPRConsent } from './hooks/useGDPRConsent';

function MyComponent() {
  const {
    consentState,
    isModalOpen,
    needsConsent,
    canUseGeolocation,
    requestConsent,
    handleAccept,
    handleReject,
    closeModal
  } = useGDPRConsent('research-123');

  return (
    <div>
      {needsConsent && (
        <button onClick={requestConsent}>
          Solicitar Consentimiento GDPR
        </button>
      )}

      {canUseGeolocation && (
        <div>Puede usar geolocalización</div>
      )}
    </div>
  );
}
```

### 3. Geolocalización con GDPR Integrado

```tsx
import { useGeolocationWithGDPR } from './hooks/useGeolocationWithGDPR';
import { GDPRConsentModal } from './components/common/GDPRConsentModal';

function MyComponent() {
  const {
    // Estado de geolocalización
    latitude,
    longitude,
    accuracy,
    city,
    country,
    isLoading,
    error,

    // Estado de GDPR
    needsGDPRConsent,
    canUseGeolocation,

    // Acciones
    requestLocation,
    retry,

    // Props del modal
    gdprModalProps
  } = useGeolocationWithGDPR({
    researchId: 'research-123',
    researchTitle: 'Investigación de Usabilidad',
    autoRequestConsent: true,
    enableHighAccuracy: true
  });

  return (
    <div>
      {/* Contenido de geolocalización */}
      {latitude && longitude && (
        <div>
          Ubicación: {latitude}, {longitude}
        </div>
      )}

      {/* Modal de consentimiento */}
      <GDPRConsentModal {...gdprModalProps} />
    </div>
  );
}
```

## 🔐 Gestión de Estado

### Estructura del Estado de Consentimiento

```typescript
interface GDPRConsentState {
  hasConsented: boolean | null;    // null = no decidido
  hasRejected: boolean;            // true si rechazó
  timestamp: number | null;        // timestamp de la decisión
  researchId?: string;             // ID de la investigación
}
```

### Persistencia en localStorage

El consentimiento se guarda automáticamente en `localStorage` con la clave `emotio_gdpr_consent`:

```json
{
  "hasConsented": true,
  "hasRejected": false,
  "timestamp": 1703123456789,
  "researchId": "research-123"
}
```

## 🧪 Testing

### Página de Test

Accede a la página de test en: `http://localhost:5173/#gdpr-test`

### Test Automatizado

Ejecuta el test automatizado con Playwright:

```bash
node test-gdpr-consent.mjs
```

### Casos de Test Cubiertos

- [x] Renderizado del modal GDPR
- [x] Aceptación de consentimiento
- [x] Rechazo de consentimiento
- [x] Persistencia en localStorage
- [x] Integración con geolocalización
- [x] Fallback a ubicación por IP
- [x] Estados de carga y error
- [x] Consentimiento específico por investigación

## 📱 Responsive Design

El modal está optimizado para dispositivos móviles:

- **Desktop**: Modal centrado con ancho máximo
- **Mobile**: Modal a pantalla completa con scroll
- **Tablet**: Modal adaptativo con padding optimizado

## 🎨 Personalización

### Props del Modal

```typescript
interface GDPRConsentModalProps {
  isOpen: boolean;                    // Controla visibilidad
  onAccept: () => void;              // Callback al aceptar
  onReject: () => void;              // Callback al rechazar
  onClose: () => void;               // Callback al cerrar
  researchTitle?: string;            // Título de la investigación
  className?: string;                // Clases CSS adicionales
}
```

### Opciones de Geolocalización

```typescript
interface GeolocationWithGDPROptions {
  researchId?: string;               // ID de la investigación
  researchTitle?: string;            // Título para el modal
  autoRequestConsent?: boolean;      // Solicitar automáticamente
  enableHighAccuracy?: boolean;      // Alta precisión GPS
  timeout?: number;                  // Timeout en ms
  fallbackToIP?: boolean;            // Fallback a IP
}
```

## 🔒 Cumplimiento GDPR

### Elementos de Cumplimiento

1. **Consentimiento Explícito**: El usuario debe hacer clic en "Aceptar"
2. **Información Clara**: Texto detallado sobre qué datos se recopilan
3. **Derechos del Usuario**: Información sobre derechos GDPR
4. **Retirada de Consentimiento**: Posibilidad de rechazar
5. **Persistencia**: Recordar la decisión del usuario
6. **Seguridad**: Datos encriptados y almacenados de forma segura

### Texto Legal Incluido

- Información sobre datos recopilados
- Propósito del tratamiento
- Derechos del usuario según GDPR
- Política de retención de datos
- Información de contacto

## 🚀 Integración con Investigaciones

### En ParticipantFlow

```tsx
// En el flujo de participantes
const { gdprModalProps, canUseGeolocation } = useGeolocationWithGDPR({
  researchId: researchId,
  researchTitle: research.title,
  autoRequestConsent: true
});

// Mostrar modal si es necesario
<GDPRConsentModal {...gdprModalProps} />
```

### En Backend

Los datos de consentimiento se envían junto con la ubicación:

```typescript
{
  location: {
    latitude: 40.4168,
    longitude: -3.7038,
    accuracy: 10,
    city: "Madrid",
    country: "Spain"
  },
  gdprConsent: {
    hasConsented: true,
    timestamp: 1703123456789,
    researchId: "research-123"
  }
}
```

## 🔧 Troubleshooting

### Problemas Comunes

1. **Modal no aparece**
   - Verificar que `isOpen` sea `true`
   - Comprobar que no haya consentimiento previo

2. **Geolocalización no funciona**
   - Verificar permisos del navegador
   - Comprobar que el usuario haya consentido

3. **localStorage no funciona**
   - Verificar que el navegador soporte localStorage
   - Comprobar que no esté en modo incógnito

### Debug

Usa el componente `GDPRGeolocationExample` para debugging:

```tsx
<GDPRGeolocationExample
  researchId="debug-research"
  onLocationObtained={(location) => console.log(location)}
/>
```

## 📈 Métricas y Analytics

### Datos Recopilados

- Tasa de aceptación de consentimiento
- Tiempo hasta decisión
- Tasa de rechazo
- Ubicaciones obtenidas vs rechazadas

### Logging

```typescript
const consentInfo = getConsentInfo();
console.log('Consentimiento GDPR:', consentInfo);
```

## 🔄 Actualizaciones Futuras

### Próximas Mejoras

- [ ] Soporte para múltiples tipos de consentimiento
- [ ] Integración con analytics de consentimiento
- [ ] A/B testing de textos legales
- [ ] Soporte para diferentes jurisdicciones
- [ ] Integración con sistema de auditoría

### Mantenimiento

- Revisar textos legales trimestralmente
- Actualizar según cambios en regulaciones GDPR
- Monitorear tasas de aceptación/rechazo
- Optimizar UX basado en feedback

---

## 📞 Soporte

Para preguntas sobre la implementación GDPR, contacta al equipo de desarrollo o consulta la documentación técnica adicional.
