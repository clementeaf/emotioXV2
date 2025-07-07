# 🚀 DESPLIEGUE PUBLIC-TESTS EN S3/CLOUDFRONT

## 📋 RESUMEN
Este documento describe el proceso completo para desplegar `public-tests` en AWS S3 con CloudFront para distribución global.

## 🏗️ ARQUITECTURA
```
Vite Build → S3 Bucket → CloudFront Distribution → CDN Global
```

## 📦 PRERREQUISITOS

### 1. AWS CLI Configurado
```bash
# Verificar configuración
aws configure list

# Configurar si es necesario
aws configure
```

### 2. Permisos AWS Requeridos
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:PutBucketPolicy",
                "cloudfront:CreateInvalidation",
                "cloudfront:GetInvalidation",
                "cloudfront:ListInvalidations"
            ],
            "Resource": [
                "arn:aws:s3:::tu-bucket-public-tests",
                "arn:aws:s3:::tu-bucket-public-tests/*",
                "arn:aws:cloudfront::*:distribution/*"
            ]
        }
    ]
}
```

## 🔧 CONFIGURACIÓN INICIAL

### 1. Variables de Entorno
```bash
# Crear archivo .env en public-tests/
VITE_API_BASE_URL=https://tu-api-gateway.amazonaws.com/prod
VITE_PUBLIC_TESTS_URL=https://tu-cloudfront-domain.cloudfront.net
```

### 2. Configurar Bucket S3
```bash
# Crear bucket (si no existe)
aws s3 mb s3://tu-bucket-public-tests --region us-east-1

# Configurar bucket para hosting web
aws s3 website s3://tu-bucket-public-tests --index-document index.html --error-document index.html
```

### 3. Configurar CloudFront
```bash
# Crear distribución CloudFront
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

## 🚀 PROCESO DE DESPLIEGUE

### 1. Build del Proyecto
```bash
cd public-tests
npm run build
```

### 2. Despliegue Automático
```bash
# Desde la raíz del proyecto
./scripts/deploy/deploy-public-tests.sh
```

### 3. Despliegue Manual
```bash
# Variables de entorno
export BUCKET="tu-bucket-public-tests"
export REGION="us-east-1"
export CLOUDFRONT_DISTRIBUTION_ID="tu-distribution-id"

# Build
npm run build

# Subir a S3
aws s3 sync dist/ s3://$BUCKET --delete --region $REGION

# Invalidar caché
aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*" \
    --region $REGION
```

## 🔄 ENDPOINTS DINÁMICOS

### Configuración Automática
El script de despliegue copia automáticamente `src/config/endpoints.js` al bucket S3 en `/config/endpoints.js`.

### Estructura de Endpoints
```javascript
// src/config/endpoints.js
const getEndpoints = () => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocal) {
        return {
            API_BASE_URL: 'http://localhost:3001',
            PUBLIC_TESTS_URL: 'http://localhost:5173'
        };
    }

    return {
        API_BASE_URL: process.env.VITE_API_BASE_URL || 'https://tu-api-gateway.amazonaws.com/prod',
        PUBLIC_TESTS_URL: process.env.VITE_PUBLIC_TESTS_URL || 'https://tu-cloudfront-domain.cloudfront.net'
    };
};

export default getEndpoints;
```

## 🌐 CONFIGURACIÓN CLOUDFRONT

### 1. Configuración SPA (Single Page Application)
```json
{
    "CallerReference": "public-tests-spa-config",
    "Comment": "Public Tests SPA Distribution",
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-tu-bucket-public-tests",
        "ViewerProtocolPolicy": "redirect-to-https",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    },
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-tu-bucket-public-tests",
                "DomainName": "tu-bucket-public-tests.s3.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 0
            }
        ]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
}
```

### 2. Headers de Seguridad
```json
{
    "SecurityHeadersConfig": {
        "ContentSecurityPolicy": {
            "Override": true,
            "ContentSecurityPolicy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        },
        "XFrameOptions": {
            "Override": true,
            "XFrameOptions": "DENY"
        },
        "XContentTypeOptions": {
            "Override": true,
            "XContentTypeOptions": "nosniff"
        }
    }
}
```

## 🔍 MONITOREO Y DEBUGGING

### 1. Verificar Despliegue
```bash
# Verificar archivos en S3
aws s3 ls s3://tu-bucket-public-tests --recursive

# Verificar endpoints dinámicos
aws s3 cp s3://tu-bucket-public-tests/config/endpoints.js -

# Verificar invalidaciones
aws cloudfront list-invalidations --distribution-id $CLOUDFRONT_DISTRIBUTION_ID
```

### 2. Logs de CloudFront
```bash
# Habilitar logs de CloudFront
aws cloudfront update-distribution \
    --id $CLOUDFRONT_DISTRIBUTION_ID \
    --distribution-config file://cloudfront-with-logs.json
```

### 3. Testing de Navegación SPA
```bash
# Probar rutas directas
curl -I https://tu-cloudfront-domain.cloudfront.net/research/123
# Debe retornar 200, no 404

# Probar navegación cliente
# Abrir DevTools → Network → Navegar a rutas directas
```

## 🚨 SOLUCIÓN DE PROBLEMAS

### Problema: Caché Antiguo
```bash
# Invalidación completa
aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*"

# Verificar estado
aws cloudfront get-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --id $INVALIDATION_ID
```

### Problema: Rutas 404 en Navegación Directa
1. Verificar configuración SPA en CloudFront
2. Confirmar que `index.html` está en la raíz del bucket
3. Verificar Custom Error Responses

### Problema: Endpoints No Actualizados
```bash
# Forzar actualización de endpoints
aws s3 cp public-tests/src/config/endpoints.js s3://$BUCKET/config/endpoints.js --cache-control "no-cache"
```

## 🔄 INTEGRACIÓN CON GITHUB ACTIONS

### Workflow Automático
```yaml
# .github/workflows/deploy-public-tests-s3.yml
name: Deploy Public Tests to S3/CloudFront

on:
  push:
    branches: [main]
    paths: ['public-tests/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: public-tests/package-lock.json

      - name: Install dependencies
        run: cd public-tests && npm ci

      - name: Build
        run: cd public-tests && npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
          VITE_PUBLIC_TESTS_URL: ${{ secrets.VITE_PUBLIC_TESTS_URL }}

      - name: Deploy to S3
        run: ./scripts/deploy/deploy-public-tests.sh
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: ${{ secrets.AWS_DEFAULT_REGION }}
```

## 📊 MÉTRICAS Y PERFORMANCE

### 1. Métricas CloudWatch
- Request Count
- Error Rate
- Cache Hit Ratio
- Origin Latency

### 2. Optimizaciones Recomendadas
- Compresión Gzip habilitada
- Cache TTL optimizado
- Edge Locations cercanas
- CDN para assets estáticos

## 🔐 SEGURIDAD

### 1. Bucket Policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::tu-bucket-public-tests/*"
        }
    ]
}
```

### 2. CloudFront Security
- HTTPS obligatorio
- Headers de seguridad
- WAF si es necesario
- Rate limiting

## 📝 CHECKLIST DE DESPLIEGUE

- [ ] AWS CLI configurado
- [ ] Bucket S3 creado y configurado
- [ ] CloudFront distribution configurada
- [ ] Variables de entorno definidas
- [ ] Build exitoso
- [ ] Archivos subidos a S3
- [ ] Endpoints dinámicos copiados
- [ ] Caché invalidado
- [ ] Navegación SPA probada
- [ ] Headers de seguridad verificados
- [ ] Logs habilitados
- [ ] Monitoreo configurado

## 🆘 SOPORTE

Para problemas específicos:
1. Revisar logs de CloudFront
2. Verificar configuración S3
3. Probar invalidaciones de caché
4. Contactar al equipo de DevOps

---

**Última actualización:** $(date)
**Versión:** 1.0.0
