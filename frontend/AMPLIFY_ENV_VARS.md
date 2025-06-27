# Variables de Entorno para AWS Amplify

## Variables Requeridas

Para que el frontend funcione correctamente en AWS Amplify, necesitas configurar las siguientes variables de entorno en la consola de AWS Amplify:

### 1. **NEXT_PUBLIC_API_URL**
```
https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev
```
**Descripción:** URL base de la API del backend

### 2. **NEXT_PUBLIC_API_BASE_URL**
```
https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev
```
**Descripción:** URL base alternativa para la API

### 3. **NEXT_PUBLIC_WS_URL**
```
wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev
```
**Descripción:** URL del WebSocket para comunicación en tiempo real

### 4. **NEXT_PUBLIC_PUBLIC_TESTS_URL**
```
https://main.dgsabzeqh9eea.amplifyapp.com
```
**Descripción:** URL de la aplicación de tests públicos

## Cómo Configurar en AWS Amplify

1. Ve a la consola de AWS Amplify
2. Selecciona tu aplicación `frontend`
3. Ve a **App settings** > **Environment variables**
4. Agrega cada variable con su valor correspondiente
5. Guarda los cambios
6. Reinicia el build

## Verificación

Después de configurar las variables:
- El error `NEXT_PUBLIC_API_URL no está definida` debería desaparecer
- La funcionalidad de upload de archivos debería funcionar correctamente
- Los WebSockets deberían conectarse correctamente
