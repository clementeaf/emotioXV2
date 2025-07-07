# 🚀 Configuración de GitHub Actions para EmotioXV2

Esta guía te ayudará a configurar la automatización completa de despliegues para EmotioXV2 usando GitHub Actions.

## 📋 Tabla de Contenidos

1. [Arquitectura de Despliegue](#arquitectura-de-despliegue)
2. [Prerrequisitos](#prerrequisitos)
3. [Configuración de Vercel](#configuración-de-vercel)
4. [Configuración de GitHub Secrets](#configuración-de-github-secrets)
5. [Workflows Disponibles](#workflows-disponibles)
6. [Flujo de Trabajo](#flujo-de-trabajo)
7. [Solución de Problemas](#solución-de-problemas)

## 🏗️ Arquitectura de Despliegue

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│ GitHub Actions  │───▶│   Vercel        │
│                 │    │                 │    │   (Frontend)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   AWS Lambda    │
                       │   (Backend)     │
                       └─────────────────┘
```

### Componentes:

- **Frontend**: Next.js 14 → Vercel
- **Public Tests**: Vite/React → Vercel
- **Backend**: AWS Lambda (Serverless) → AWS
- **Shared**: Interfaces TypeScript compartidas

## ✅ Prerrequisitos

### 1. GitHub CLI
```bash
# Instalar GitHub CLI
brew install gh  # macOS
# o descargar desde: https://cli.github.com/

# Autenticarse
gh auth login
```

### 2. Cuenta de Vercel
- Crear cuenta en [vercel.com](https://vercel.com)
- Instalar Vercel CLI: `npm i -g vercel`

### 3. AWS CLI
```bash
# Instalar AWS CLI
brew install awscli  # macOS

# Configurar credenciales
aws configure
```

## 🌐 Configuración de Vercel

### 1. Crear Proyectos en Vercel

#### Frontend (Next.js)
```bash
cd frontend
vercel login
vercel --name emotioxv2-frontend
```

#### Public Tests (Vite)
```bash
cd public-tests
vercel --name emotioxv2-public-tests
```

### 2. Obtener IDs de Proyecto

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona cada proyecto
3. Ve a Settings → General
4. Copia el **Project ID**

### 3. Obtener Organization ID

1. Ve a [vercel.com/account](https://vercel.com/account)
2. Copia el **Team ID** (Organization ID)

### 4. Crear Token de Vercel

1. Ve a [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Crea un nuevo token con permisos de deploy

## 🔑 Configuración de GitHub Secrets

### Opción 1: Script Automático (Recomendado)

```bash
# Ejecutar script de configuración
./scripts/setup-github-secrets.sh
```

### Opción 2: Configuración Manual

Ve a tu repositorio en GitHub → Settings → Secrets and variables → Actions

#### Secrets Requeridos:

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS Access Key ID | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key | `...` |
| `VERCEL_TOKEN` | Token de Vercel | `...` |
| `VERCEL_ORG_ID` | Organization ID de Vercel | `team_...` |
| `VERCEL_PROJECT_ID` | Project ID del Frontend | `prj_...` |
| `VERCEL_PUBLIC_TESTS_PROJECT_ID` | Project ID de Public Tests | `prj_...` |
| `NEXT_PUBLIC_PUBLIC_TESTS_URL` | URL de Public Tests | `https://emotioxv2-public-tests.vercel.app` |
| `VITE_PUBLIC_TESTS_URL` | URL de Public Tests para Vite | `https://emotioxv2-public-tests.vercel.app` |

## 🔄 Workflows Disponibles

### 1. `deploy-all.yml` (Recomendado)
- **Trigger**: Push a `main`
- **Función**: Despliega todos los componentes
- **Orden**: Backend → Frontend → Public Tests

### 2. `deploy-frontend.yml`
- **Trigger**: Cambios en `frontend/` o `shared/`
- **Función**: Solo despliega el frontend

### 3. `deploy-public-tests.yml`
- **Trigger**: Cambios en `public-tests/` o `shared/`
- **Función**: Solo despliega public-tests

### 4. `deploy-backend.yml`
- **Trigger**: Cambios en `backendV2/` o `shared/`
- **Función**: Solo despliega el backend

## 🚀 Flujo de Trabajo

### Desarrollo Normal

1. **Crear feature branch**
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

2. **Desarrollar y commit**
   ```bash
   git add .
   git commit -m "feat: nueva funcionalidad"
   ```

3. **Push y crear PR**
   ```bash
   git push origin feature/nueva-funcionalidad
   # Crear Pull Request en GitHub
   ```

4. **Merge a main**
   - Los workflows se ejecutan automáticamente
   - Despliegue automático a producción

### Despliegue Manual

```bash
# Desplegar todo
gh workflow run deploy-all.yml

# Desplegar solo frontend
gh workflow run deploy-frontend.yml

# Desplegar solo backend
gh workflow run deploy-backend.yml
```

## 📊 Monitoreo

### GitHub Actions
- Ve a tu repositorio → Actions
- Monitorea el progreso de los workflows
- Revisa los logs si hay errores

### Vercel Dashboard
- [vercel.com/dashboard](https://vercel.com/dashboard)
- Monitorea despliegues y performance

### AWS Console
- [console.aws.amazon.com](https://console.aws.amazon.com)
- Monitorea Lambda functions y API Gateway

## 🔧 Solución de Problemas

### Error: "Vercel token not found"
```bash
# Verificar que el secret está configurado
gh secret list --repo owner/repo
```

### Error: "AWS credentials not found"
```bash
# Verificar configuración de AWS
aws sts get-caller-identity
```

### Error: "Build failed"
1. Revisar logs en GitHub Actions
2. Verificar dependencias en `package.json`
3. Probar build localmente

### Error: "Deployment failed"
1. Verificar configuración de Vercel
2. Revisar variables de entorno
3. Verificar permisos de proyecto

## 📝 Variables de Entorno

### Frontend (Next.js)
```env
NEXT_PUBLIC_API_URL=https://api.emotioxv2.com
NEXT_PUBLIC_PUBLIC_TESTS_URL=https://tests.emotioxv2.com
```

### Public Tests (Vite)
```env
VITE_API_URL=https://api.emotioxv2.com
VITE_PUBLIC_TESTS_URL=https://tests.emotioxv2.com
```

### Backend (AWS Lambda)
```env
STAGE=dev
AWS_REGION=us-east-1
```

## 🎯 URLs de Producción

Una vez configurado, tus aplicaciones estarán disponibles en:

- **Frontend**: `https://emotioxv2-frontend.vercel.app`
- **Public Tests**: `https://emotioxv2-public-tests.vercel.app`
- **Backend API**: `https://[api-gateway-url].execute-api.us-east-1.amazonaws.com/dev`

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en GitHub Actions
2. Verifica la configuración de secrets
3. Prueba los despliegues localmente
4. Consulta la documentación de [Vercel](https://vercel.com/docs) y [GitHub Actions](https://docs.github.com/en/actions)

---

**¡Listo! Tu pipeline de CI/CD está configurado y listo para usar. 🚀**
