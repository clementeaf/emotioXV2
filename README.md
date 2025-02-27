# EmotioX v2

Aplicación para gestionar y registrar emociones con autenticación OTP y WebSockets para renovación de tokens.

## Estructura del Proyecto

El proyecto está organizado como un monorepo con los siguientes componentes:

- **frontend**: Aplicación Next.js para la interfaz de usuario
- **backend**: API serverless con AWS Lambda y DynamoDB
- **shared**: Tipos y utilidades compartidas entre frontend y backend

## Requisitos Previos

- Node.js 18 o superior
- npm 8 o superior
- AWS CLI configurado con credenciales válidas
- Cuenta de AWS con permisos para:
  - Lambda
  - DynamoDB
  - API Gateway
  - SES (para envío de emails)
  - IAM

## Configuración Inicial

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/emotiox-v2.git
   cd emotiox-v2
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar AWS CLI (si aún no está configurado):
   ```bash
   aws configure --profile emotioX
   ```

4. Configurar variables de entorno:
   - Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:
     ```
     JWT_SECRET=tu_secreto_jwt_seguro
     SES_FROM_EMAIL=tu_email_verificado@ejemplo.com
     AWS_PROFILE=emotioX
     ```

## Desarrollo Local

### Backend

Para ejecutar el backend localmente:

```bash
npm run backend:dev
```

Esto iniciará el servidor Serverless Offline en http://localhost:3001

### Frontend

Para ejecutar el frontend localmente:

```bash
npm run frontend:dev
```

Esto iniciará el servidor Next.js en http://localhost:4700

## Despliegue

### Verificar Credenciales AWS

Antes de desplegar, verifica que tus credenciales AWS estén correctamente configuradas:

```bash
npm run check-aws dev
```

### Desplegar Backend

Para desplegar el backend a AWS:

```bash
# Entorno de desarrollo
npm run backend:deploy:dev

# Entorno de pruebas
npm run backend:deploy:test

# Entorno de producción
npm run backend:deploy:prod
```

### Actualizar Configuración del Frontend

Después de desplegar el backend, actualiza la configuración del frontend con las URLs generadas:

```bash
npm run update-frontend:dev
```

### Desplegar Frontend

Para construir y desplegar el frontend:

```bash
npm run frontend:deploy:dev
```

### Despliegue Completo

Para realizar un despliegue completo (backend + frontend):

```bash
npm run deploy:dev
```

## Monitoreo y Logs

Para ver los logs del backend:

```bash
# Ver logs de una función específica (reemplaza FUNCTION_NAME)
npm run backend:logs:dev -- FUNCTION_NAME

# Ejemplos
npm run backend:logs:dev -- requestOtp
npm run backend:logs:dev -- validateOtp
npm run backend:logs:dev -- websocketConnect
```

## Rollback

Si necesitas revertir un despliegue:

```bash
npm run rollback:dev
```

## Características Principales

- **Autenticación OTP**: Sistema de autenticación sin contraseña mediante códigos de un solo uso enviados por email
- **WebSockets**: Renovación automática de tokens JWT mediante conexiones WebSocket
- **Gestión de Usuarios**: CRUD completo para perfiles de usuario
- **Gestión de Emociones**: Registro y seguimiento de emociones

## Arquitectura

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Serverless Framework, AWS Lambda, API Gateway, DynamoDB
- **Autenticación**: JWT, OTP vía SES
- **Comunicación en tiempo real**: WebSockets mediante API Gateway

## Licencia

Este proyecto es privado y confidencial.
