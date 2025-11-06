# Configuración de CloudFront para Frontend

## 📋 Resumen

Este documento explica cómo configurar CloudFront para el frontend de EmotioXV2.

## 🎯 Objetivo

Configurar una distribución de CloudFront que apunte al bucket S3 `emotioxv2-frontend-041238861016` para mejorar el rendimiento y la disponibilidad del frontend.

## 📦 Prerequisitos

1. AWS CLI configurado con credenciales válidas
2. Permisos para crear distribuciones de CloudFront
3. El bucket S3 `emotioxv2-frontend-041238861016` debe existir y tener contenido

## 🚀 Pasos para Crear la Distribución

### Opción 1: Usar el Script Automático (Recomendado)

```bash
# Ejecutar el script de creación
./scripts/create-frontend-cloudfront.sh
```

El script:
- ✅ Verifica que el bucket S3 existe
- ✅ Crea la distribución de CloudFront
- ✅ Muestra el Distribution ID y URL
- ✅ Proporciona instrucciones para configurar el secret en GitHub

### Opción 2: Crear Manualmente con AWS CLI

```bash
# Crear la distribución usando el archivo de configuración
aws cloudfront create-distribution \
    --distribution-config file://config/aws/frontend-cloudfront-config.json \
    --region us-east-1
```

**Nota:** Necesitarás actualizar el `CallerReference` en el archivo JSON antes de ejecutar el comando.

## ⚙️ Configuración en GitHub

Una vez creada la distribución, necesitas configurar el secret en GitHub:

```bash
# Usando GitHub CLI
gh secret set FRONTEND_CLOUDFRONT_DISTRIBUTION_ID --body "TU_DISTRIBUTION_ID"
```

O manualmente en GitHub:
1. Ve a Settings → Secrets and variables → Actions
2. Crea un nuevo secret llamado `FRONTEND_CLOUDFRONT_DISTRIBUTION_ID`
3. Pega el Distribution ID obtenido del script

## ⏱️ Tiempo de Activación

La distribución de CloudFront puede tardar **5-15 minutos** en estar completamente activa. Puedes verificar el estado con:

```bash
aws cloudfront get-distribution \
    --id TU_DISTRIBUTION_ID \
    --query 'Distribution.Status' \
    --output text
```

Espera hasta que el estado sea `Deployed`.

## ✅ Verificación

Una vez que la distribución esté activa:

1. **Verifica la URL de CloudFront:**
   ```bash
   curl -I https://TU_DOMAIN.cloudfront.net
   ```

2. **Verifica que el workflow funcione:**
   - Haz un cambio en `frontend/`
   - El workflow debería invalidar CloudFront automáticamente
   - Revisa los logs del workflow para confirmar

## 📊 Configuración Actual

- **Bucket S3:** `emotioxv2-frontend-041238861016`
- **Región:** `us-east-1`
- **Origin:** S3 Website Endpoint
- **Custom Error Responses:** Configurado para SPA (404/403 → index.html)
- **Compression:** Habilitada
- **HTTPS:** Redirección automática

## 🔧 Troubleshooting

### Error: "Distribution already exists"
- Verifica si ya existe una distribución para este bucket
- Lista las distribuciones existentes:
  ```bash
  aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,DomainName,Origins.Items[0].DomainName]' --output table
  ```

### Error: "Bucket not found"
- Verifica que el bucket existe:
  ```bash
  aws s3 ls s3://emotioxv2-frontend-041238861016
  ```

### La distribución está en estado "InProgress"
- Esto es normal, espera 5-15 minutos
- Verifica periódicamente el estado hasta que sea "Deployed"

## 📝 Notas

- El workflow automático detectará el secret y comenzará a invalidar CloudFront en cada deploy
- Si el secret no está configurado, el workflow funcionará solo con S3 (sin CloudFront)
- La URL de CloudFront se mostrará automáticamente en los logs del workflow después de cada deploy

