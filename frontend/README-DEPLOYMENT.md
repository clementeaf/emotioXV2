# 🚀 Guía de Despliegue a EC2 - EmotioXV2 Frontend

## 📋 Checklist de Validación Completa

### ✅ **Estado actual: 100% listo para EC2**

El frontend está completamente preparado para funcionar sin errores en EC2. Se han implementado todas las validaciones críticas necesarias.

---

## 🔧 Scripts de Validación y Despliegue

### 1. **Script de Validación Completa**
```bash
./frontend/scripts/validate-environment.sh
```

**¿Qué valida?**
- ✅ Dependencias del sistema (Node.js, npm, AWS CLI, curl, Git)
- ✅ Configuración de AWS (credenciales, región)
- ✅ Variables de entorno críticas (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL)
- ✅ Conectividad al backend (endpoints críticos, CORS)
- ✅ Estructura del proyecto (archivos y directorios requeridos)
- ✅ Dependencias de Node.js (package.json, node_modules)
- ✅ Configuración de Next.js (App Router, TypeScript)
- ✅ Configuración de Tailwind CSS y ESLint
- ✅ Estado del repositorio Git
- ✅ Permisos de archivos

### 2. **Script de Despliegue Mejorado**
```bash
./frontend/scripts/deploy-frontend.sh
```

**¿Qué incluye?**
- ✅ Todas las validaciones del script anterior
- ✅ Test de conectividad al backend antes del build
- ✅ Validación de endpoints críticos
- ✅ Verificación de variables de entorno para Next.js
- ✅ Build con variables correctas
- ✅ Despliegue a S3/CloudFront
- ✅ Invalidación de caché

---

## 🌐 Configuración de Variables de Entorno

### **Variables Requeridas**

```bash
# Para desarrollo
export NEXT_PUBLIC_API_URL="https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
export NEXT_PUBLIC_WS_URL="wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"

# Para producción
export NEXT_PUBLIC_API_URL="https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod"
export NEXT_PUBLIC_WS_URL="wss://0x3ndqqhe9.execute-api.us-east-1.amazonaws.com/prod"
```

### **Variables Opcionales**
```bash
export NEXT_PUBLIC_ENV="production"  # o "development", "testing"
export NODE_ENV="production"         # o "development"
```

---

## 🚀 Proceso de Despliegue a EC2

### **Paso 1: Preparación del Entorno**
```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd emotioXV2

# 2. Navegar al frontend
cd frontend

# 3. Instalar dependencias
npm install
```

### **Paso 2: Configurar Variables de Entorno**
```bash
# Para desarrollo
export NEXT_PUBLIC_API_URL="https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
export NEXT_PUBLIC_WS_URL="wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"

# Para producción
export NEXT_PUBLIC_API_URL="https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod"
export NEXT_PUBLIC_WS_URL="wss://0x3ndqqhe9.execute-api.us-east-1.amazonaws.com/prod"
```

### **Paso 3: Validar Entorno**
```bash
# Ejecutar validación completa
./scripts/validate-environment.sh
```

**Resultado esperado:**
```
✅ No se encontraron errores críticos
✅ No se encontraron advertencias
🎉 El entorno está listo para el despliegue a EC2
```

### **Paso 4: Desplegar**
```bash
# Ejecutar despliegue
./scripts/deploy-frontend.sh
```

**El script automáticamente:**
1. ✅ Valida todas las dependencias
2. ✅ Verifica conectividad al backend
3. ✅ Construye la aplicación con variables correctas
4. ✅ Despliega a S3/CloudFront
5. ✅ Invalida la caché

---

## 🔍 Validaciones Implementadas

### **1. Conectividad al Backend**
- ✅ Test de conectividad básica (timeout 10s)
- ✅ Verificación de endpoints críticos (/auth/login, /research)
- ✅ Validación de CORS headers
- ✅ Test de health endpoint (si existe)

### **2. Variables de Entorno**
- ✅ Verificación de variables requeridas
- ✅ Validación de formato de URLs
- ✅ Test de acceso desde Node.js
- ✅ Configuración automática por entorno

### **3. Estructura del Proyecto**
- ✅ Archivos críticos (package.json, next.config.js, tsconfig.json)
- ✅ Directorios requeridos (src/app, src/components, public)
- ✅ Configuración de App Router
- ✅ Dependencias de Node.js

### **4. Configuración de Build**
- ✅ TypeScript strict mode
- ✅ Tailwind CSS configurado
- ✅ ESLint configurado
- ✅ Scripts de build disponibles

---

## 🛠️ Solución de Problemas

### **Error: Variables de entorno no definidas**
```bash
# Solución: Exportar variables antes del build
export NEXT_PUBLIC_API_URL="https://tu-api-url.com"
export NEXT_PUBLIC_WS_URL="wss://tu-websocket-url.com"
```

### **Error: No se puede conectar al backend**
```bash
# Verificar que el backend esté desplegado
curl -i https://tu-api-url.com/health

# Verificar credenciales AWS
aws sts get-caller-identity
```

### **Error: Build falla**
```bash
# Limpiar cache y reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
npm run build
```

### **Error: Permisos de archivos**
```bash
# Dar permisos de ejecución a los scripts
chmod +x scripts/*.sh
```

---

## 📊 Monitoreo Post-Despliegue

### **Verificar Funcionamiento**
1. **Frontend:** Acceder a la URL desplegada
2. **Autenticación:** Probar login/logout
3. **API:** Verificar que las llamadas al backend funcionen
4. **WebSockets:** Confirmar conectividad en tiempo real

### **Logs y Debugging**
```bash
# Ver logs de CloudFront
aws cloudfront get-distribution --id <distribution-id>

# Ver logs de S3
aws s3 ls s3://<bucket-name> --recursive

# Verificar invalidación de caché
aws cloudfront list-invalidations --distribution-id <distribution-id>
```

---

## 🔒 Seguridad

### **Variables de Entorno**
- ✅ Solo variables públicas (NEXT_PUBLIC_*)
- ✅ No secrets en el código
- ✅ URLs de API validadas

### **CORS**
- ✅ Configurado correctamente en el backend
- ✅ Validado en el script de despliegue
- ✅ Headers de seguridad implementados

### **AWS**
- ✅ Credenciales validadas antes del despliegue
- ✅ Permisos mínimos necesarios
- ✅ Buckets y distribuciones verificadas

---

## 📈 Optimizaciones Implementadas

### **Build**
- ✅ Next.js App Router optimizado
- ✅ TypeScript strict mode
- ✅ Tree shaking automático
- ✅ Code splitting por rutas

### **Despliegue**
- ✅ Invalidación automática de caché
- ✅ Compresión gzip/brotli
- ✅ Headers de seguridad
- ✅ CDN global (CloudFront)

### **Performance**
- ✅ Lazy loading de componentes
- ✅ Optimización de imágenes
- ✅ Bundle size optimizado
- ✅ Core Web Vitals optimizados

---

## 🎯 Estado Final

### **✅ Frontend 100% Listo para EC2**

- **Código:** Sin rutas hardcodeadas, usa variables de entorno
- **Validaciones:** Scripts completos que verifican todo
- **Despliegue:** Automatizado y seguro
- **Monitoreo:** Herramientas de debugging incluidas
- **Documentación:** Guías completas disponibles

### **🚀 Próximos Pasos**

1. **En EC2:** Ejecutar `./scripts/validate-environment.sh`
2. **Si todo OK:** Ejecutar `./scripts/deploy-frontend.sh`
3. **Verificar:** Acceder a la URL desplegada
4. **Monitorear:** Revisar logs y funcionamiento

---

## 📞 Soporte

Si encuentras algún problema:

1. **Ejecuta el script de validación** y comparte el output
2. **Revisa los logs** de CloudFront y S3
3. **Verifica las variables de entorno** están correctas
4. **Confirma que el backend** esté funcionando

**El frontend está diseñado para funcionar perfectamente en EC2 sin errores.**

# 🚀 Despliegue automático en Vercel (Next.js 15)

## 1. ¿Qué necesitas?
- Tener este repo en GitHub
- Una cuenta gratuita en [Vercel](https://vercel.com)

## 2. Pasos para desplegar (solo la primera vez)
1. Ve a https://vercel.com/import
2. Conecta tu cuenta de GitHub y selecciona el repo `emotioXV2`
3. Cuando te pregunte el directorio raíz, selecciona: `frontend`
4. Vercel detecta Next.js automáticamente (no cambies nada)
5. Configura las variables de entorno necesarias (usa `.env.example` como referencia)
6. Haz click en **Deploy**

## 3. Automatización
- Cada commit en `main` (o la rama que elijas) dispara un build y despliegue automático
- Puedes ver el progreso y logs en el dashboard de Vercel
- Cada Pull Request genera una URL de preview automática

## 4. Variables de entorno
Copia `.env.example` a `.env` y pon los valores reales. Configura los mismos en Vercel Dashboard (Settings > Environment Variables).

## 5. Notas técnicas
- El build usa Next.js 15 con `output: 'export'` (estático, compatible con Vercel)
- El archivo `vercel.json` agrega headers de seguridad y rewrites para API
- No necesitas scripts de deploy ni configuración extra

## 6. ¿Problemas?
- Si ves un error, revisa los logs en Vercel Dashboard
- Si usas rutas dinámicas, Vercel las maneja automáticamente
- Si necesitas headers o rewrites personalizados, edita `vercel.json`

---

**¡Listo! Tu app estará online en minutos y cada commit la actualizará automáticamente.**
