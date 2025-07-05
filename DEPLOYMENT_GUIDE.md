# 🚀 Guía de Deployment - EmotioXV2

## 📁 **ESTRUCTURA ORGANIZADA**

```
emotioXV2/
├── 🚀 deploy.sh                    # Script principal (redirección)
├── 📖 DEPLOYMENT_GUIDE.md          # Esta guía
├── 📁 scripts/
│   └── 📁 deploy/                  # Scripts organizados
│       ├── 🚀 deploy.sh            # Menú interactivo
│       ├── 🖥️ deploy-frontend.sh   # Deploy frontend
│       ├── 📱 deploy-public-tests.sh # Deploy public-tests
│       ├── 🚀 deploy-both.sh       # Deploy ambos
│       ├── 📋 show-urls.sh         # Mostrar URLs
│       ├── ✅ validate-deployment.sh # Validar deployment
│       ├── ⚙️ config.sh            # Configuración
│       └── 📖 README.md            # Documentación
├── 📁 config/
│   ├── 📁 aws/                     # Configuraciones AWS
│   │   └── dist-config*.json       # Configs CloudFront
│   └── 📁 deployment/              # Configs deployment
│       ├── deployment-info.json    # Info de deployments
│       └── env.production.ec2      # Variables de entorno
└── 📁 scripts/old-scripts-backup-*/ # Scripts antiguos (backup)
```

## ⚡ **COMANDOS ULTRA-RÁPIDOS**

### **Desde el directorio raíz:**

```bash
# 🚀 Script principal (menú interactivo)
./deploy.sh

# 🖥️ Solo frontend (3-4 min)
bash scripts/deploy/deploy-frontend.sh

# 📱 Solo public-tests (2-3 min)
bash scripts/deploy/deploy-public-tests.sh

# 🚀 Ambos (5-6 min)
bash scripts/deploy/deploy-both.sh
```

### **Verificar y validar:**

```bash
# 📋 Ver URLs activas
bash scripts/deploy/show-urls.sh

# ✅ Validar deployments
bash scripts/deploy/validate-deployment.sh
```

## 🎯 **FLUJO DE TRABAJO**

### **1. Cambias código del frontend:**
```bash
./deploy.sh
# Selecciona opción 1: Deploy Frontend
```

### **2. Cambias código de public-tests:**
```bash
./deploy.sh
# Selecciona opción 2: Deploy Public-Tests
```

### **3. Cambias ambos:**
```bash
./deploy.sh
# Selecciona opción 3: Deploy Ambos
```

### **4. Verificas que funciona:**
```bash
./deploy.sh
# Selecciona opción 5: Validar Deployment
```

## 🔗 **URLS ACTIVAS**

- **🖥️ Frontend:** https://d2s9nr0bm47yl1.cloudfront.net/
- **📱 Public-Tests:** https://d2zt8ia21te5mv.cloudfront.net/

## 📊 **TIEMPOS ESTIMADOS**

| Acción | Tiempo | Comando |
|--------|--------|---------|
| Deploy Frontend | 3-4 min | `bash scripts/deploy/deploy-frontend.sh` |
| Deploy Public-Tests | 2-3 min | `bash scripts/deploy/deploy-public-tests.sh` |
| Deploy Ambos | 5-6 min | `bash scripts/deploy/deploy-both.sh` |
| Validar | 1 min | `bash scripts/deploy/validate-deployment.sh` |

## ⚙️ **CONFIGURACIÓN AUTOMÁTICA**

Los scripts manejan automáticamente:
- ✅ Instalación de dependencias
- ✅ Build optimizado
- ✅ Deploy a S3
- ✅ Invalidación de CloudFront
- ✅ Validación de éxito
- ✅ Mostrar URLs

## 🚨 **EN CASO DE ERROR**

1. **Revisa los logs** - información detallada en cada script
2. **Valida el deployment:** `bash scripts/deploy/validate-deployment.sh`
3. **Verifica URLs:** `bash scripts/deploy/show-urls.sh`
4. **Si persiste:** Contacta al equipo

## 📋 **ARCHIVOS ORGANIZADOS**

### **Scripts antiguos movidos a backup:**
- `deploy-frontend-simple.sh` → `scripts/old-scripts-backup-*/`
- `deploy-frontend-s3-cloudfront.sh` → `scripts/old-scripts-backup-*/`

### **Configuraciones organizadas:**
- `dist-config*.json` → `config/aws/`
- `deployment-info.json` → `config/deployment/`
- `env.production.ec2` → `config/deployment/`

## 🎉 **RESULTADO**

**El deployment ahora es extremadamente sencillo:**

1. **Un solo comando:** `./deploy.sh`
2. **Menú interactivo** para elegir qué hacer
3. **Scripts optimizados** y organizados
4. **Validación automática** de éxito
5. **URLs mostradas** automáticamente

---

**¡Con esta organización, el deployment será súper fácil! 🚀**
