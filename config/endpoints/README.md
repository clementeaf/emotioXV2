# 🔄 ENDPOINTS DINÁMICOS - EmotioXV2

## 📁 **ESTRUCTURA DEL SISTEMA**

```
config/endpoints/
├── 📄 api-config.ts           # ✅ Configuración centralizada de endpoints
├── 📄 sync-script.sh          # ✅ Script de sincronización automática
├── 📄 dynamic-endpoints.js    # 🔄 Generado por backendV2 (automático)
├── 📄 centralized-config.ts   # 🔄 Generado por sync-script (automático)
├── 📄 sync-status.json        # 🔄 Estado de sincronización (automático)
└── 📄 README.md              # ✅ Esta documentación
```

## 🎯 **PROPÓSITO**

Este directorio centraliza toda la configuración de endpoints del proyecto EmotioXV2, integrando con el sistema dinámico de backendV2 para mantener sincronización automática entre todos los componentes.

## 🚀 **FUNCIONALIDADES**

### **✅ Sincronización Automática**
- Exporta endpoints desde backendV2 automáticamente
- Genera configuración centralizada
- Mantiene estado de sincronización
- Caché inteligente (5 minutos)

### **✅ Configuración Centralizada**
- Una sola fuente de verdad para endpoints
- Compatible con frontend y public-tests
- Fallbacks robustos
- Tipado TypeScript completo

### **✅ Integración Completa**
- Scripts de deployment automáticos
- Variables de entorno dinámicas
- Compatibilidad multi-entorno
- Documentación actualizada

## 📋 **ARCHIVOS GENERADOS**

### **🔄 dynamic-endpoints.js**
```javascript
// ARCHIVO GENERADO AUTOMÁTICAMENTE
export const API_ENDPOINTS = {
  http: "https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev",
  ws: "wss://w8dj7wxnl9.execute-api.us-east-1.amazonaws.com/dev",
  stage: "dev"
};
```

### **🔄 centralized-config.ts**
```typescript
export const CENTRALIZED_API_CONFIG = {
  http: "https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev",
  ws: "wss://w8dj7wxnl9.execute-api.us-east-1.amazonaws.com/dev",
  stage: "dev",
  frontend: "http://localhost:3000",
  publicTests: "http://localhost:4700"
};
```

### **🔄 sync-status.json**
```json
{
  "lastSync": "2025-01-11T12:00:00.000Z",
  "stage": "dev",
  "filesGenerated": ["dynamic-endpoints.js", "centralized-config.ts"],
  "backendVersion": "1.0.0"
}
```

## 🛠️ **USO**

### **Sincronización Manual**
```bash
# Sincronización básica
./config/endpoints/sync-script.sh

# Sincronización para producción
./config/endpoints/sync-script.sh --stage prod

# Sincronización con información detallada
./config/endpoints/sync-script.sh --verbose

# Sincronización forzada
./config/endpoints/sync-script.sh --force
```

### **Integración en Código**
```typescript
// Importar configuración centralizada
import { CENTRALIZED_API_CONFIG, getApiUrl } from './config/endpoints/centralized-config';

// Usar endpoints
const apiUrl = getApiUrl('/auth/login');
const wsUrl = CENTRALIZED_API_CONFIG.ws;
```

### **Integración en Scripts de Deployment**
```bash
# En scripts de deployment
./config/endpoints/sync-script.sh --stage prod --verbose
```

## 🔧 **CONFIGURACIÓN**

### **Variables de Entorno**
```bash
# Para sincronización manual
API_ENDPOINT=https://api.emotioxv2.com/prod
WEBSOCKET_ENDPOINT=wss://ws.emotioxv2.com/prod
STAGE=production
```

### **Opciones del Script**
```bash
-h, --help          # Mostrar ayuda
-f, --force         # Forzar sincronización sin caché
-v, --verbose       # Mostrar información detallada
--stage STAGE       # Especificar etapa (dev, prod, etc.)
--api-url URL       # Especificar URL de API manualmente
--ws-url URL        # Especificar URL de WebSocket manualmente
```

## 🔄 **FLUJO DE SINCRONIZACIÓN**

### **1. Exportación desde backendV2**
```bash
# backendV2 exporta endpoints automáticamente
npx ts-node backendV2/src/utils/endpoints-exporter.ts config/endpoints/dynamic-endpoints.js
```

### **2. Generación de Configuración Centralizada**
```bash
# Script genera configuración centralizada
./config/endpoints/sync-script.sh
```

### **3. Consumo por Frontend y Public-Tests**
```typescript
// Frontend consume endpoints dinámicos
import { getDynamicEndpoints } from './config/endpoints/api-config';

// Public-Tests consume endpoints dinámicos
import { loadDynamicEndpoints } from './config/dynamic-endpoints';
```

## 📊 **ESTADOS DE SINCRONIZACIÓN**

### **✅ Sincronizado**
- Todos los archivos generados correctamente
- Endpoints actualizados
- Estado válido

### **⚠️ Desincronizado**
- Archivos faltantes
- Endpoints desactualizados
- Error en sincronización

### **❌ Error**
- Script falló
- BackendV2 no disponible
- Permisos insuficientes

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### **Error: "No se encontró backendV2"**
```bash
# Verificar estructura del proyecto
ls -la backendV2/
ls -la config/endpoints/
```

### **Error: "Script de exportación no encontrado"**
```bash
# Verificar que existe el script
ls -la backendV2/src/utils/endpoints-exporter.ts
```

### **Error: "Permisos insuficientes"**
```bash
# Dar permisos de ejecución
chmod +x config/endpoints/sync-script.sh
```

### **Endpoints Desactualizados**
```bash
# Forzar sincronización completa
./config/endpoints/sync-script.sh --force --verbose
```

## 🔗 **INTEGRACIÓN CON OTROS COMPONENTES**

### **Frontend (Next.js)**
```typescript
// frontend/src/api/dynamic-endpoints.ts
import { getDynamicEndpoints } from '../../../config/endpoints/api-config';
```

### **Public-Tests (Vite)**
```typescript
// public-tests/src/config/dynamic-endpoints.ts
import { loadDynamicEndpoints } from '../../../config/endpoints/api-config';
```

### **Scripts de Deployment**
```bash
# scripts/deploy/deploy-frontend.sh
./config/endpoints/sync-script.sh --stage prod

# scripts/deploy/deploy-public-tests.sh
./config/endpoints/sync-script.sh --stage prod
```

## 📈 **MONITOREO Y MANTENIMIENTO**

### **Verificar Estado**
```bash
# Verificar archivos generados
ls -la config/endpoints/

# Verificar estado de sincronización
cat config/endpoints/sync-status.json
```

### **Logs de Sincronización**
```bash
# Ver logs detallados
./config/endpoints/sync-script.sh --verbose

# Ver solo errores
./config/endpoints/sync-script.sh 2>&1 | grep ERROR
```

### **Limpieza**
```bash
# Limpiar archivos generados (cuidado)
rm -f config/endpoints/dynamic-endpoints.js
rm -f config/endpoints/centralized-config.ts
rm -f config/endpoints/sync-status.json
```

## 🎯 **BENEFICIOS**

### **✅ Centralización**
- Una sola fuente de verdad
- Configuración unificada
- Mantenimiento simplificado

### **✅ Automatización**
- Sincronización automática
- Integración con deployment
- Actualización transparente

### **✅ Robustez**
- Fallbacks múltiples
- Caché inteligente
- Manejo de errores

### **✅ Compatibilidad**
- Multi-entorno
- Multi-framework
- Multi-lenguaje

## 🔮 **FUTURAS MEJORAS**

### **🔄 Sincronización Automática**
- Cron job para sincronización periódica
- Webhooks para actualización en tiempo real
- Notificaciones de cambios

### **📊 Monitoreo Avanzado**
- Dashboard de estado de endpoints
- Alertas de desincronización
- Métricas de performance

### **🔧 Configuración Avanzada**
- Configuración por ambiente
- Templates personalizables
- Validación de esquemas

---

**Esta configuración centralizada asegura que todos los componentes del proyecto EmotioXV2 estén siempre sincronizados con los endpoints más recientes del backendV2.**
