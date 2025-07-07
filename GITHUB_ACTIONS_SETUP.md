# 🚀 Configuración de GitHub Actions para EmotioXV2

## 📋 Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de AWS](#configuración-de-aws)
3. [Configuración de GitHub Secrets](#configuración-de-github-secrets)
4. [Workflows Configurados](#workflows-configurados)
5. [Despliegue](#despliegue)
6. [Monitoreo](#monitoreo)
7. [Solución de Problemas](#solución-de-problemas)

## 🏗️ Arquitectura de Despliegue

```
│   GitHub Repo   │───▶│ GitHub Actions  │───▶│   AWS Services   │
│                 │    │                 │    │                  │
│   Main Branch   │    │   Workflows     │    │   Amplify        │
│   Push/PR       │    │   Build         │    │   S3/CloudFront  │
│                 │    │   Test          │    │   Lambda         │
```

### Componentes:
- **Backend**: AWS Lambda (Serverless Framework)
- **Frontend**: Next.js 14 → AWS Amplify
- **Public Tests**: Vite/React → AWS S3/CloudFront

## ✅ Requisitos Previos

### 1. Cuenta de AWS
- Cuenta de AWS con permisos para:
  - AWS Lambda
  - AWS Amplify
  - S3
  - CloudFront
  - IAM
- AWS CLI configurado localmente

### 2. Cuenta de GitHub
- Repositorio en GitHub
- GitHub CLI instalado (`gh`)
- Acceso a Actions y Secrets

### 3. Configuración Local
- Node.js 18+
- Serverless Framework CLI
- AWS CLI configurado

## 🔧 Configuración de AWS

### 1. Configurar AWS CLI
```bash
aws configure
# Ingresa tu Access Key ID, Secret Access Key, región (us-east-1)
```

### 2. Crear Apps en Amplify
```bash
# Frontend
aws amplify create-app --name emotioxv2-frontend --region us-east-1

# Public Tests (opcional, ya que usamos S3/CloudFront)
aws amplify create-app --name emotioxv2-public-tests --region us-east-1
```

### 3. Configurar S3 y CloudFront
```bash
# Crear bucket para public-tests
aws s3 mb s3://emotioxv2-public-tests --region us-east-1

# Configurar CloudFront distribution
# (Hacer manualmente en la consola de AWS)
```

## 🔑 Configuración de GitHub Secrets

### 1. Ejecutar Script de Configuración
```bash
./scripts/setup-github-secrets.sh
```

### 2. Secrets Requeridos

| Secret | Descripción | Ejemplo |
|--------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | Access Key de AWS | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Secret Key de AWS | `...` |
| `AWS_DEFAULT_REGION` | Región de AWS | `us-east-1` |
| `AMPLIFY_FRONTEND_APP_ID` | App ID de Amplify Frontend | `d1234567890` |
| `AMPLIFY_PUBLIC_TESTS_APP_ID` | App ID de Amplify Public Tests | `d1234567890` |
| `PUBLIC_TESTS_S3_BUCKET` | Bucket S3 para Public Tests | `emotioxv2-public-tests` |
| `PUBLIC_TESTS_CLOUDFRONT_DISTRIBUTION_ID` | Distribution ID de CloudFront | `E1234567890` |
| `NEXT_PUBLIC_PUBLIC_TESTS_URL` | URL de Public Tests | `https://tu-distribution-id.cloudfront.net` |
| `VITE_PUBLIC_TESTS_URL` | URL de Public Tests para Vite | `https://tu-distribution-id.cloudfront.net` |

## 🔄 Workflows Configurados

### 1. `deploy-all.yml`
- **Trigger**: Push a `main`
- **Funciones**:
  - Detecta cambios en componentes
  - Despliega backend primero
  - Despliega frontend a Amplify
  - Despliega public-tests a S3/CloudFront
  - Actualiza endpoints automáticamente

### 2. `deploy-backend.yml`
- **Trigger**: Cambios en `backendV2/`
- **Funciones**:
  - Despliega AWS Lambda
  - Exporta endpoints
  - Actualiza configuración

### 3. `deploy-public-tests-s3.yml`
- **Trigger**: Cambios en `public-tests/`
- **Funciones**:
  - Build de Vite
  - Despliegue a S3
  - Invalidación de CloudFront

## 🚀 Despliegue

### Despliegue Automático
```bash
# Hacer push a main para activar workflows
git add .
git commit -m "feat: new feature"
git push origin main
```

### Despliegue Manual
```bash
# Desde GitHub Actions UI
# Ir a Actions → deploy-all → Run workflow
```

### Verificar Despliegue
```bash
# Probar S3/CloudFront
./scripts/test-s3-cloudfront-deployment.sh

# Verificar Amplify
aws amplify get-app --app-id $AMPLIFY_APP_ID
```

## 📊 Monitoreo

### GitHub Actions Dashboard
- [github.com/username/repo/actions](https://github.com/username/repo/actions)
- Monitorear ejecución de workflows
- Revisar logs en caso de errores

### AWS Console
- **Amplify Console**: Monitorear builds y deployments
- **CloudFront**: Métricas de performance y errores
- **Lambda**: Logs y métricas de funciones

### Alertas
- Configurar notificaciones en GitHub
- Configurar CloudWatch Alarms
- Monitorear métricas de performance

## 🚨 Solución de Problemas

### Error: "AWS credentials not found"
```bash
# Verificar configuración de AWS
aws configure list
aws sts get-caller-identity
```

### Error: "Amplify app not found"
```bash
# Verificar que la app existe
aws amplify list-apps --region us-east-1

# Crear app si no existe
aws amplify create-app --name emotioxv2-frontend --region us-east-1
```

### Error: "S3 bucket not found"
```bash
# Crear bucket
aws s3 mb s3://emotioxv2-public-tests --region us-east-1

# Configurar bucket policy
aws s3api put-bucket-policy --bucket emotioxv2-public-tests --policy file://bucket-policy.json
```

### Error: "CloudFront distribution not found"
1. Crear distribución en AWS Console
2. Configurar origen S3
3. Configurar Custom Error Responses para SPA
4. Actualizar secret `PUBLIC_TESTS_CLOUDFRONT_DISTRIBUTION_ID`

### Error: "Build failed"
1. Verificar logs en GitHub Actions
2. Verificar dependencias en `package.json`
3. Verificar variables de entorno
4. Probar build localmente

### Error: "Deployment failed"
1. Verificar permisos de AWS
2. Verificar configuración de secrets
3. Verificar logs de CloudFormation
4. Verificar límites de AWS

## 📚 Recursos Adicionales

### Documentación
- [AWS Amplify](https://docs.aws.amazon.com/amplify/)
- [AWS S3](https://docs.aws.amazon.com/s3/)
- [AWS CloudFront](https://docs.aws.amazon.com/cloudfront/)
- [GitHub Actions](https://docs.github.com/en/actions)

### URLs de Despliegue
- **Frontend**: `https://main.tu-app-id.amplifyapp.com`
- **Public Tests**: `https://tu-distribution-id.cloudfront.net`
- **Backend API**: `https://tu-api-gateway.amazonaws.com/prod`

### Comandos Útiles
```bash
# Verificar estado de apps
aws amplify list-apps

# Verificar builds
aws amplify list-jobs --app-id $APP_ID

# Verificar CloudFront
aws cloudfront list-distributions

# Verificar S3
aws s3 ls s3://tu-bucket-public-tests
```

---

**Última actualización**: $(date)
**Versión**: 2.0.0 (AWS Only)
