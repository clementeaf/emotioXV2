# EmotioX v2

EmotioX es una plataforma para la creación y gestión de investigaciones de eye-tracking y otras técnicas de análisis de emociones y comportamiento de usuarios.

## Entorno de desarrollo

### Requisitos
- Node.js 18+ 
- AWS CLI configurado con credenciales válidas
- DynamoDB local (opcional)

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
   ```

3. Iniciar el proyecto en modo desarrollo:
   ```bash
   # Frontend
   cd frontend
   npm run dev
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

## Modos de desarrollo
La aplicación incluye dos modos para desarrollo:

1. **Modo normal**: Conecta con las APIs reales en AWS
2. **Modo bypass**: Utiliza endpoints simulados para evitar depender de la API backend

## Verificar datos en DynamoDB
Para verificar los datos en DynamoDB, puedes usar estos comandos:

```bash
# Ver tablas
aws dynamodb list-tables --region us-east-1

# Ver usuarios
aws dynamodb scan --table-name emotio-x-backend-v2-dev-users --region us-east-1

# Ver investigaciones
aws dynamodb scan --table-name emotio-x-backend-v2-dev-research --region us-east-1
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
```

### Ejecución local

```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run dev
```

### Despliegue

```bash
# Desplegar en desarrollo
cd backend
npm run deploy:dev

# Desplegar en test
npm run deploy:test

# Desplegar en producción
npm run deploy:prod
```

## Solución de problemas

### Error al cargar datos de la API

Si experimentas errores al cargar datos de la API:

1. Verifica que la configuración de la API sea correcta en `frontend/src/config/api.config.ts`
2. Comprueba que los endpoints estén correctamente definidos en `frontend/src/config/endpoints.json`
3. En desarrollo, puedes activar el modo simulado para trabajar sin depender de la API:
   ```javascript
   localStorage.setItem('use_simulated_api', 'true');
   ```

### Error en el despliegue

Si hay errores durante el despliegue:

1. Verifica tus credenciales de AWS
2. Comprueba los logs de CloudFormation
3. Ejecuta `serverless logs` para ver los logs de las funciones Lambda
