# 📁 Organización de Configuraciones AWS - EmotioXV2

## 🏗️ Estructura de Carpetas

### `/cloudfront/`
Configuraciones de CloudFront organizadas por componente:

#### `public-tests/`
- `cf-config.json` - Configuración principal para public-tests
- `new-cloudfront-config.json` - Nueva configuración simplificada
- `disabled-config.json` - Configuración deshabilitada

#### `frontend/`
- (Pendiente: mover configuraciones del frontend cuando se identifiquen)

#### `backups/`
- `cloudfront-config-backup.json` - Backup de configuración anterior
- `cloudfront-config.json` - Configuración de respaldo

### `/cors/`
Configuraciones de CORS:
- `cors-config.json` - Configuración CORS base
- `cors-config-fixed.json` - Configuración CORS corregida

### `/policies/` (archivos existentes)
Políticas de buckets S3:
- `bucket-policy.json` - Política de bucket principal
- `bucket-policy-public.json` - Política de bucket público
- `bucket_policy.json` - Política alternativa
- `cors_policy.json` - Política CORS para S3

## ⚠️ Notas Importantes

### Archivos que permanecen en raíz del proyecto:
- `dist-config*.json` - **GENERADOS DINÁMICAMENTE** por scripts de deployment
- `env.production.ec2` - **DESCARGADO DINÁMICAMENTE** desde EC2

**NO mover estos archivos** ya que los scripts de `/scripts/` los crean/usan directamente en la raíz.

## 🔄 Scripts Afectados
- `setup-spa-cloudfront-s3.sh` - Genera `dist-config.json`
- `setup-spa-cloudfront-s3-auto.sh` - Genera `dist-config-raw.json`
- `validate-local-vs-ec2.sh` - Descarga `env.production.ec2`

## 📝 Mantenimiento
Al añadir nuevas configuraciones AWS:
1. Usar la estructura de carpetas apropiada
2. Documentar en este README
3. Verificar que scripts no se vean afectados
