# EmotioXV2

## ⚠️ Deployment Notice

**This project does NOT deploy to Vercel.**

- **Frontend**: Deploys to S3/CloudFront via GitHub Actions
- **Public Tests**: Deploys to S3/CloudFront via GitHub Actions  
- **Backend**: Deploys to AWS Lambda via Serverless Framework

Any Vercel deployments for this repository should be disabled.

## Architecture

```
├── frontend/        # Next.js app → S3/CloudFront
├── public-tests/    # Vite React app → S3/CloudFront
├── backendV2/       # Node.js API → AWS Lambda
└── shared/          # Shared TypeScript interfaces
```

## Deployment Targets

- **Frontend**: https://d2s9nr0bm47yl1.cloudfront.net
- **Public Tests**: https://d2zt8ia21te5mv.cloudfront.net  
- **Backend API**: https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev

---

EmotioX es una plataforma para la creación y gestión de investigaciones de eye-tracking y otras técnicas de análisis de emociones y comportamiento de usuarios.

## Entorno de desarrollo

### Requisitos
- Node.js 18+
- AWS CLI configurado con credenciales válidas
- DynamoDB local (opcional)
- Java Runtime Environment (JRE) versión 8.x o superior (para DynamoDB Local)

### Configuración
1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   # En la carpeta principal
   cd emotioX.v2

   # Instalar dependencias del frontend
   cd frontend
   npm install

   # Volver a la carpeta principal e instalar backend (si es necesario)
   cd ..
   cd backend
   npm install

   # Instalar dependencias para backendV2
   cd ..
   cd backendV2
   npm install
   ```

3. Iniciar el proyecto en modo desarrollo:
   ```bash
   # Frontend
   cd frontend
   npm run dev

   # BackendV2 con DynamoDB Local
   cd backendV2
   serverless dynamodb install  # Solo la primera vez
   serverless offline start
   ```

### Usuarios de prueba
Para fines de desarrollo, se ha creado un usuario de prueba en la base de datos:

| Email | ID | Nombre |
|-------|-----|-------|
| test@example.com | testuser | Usuario Prueba |

### Datos de ejemplo
Se ha creado una investigación de ejemplo en la base de datos:

```json
{
  "id": "research-test-01",
  "userId": "testuser",
  "basic": {
    "name": "Investigación de prueba",
    "enterprise": "enterprise1",
    "type": "eye-tracking",
    "technique": "aim-framework"
  },
  "status": "draft",
  "currentStage": "build",
  "stageProgress": 0,
  "createdAt": "2025-03-16T23:00:00.000Z",
  "updatedAt": "2025-03-16T23:00:00.000Z"
}
```

## Características principales
- Gestión de usuarios e investigaciones
- Creación de proyectos de eye-tracking
- Dashboard para visualización de resultados
- Sistema de autenticación basado en JWT
- Almacenamiento en DynamoDB

## Documentación de la API

La API de EmotioXV2 está completamente documentada en el directorio `backendV2/docs/`. Esta documentación incluye:

- **[API Reference](backendV2/docs/api-reference.md)**: Documentación completa de todos los endpoints, parámetros, cuerpos de solicitud y respuestas.
- **[Modelo de Investigación](backendV2/docs/research-model.md)**: Detalles sobre la estructura de datos, validaciones y operaciones del modelo de investigación.
- **[DynamoDB Local](backendV2/docs/dynamodb-local.md)**: Guía para configurar y utilizar DynamoDB Local en desarrollo.

### Scripts de utilidad para desarrollo

Se han incluido scripts de utilidad en el directorio `backendV2/scripts/` para facilitar el desarrollo:

- **login.sh**: Inicia sesión y recupera un token de autenticación.
- **export-token.sh**: Exporta el token como variable de entorno para usarlo en solicitudes a la API.

```bash
# Iniciar sesión y obtener token
source backendV2/scripts/login.sh

# Exportar el token como variable de entorno
source backendV2/scripts/export-token.sh

# Usar el token en una solicitud curl
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/dev/research/user
```

Consulta la [documentación de scripts](backendV2/scripts/README.md) para más detalles.

## Modos de desarrollo
La aplicación incluye dos modos para desarrollo:

1. **Modo normal**: Conecta con las APIs reales en AWS
2. **Modo bypass**: Utiliza endpoints simulados para evitar depender de la API backend
3. **Modo DynamoDB Local**: Utiliza una instancia local de DynamoDB para desarrollo

## Verificar datos en DynamoDB
Para verificar los datos en DynamoDB, puedes usar estos comandos:

```bash
# Ver tablas
aws dynamodb list-tables --region us-east-1

# Ver usuarios
aws dynamodb scan --table-name emotio-x-backend-v2-dev-users --region us-east-1

# Ver investigaciones
aws dynamodb scan --table-name emotio-x-backend-v2-dev-research --region us-east-1

# DynamoDB Local (modo desarrollo)
aws dynamodb list-tables --endpoint-url http://localhost:8000
aws dynamodb scan --table-name emotioxv2-users-dev --endpoint-url http://localhost:8000
aws dynamodb scan --table-name emotioXV2-table-dev --endpoint-url http://localhost:8000
```

## Problemas conocidos
- **Error 401 Unauthorized**: Si no existen usuarios en la nueva tabla de usuarios v2, aparecerá este error. La solución es crear usuarios de prueba como se muestra arriba.
- **CORS**: En desarrollo local, se utilizan proxies para evitar problemas de CORS.

## Notas importantes
Este proyecto es una migración desde el EmotioX original. Las bases de datos y APIs son nuevas, por lo que no existirá continuidad con los datos de la versión anterior a menos que se implementen procesos de migración.

## Configuración automática de API

El proyecto incluye un sistema automatizado para actualizar la configuración de la API del frontend después de un despliegue serverless.

### Funcionamiento

Cuando ejecutas `npm run deploy` en el backend:

1. Se despliega la aplicación en AWS usando Serverless Framework
2. Se ejecuta automáticamente un script post-despliegue
3. El script obtiene las URLs y endpoints generados por AWS
4. Se actualizan los archivos de configuración del frontend:
   - `frontend/src/config/outputs.json`: Contiene las salidas del stack de CloudFormation
   - `frontend/src/config/endpoints.json`: Contiene los endpoints de la API
   - `frontend/src/config/api.config.ts`: Configuración de la API para el frontend

### Ejecución manual

Para ejecutar la actualización de configuración manualmente:

```bash
node scripts/auto-update-api-config.js [dev|test|prod]
```

### Modo de desarrollo vs. Producción

El sistema detecta automáticamente si debe usar:

- **Proxies locales**: Cuando estás en desarrollo sin una API_URL específica
- **Endpoints reales**: Cuando hay una API_URL o estás en producción

### Desactivar datos simulados

Si has estado usando datos simulados durante el desarrollo, después de actualizar la configuración, debes desactivar el modo de datos simulados:

```javascript
// En la consola del navegador
localStorage.removeItem('use_simulated_api');
```

O simplemente recarga la aplicación, que ahora usará los endpoints reales.

## Desarrollo

### Requisitos previos

- Node.js (v18 o superior)
- AWS CLI configurado con credenciales
- Serverless Framework instalado globalmente (`npm install -g serverless`)
- Java Runtime Environment (JRE) para DynamoDB Local

### Instalación

1. Clona el repositorio
2. Instala las dependencias:

```bash
# Instalar dependencias del frontend
cd frontend
npm install

# Instalar dependencias del backend
cd ../backend
npm install

# Instalar dependencias del backendV2
cd ../backendV2
npm install
```

### Ejecución local

```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run dev

# BackendV2 con DynamoDB Local
cd backendV2
serverless dynamodb install  # Solo la primera vez
serverless offline start
```

### Despliegue

#### Despliegue Manual
```bash
# Desplegar en desarrollo
cd backend
npm run deploy:dev

# Desplegar en test
npm run deploy:test

# Desplegar en producción
npm run deploy:prod
```

#### Despliegue Automático (CI/CD)
El proyecto incluye workflows de GitHub Actions para despliegue automático:

- **Frontend**: Despliegue automático a AWS Amplify
- **Public Tests**: Despliegue automático a AWS S3/CloudFront
- **Backend**: Despliegue automático a AWS Lambda

Para configurar el despliegue automático:
```bash
# Configurar secrets de GitHub
./scripts/setup-github-secrets.sh

# Probar despliegue S3/CloudFront
./scripts/test-s3-cloudfront-deployment.sh
```

Documentación completa:
- [Despliegue S3/CloudFront](public-tests/DEPLOYMENT_S3_CLOUDFRONT.md)

### **Frontend:**
- **Amplify:** `https://main.tu-app-id.amplifyapp.com`

### **Public Tests:**
- **S3/CloudFront:** `https://tu-distribution-id.cloudfront.net`

## Solución de problemas

### Error al cargar datos de la API

Si experimentas errores al cargar datos de la API:

1. Verifica que la configuración de la API sea correcta en `frontend/src/config/api.config.ts`
2. Comprueba que los endpoints estén correctamente definidos en `frontend/src/config/endpoints.json`
3. En desarrollo, puedes activar el modo simulado para trabajar sin depender de la API:
   ```javascript
   localStorage.setItem('use_simulated_api', 'true');
   ```

### Problemas con DynamoDB Local

Si encuentras problemas con DynamoDB Local:

1. Verifica que Java esté instalado correctamente
2. Comprueba que DynamoDB Local esté ejecutándose en el puerto 8000
3. Consulta la [guía de solución de problemas](backendV2/docs/dynamodb-local.md#solución-de-problemas-comunes) en la documentación

### Error en el despliegue

Si hay errores durante el despliegue:

1. Verifica tus credenciales de AWS
2. Comprueba los logs de CloudFormation
3. Ejecuta `serverless logs` para ver los logs de las funciones Lambda
