# 🚀 DEPLOY COMPLETO A AWS S3/CLOUDFRONT - EmotioXV2

## 📋 RESUMEN EJECUTIVO

### **✅ LO QUE ESTÁ LISTO:**
- ✅ **Script de deploy automatizado** (`deploy-aws.sh`)
- ✅ **Configuración de S3** (bucket-policy.json)
- ✅ **Configuración de CloudFront** (cloudfront-config.json)
- ✅ **Lambda@Edge para redireccionamientos** (lambda-redirects.js)
- ✅ **Lambda@Edge para headers de seguridad** (lambda-headers.js)
- ✅ **GitHub Actions workflow** (aws-s3-deploy.yml)
- ✅ **Documentación completa** (aws-deploy-manual.md)

### **🎯 CARACTERÍSTICAS CONFIGURADAS:**
- ✅ **Variables de entorno** (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`)
- ✅ **Redireccionamientos API** (`/api/*` → API Gateway)
- ✅ **Headers de seguridad** (X-Content-Type-Options, X-Frame-Options, etc.)
- ✅ **SPA routing** (fallback a index.html)
- ✅ **CDN global** con CloudFront
- ✅ **SSL automático**
- ✅ **Invalidación de caché** automática

---

## 🚀 PASOS PARA DEPLOY

### **Paso 1: Configurar AWS CLI**
```bash
# Instalar AWS CLI
brew install awscli

# Configurar credenciales
aws configure
# AWS Access Key ID: [tu-access-key]
# AWS Secret Access Key: [tu-secret-key]
# Default region name: us-east-1
# Default output format: json
```

### **Paso 2: Ejecutar Deploy Automatizado**
```bash
# Navegar al directorio frontend
cd frontend

# Ejecutar script de deploy
./deploy-aws.sh
```

### **Paso 3: Configurar GitHub Secrets (Opcional)**
Para automatización completa, configurar en GitHub:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET` = `emotioxv2-frontend`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

---

## 📊 COMPARACIÓN CON VERCEL

| Aspecto | Vercel | AWS S3/CloudFront |
|---------|--------|-------------------|
| **Tiempo de configuración** | 5 minutos | 30 minutos |
| **Deploy automático** | ✅ | ✅ (con GitHub Actions) |
| **Redireccionamientos API** | ✅ Automático | ✅ (Lambda@Edge) |
| **Headers de seguridad** | ✅ Automático | ✅ (Lambda@Edge) |
| **CDN global** | ✅ | ✅ |
| **SSL automático** | ✅ | ✅ |
| **Costo** | ✅ Gratis | ⚠️ $1-5/mes |
| **Mantenimiento** | ✅ Cero | ⚠️ Bajo |

---

## 🔧 CONFIGURACIÓN AVANZADA

### **Lambda@Edge Setup:**
1. **Crear funciones Lambda** con los archivos `lambda-redirects.js` y `lambda-headers.js`
2. **Publicar versiones** de las funciones
3. **Asociar a CloudFront** como:
   - **Viewer Request** (para redireccionamientos)
   - **Viewer Response** (para headers)

### **Configuración de CloudFront:**
```bash
# Crear distribución CloudFront
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### **Verificación de deploy:**
```bash
# Verificar S3
aws s3 ls s3://emotioxv2-frontend --recursive

# Verificar CloudFront
aws cloudfront list-distributions

# Probar URLs
curl -I http://emotioxv2-frontend.s3-website-us-east-1.amazonaws.com
```

---

## 🎯 VENTAJAS DE AWS

### **✅ PROS:**
- ✅ **Control total** de la infraestructura
- ✅ **Escalabilidad** automática
- ✅ **CDN global** con CloudFront
- ✅ **Costo muy bajo** ($1-5/mes)
- ✅ **Integración nativa** con otros servicios AWS
- ✅ **Performance** optimizada

### **⚠️ CONTRAS:**
- ⚠️ **Configuración manual** compleja
- ⚠️ **Mantenimiento** requerido
- ⚠️ **Lambda@Edge** para funcionalidades avanzadas
- ⚠️ **Curva de aprendizaje** alta

---

## 🚨 LIMITACIONES CONOCIDAS

### **Redireccionamientos API:**
- ⚠️ Requieren **Lambda@Edge** para funcionar correctamente
- ⚠️ **Configuración manual** en CloudFront
- ⚠️ **Latencia adicional** de ~50ms

### **Headers de Seguridad:**
- ⚠️ Requieren **Lambda@Edge** para ser aplicados
- ⚠️ **Configuración manual** en CloudFront
- ⚠️ **Limitaciones** de tamaño de función

### **WebSocket Connections:**
- ⚠️ **No soportados** en CloudFront
- ⚠️ Requieren **configuración directa** al backend
- ⚠️ **CORS** debe estar configurado en el backend

---

## 🎉 CONCLUSIÓN

### **✅ AWS S3/CloudFront ES VIABLE** para EmotioXV2/frontend

**Con las configuraciones creadas, tu aplicación puede funcionar completamente en AWS con:**

- ✅ **Deploy automatizado** via GitHub Actions
- ✅ **Redireccionamientos API** funcionales
- ✅ **Headers de seguridad** aplicados
- ✅ **CDN global** con CloudFront
- ✅ **SSL automático**
- ✅ **Costo muy bajo** ($1-5/mes)

### **🎯 RECOMENDACIÓN:**
**Usa AWS como backup de Vercel** - mantén Vercel como principal por su simplicidad, pero AWS te da control total y costos predecibles.

---

## 📞 SOPORTE

Si encuentras problemas:
1. **Verifica credenciales AWS** con `aws sts get-caller-identity`
2. **Revisa logs** en CloudWatch
3. **Verifica configuración** de Lambda@Edge
4. **Consulta documentación** en `aws-deploy-manual.md`
