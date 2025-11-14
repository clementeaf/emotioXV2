# 📋 Instrucciones para Sincronizar URLs de Public-Tests

## ✅ Cambios Realizados

Se han corregido todas las referencias a la URL de CloudFront para public-tests:
- **URL antigua (incorrecta):** `https://d35071761848hm.cloudfront.net`
- **URL nueva (correcta):** `https://d2zt8ia21te5mv.cloudfront.net`
- **Distribution ID:** `E2X8HCFI5FM1EC`

## 🔧 Pasos para Sincronizar

### 1. Verificar/Actualizar Secret en GitHub

El secret `NEXT_PUBLIC_PUBLIC_TESTS_URL` debe contener la URL correcta.

#### Opción A: Usando GitHub CLI (recomendado)

```bash
# Verificar el valor actual
gh secret list

# Actualizar el secret
gh secret set NEXT_PUBLIC_PUBLIC_TESTS_URL --body "https://d2zt8ia21te5mv.cloudfront.net"
```

#### Opción B: Usando la interfaz web de GitHub

1. Ve a tu repositorio en GitHub
2. Navega a: **Settings** → **Secrets and variables** → **Actions**
3. Busca el secret `NEXT_PUBLIC_PUBLIC_TESTS_URL`
4. Si existe y tiene la URL incorrecta, haz clic en **Update**
5. Cambia el valor a: `https://d2zt8ia21te5mv.cloudfront.net`
6. Guarda los cambios

### 2. Hacer Push de los Cambios

```bash
git push origin main
```

Esto activará automáticamente los workflows de deploy:
- **Frontend:** Se desplegará cuando detecte cambios en `frontend/**`
- **Public-tests:** Se desplegará cuando detecte cambios en `public-tests/**`

### 3. Verificar el Deploy

#### Frontend
- Workflow: `.github/workflows/deploy-frontend.yml`
- Se ejecuta automáticamente al hacer push a `main` con cambios en `frontend/**`
- Verifica en: **Actions** → **Deploy Frontend to S3/CloudFront**

#### Public-tests
- Workflow: `.github/workflows/deploy-public-tests-s3.yml`
- Se ejecuta automáticamente al hacer push a `main` con cambios en `public-tests/**`
- Verifica en: **Actions** → **Deploy Public Tests to S3/CloudFront**

### 4. Verificar URLs en Producción

Después del deploy (puede tardar 5-15 minutos):

#### Frontend
- **CloudFront:** https://d2s9nr0bm47yl1.cloudfront.net
- **S3:** http://emotioxv2-frontend-041238861016.s3-website-us-east-1.amazonaws.com

#### Public-tests
- **CloudFront:** https://d2zt8ia21te5mv.cloudfront.net
- **S3:** http://emotioxv2-public-tests-041238861016.s3-website-us-east-1.amazonaws.com

## 🔍 Verificación Adicional

### Verificar que el secret está correcto

```bash
# Usando GitHub CLI
gh secret list | grep NEXT_PUBLIC_PUBLIC_TESTS_URL
```

### Verificar el build del frontend

El frontend usa `NEXT_PUBLIC_PUBLIC_TESTS_URL` durante el build. Si el secret está correcto, el build incluirá la URL correcta.

### Verificar archivos en S3

```bash
# Verificar que los archivos están actualizados
aws s3 ls s3://emotioxv2-frontend-041238861016/ --recursive | head -20
aws s3 ls s3://emotioxv2-public-tests-041238861016/ --recursive | head -20
```

## ⚠️ Notas Importantes

1. **Tiempo de propagación:** CloudFront puede tardar 5-15 minutos en actualizar después de la invalidación
2. **Cache del navegador:** Puede ser necesario hacer hard refresh (Ctrl+Shift+R o Cmd+Shift+R)
3. **Variables de entorno:** El frontend usa `NEXT_PUBLIC_PUBLIC_TESTS_URL` del secret durante el build, no en runtime
4. **Fallback:** El código tiene un fallback a la URL correcta si el secret no está configurado

## 📊 Resumen de Configuración

| Componente | Distribution ID | CloudFront URL | S3 Bucket |
|------------|----------------|----------------|-----------|
| Frontend | `E3MCIWNMF6ES2R` | `d2s9nr0bm47yl1.cloudfront.net` | `emotioxv2-frontend-041238861016` |
| Public-tests | `E2X8HCFI5FM1EC` | `d2zt8ia21te5mv.cloudfront.net` | `emotioxv2-public-tests-041238861016` |

## ✅ Checklist Final

- [ ] Secret `NEXT_PUBLIC_PUBLIC_TESTS_URL` actualizado en GitHub
- [ ] Cambios commiteados y pusheados
- [ ] Workflow de frontend ejecutado exitosamente
- [ ] Workflow de public-tests ejecutado exitosamente
- [ ] URLs verificadas en producción
- [ ] CloudFront cache invalidado
- [ ] Funcionalidad probada en producción

