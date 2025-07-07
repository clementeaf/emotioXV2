# ✅ CHECKLIST: DESPLIEGUE S3/CLOUDFRONT PUBLIC-TESTS

## 📋 VERIFICACIÓN PREVIA

### [ ] AWS CLI Configurado
```bash
aws configure list
aws sts get-caller-identity
```

### [ ] Permisos AWS Verificados
- [ ] S3: ListBucket, GetObject, PutObject, DeleteObject
- [ ] CloudFront: CreateInvalidation, GetInvalidation, ListInvalidations
- [ ] IAM: Permisos para las acciones anteriores

### [ ] Bucket S3 Creado
```bash
aws s3 ls s3://tu-bucket-public-tests
```

### [ ] CloudFront Distribution Configurada
```bash
aws cloudfront list-distributions --query 'DistributionList.Items[?Comment==`Public Tests SPA Distribution`]'
```

## 🔧 CONFIGURACIÓN DE SECRETS

### [ ] GitHub Secrets Configurados
```bash
./scripts/setup-github-secrets.sh
```

Secrets requeridos:
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_DEFAULT_REGION`
- [ ] `PUBLIC_TESTS_S3_BUCKET`
- [ ] `PUBLIC_TESTS_CLOUDFRONT_DISTRIBUTION_ID`
- [ ] `VITE_API_BASE_URL`
- [ ] `VITE_PUBLIC_TESTS_URL`

## 🚀 DESPLIEGUE INICIAL

### [ ] Build del Proyecto
```bash
cd public-tests
npm run build
```

### [ ] Despliegue Manual (Primera Vez)
```bash
./scripts/deploy/deploy-public-tests.sh
```

### [ ] Verificar Despliegue
```bash
./scripts/test-s3-cloudfront-deployment.sh
```

## 🔄 CONFIGURACIÓN AUTOMÁTICA

### [ ] Workflow GitHub Actions
- [ ] `.github/workflows/deploy-public-tests-s3.yml` creado
- [ ] `.github/workflows/deploy-all.yml` actualizado
- [ ] Workflow se ejecuta en push a `main`

### [ ] Scripts de Despliegue
- [ ] `scripts/deploy/deploy-public-tests.sh` actualizado con endpoints
- [ ] `scripts/test-s3-cloudfront-deployment.sh` creado
- [ ] Scripts tienen permisos de ejecución

## 🌐 CONFIGURACIÓN CLOUDFRONT

### [ ] Configuración SPA
- [ ] Custom Error Response para 404 → 200
- [ ] Response Page Path: `/index.html`
- [ ] Error Caching Min TTL: 0

### [ ] Headers de Seguridad
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Content-Security-Policy configurado

### [ ] Cache Settings
- [ ] Default TTL: 86400 (24 horas)
- [ ] Min TTL: 0
- [ ] Max TTL: 31536000 (1 año)

## 🔗 ENDPOINTS DINÁMICOS

### [ ] Archivo de Endpoints
- [ ] `public-tests/src/config/endpoints.js` existe
- [ ] Detecta entorno local vs producción
- [ ] Usa variables de entorno correctamente

### [ ] Copia Automática
- [ ] Script copia endpoints.js a S3
- [ ] Ruta en S3: `/config/endpoints.js`
- [ ] Cache control configurado

## 🧪 PRUEBAS

### [ ] Pruebas de Acceso
- [ ] URL principal responde 200
- [ ] Navegación SPA funciona
- [ ] Rutas directas funcionan (ej: `/research/123`)

### [ ] Pruebas de Performance
- [ ] Tiempo de respuesta < 3 segundos
- [ ] Assets se cargan correctamente
- [ ] No errores en consola

### [ ] Pruebas de Endpoints
- [ ] endpoints.js se descarga correctamente
- [ ] API_BASE_URL configurado
- [ ] PUBLIC_TESTS_URL configurado

## 📊 MONITOREO

### [ ] CloudWatch Metrics
- [ ] Request Count configurado
- [ ] Error Rate monitoreado
- [ ] Cache Hit Ratio visible

### [ ] Logs Habilitados
- [ ] CloudFront logs configurados
- [ ] S3 access logs habilitados
- [ ] Logs se almacenan en bucket separado

## 🔐 SEGURIDAD

### [ ] Bucket Policy
- [ ] Acceso público configurado
- [ ] No permisos de escritura pública
- [ ] CORS configurado si es necesario

### [ ] CloudFront Security
- [ ] HTTPS obligatorio
- [ ] Viewer Protocol Policy: redirect-to-https
- [ ] WAF configurado (opcional)

## 📝 DOCUMENTACIÓN

### [ ] Documentación Creada
- [ ] `public-tests/DEPLOYMENT_S3_CLOUDFRONT.md` completo
- [ ] README.md actualizado
- [ ] Scripts documentados

### [ ] Guías de Uso
- [ ] Instrucciones de configuración
- [ ] Solución de problemas
- [ ] Ejemplos de uso

## 🎯 VERIFICACIÓN FINAL

### [ ] Despliegue Completo
```bash
# Verificar todo el flujo
git add .
git commit -m "feat: configure S3/CloudFront deployment for public-tests"
git push origin main
```

### [ ] Workflow Ejecutado
- [ ] GitHub Actions se ejecuta automáticamente
- [ ] Build exitoso
- [ ] Despliegue a S3 exitoso
- [ ] Invalidación de CloudFront exitosa

### [ ] Aplicación Funcionando
- [ ] URL pública accesible
- [ ] Navegación funciona
- [ ] API conecta correctamente
- [ ] No errores en producción

## 🚨 SOLUCIÓN DE PROBLEMAS

### Problemas Comunes:
1. **Caché antiguo**: Invalidar manualmente en CloudFront
2. **Permisos**: Verificar IAM roles y políticas
3. **Endpoints**: Verificar configuración en S3
4. **SPA routing**: Verificar Custom Error Responses

### Comandos de Debug:
```bash
# Verificar bucket
aws s3 ls s3://tu-bucket-public-tests --recursive

# Verificar CloudFront
aws cloudfront get-distribution --id tu-distribution-id

# Probar invalidación
aws cloudfront create-invalidation --distribution-id tu-distribution-id --paths "/*"

# Ver logs
aws logs describe-log-groups --log-group-name-prefix "/aws/cloudfront"
```

---

## ✅ ESTADO FINAL

- [ ] **CONFIGURACIÓN COMPLETA**: Todos los elementos configurados
- [ ] **DESPLIEGUE EXITOSO**: Aplicación funcionando en producción
- [ ] **AUTOMATIZACIÓN ACTIVA**: CI/CD funcionando correctamente
- [ ] **MONITOREO CONFIGURADO**: Métricas y logs habilitados
- [ ] **DOCUMENTACIÓN ACTUALIZADA**: Guías completas disponibles

**🎉 ¡DESPLIEGUE S3/CLOUDFRONT COMPLETADO EXITOSAMENTE!**
