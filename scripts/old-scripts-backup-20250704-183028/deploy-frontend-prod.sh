#!/bin/bash

echo "🚀 Desplegando frontend de producción..."

# Ir al directorio del frontend
cd frontend

# Copiar el archivo de variables de entorno de producción
cp env.production .env.production

# Instalar dependencias si no están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Construir la aplicación para producción
echo "🔨 Construyendo aplicación para producción..."
npm run build

# Reiniciar el servicio PM2
echo "🔄 Reiniciando servicio PM2..."
pm2 restart emotioxv2-frontend || pm2 start npm --name "emotioxv2-frontend" -- start

echo "✅ Frontend de producción desplegado correctamente!"
echo "🌐 URL: http://54.90.132.233:3000"
