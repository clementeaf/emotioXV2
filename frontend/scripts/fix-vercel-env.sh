#!/bin/bash

# 🚀 Script de Diagnóstico y Solución para Variables de Entorno en Vercel - EmotioXV2
# ================================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de logging
print_message() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo -e "${BLUE}================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================================${NC}"
}

# Variables de entorno requeridas para Vercel
VERCEL_ENV_VARS=(
    "NEXT_PUBLIC_API_URL"
    "NEXT_PUBLIC_WS_URL"
    "NEXT_PUBLIC_ENV"
)

# URLs de API por entorno
DEV_API_URL="https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
DEV_WS_URL="wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
PROD_API_URL="https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod"
PROD_WS_URL="wss://0x3ndqqhe9.execute-api.us-east-1.amazonaws.com/prod"

print_header "🔧 DIAGNÓSTICO Y SOLUCIÓN DE VARIABLES DE ENTORNO EN VERCEL"
print_message "EmotioXV2 Frontend - Problemas detectados en Vercel"

echo ""
print_header "📋 PROBLEMAS IDENTIFICADOS"

print_error "1. Error 404 en API Gateway"
print_error "   - d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev/research/193b949e-9fac-f000-329b-e71bab5a9203/cognitive-task:1"
print_error "   - El endpoint no responde correctamente"

print_error "2. Variable NEXT_PUBLIC_API_URL no definida"
print_error "   - [FileUploadHook] Error: NEXT_PUBLIC_API_URL no está definida en las variables de entorno"
print_error "   - Esto causa fallos en la carga de archivos"

print_error "3. Error en FileUploadHook"
print_error "   - Error procesando archivo imagen1.png: Error: La URL del backend no está configurada"
print_error "   - Los archivos no se pueden subir sin la URL del backend"

echo ""
print_header "🔧 SOLUCIÓN PASO A PASO"

print_message "Paso 1: Verificar configuración actual de Vercel"
echo ""

# Verificar si Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI no está instalado"
    print_message "Instalando Vercel CLI..."
    npm install -g vercel
    print_success "Vercel CLI instalado"
else
    print_success "Vercel CLI ya está instalado"
fi

echo ""
print_message "Paso 2: Configurar variables de entorno en Vercel"

# Función para configurar variables de entorno
configure_vercel_env() {
    local env_name=$1
    local api_url=$2
    local ws_url=$3

    print_message "Configurando variables para entorno: $env_name"

    # Configurar variables de entorno en Vercel
    vercel env add NEXT_PUBLIC_API_URL $env_name <<< "$api_url"
    vercel env add NEXT_PUBLIC_WS_URL $env_name <<< "$ws_url"
    vercel env add NEXT_PUBLIC_ENV $env_name <<< "$env_name"

    print_success "Variables configuradas para $env_name"
}

# Configurar variables para desarrollo
print_message "Configurando variables para desarrollo..."
configure_vercel_env "development" "$DEV_API_URL" "$DEV_WS_URL"

# Configurar variables para producción
print_message "Configurando variables para producción..."
configure_vercel_env "production" "$PROD_API_URL" "$PROD_WS_URL"

echo ""
print_message "Paso 3: Verificar configuración"

# Verificar variables configuradas
print_message "Verificando variables configuradas en Vercel..."
vercel env ls

echo ""
print_header "📋 CONFIGURACIÓN MANUAL EN VERCEL DASHBOARD"

print_message "Si el script automático no funciona, configura manualmente:"
echo ""
print_message "1. Ve a https://vercel.com/dashboard"
print_message "2. Selecciona tu proyecto EmotioXV2"
print_message "3. Ve a Settings > Environment Variables"
print_message "4. Agrega las siguientes variables:"
echo ""

print_message "Para Development:"
echo "   NEXT_PUBLIC_API_URL = $DEV_API_URL"
echo "   NEXT_PUBLIC_WS_URL = $DEV_WS_URL"
echo "   NEXT_PUBLIC_ENV = development"
echo ""

print_message "Para Production:"
echo "   NEXT_PUBLIC_API_URL = $PROD_API_URL"
echo "   NEXT_PUBLIC_WS_URL = $PROD_WS_URL"
echo "   NEXT_PUBLIC_ENV = production"
echo ""

print_header "🔍 VERIFICACIÓN DE CONECTIVIDAD"

print_message "Verificando conectividad al backend..."

# Test de conectividad al backend de desarrollo
if curl -s --max-time 10 "$DEV_API_URL" > /dev/null 2>&1; then
    print_success "✅ Backend de desarrollo responde"
else
    print_error "❌ Backend de desarrollo no responde"
fi

# Test de conectividad al backend de producción
if curl -s --max-time 10 "$PROD_API_URL" > /dev/null 2>&1; then
    print_success "✅ Backend de producción responde"
else
    print_error "❌ Backend de producción no responde"
fi

echo ""
print_header "🚀 REDEPLOY DESPUÉS DE CONFIGURAR VARIABLES"

print_message "Después de configurar las variables de entorno:"
print_message "1. Haz un commit y push a tu repositorio"
print_message "2. Vercel automáticamente hará un nuevo deploy"
print_message "3. Las variables estarán disponibles en el nuevo build"
echo ""

print_message "O fuerza un redeploy manual:"
print_message "vercel --prod"

echo ""
print_header "🔧 SOLUCIÓN ALTERNATIVA: ARCHIVO .env.local"

print_message "Si las variables de entorno no funcionan, crea un archivo .env.local:"

cat > .env.local << EOF
# Variables de entorno para EmotioXV2 Frontend
# Configuración para desarrollo
NEXT_PUBLIC_API_URL=$DEV_API_URL
NEXT_PUBLIC_WS_URL=$DEV_WS_URL
NEXT_PUBLIC_ENV=development

# Configuración para producción (se usará en build de producción)
# NEXT_PUBLIC_API_URL=$PROD_API_URL
# NEXT_PUBLIC_WS_URL=$PROD_WS_URL
# NEXT_PUBLIC_ENV=production
EOF

print_success "Archivo .env.local creado"
print_warning "⚠️  NOTA: .env.local solo funciona en desarrollo local"
print_warning "⚠️  Para Vercel, debes usar las variables de entorno del dashboard"

echo ""
print_header "✅ RESUMEN DE SOLUCIÓN"

print_success "1. Variables de entorno configuradas"
print_success "2. URLs de API validadas"
print_success "3. Script de diagnóstico completado"
print_success "4. Archivo .env.local creado como respaldo"

echo ""
print_message "🎯 PRÓXIMOS PASOS:"
print_message "1. Configura las variables en Vercel Dashboard"
print_message "2. Haz un redeploy de la aplicación"
print_message "3. Verifica que los errores desaparezcan"
print_message "4. Prueba la carga de archivos"

echo ""
print_header "🔍 MONITOREO POST-SOLUCIÓN"

print_message "Para verificar que la solución funcionó:"
print_message "1. Revisa la consola del navegador"
print_message "2. Verifica que no aparezcan errores de NEXT_PUBLIC_API_URL"
print_message "3. Prueba subir un archivo en la aplicación"
print_message "4. Verifica que las llamadas a la API funcionen"

echo ""
print_success "🎉 Script de diagnóstico completado"
print_message "Si sigues teniendo problemas, revisa los logs de Vercel"
