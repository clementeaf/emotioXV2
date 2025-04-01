# Despliegue en AWS Amplify

Este documento detalla el proceso para desplegar la aplicación en AWS Amplify.

## Requisitos previos

- Cuenta de AWS con acceso a AWS Amplify
- Código fuente de la aplicación en un repositorio Git (GitHub, GitLab, BitBucket, etc.)

## Pasos para el despliegue

### 1. Acceder a la consola de AWS Amplify

1. Inicia sesión en la [consola de AWS](https://aws.amazon.com/console/)
2. Busca y selecciona "Amplify"

### 2. Crear una nueva aplicación

1. Haz clic en "New App" o "Create app"
2. Selecciona "Host web app"

### 3. Seleccionar proveedor de repositorio

1. Elige tu proveedor de repositorio (GitHub, BitBucket, etc.)
2. Autoriza a Amplify para acceder a tu cuenta
3. Selecciona el repositorio y la rama que deseas desplegar

### 4. Configurar las opciones de construcción

1. Amplify detectará automáticamente que es una aplicación Next.js
2. En la sección "App build specification", selecciona "Use a YAML file in your repository (amplify.yml)"
3. Confirma que el archivo `amplify.yml` está seleccionado

### 5. Configurar variables de entorno (si es necesario)

1. Agrega la variable de entorno `NEXT_PUBLIC_API_URL` con el valor de tu API
   - Nombre: `NEXT_PUBLIC_API_URL`
   - Valor: `https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev`

### 6. Configurar opciones avanzadas

1. En "Build settings" > "Advanced settings":
   - Base directory: `/` (directorio raíz del repositorio)
   - Build output directory: `frontend/.next`

### 7. Iniciar el despliegue

1. Haz clic en "Save and deploy"
2. Espera a que se complete el proceso de construcción y despliegue (10-15 minutos aproximadamente)

## Solución de problemas comunes

### Error: Module not found

Si aparece un error relacionado con módulos no encontrados:

1. Verifica que el archivo `amplify.yml` esté correctamente configurado
2. Asegúrate de que el directorio compartido se esté construyendo correctamente
3. Comprueba las variables de entorno

### Error: Build failed

1. Revisa los logs de construcción en la consola de Amplify
2. Verifica que todas las dependencias estén instaladas correctamente
3. Asegúrate de que los comandos de construcción son correctos

## Verificación del despliegue

1. Una vez finalizado el despliegue, Amplify proporcionará una URL para acceder a la aplicación
2. Verifica que todas las rutas y funcionalidades estén trabajando correctamente 