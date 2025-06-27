# Configuración Manual de Variables de Entorno en AWS Amplify

## 🚨 Problema Detectado
La app `d1718q1uyn5ffx` no existe en AWS Amplify. Necesitamos configurar las variables de entorno manualmente en la consola web.

## 🔧 Solución: Configuración Manual

### Paso 1: Acceder a AWS Amplify Console
1. Ve a: https://console.aws.amazon.com/amplify/
2. Busca tu aplicación `frontend` o `emotioXV2`
3. Haz clic en la aplicación

### Paso 2: Configurar Variables de Entorno
1. Ve a **App settings** (en el menú lateral)
2. Haz clic en **Environment variables**
3. Haz clic en **Add environment variable**

### Paso 3: Agregar Variables (Una por una)

#### Variable 1:
- **Key:** `NEXT_PUBLIC_API_URL`
- **Value:** `https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev`
- **Branch:** `main`

#### Variable 2:
- **Key:** `NEXT_PUBLIC_API_BASE_URL`
- **Value:** `https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev`
- **Branch:** `main`

#### Variable 3:
- **Key:** `NEXT_PUBLIC_WS_URL`
- **Value:** `wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev`
- **Branch:** `main`

#### Variable 4:
- **Key:** `NEXT_PUBLIC_PUBLIC_TESTS_URL`
- **Value:** `https://main.dgsabzeqh9eea.amplifyapp.com`
- **Branch:** `main`

### Paso 4: Guardar y Reiniciar Build
1. Haz clic en **Save**
2. Ve a **Build settings**
3. Haz clic en **Trigger build**

## ✅ Verificación
Después de configurar las variables:
- El error `NEXT_PUBLIC_API_URL no está definida` debería desaparecer
- La funcionalidad de upload de archivos debería funcionar
- Los WebSockets deberían conectarse correctamente

## 🔍 Si No Encuentras la App
Si no encuentras la aplicación en AWS Amplify:
1. Verifica que estés en la región correcta (us-east-1)
2. La app pudo haber sido eliminada o movida
3. Necesitarás crear una nueva app de Amplify

## 📞 Próximos Pasos
Una vez configuradas las variables, el frontend debería funcionar correctamente con el backend.
