# ⚙️ Configuración - EmotioXV2

## 📁 **ESTRUCTURA ORGANIZADA**

```
config/
├── 📁 aws/                    # Configuraciones AWS
│   ├── dist-config.json       # Configuración CloudFront principal
│   ├── dist-config-raw.json   # Configuración CloudFront raw
│   └── dist-config-spa.json   # Configuración CloudFront SPA
├── 📁 deployment/             # Configuraciones de deployment
│   ├── deployment-info.json   # Información de deployments
│   └── env.production.ec2     # Variables de entorno producción
├── 📁 environments/           # Variables de entorno por ambiente
│   └── env.production.ec2     # Variables de entorno EC2
└── 📁 endpoints/              # 🆕 ENDPOINTS DINÁMICOS
    ├── api-config.ts          # 🆕 Configuración centralizada
    ├── sync-script.sh         # 🆕 Script de sincronización
    ├── dynamic-endpoints.js   # 🔄 Generado por backendV2
    ├── centralized-config.ts  # 🔄 Generado automáticamente
    ├── sync-status.json       # 🔄 Estado de sincronización
    ├── index.ts               # 🆕 Exportación centralizada
    └── README.md              # 🆕 Documentación específica
```

## 🔧 **DESCRIPCIÓN DE ARCHIVOS**

### **📁 aws/**
Configuraciones específicas de AWS CloudFront y S3:

- **`dist-config.json`** - Configuración principal de CloudFront
- **`dist-config-raw.json`** - Configuración para contenido raw
- **`dist-config-spa.json`** - Configuración para Single Page Applications

### **📁 deployment/**
Archivos relacionados con el proceso de deployment:

- **`deployment-info.json`** - Información y metadatos de deployments
- **`env.production.ec2`** - Variables de entorno para producción

### **📁 environments/**
Variables de entorno organizadas por ambiente:

- **`env.production.ec2`** - Variables de entorno para producción

### **📁 endpoints/** 🆕
**SISTEMA DE ENDPOINTS DINÁMICOS** - Integración completa con backendV2:

- **`api-config.ts`** - Configuración centralizada de endpoints
- **`sync-script.sh`** - Script de sincronización automática
- **`dynamic-endpoints.js`** - Endpoints exportados por backendV2
- **`centralized-config.ts`** - Configuración centralizada generada
- **`sync-status.json`** - Estado de sincronización
- **`index.ts`** - Exportación centralizada
- **`README.md`** - Documentación específica

## 🚀 **SISTEMA DE ENDPOINTS DINÁMICOS** 🆕

### **🔄 Sincronización Automática**
El directorio `config/endpoints/` ahora integra completamente con el sistema de endpoints dinámicos de backendV2:

```bash
# Sincronización manual
./config/endpoints/sync-script.sh

# Sincronización para producción
./config/endpoints/sync-script.sh --stage prod --verbose

# Verificar estado
cat config/endpoints/sync-status.json
```

### **📤 Exportación desde backendV2**
```bash
# backendV2 exporta automáticamente
npx ts-node backendV2/src/utils/endpoints-exporter.ts config/endpoints/dynamic-endpoints.js
```

### **📥 Consumo por Frontend y Public-Tests**
```typescript
// Importar configuración centralizada
import { CENTRALIZED_API_CONFIG, getApiUrl } from './config/endpoints/centralized-config';

// Usar endpoints
const apiUrl = getApiUrl('/auth/login');
const wsUrl = CENTRALIZED_API_CONFIG.ws;
```

### **✅ Beneficios de la Integración**
- **🔄 Sincronización Automática**: Los endpoints se actualizan automáticamente
- **📁 Organización Centralizada**: Una sola fuente de verdad para endpoints
- **🛠️ Mantenimiento Simplificado**: Configuración unificada
- **📋 Documentación Clara**: Estructura bien documentada
- **⚡ Performance**: Caché y fallbacks optimizados

## 🚀 **USO CON SCRIPTS DE DEPLOYMENT**

Los scripts de deployment en `scripts/deploy/` utilizan automáticamente estas configuraciones:

```bash
# Los scripts leen automáticamente las configuraciones
bash scripts/deploy/deploy-frontend.sh
bash scripts/deploy/deploy-public-tests.sh
bash scripts/deploy/deploy-both.sh

# Y ahora también sincronizan endpoints dinámicos
./config/endpoints/sync-script.sh --stage prod
```

## 📋 **MANTENIMIENTO**

### **Para actualizar configuraciones AWS:**
1. Modifica los archivos en `config/aws/`
2. Aplica los cambios con los scripts de deployment
3. Verifica que funcionen correctamente

### **Para actualizar variables de entorno:**
1. Modifica los archivos en `config/deployment/` o `config/environments/`
2. Los scripts de deployment las aplicarán automáticamente

### **Para sincronizar endpoints dinámicos:** 🆕
1. Ejecuta `./config/endpoints/sync-script.sh`
2. Verifica el estado en `config/endpoints/sync-status.json`
3. Los endpoints se actualizarán automáticamente en frontend y public-tests

## 🔍 **ARCHIVOS DE BACKUP**

Los archivos originales que estaban en el directorio raíz han sido movidos a:
- `scripts/old-scripts-backup-*/` - Scripts antiguos
- `config/aws/` - Configuraciones AWS organizadas
- `config/deployment/` - Configuraciones de deployment organizadas
- `config/endpoints/` - Endpoints dinámicos centralizados 🆕

---

**Esta organización facilita el mantenimiento y la gestión de configuraciones del proyecto EmotioXV2, ahora con integración completa de endpoints dinámicos.**

## 🏗️ Estructura de Carpetas

### `/environments/`
Archivos de variables de entorno organizados por ambiente:

#### Archivos existentes:
- `env.production.ec2` - **COPIA** del archivo descargado desde EC2

#### ⚠️ Nota importante sobre `env.production.ec2`:
- El archivo original permanece en la **raíz del proyecto**
- Es **descargado dinámicamente** por `scripts/validate-local-vs-ec2.sh`
- Esta carpeta contiene una **copia de referencia** para organización
- **NO modificar** la ubicación del archivo original

### `/endpoints/` 🆕
**SISTEMA DE ENDPOINTS DINÁMICOS** - Nueva funcionalidad:

#### Archivos generados automáticamente:
- `dynamic-endpoints.js` - **EXPORTADO** por backendV2
- `centralized-config.ts` - **GENERADO** por sync-script
- `sync-status.json` - **ESTADO** de sincronización

#### ⚠️ Nota importante sobre endpoints dinámicos:
- Los archivos son **generados automáticamente** por backendV2
- **NO modificar manualmente** - se sobrescribirán en la próxima sincronización
- Usar `./config/endpoints/sync-script.sh` para sincronizar
- Verificar estado en `sync-status.json`

## 🔄 Scripts que interactúan con archivos de entorno:
- `validate-local-vs-ec2.sh` - Descarga y compara `env.production.ec2`
- `update-frontend-env-from-public-tests.sh` - Actualiza variables de entorno

## 🔄 Scripts que interactúan con endpoints dinámicos: 🆕
- `sync-script.sh` - Sincroniza endpoints desde backendV2
- `deploy-frontend.sh` - Usa endpoints dinámicos en deployment
- `deploy-public-tests.sh` - Usa endpoints dinámicos en deployment

## 📝 Uso recomendado:
1. **Para consulta**: usar archivos en `config/environments/`
2. **Para scripts**: mantener archivos en raíz como están
3. **Para nuevos entornos**: añadir aquí las copias de referencia
4. **Para endpoints**: usar `config/endpoints/` como fuente centralizada 🆕

## 🚀 Futuras expansiones:
Esta estructura está preparada para:
- `env.development` - Variables de desarrollo
- `env.staging` - Variables de staging
- `env.test` - Variables de testing
- `endpoints/production/` - Endpoints de producción 🆕
- `endpoints/staging/` - Endpoints de staging 🆕

## 🔐 Seguridad:
- **NUNCA** commitear archivos `.env` con secrets reales
- Usar `.env.example` para documentar variables necesarias
- Las copias aquí son solo para referencia/organización
- Los endpoints dinámicos son seguros para commitear 🆕
