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
└── 📁 environments/           # Variables de entorno por ambiente
    └── env.production.ec2     # Variables de entorno EC2
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

## 🚀 **USO CON SCRIPTS DE DEPLOYMENT**

Los scripts de deployment en `scripts/deploy/` utilizan automáticamente estas configuraciones:

```bash
# Los scripts leen automáticamente las configuraciones
bash scripts/deploy/deploy-frontend.sh
bash scripts/deploy/deploy-public-tests.sh
bash scripts/deploy/deploy-both.sh
```

## 📋 **MANTENIMIENTO**

### **Para actualizar configuraciones AWS:**
1. Modifica los archivos en `config/aws/`
2. Aplica los cambios con los scripts de deployment
3. Verifica que funcionen correctamente

### **Para actualizar variables de entorno:**
1. Modifica los archivos en `config/deployment/` o `config/environments/`
2. Los scripts de deployment las aplicarán automáticamente

## 🔍 **ARCHIVOS DE BACKUP**

Los archivos originales que estaban en el directorio raíz han sido movidos a:
- `scripts/old-scripts-backup-*/` - Scripts antiguos
- `config/aws/` - Configuraciones AWS organizadas
- `config/deployment/` - Configuraciones de deployment organizadas

---

**Esta organización facilita el mantenimiento y la gestión de configuraciones.**

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

## 🔄 Scripts que interactúan con archivos de entorno:
- `validate-local-vs-ec2.sh` - Descarga y compara `env.production.ec2`
- `update-frontend-env-from-public-tests.sh` - Actualiza variables de entorno

## 📝 Uso recomendado:
1. **Para consulta**: usar archivos en `config/environments/`
2. **Para scripts**: mantener archivos en raíz como están
3. **Para nuevos entornos**: añadir aquí las copias de referencia

## 🚀 Futuras expansiones:
Esta estructura está preparada para:
- `env.development` - Variables de desarrollo
- `env.staging` - Variables de staging
- `env.test` - Variables de testing

## 🔐 Seguridad:
- **NUNCA** commitear archivos `.env` con secrets reales
- Usar `.env.example` para documentar variables necesarias
- Las copias aquí son solo para referencia/organización
