# 🔧 Configuración de Variables de Entorno para Vercel - EmotioXV2

## 🚨 PROBLEMA ACTUAL

El frontend en Vercel está fallando porque las variables de entorno `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_WS_URL` no están configuradas.

### Errores detectados:
- `[FileUploadHook] Error: NEXT_PUBLIC_API_URL no está definida en las variables de entorno`
- `Error procesando archivo imagen1.png: Error: La URL del backend no está configurada`
- Error 404 en API Gateway

## 🔧 SOLUCIÓN: Configurar Variables en Vercel Dashboard

### Paso 1: Acceder al Dashboard de Vercel
1. Ve a [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **EmotioXV2**
3. Ve a **Settings** > **Environment Variables**

### Paso 2: Configurar Variables para Development

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev` |
| `NEXT_PUBLIC_WS_URL` | `wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev` |
| `NEXT_PUBLIC_ENV` | `development` |

**Configuración:**
- **Environment:** Development
- **Production:** ✅ (marcar)
- **Preview:** ✅ (marcar)

### Paso 3: Configurar Variables para Production

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod` |
| `NEXT_PUBLIC_WS_URL` | `wss://0x3ndqqhe9.execute-api.us-east-1.amazonaws.com/prod` |
| `NEXT_PUBLIC_ENV` | `production` |

**Configuración:**
- **Environment:** Production
- **Production:** ✅ (marcar)
- **Preview:** ✅ (marcar)

## 🚀 Configuración Automática con Vercel CLI

### Opción 1: Usar el script automático
```bash
cd frontend
./scripts/fix-vercel-env.sh
```

### Opción 2: Configuración manual con CLI
```bash
# Instalar Vercel CLI si no está instalado
npm install -g vercel

# Configurar variables para development
vercel env add NEXT_PUBLIC_API_URL development
# Ingresa: https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev

vercel env add NEXT_PUBLIC_WS_URL development
# Ingresa: wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev

vercel env add NEXT_PUBLIC_ENV development
# Ingresa: development

# Configurar variables para production
vercel env add NEXT_PUBLIC_API_URL production
# Ingresa: https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod

vercel env add NEXT_PUBLIC_WS_URL production
# Ingresa: wss://0x3ndqqhe9.execute-api.us-east-1.amazonaws.com/prod

vercel env add NEXT_PUBLIC_ENV production
# Ingresa: production
```

## 🔍 Verificación de Variables

### Verificar variables configuradas:
```bash
vercel env ls
```

### Verificar conectividad al backend:
```bash
# Test de desarrollo
curl -i https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev

# Test de producción
curl -i https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod
```

## 🚀 Redeploy Después de Configurar Variables

### Opción 1: Redeploy automático
1. Haz un commit y push a tu repositorio
2. Vercel automáticamente hará un nuevo deploy con las variables

### Opción 2: Redeploy manual
```bash
vercel --prod
```

## 🔧 Solución Alternativa: Archivo .env.local

Si las variables de entorno no funcionan, crea un archivo `.env.local` en el directorio `frontend/`:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_WS_URL=wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_ENV=development
```

**⚠️ NOTA:** `.env.local` solo funciona en desarrollo local. Para Vercel, debes usar las variables de entorno del dashboard.

## 📋 Checklist de Verificación

### [ ] Variables configuradas en Vercel Dashboard
- [ ] `NEXT_PUBLIC_API_URL` para Development
- [ ] `NEXT_PUBLIC_WS_URL` para Development
- [ ] `NEXT_PUBLIC_ENV` para Development
- [ ] `NEXT_PUBLIC_API_URL` para Production
- [ ] `NEXT_PUBLIC_WS_URL` para Production
- [ ] `NEXT_PUBLIC_ENV` para Production

### [ ] Redeploy completado
- [ ] Commit y push al repositorio
- [ ] Deploy automático en Vercel
- [ ] Variables disponibles en el nuevo build

### [ ] Verificación post-deploy
- [ ] No errores de `NEXT_PUBLIC_API_URL` en consola
- [ ] Carga de archivos funciona correctamente
- [ ] Llamadas a la API funcionan
- [ ] WebSocket conecta correctamente

## 🔍 Monitoreo y Debugging

### Verificar variables en runtime:
```javascript
// En la consola del navegador
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('WS URL:', process.env.NEXT_PUBLIC_WS_URL);
console.log('Environment:', process.env.NEXT_PUBLIC_ENV);
```

### Logs de Vercel:
1. Ve a tu proyecto en Vercel Dashboard
2. Selecciona el último deploy
3. Revisa los logs de build y runtime

### Debugging de API:
```javascript
// En la consola del navegador
fetch(process.env.NEXT_PUBLIC_API_URL + '/health')
  .then(response => console.log('API Status:', response.status))
  .catch(error => console.error('API Error:', error));
```

## 🎯 URLs de Referencia

### Development Environment:
- **API Gateway:** `https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev`
- **WebSocket:** `wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev`

### Production Environment:
- **API Gateway:** `https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod`
- **WebSocket:** `wss://0x3ndqqhe9.execute-api.us-east-1.amazonaws.com/prod`

## 🚨 Problemas Comunes

### Error: "Variable not found"
- **Solución:** Verifica que la variable esté configurada para el entorno correcto
- **Verificación:** Usa `vercel env ls` para ver todas las variables

### Error: "API not responding"
- **Solución:** Verifica que el backend esté desplegado y funcionando
- **Verificación:** Haz un test de conectividad con curl

### Error: "Build failed"
- **Solución:** Verifica que las variables estén disponibles durante el build
- **Verificación:** Revisa los logs de build en Vercel Dashboard

## 📞 Soporte

Si sigues teniendo problemas después de seguir estos pasos:

1. **Revisa los logs de Vercel** en el dashboard
2. **Verifica la conectividad** al backend con curl
3. **Comprueba las variables** con `vercel env ls`
4. **Haz un redeploy** manual con `vercel --prod`

---

**✅ Una vez configuradas las variables de entorno, los errores deberían desaparecer y la aplicación funcionará correctamente en Vercel.**
