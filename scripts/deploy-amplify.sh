#!/bin/bash

# Script para preparar el despliegue en AWS Amplify

echo "🚀 Preparando el proyecto para despliegue en AWS Amplify..."

# Asegurarse de que estamos en el directorio raíz
cd "$(dirname "$0")"

# Verificar estructura del proyecto
echo "📁 Verificando estructura del proyecto..."
if [ ! -d "frontend" ]; then
  echo "❌ Error: No se encontró el directorio 'frontend'"
  exit 1
fi

if [ ! -d "shared" ]; then
  echo "❌ Error: No se encontró el directorio 'shared'"
  exit 1
fi

# Instalar dependencias y construir el proyecto shared
echo "📦 Instalando dependencias y construyendo el paquete shared..."
cd shared
npm install
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Error al construir el paquete shared"
  exit 1
fi
echo "✅ Paquete shared construido correctamente"

# Instalar dependencias y construir el frontend
echo "📦 Instalando dependencias del frontend..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
  echo "❌ Error al instalar dependencias del frontend"
  exit 1
fi

# Verificar archivo de configuración de Amplify
echo "📝 Verificando archivo de configuración de Amplify..."
cd ..
if [ ! -f "amplify.yml" ]; then
  echo "❌ Error: No se encontró el archivo 'amplify.yml'"
  exit 1
fi

echo "✅ Proyecto listo para despliegue en AWS Amplify"
echo ""
echo "Sigue estos pasos para desplegar en la consola de AWS Amplify:"
echo "1. Accede a la consola de AWS Amplify"
echo "2. Haz clic en 'New App' > 'Host web app'"
echo "3. Conecta tu repositorio de código"
echo "4. Configura el build según las instrucciones en AMPLIFY-DEPLOY.md"
echo "5. Haz clic en 'Save and deploy'"
echo ""
echo "Para más detalles, consulta el archivo AMPLIFY-DEPLOY.md" 