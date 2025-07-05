#!/bin/bash

echo "🚀 Desplegando frontend de producción (versión simplificada)..."

# Ir al directorio del frontend
cd frontend

# Copiar el archivo de variables de entorno de producción
cp env.production .env.production

echo "✅ Variables de entorno configuradas"
echo "🌐 URL del backend: https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod"
echo "🔗 URL del frontend: http://54.90.132.233:3000"
echo ""
echo "📋 Para probar el frontend con el backend:"
echo "1. Ve a http://54.90.132.233:3000"
echo "2. Haz login con: test@emotio.com / Test123!"
echo "3. Crea una nueva investigación"
echo "4. Verifica que se guarda correctamente"
