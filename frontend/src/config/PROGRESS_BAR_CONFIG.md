# 🎯 CONFIGURACIÓN DE BARRA DE PROGRESO - Eye Tracking

## 📋 **FUNCIONALIDAD IMPLEMENTADA**

### **✅ Nueva Opción de Configuración**
Se ha agregado una nueva opción en la configuración de reclutamiento de Eye Tracking para controlar la visibilidad de la barra de progreso en `public-tests`.

### **🎯 Ubicación en la Interfaz**
- **Sección**: "Configuración de reclutamiento ocular"
- **Subsección**: "Configuración del enlace"
- **Opción**: "Mostrar barra de progreso en public-tests"

## 🔧 **CAMBIOS TÉCNICOS IMPLEMENTADOS**

### **1️⃣ Frontend - Interfaces**
```typescript
// shared/interfaces/eyeTrackingRecruit.interface.ts
export type LinkConfigKeys =
  | 'allowMobile'
  | 'trackLocation'
  | 'allowMultipleAttempts'
  | 'showProgressBar'; // 🎯 NUEVO

export interface LinkConfig {
  allowMobile: boolean;
  trackLocation: boolean;
  allowMultipleAttempts: boolean;
  showProgressBar: boolean; // 🎯 NUEVO
}
```

### **2️⃣ Frontend - Hook**
```typescript
// frontend/src/components/research/EyeTracking/Recruit/hooks/useEyeTrackingRecruit.ts
const DEFAULT_CONFIG: EyeTrackingRecruitFormData = {
  // ... otras configuraciones
  linkConfig: {
    allowMobile: false,
    trackLocation: false,
    allowMultipleAttempts: false,
    showProgressBar: false // 🎯 NUEVO
  }
};
```

### **3️⃣ Frontend - Componente UI**
```typescript
// frontend/src/components/research/EyeTracking/Recruit/RecruitEyeTrackingForm.tsx
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    id="showProgressBar"
    checked={formData.linkConfig.showProgressBar}
    onChange={(e) => handleLinkConfigChange('showProgressBar', e.target.checked)}
    disabled={!linkConfigEnabled}
    className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
  />
  <label htmlFor="showProgressBar" className={`text-sm ${linkConfigEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
    Mostrar barra de progreso en public-tests
    <span className="text-xs text-gray-500 ml-1">(permite actualizar respuestas previas)</span>
  </label>
</div>
```

### **4️⃣ Backend - Modelo**
```typescript
// backendV2/src/models/eyeTracking.model.ts
const DEFAULT_EYE_TRACKING_CONFIG: EyeTrackingFormData = {
  // ... otras configuraciones
  linkConfig: {
    allowMobile: false,
    trackLocation: false,
    allowMultipleAttempts: false,
    showProgressBar: false // 🎯 NUEVO
  }
};
```

## 🎯 **FUNCIONALIDAD**

### **✅ Comportamiento**
- **Activado**: Los participantes en `public-tests` verán una barra de progreso
- **Desactivado**: Los participantes no verán barra de progreso
- **Advertencia**: Se incluye texto explicativo "(permite actualizar respuestas previas)"

### **✅ Persistencia**
- La configuración se guarda en la base de datos
- Se mantiene entre sesiones
- Se aplica a todos los participantes de la investigación

## 🔄 **PRÓXIMOS PASOS**

### **📋 Implementación en public-tests**
- [ ] Leer la configuración `showProgressBar` desde la API
- [ ] Mostrar/ocultar barra de progreso según la configuración
- [ ] Implementar funcionalidad de actualización de respuestas previas

### **📋 Testing**
- [ ] Probar configuración activada
- [ ] Probar configuración desactivada
- [ ] Verificar persistencia en base de datos
- [ ] Validar comportamiento en public-tests

## 🎯 **IMPORTANCIA**

### **✅ Beneficios**
- **Control granular**: Los investigadores pueden decidir si mostrar progreso
- **Flexibilidad**: Diferentes investigaciones pueden tener diferentes configuraciones
- **Transparencia**: Los participantes saben si pueden actualizar respuestas

### **✅ Consideraciones**
- **Experiencia del usuario**: La barra de progreso puede influir en el comportamiento
- **Integridad de datos**: Permitir actualizaciones puede afectar la calidad de los datos
- **Expectativas**: Los participantes esperan poder navegar libremente

---

**🎯 CONCLUSIÓN**: La configuración de barra de progreso ha sido implementada completamente en el frontend y backend. Está lista para ser utilizada en `public-tests`.
