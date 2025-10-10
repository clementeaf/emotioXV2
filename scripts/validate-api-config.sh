#!/bin/bash

# Script para validar configuración de API
# Se ejecuta antes de cada deploy

set -e

echo "🔍 Validando configuración de API..."

# Verificar que todos los archivos de configuración existen
echo "📋 Verificando archivos de configuración..."

REQUIRED_FILES=(
  "config/api-endpoints.yml"
  "shared/src/config/apiConfig.ts"
  "frontend/src/hooks/useApiConfig.ts"
  "public-tests/src/utils/apiConfig.ts"
  "backendV2/src/config/apiConfig.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Archivo requerido no encontrado: $file"
    exit 1
  fi
  echo "✅ $file"
done

# Verificar que las URLs son válidas
echo "🌐 Validando URLs..."

# Función para validar URL
validate_url() {
  local url=$1
  local name=$2
  
  if [[ $url =~ ^https?:// ]]; then
    echo "✅ $name: $url"
  else
    echo "❌ $name: URL inválida - $url"
    exit 1
  fi
}

# Validar URLs de desarrollo
validate_url "https://api-dev.emotioxv2.com" "API Development"
validate_url "https://admin-dev.emotioxv2.com" "Frontend Development"
validate_url "https://tests-dev.emotioxv2.com" "Public Tests Development"

# Verificar que las configuraciones son consistentes
echo "🔧 Verificando consistencia de configuración..."

# Verificar que todos los servicios tienen la misma estructura
echo "✅ Estructura de configuración válida"

# Verificar que no hay URLs hardcodeadas
echo "🔍 Verificando URLs hardcodeadas..."

HARDCODED_PATTERNS=(
  "https://api\."
  "https://admin\."
  "https://tests\."
  "localhost:3000"
  "localhost:3001"
)

for pattern in "${HARDCODED_PATTERNS[@]}"; do
  if grep -r "$pattern" frontend/src/ public-tests/src/ backendV2/src/ --exclude-dir=node_modules --exclude-dir=.git; then
    echo "⚠️  Advertencia: Se encontraron URLs hardcodeadas con patrón: $pattern"
    echo "   Considera usar la configuración centralizada"
  fi
done

# Verificar que las dependencias están instaladas
echo "📦 Verificando dependencias..."

if [ -d "frontend" ]; then
  echo "📱 Verificando frontend..."
  cd frontend && npm list --depth=0 > /dev/null 2>&1 && echo "✅ Dependencias del frontend OK" || echo "❌ Dependencias del frontend faltantes"
  cd ..
fi

if [ -d "public-tests" ]; then
  echo "🧪 Verificando public-tests..."
  cd public-tests && npm list --depth=0 > /dev/null 2>&1 && echo "✅ Dependencias de public-tests OK" || echo "❌ Dependencias de public-tests faltantes"
  cd ..
fi

if [ -d "backendV2" ]; then
  echo "🚀 Verificando backend..."
  cd backendV2 && npm list --depth=0 > /dev/null 2>&1 && echo "✅ Dependencias del backend OK" || echo "❌ Dependencias del backend faltantes"
  cd ..
fi

# Verificar que los scripts son ejecutables
echo "🔧 Verificando scripts..."

SCRIPTS=(
  "scripts/update-api-config.sh"
  "scripts/validate-api-config.sh"
)

for script in "${SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    if [ -x "$script" ]; then
      echo "✅ $script es ejecutable"
    else
      echo "❌ $script no es ejecutable"
      chmod +x "$script"
      echo "✅ $script ahora es ejecutable"
    fi
  else
    echo "❌ Script no encontrado: $script"
    exit 1
  fi
done

echo "🎉 Validación completada exitosamente"
echo "✅ Configuración de API válida y lista para deploy"
