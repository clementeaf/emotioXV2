# 🎯 Configuración de Seeso.io para Eye Tracking

## 📋 Pasos para configurar Seeso.io

### 1. **Obtener licencia de Seeso.io**
1. Ve a [https://manage.seeso.io/](https://manage.seeso.io/)
2. Regístrate o inicia sesión
3. Crea un nuevo proyecto
4. Copia tu **License Key**

### 2. **Configurar variables de entorno**
Crea un archivo `.env.local` en la carpeta `frontend/`:

```bash
# Seeso.io License Key
NEXT_PUBLIC_SEESO_LICENSE_KEY=tu_licencia_aqui

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/dev
```

### 3. **Configurar headers CORS**
Seeso.io requiere headers específicos para funcionar. Agrega esto a tu `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 4. **Reiniciar el servidor**
```bash
npm run dev
```

## 🎯 **Ventajas de Seeso.io sobre WebGazer:**

- ✅ **Más preciso** - Mejor detección de mirada
- ✅ **Calibración automática** - No requiere calibración manual
- ✅ **Mejor rendimiento** - Optimizado para producción
- ✅ **Soporte profesional** - SDK oficial con documentación
- ✅ **Compatibilidad** - Funciona en más navegadores

## 🚨 **Troubleshooting:**

### Error: "Se requiere una licencia de Seeso.io"
- Verifica que `NEXT_PUBLIC_SEESO_LICENSE_KEY` esté configurado
- Asegúrate de que la licencia sea válida

### Error: "SharedArrayBuffer is not defined"
- Verifica que los headers CORS estén configurados
- Asegúrate de que el navegador soporte SharedArrayBuffer

### Error: "Seeso.io no está inicializado"
- Verifica que la licencia sea correcta
- Revisa la consola para errores de red
