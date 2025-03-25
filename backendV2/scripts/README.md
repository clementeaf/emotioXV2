# Scripts de Utilidad para Desarrollo

Este directorio contiene scripts para facilitar el desarrollo y las pruebas del backend de emotioXV2.

## Scripts Disponibles

### `login.sh`

Script para iniciar sesión en la API y obtener un token de autenticación.

**Uso:**
```bash
./scripts/login.sh
```

Este script:
1. Inicia sesión con el usuario predefinido (`usuario.api@test.com`)
2. Obtiene un token de autenticación
3. Guarda el token en `~/.emotioxv2/token.txt`
4. Muestra el comando para exportar el token como variable de entorno

### `export-token.sh`

Script para exportar el token guardado como variable de entorno.

**Uso:**
```bash
source ./scripts/export-token.sh
```

> **Nota:** Es importante usar `source` para que la variable se exporte en el shell actual.

Este script:
1. Lee el token guardado en `~/.emotioxv2/token.txt`
2. Lo exporta como variable de entorno `TOKEN`
3. Muestra confirmación de que el token ha sido exportado

## Flujo de Trabajo Recomendado para Desarrollo Local

1. Inicia la aplicación con `npx sls offline start`
2. Ejecuta `./scripts/login.sh` para obtener un token
3. Usa `source ./scripts/export-token.sh` para exportar el token
4. Ahora puedes hacer peticiones a la API utilizando el token:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/dev/auth/me
```

## Despliegue y Exportación de Endpoints

Esta sección describe los scripts disponibles para desplegar la aplicación y exportar los endpoints de la API para su uso en el frontend.

### Scripts Disponibles

#### `deploy-and-export.sh`

Este script realiza el despliegue de la aplicación y luego exporta las URLs de los endpoints para que el frontend pueda acceder a ellas dinámicamente.

**Uso:**
```bash
# Desplegar en el entorno por defecto (dev)
./scripts/deploy-and-export.sh

# Desplegar en un entorno específico
./scripts/deploy-and-export.sh prod us-west-1
```

**Parámetros:**
- `stage` (opcional): Entorno de despliegue (dev, test, prod). Por defecto: `dev`
- `region` (opcional): Región de AWS. Por defecto: `us-east-1`

### Archivos Generados

Después del despliegue, se generan los siguientes archivos:

1. `outputs.json`: Contiene las salidas del stack de CloudFormation
2. `endpoints.json`: Contiene las URLs de los endpoints de la API
3. `frontend/src/config/api-endpoints.js`: Archivo JavaScript para importar en el frontend
4. `frontend/src/config/api-endpoints.ts`: Archivo TypeScript para importar en el frontend

### Uso en el Frontend

Para utilizar los endpoints exportados en el frontend, puedes importar el archivo de configuración:

**En JavaScript:**
```javascript
import API_CONFIG from '../config/api-endpoints';

// Uso de los endpoints
const loginUrl = `${API_CONFIG.authApiUrl}${API_CONFIG.endpoints.auth.login}`;
const getAllResearchUrl = `${API_CONFIG.researchApiUrl}${API_CONFIG.endpoints.research.getAll}`;
```

**En TypeScript:**
```typescript
import API_CONFIG, { ApiEndpoint } from '../config/api-endpoints';

// Uso de los endpoints
const loginUrl = `${API_CONFIG.authApiUrl}${API_CONFIG.endpoints.auth.login}`;
const getAllResearchUrl = `${API_CONFIG.researchApiUrl}${API_CONFIG.endpoints.research.getAll}`;
```

### Configuración Manual

Si necesitas configurar manualmente los endpoints (por ejemplo, para desarrollo local), puedes crear un archivo `.env` en el directorio del frontend con las siguientes variables:

```
REACT_APP_API_BASE_URL=http://localhost:3000/dev
REACT_APP_AUTH_API_URL=http://localhost:3000/dev/auth
REACT_APP_RESEARCH_API_URL=http://localhost:3000/dev/research
REACT_APP_WELCOME_SCREEN_API_URL=http://localhost:3000/dev/welcome-screens
```

### Flujo de Trabajo Recomendado

1. Desarrolla y prueba la API localmente usando `serverless offline`
2. Cuando estés listo para desplegar, usa el script `deploy-and-export.sh`
3. Verifica que los archivos de configuración se hayan generado correctamente
4. El frontend automáticamente usará las URLs correctas al importar el archivo de configuración

## Nota sobre los Usuarios

El script de login utiliza el usuario predefinido `usuario.api@test.com` con la contraseña `password123`. Este usuario se debe registrar una vez manualmente mediante:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"name":"Usuario Test API","email":"usuario.api@test.com","password":"password123"}' http://localhost:3000/dev/auth/register
```

Si necesitas cambiar este usuario, edita las variables al inicio del archivo `login.sh`. 