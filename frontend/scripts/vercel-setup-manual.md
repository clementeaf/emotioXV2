# 🚀 Configuración Manual de Vercel - EmotioXV2

## 🚨 PROBLEMA ACTUAL

El frontend en Vercel está fallando porque:
1. **Variables de entorno no configuradas** - `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_WS_URL`
2. **Error 404 en API Gateway** - El endpoint no responde correctamente
3. **FileUploadHook falla** - No puede subir archivos sin la URL del backend

## 🔧 SOLUCIÓN COMPLETA PASO A PASO

### Paso 1: Verificar Estado Actual del Proyecto

```bash
# Verificar si el proyecto está vinculado a Vercel
vercel ls

# Si no está vinculado, vincular el proyecto
vercel link
```

### Paso 2: Configurar Variables de Entorno en Vercel Dashboard

#### 2.1 Acceder al Dashboard
1. Ve a [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **EmotioXV2**
3. Ve a **Settings** > **Environment Variables**

#### 2.2 Configurar Variables para Development

| Variable | Valor | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev` | Development |
| `NEXT_PUBLIC_WS_URL` | `wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev` | Development |
| `NEXT_PUBLIC_ENV` | `development` | Development |

**Configuración:**
- ✅ **Production:** Marcado
- ✅ **Preview:** Marcado

#### 2.3 Configurar Variables para Production

| Variable | Valor | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod` | Production |
| `NEXT_PUBLIC_WS_URL` | `wss://0x3ndqqhe9.execute-api.us-east-1.amazonaws.com/prod` | Production |
| `NEXT_PUBLIC_ENV` | `production` | Production |

**Configuración:**
- ✅ **Production:** Marcado
- ✅ **Preview:** Marcado

### Paso 3: Verificar Conectividad al Backend

```bash
# Test de conectividad al backend de desarrollo
curl -i https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev

# Test de conectividad al backend de producción
curl -i https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod

# Test de endpoint específico que está fallando
curl -i "https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev/research/193b949e-9fac-f000-329b-e71bab5a9203/cognitive-task"
```

### Paso 4: Redeploy de la Aplicación

#### Opción A: Redeploy Automático
```bash
# Hacer commit y push para trigger automático
git add .
git commit -m "fix: configure environment variables for Vercel"
git push origin main
```

#### Opción B: Redeploy Manual
```bash
# Forzar redeploy manual
vercel --prod
```

### Paso 5: Verificar Variables en Runtime

#### 5.1 Verificar en el Navegador
Abre la consola del navegador en tu aplicación Vercel y ejecuta:

```javascript
// Verificar variables de entorno
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('WS URL:', process.env.NEXT_PUBLIC_WS_URL);
console.log('Environment:', process.env.NEXT_PUBLIC_ENV);

// Test de conectividad a la API
fetch(process.env.NEXT_PUBLIC_API_URL + '/health')
  .then(response => console.log('API Status:', response.status))
  .catch(error => console.error('API Error:', error));
```

#### 5.2 Verificar en los Logs de Vercel
1. Ve a tu proyecto en Vercel Dashboard
2. Selecciona el último deploy
3. Revisa los logs de build y runtime

## 🔍 DIAGNÓSTICO DETALLADO

### Verificar Variables Configuradas
```bash
# Listar variables de entorno en Vercel
vercel env ls
```

### Verificar Estado del Proyecto
```bash
# Verificar proyectos vinculados
vercel ls

# Verificar configuración del proyecto
vercel project ls
```

### Verificar Logs de Deploy
```bash
# Ver logs del último deploy
vercel logs

# Ver logs en tiempo real
vercel logs --follow
```

## 🚨 SOLUCIÓN ALTERNATIVA: Configuración Local

Si las variables de entorno en Vercel no funcionan, puedes crear un archivo `.env.local`:

```bash
# Crear archivo .env.local en el directorio frontend/
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_WS_URL=wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_ENV=development
EOF
```

**⚠️ NOTA:** Este archivo solo funciona en desarrollo local. Para Vercel, debes usar las variables del dashboard.

## 📋 CHECKLIST DE VERIFICACIÓN

### [ ] Configuración de Vercel
- [ ] Proyecto vinculado a Vercel (`vercel link`)
- [ ] Variables de entorno configuradas en Dashboard
- [ ] Variables disponibles para Development y Production

### [ ] Variables de Entorno
- [ ] `NEXT_PUBLIC_API_URL` configurada
- [ ] `NEXT_PUBLIC_WS_URL` configurada
- [ ] `NEXT_PUBLIC_ENV` configurada
- [ ] Variables marcadas para Production y Preview

### [ ] Conectividad
- [ ] Backend de desarrollo responde
- [ ] Backend de producción responde
- [ ] Endpoint específico que fallaba responde

### [ ] Deploy
- [ ] Redeploy completado
- [ ] Variables disponibles en runtime
- [ ] No errores en logs de Vercel

### [ ] Verificación Post-Deploy
- [ ] No errores de `NEXT_PUBLIC_API_URL` en consola
- [ ] Carga de archivos funciona
- [ ] Llamadas a la API funcionan
- [ ] WebSocket conecta correctamente

## 🔧 TROUBLESHOOTING

### Error: "Project not linked"
```bash
# Solución: Vincular proyecto
vercel link
```

### Error: "Variables not found"
1. Verifica que las variables estén configuradas en el Dashboard
2. Verifica que estén marcadas para el entorno correcto
3. Haz un redeploy después de configurar las variables

### Error: "API not responding"
1. Verifica que el backend esté desplegado
2. Haz un test de conectividad con curl
3. Verifica que las URLs sean correctas

### Error: "Build failed"
1. Revisa los logs de build en Vercel Dashboard
2. Verifica que las variables estén disponibles durante el build
3. Verifica que no haya errores de sintaxis en el código

## 🎯 URLs DE REFERENCIA

### Development Environment:
- **API Gateway:** `https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev`
- **WebSocket:** `wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev`

### Production Environment:
- **API Gateway:** `https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod`
- **WebSocket:** `wss://0x3ndqqhe9.execute-api.us-east-1.amazonaws.com/prod`

## 📞 SOPORTE ADICIONAL

Si sigues teniendo problemas:

1. **Revisa los logs de Vercel** en el dashboard
2. **Verifica la conectividad** al backend con curl
3. **Comprueba las variables** con `vercel env ls`
4. **Haz un redeploy** manual con `vercel --prod`
5. **Contacta soporte** de Vercel si es necesario

---

**✅ Una vez completados todos los pasos, los errores deberían desaparecer y la aplicación funcionará correctamente en Vercel.**
