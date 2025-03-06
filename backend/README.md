# Sistema OTP de EmotioX

Este módulo gestiona la autenticación mediante One-Time Password (OTP) enviado por email.

## 🔑 Configuración

1. Crear archivo `.env` en la raíz de la carpeta `backend`:

```
# AWS Credentials
AWS_ACCESS_KEY_ID=TU_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=TU_SECRET_KEY
AWS_REGION=us-east-1

# Email configuration
SES_FROM_EMAIL=tu_email_verificado@dominio.com

# OTP configuration
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
JWT_SECRET=tu_secreto_super_seguro_para_jwt

# Otros ajustes
NODE_ENV=development
```

2. Asegurarse de que el email configurado en `SES_FROM_EMAIL` esté verificado en AWS SES.

## 🚀 Ejecución

Para iniciar el servidor de desarrollo:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## 🧪 Pruebas

### Usando el script de prueba

```bash
# Otorgar permisos de ejecución
chmod +x test-otp.js

# Solicitar OTP
node test-otp.js request tu_email@ejemplo.com

# Validar OTP (reemplaza 123456 con el código recibido)
node test-otp.js validate tu_email@ejemplo.com 123456
```

### Usando curl directamente

```bash
# Solicitar OTP
curl -X POST http://localhost:4000/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "tu_email@ejemplo.com"}'

# Validar OTP
curl -X POST http://localhost:4000/auth/validate-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "tu_email@ejemplo.com", "code": "123456"}'
```

## 🔍 Verificación de logs

Para ver los logs y depurar posibles errores:

```bash
npm run logs
```

## 🔒 Mejoras implementadas

- **Generación segura**: Uso de `crypto.randomInt()` para generación criptográficamente segura
- **Límite de intentos**: Configurable mediante `OTP_MAX_ATTEMPTS`
- **Expiración clara**: Configurable mediante `OTP_EXPIRY_MINUTES`
- **Mejor manejo de errores**: Mensajes detallados para depuración
- **Emails HTML mejorados**: Mejor experiencia de usuario
- **Gestión de credenciales**: Carga desde archivo `.env` 