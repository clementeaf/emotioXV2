# 🎯 Configuración de Seeso.io - Guía Paso a Paso

## 📋 **Instrucciones para configurar Seeso.io:**

### 1. **Obtener licencia de Seeso.io**
1. Ve a [https://manage.seeso.io/](https://manage.seeso.io/)
2. **Regístrate** o inicia sesión
3. **Crea un nuevo proyecto**
4. **Copia tu License Key** (algo como: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 2. **Configurar la licencia**
1. Abre el archivo `.env.local` en la carpeta `frontend/`
2. Reemplaza `YOUR_SEESO_LICENSE_KEY_HERE` con tu licencia real
3. Guarda el archivo

**Ejemplo:**
```bash
NEXT_PUBLIC_SEESO_LICENSE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### 3. **Reiniciar el servidor**
```bash
npm run dev
```

### 4. **Probar el eye tracking**
1. Ve a `http://localhost:3000/eye-tracking-demo`
2. Haz clic en "Iniciar Eye Tracking"
3. **¡Debería funcionar mucho mejor que WebGazer!**

## 🎯 **Ventajas de Seeso.io:**

- ✅ **Calibración automática** - No necesitas calibración manual
- ✅ **Mejor precisión** - Eye tracking más exacto
- ✅ **Rendimiento superior** - Optimizado para producción
- ✅ **SDK oficial** - Soporte profesional

## 🚨 **Si tienes problemas:**

### Error: "Se requiere una licencia de Seeso.io"
- Verifica que `NEXT_PUBLIC_SEESO_LICENSE_KEY` esté configurado
- Asegúrate de que la licencia sea válida

### Error: "SharedArrayBuffer is not defined"
- Verifica que los headers CORS estén configurados en `next.config.js`
- Asegúrate de que el navegador soporte SharedArrayBuffer

### Error: "Seeso.io no está inicializado"
- Verifica que la licencia sea correcta
- Revisa la consola para errores de red

## 📞 **Soporte:**
- Documentación: [https://docs.eyedid.ai/](https://docs.eyedid.ai/)
- Soporte: [https://manage.seeso.io/](https://manage.seeso.io/)
