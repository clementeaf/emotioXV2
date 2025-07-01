#!/bin/bash

# Script para validar el entorno antes del despliegue a EC2
# Este script verifica que todas las condiciones estén listas para un despliegue exitoso

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_message() {
  echo -e "${BLUE}[EmotioXV2]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[ÉXITO]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[ADVERTENCIA]${NC} $1"
}

# Contador de errores
ERROR_COUNT=0
WARNING_COUNT=0

# Función para incrementar contadores
increment_error() {
  ((ERROR_COUNT++))
}

increment_warning() {
  ((WARNING_COUNT++))
}

# Verificar dependencias del sistema
check_system_dependencies() {
  print_message "🔧 Verificando dependencias del sistema..."

  local dependencies=(
    "node:Node.js"
    "npm:npm"
    "aws:AWS CLI"
    "curl:curl"
    "git:Git"
  )

  for dep in "${dependencies[@]}"; do
    local cmd="${dep%%:*}"
    local name="${dep##*:}"

    if command -v "$cmd" &> /dev/null; then
      local version=$("$cmd" --version 2>/dev/null | head -n1)
      print_success "✅ $name: $version"
    else
      print_error "❌ $name no está instalado"
      increment_error
    fi
  done
}

# Verificar configuración de AWS
check_aws_configuration() {
  print_message "☁️  Verificando configuración de AWS..."

  # Verificar credenciales
  if ! aws sts get-caller-identity &> /dev/null; then
    print_error "❌ No se pueden verificar las credenciales de AWS"
    print_error "   Ejecuta: aws configure"
    increment_error
  else
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local user_arn=$(aws sts get-caller-identity --query Arn --output text)
    print_success "✅ Credenciales AWS válidas"
    print_message "   Cuenta: $account_id"
    print_message "   Usuario: $user_arn"
  fi

  # Verificar región
  local region=$(aws configure get region)
  if [ -n "$region" ]; then
    print_success "✅ Región AWS: $region"
  else
    print_warning "⚠️  Región AWS no configurada"
    increment_warning
  fi
}

# Verificar variables de entorno
check_environment_variables() {
  print_message "🔑 Verificando variables de entorno..."

  local required_vars=(
    "NEXT_PUBLIC_API_URL"
    "NEXT_PUBLIC_WS_URL"
  )

  local optional_vars=(
    "NEXT_PUBLIC_ENV"
    "NODE_ENV"
  )

  # Variables requeridas
  for var in "${required_vars[@]}"; do
    if [ -n "${!var}" ]; then
      print_success "✅ $var: ${!var}"
    else
      print_error "❌ $var no está definida"
      increment_error
    fi
  done

  # Variables opcionales
  for var in "${optional_vars[@]}"; do
    if [ -n "${!var}" ]; then
      print_success "✅ $var: ${!var}"
    else
      print_warning "⚠️  $var no está definida (opcional)"
      increment_warning
    fi
  done

  # Validar formato de URLs
  if [ -n "$NEXT_PUBLIC_API_URL" ]; then
    if [[ "$NEXT_PUBLIC_API_URL" =~ ^https?:// ]]; then
      print_success "✅ Formato de API URL válido"
    else
      print_error "❌ API URL debe comenzar con http:// o https://"
      increment_error
    fi
  fi

  if [ -n "$NEXT_PUBLIC_WS_URL" ]; then
    if [[ "$NEXT_PUBLIC_WS_URL" =~ ^wss?:// ]]; then
      print_success "✅ Formato de WebSocket URL válido"
    else
      print_error "❌ WebSocket URL debe comenzar con ws:// o wss://"
      increment_error
    fi
  fi
}

# Verificar conectividad al backend
check_backend_connectivity() {
  print_message "🌐 Verificando conectividad al backend..."

  if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    print_error "❌ No se puede verificar conectividad: NEXT_PUBLIC_API_URL no está definida"
    increment_error
    return
  fi

  local api_url="$NEXT_PUBLIC_API_URL"

  # Test de conectividad básica
  if curl -s --max-time 10 --connect-timeout 10 "$api_url" > /dev/null 2>&1; then
    print_success "✅ Conectividad básica al backend"
  else
    print_error "❌ No se puede conectar al backend en: $api_url"
    increment_error
    return
  fi

  # Test de endpoints críticos
  local endpoints=(
    "/auth/login:POST"
    "/research:GET"
  )

  for endpoint in "${endpoints[@]}"; do
    local path="${endpoint%%:*}"
    local method="${endpoint##*:}"
    local full_url="${api_url}${path}"

    if curl -s --max-time 10 -X "$method" "$full_url" > /dev/null 2>&1; then
      print_success "✅ $method $path"
    else
      print_warning "⚠️  $method $path no responde (puede ser normal)"
      increment_warning
    fi
  done
}

# Verificar estructura del proyecto
check_project_structure() {
  print_message "📁 Verificando estructura del proyecto..."

  local required_files=(
    "package.json"
    "next.config.js"
    "tsconfig.json"
    "src/config/api.ts"
  )

  local required_dirs=(
    "src"
    "src/app"
    "src/components"
    "public"
  )

  # Verificar archivos requeridos
  for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
      print_success "✅ $file"
    else
      print_error "❌ $file no encontrado"
      increment_error
    fi
  done

  # Verificar directorios requeridos
  for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
      print_success "✅ $dir/"
    else
      print_error "❌ $dir/ no encontrado"
      increment_error
    fi
  done
}

# Verificar dependencias de Node.js
check_node_dependencies() {
  print_message "📦 Verificando dependencias de Node.js..."

  if [ ! -f "package.json" ]; then
    print_error "❌ package.json no encontrado"
    increment_error
    return
  fi

  # Verificar que node_modules existe
  if [ -d "node_modules" ]; then
    print_success "✅ node_modules/ existe"
  else
    print_warning "⚠️  node_modules/ no existe. Ejecuta: npm install"
    increment_warning
  fi

  # Verificar que package-lock.json existe
  if [ -f "package-lock.json" ]; then
    print_success "✅ package-lock.json existe"
  else
    print_warning "⚠️  package-lock.json no existe"
    increment_warning
  fi

  # Verificar scripts en package.json
  if grep -q '"build"' package.json; then
    print_success "✅ Script 'build' encontrado en package.json"
  else
    print_error "❌ Script 'build' no encontrado en package.json"
    increment_error
  fi
}

# Verificar configuración de Next.js
check_nextjs_configuration() {
  print_message "⚡ Verificando configuración de Next.js..."

  if [ -f "next.config.js" ]; then
    print_success "✅ next.config.js existe"
  else
    print_warning "⚠️  next.config.js no existe (puede ser normal)"
    increment_warning
  fi

  if [ -f "tsconfig.json" ]; then
    print_success "✅ tsconfig.json existe"
  else
    print_error "❌ tsconfig.json no encontrado"
    increment_error
  fi

  # Verificar que el directorio app existe (App Router)
  if [ -d "src/app" ]; then
    print_success "✅ App Router configurado (src/app/)"
  else
    print_error "❌ App Router no encontrado (src/app/)"
    increment_error
  fi
}

# Verificar configuración de TypeScript
check_typescript_configuration() {
  print_message "🔷 Verificando configuración de TypeScript..."

  if [ -f "tsconfig.json" ]; then
    # Verificar configuración básica
    if grep -q '"strict": true' tsconfig.json; then
      print_success "✅ TypeScript strict mode habilitado"
    else
      print_warning "⚠️  TypeScript strict mode no está habilitado"
      increment_warning
    fi

    if grep -q '"target": "es5"' tsconfig.json || grep -q '"target": "es6"' tsconfig.json; then
      print_success "✅ Target de TypeScript configurado"
    else
      print_warning "⚠️  Target de TypeScript no verificado"
      increment_warning
    fi
  fi
}

# Verificar configuración de Tailwind CSS
check_tailwind_configuration() {
  print_message "🎨 Verificando configuración de Tailwind CSS..."

  if [ -f "tailwind.config.js" ] || [ -f "tailwind.config.ts" ]; then
    print_success "✅ tailwind.config encontrado"
  else
    print_warning "⚠️  tailwind.config no encontrado"
    increment_warning
  fi

  if [ -f "src/app/globals.css" ] && grep -q "@tailwind" src/app/globals.css; then
    print_success "✅ Tailwind CSS importado en globals.css"
  else
    print_warning "⚠️  Tailwind CSS no verificado en globals.css"
    increment_warning
  fi
}

# Verificar configuración de ESLint
check_eslint_configuration() {
  print_message "🔍 Verificando configuración de ESLint..."

  if [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ] || [ -f "eslint.config.js" ]; then
    print_success "✅ Configuración de ESLint encontrada"
  else
    print_warning "⚠️  Configuración de ESLint no encontrada"
    increment_warning
  fi

  # Verificar que eslint está en las dependencias
  if grep -q "eslint" package.json; then
    print_success "✅ ESLint en dependencias"
  else
    print_warning "⚠️  ESLint no encontrado en dependencias"
    increment_warning
  fi
}

# Verificar configuración de Git
check_git_configuration() {
  print_message "📝 Verificando configuración de Git..."

  if [ -d ".git" ]; then
    print_success "✅ Repositorio Git inicializado"

    # Verificar que no hay cambios sin commitear
    if [ -z "$(git status --porcelain)" ]; then
      print_success "✅ No hay cambios sin commitear"
    else
      print_warning "⚠️  Hay cambios sin commitear"
      increment_warning
    fi

    # Verificar la rama actual
    local current_branch=$(git branch --show-current)
    print_message "   Rama actual: $current_branch"

  else
    print_warning "⚠️  No es un repositorio Git"
    increment_warning
  fi
}

# Verificar permisos de archivos
check_file_permissions() {
  print_message "🔐 Verificando permisos de archivos..."

  # Verificar que el script tiene permisos de ejecución
  if [ -x "$0" ]; then
    print_success "✅ Script de validación ejecutable"
  else
    print_warning "⚠️  Script de validación no es ejecutable"
    increment_warning
  fi

  # Verificar permisos de directorios importantes
  local dirs=("src" "public" "node_modules")
  for dir in "${dirs[@]}"; do
    if [ -d "$dir" ] && [ -r "$dir" ]; then
      print_success "✅ Permisos de lectura en $dir/"
    else
      print_warning "⚠️  Permisos de lectura en $dir/ no verificados"
      increment_warning
    fi
  done
}

# Mostrar resumen final
show_summary() {
  echo ""
  print_message "📊 RESUMEN DE VALIDACIÓN"
  echo "================================"

  if [ $ERROR_COUNT -eq 0 ]; then
    print_success "✅ No se encontraron errores críticos"
  else
    print_error "❌ Se encontraron $ERROR_COUNT errores críticos"
  fi

  if [ $WARNING_COUNT -eq 0 ]; then
    print_success "✅ No se encontraron advertencias"
  else
    print_warning "⚠️  Se encontraron $WARNING_COUNT advertencias"
  fi

  echo ""

  if [ $ERROR_COUNT -eq 0 ]; then
    print_success "🎉 El entorno está listo para el despliegue a EC2"
    echo ""
    print_message "Próximos pasos:"
    echo "  1. Ejecutar: ./scripts/deploy-frontend.sh"
    echo "  2. Seleccionar el entorno (dev/test/prod)"
    echo "  3. Confirmar el despliegue"
  else
    print_error "🚫 El entorno NO está listo para el despliegue"
    echo ""
    print_message "Corrige los errores antes de continuar:"
    echo "  1. Revisa los errores listados arriba"
    echo "  2. Ejecuta este script nuevamente después de corregir"
    echo "  3. Solo procede cuando no haya errores críticos"
  fi

  echo ""
  print_message "Para más información, consulta la documentación del proyecto."
}

# Función principal
main() {
  echo ""
  print_message "🔍 VALIDACIÓN DE ENTORNO PARA DESPLIEGUE A EC2"
  echo "=================================================="
  echo ""

  # Ejecutar todas las validaciones
  check_system_dependencies
  echo ""

  check_aws_configuration
  echo ""

  check_environment_variables
  echo ""

  check_backend_connectivity
  echo ""

  check_project_structure
  echo ""

  check_node_dependencies
  echo ""

  check_nextjs_configuration
  echo ""

  check_typescript_configuration
  echo ""

  check_tailwind_configuration
  echo ""

  check_eslint_configuration
  echo ""

  check_git_configuration
  echo ""

  check_file_permissions
  echo ""

  # Mostrar resumen final
  show_summary

  # Retornar código de salida apropiado
  if [ $ERROR_COUNT -gt 0 ]; then
    exit 1
  else
    exit 0
  fi
}

# Ejecutar el script
main
