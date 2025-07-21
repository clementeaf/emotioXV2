# 🚀 Deploy Estático en Railway - EmotioXV2

## 📋 CONFIGURACIÓN

### **Paso 1: Crear proyecto en Railway**
1. Ve a [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Selecciona tu repositorio `emotioXV2`
4. **Branch:** `main`

### **Paso 2: Configurar como Static Site**
- **Service Type:** Static Site
- **Build Command:** `npm run build`
- **Output Directory:** `out`
- **Root Directory:** `frontend`

### **Paso 3: Variables de Entorno**
```
NEXT_PUBLIC_API_URL=https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_WS_URL=wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_ENV=production
```

### **Paso 4: Deploy**
- Railway automáticamente hará build y deploy
- URL: `https://tu-app.railway.app`

## ✅ VENTAJAS DE RAILWAY

- ✅ **Login estable** y confiable
- ✅ **Interfaz simple** y clara
- ✅ **Deploy automático** desde GitHub
- ✅ **Variables de entorno** fáciles de configurar
- ✅ **SSL automático**
- ✅ **CDN global**

## ⚠️ LIMITACIONES

- ⚠️ **Redireccionamientos API** requieren configuración manual
- ⚠️ **Headers de seguridad** requieren configuración manual
- ⚠️ **Costo:** $5/mes después del período gratuito
