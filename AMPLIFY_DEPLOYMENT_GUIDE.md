# 🚀 Guía de Despliegue CI/CD para AWS Amplify - EmotioXV2 Frontend

Esta guía te permitirá configurar un pipeline de CI/CD completamente automatizado para desplegar el frontend de EmotioXV2 en AWS Amplify.

## 📋 Requisitos Previos

### 1. Herramientas Necesarias
```bash
# AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# jq (para procesamiento JSON)
brew install jq

# Verificar instalación
aws --version
jq --version
```

### 2. Configuración AWS
```bash
# Configurar credenciales AWS
aws configure

# Verificar configuración
aws sts get-caller-identity
```

### 3. GitHub Personal Access Token
- Ve a GitHub → Settings → Developer settings → Personal access tokens
- Crea un token con permisos: `repo`, `admin:repo_hook`, `read:org`
- Guarda el token de forma segura

## 🔧 Configuración Automatizada

### Opción 1: Script Automatizado (Recomendado)

```bash
# Ejecutar el script de configuración
cd /Users/clementefalcone/Desktop/personal/emotioXV2
./scripts/setup-amplify.sh
```

El script te pedirá:
- Nombre de la aplicación Amplify
- URL del repositorio GitHub
- Token de GitHub
- Nombre de la rama principal
- Región AWS
- Dominio personalizado (opcional)

### Opción 2: Configuración Manual

#### 1. Crear la aplicación Amplify
```bash
aws amplify create-app \
  --name "emotioxv2-frontend" \
  --repository "https://github.com/tu-usuario/emotioXV2.git" \
  --platform "WEB" \
  --environment-variables "NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1" \
  --enable-auto-branch-creation \
  --region us-east-1
```

#### 2. Conectar el repositorio
```bash
APP_ID="tu-app-id"
GITHUB_TOKEN="tu-github-token"

aws amplify update-app \
  --app-id $APP_ID \
  --oauth-token $GITHUB_TOKEN \
  --region us-east-1
```

#### 3. Crear branch principal
```bash
aws amplify create-branch \
  --app-id $APP_ID \
  --branch-name main \
  --stage PRODUCTION \
  --framework "Next.js - SSG" \
  --enable-auto-build \
  --environment-variables "NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1" \
  --region us-east-1
```

## 🔐 Configuración de Secrets en GitHub

### 1. Agregar Secrets al Repositorio
Ve a tu repositorio GitHub → Settings → Secrets and variables → Actions

Agrega estos secrets:
- `AWS_ACCESS_KEY_ID`: Tu Access Key ID de AWS
- `AWS_SECRET_ACCESS_KEY`: Tu Secret Access Key de AWS
- `AMPLIFY_APP_ID`: ID de tu aplicación Amplify

### 2. Configurar Variables de Entorno
```bash
# En GitHub Actions, estas variables se configuran automáticamente
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS=--max-old-space-size=4096
```

## 🏗️ Archivos de Configuración

### 1. GitHub Actions Workflow
El archivo `.github/workflows/deploy-amplify.yml` contiene:
- ✅ Configuración automática de Node.js
- ✅ Instalación de dependencias
- ✅ Linting y verificación de API
- ✅ Build del proyecto
- ✅ Despliegue automático a Amplify
- ✅ Monitoreo del estado del despliegue

### 2. Amplify Build Settings
El archivo `amplify.yml` incluye:
- ✅ Configuración de build para Next.js
- ✅ Optimizaciones de cache
- ✅ Headers de seguridad
- ✅ Configuración de redirects y rewrites
- ✅ Variables de entorno

## 🚀 Flujo de Despliegue

### 1. Despliegue Automático
```bash
# El pipeline se ejecuta automáticamente cuando:
# - Haces push a main o develop
# - Modificas archivos en frontend/ o shared/
# - Cambias el workflow de GitHub Actions
```

### 2. Branches Soportados
- **main**: Despliegue a producción
- **develop**: Despliegue a desarrollo
- **feature/***: Preview automático en PRs

### 3. Proceso de Build
1. **Pre-build**: Instalación de dependencias
2. **Build**: Linting, verificación API, build de Next.js
3. **Post-build**: Verificación de artifacts
4. **Deploy**: Despliegue a AWS Amplify

## 📊 Monitoreo y Logs

### 1. Consola de Amplify
```
https://console.aws.amazon.com/amplify/home?region=us-east-1#/[APP_ID]
```

### 2. Logs de GitHub Actions
- Ve a tu repositorio → Actions
- Selecciona el workflow "Deploy to AWS Amplify"
- Revisa los logs detallados de cada step

### 3. Comandos de Monitoreo
```bash
# Ver estado de la app
aws amplify get-app --app-id [APP_ID] --region us-east-1

# Ver jobs de despliegue
aws amplify list-jobs --app-id [APP_ID] --branch-name main --region us-east-1

# Ver estado de un job específico
aws amplify get-job --app-id [APP_ID] --branch-name main --job-id [JOB_ID] --region us-east-1
```

## 🔧 Troubleshooting

### 1. Errores Comunes

#### Build Failed
```bash
# Revisar logs en Amplify Console
# Común: dependencias faltantes o errores de linting

# Solución local:
cd frontend
npm run lint:fix
npm run build
```

#### Deploy Failed
```bash
# Verificar permisos AWS
aws sts get-caller-identity

# Verificar secrets de GitHub
# Asegurarse de que AMPLIFY_APP_ID esté correcto
```

#### Dependencies Issues
```bash
# Limpiar cache
rm -rf frontend/node_modules
rm -rf frontend/.next
rm frontend/package-lock.json

# Reinstalar
cd frontend
npm install
```

### 2. Configuración de Dominio Personalizado

```bash
# Agregar dominio personalizado
aws amplify create-domain-association \
  --app-id [APP_ID] \
  --domain-name tu-dominio.com \
  --sub-domain-settings prefix=,branchName=main \
  --region us-east-1

# Verificar configuración DNS
aws amplify get-domain-association \
  --app-id [APP_ID] \
  --domain-name tu-dominio.com \
  --region us-east-1
```

## 🛡️ Seguridad

### 1. Headers de Seguridad
El archivo `amplify.yml` incluye headers de seguridad:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
- Referrer-Policy

### 2. Variables de Entorno Seguras
```bash
# Nunca commitear archivos .env
# Usar GitHub Secrets para información sensible
# Usar AWS Systems Manager Parameter Store para configuración
```

## 🔄 Actualización del Pipeline

### 1. Modificar el Workflow
```bash
# Editar .github/workflows/deploy-amplify.yml
# Los cambios se aplican automáticamente en el próximo commit
```

### 2. Actualizar Configuración de Amplify
```bash
# Editar amplify.yml
# Los cambios se aplican en el próximo despliegue
```

## 📈 Optimizaciones

### 1. Performance
- ✅ Cache de dependencias en GitHub Actions
- ✅ Cache de Next.js build
- ✅ Optimización de imágenes
- ✅ Compresión de assets

### 2. Costos
- ✅ Build solo cuando es necesario
- ✅ Cache de artefactos
- ✅ Despliegue incremental

## 🎯 Próximos Pasos

1. **Ejecutar el setup inicial**:
   ```bash
   ./scripts/setup-amplify.sh
   ```

2. **Configurar secrets en GitHub**

3. **Hacer push a main para probar el pipeline**

4. **Configurar dominio personalizado (opcional)**

5. **Configurar notificaciones (opcional)**

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs en GitHub Actions
2. Verifica la configuración en Amplify Console
3. Comprueba los secrets de GitHub
4. Ejecuta el build localmente para debugging

¡Tu pipeline de CI/CD está listo para automatizar completamente el despliegue de EmotioXV2 Frontend a AWS Amplify! 🚀
