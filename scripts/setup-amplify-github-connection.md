# 🔗 Conectar App de Amplify a GitHub

## 📋 Pasos para conectar la app `emotioxv2-frontend` a GitHub

### 1. **Acceder a AWS Amplify Console**
- Ve a: https://console.aws.amazon.com/amplify
- Selecciona la región: **US East (N. Virginia)**

### 2. **Seleccionar la app**
- Busca y selecciona: **emotioxv2-frontend**
- App ID: `diq999se9lnd8`

### 3. **Conectar repositorio**
- Ve a: **App settings** → **General** → **Repository**
- Haz clic en **Connect repository**

### 4. **Configurar conexión**
- **Repository provider**: GitHub
- **Repository**: `clementeaf/emotioXV2`
- **Branch**: `main`
- **Build settings**: Usar `amplify.yml` (ya existe en el repo)

### 5. **Autorizar GitHub**
- Haz clic en **Authorize**
- Selecciona el repositorio `clementeaf/emotioXV2`
- Confirma la autorización

### 6. **Configurar build**
- **Build settings**: Usar archivo de configuración del repositorio
- **Service role**: Usar rol existente o crear uno nuevo
- Haz clic en **Save and deploy**

---

## ✅ **Después de la conexión**

Una vez conectado:
1. **Amplify detectará automáticamente** los cambios en GitHub
2. **Cada push a `main`** triggereará un build automático
3. **La app estará disponible** en: `https://diq999se9lnd8.amplifyapp.com`

---

## 🔧 **Verificación**

Para verificar que funciona:
1. Haz un cambio en `frontend/`
2. Commit y push a `main`
3. Ve a Amplify Console y verifica que se inicie un build
4. Espera 3-5 minutos para que termine el despliegue

---

## 📞 **Soporte**

Si tienes problemas:
- Verifica que el repositorio sea público o que tengas permisos
- Asegúrate de que el branch `main` exista
- Confirma que el archivo `amplify.yml` esté en la raíz del frontend
