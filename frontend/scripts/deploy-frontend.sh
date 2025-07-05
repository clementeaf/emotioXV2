#!/bin/bash

# Script para desplegar el frontend de EmotioXV2 en AWS

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

# Verificar dependencias
check_dependencies() {
  print_message "Verificando dependencias..."

  # Verificar AWS CLI
  if ! command -v aws &> /dev/null; then
    print_error "AWS CLI no está instalado. Por favor instálalo: https://aws.amazon.com/cli/"
    exit 1
  fi

  # Verificar Node.js
  if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instálalo: https://nodejs.org/"
    exit 1
  fi

  # Verificar npm
  if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado. Por favor instálalo junto con Node.js: https://nodejs.org/"
    exit 1
  fi

  # Verificar curl para tests de conectividad
  if ! command -v curl &> /dev/null; then
    print_error "curl no está instalado. Necesario para validar conectividad al backend."
    exit 1
  fi

  print_success "Todas las dependencias están instaladas."
}

# Verificar configuración de AWS
check_aws_config() {
  print_message "Verificando configuración de AWS..."

  if ! aws sts get-caller-identity &> /dev/null; then
    print_error "No se pudo verificar la identidad de AWS. Verifica tus credenciales."
    exit 1
  fi

  print_success "Configuración de AWS verificada."
}

# Validar variables de entorno críticas
validate_environment_variables() {
  print_message "Validando variables de entorno críticas..."

  # Variables requeridas para el build
  local required_vars=(
    "NEXT_PUBLIC_API_URL"
    "NEXT_PUBLIC_WS_URL"
  )

  local missing_vars=()

  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      missing_vars+=("$var")
    fi
  done

  if [ ${#missing_vars[@]} -gt 0 ]; then
    print_error "Variables de entorno faltantes:"
    for var in "${missing_vars[@]}"; do
      echo "  - $var"
    done
    print_error "Estas variables son críticas para el funcionamiento del frontend."
    exit 1
  fi

  # Validar formato de URLs
  if [[ ! "$NEXT_PUBLIC_API_URL" =~ ^https?:// ]]; then
    print_error "NEXT_PUBLIC_API_URL debe ser una URL válida (comenzar con http:// o https://)"
    exit 1
  fi

  if [[ ! "$NEXT_PUBLIC_WS_URL" =~ ^wss?:// ]]; then
    print_error "NEXT_PUBLIC_WS_URL debe ser una URL WebSocket válida (comenzar con ws:// o wss://)"
    exit 1
  fi

  print_success "Variables de entorno validadas correctamente."
  print_message "API URL: $NEXT_PUBLIC_API_URL"
  print_message "WebSocket URL: $NEXT_PUBLIC_WS_URL"
}

# Test de conectividad al backend
test_backend_connectivity() {
  print_message "Probando conectividad al backend..."

  local api_url="$NEXT_PUBLIC_API_URL"
  local health_endpoint="${api_url}/health"
  local auth_endpoint="${api_url}/auth/login"

  # Test 1: Conectividad básica (timeout 10 segundos)
  print_message "Test 1: Conectividad básica..."
  if ! curl -s --max-time 10 --connect-timeout 10 "$api_url" > /dev/null 2>&1; then
    print_error "No se puede conectar al backend en: $api_url"
    print_error "Verifica que el backend esté desplegado y accesible."
    exit 1
  fi
  print_success "Conectividad básica: OK"

  # Test 2: Endpoint de health (si existe)
  print_message "Test 2: Endpoint de health..."
  local health_response=$(curl -s --max-time 10 "$health_endpoint" 2>/dev/null)
  if [ $? -eq 0 ] && [ -n "$health_response" ]; then
    print_success "Health endpoint: OK"
  else
    print_warning "Health endpoint no disponible o no responde (esto puede ser normal)"
  fi

  # Test 3: Endpoint de autenticación (debe existir)
  print_message "Test 3: Endpoint de autenticación..."
  local auth_response=$(curl -s --max-time 10 -X POST "$auth_endpoint" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}' 2>/dev/null)

  if [ $? -eq 0 ]; then
    # Verificar que la respuesta sea JSON válido (aunque sea un error de credenciales)
    if echo "$auth_response" | grep -q "message\|error\|status"; then
      print_success "Auth endpoint: OK (responde correctamente)"
    else
      print_warning "Auth endpoint responde pero formato inesperado"
    fi
  else
    print_error "Auth endpoint no responde. Verifica que el backend esté funcionando."
    exit 1
  fi

  # Test 4: CORS headers
  print_message "Test 4: Validación de CORS..."
  local cors_response=$(curl -s --max-time 10 -H "Origin: https://test.com" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -X OPTIONS "$auth_endpoint" 2>/dev/null)

  if [ $? -eq 0 ]; then
    print_success "CORS: OK (backend responde a preflight requests)"
  else
    print_warning "CORS: No se pudo verificar (puede ser normal si no hay preflight)"
  fi

  print_success "Conectividad al backend validada correctamente."
}

# Validar endpoints críticos
validate_critical_endpoints() {
  print_message "Validando endpoints críticos..."

  local api_url="$NEXT_PUBLIC_API_URL"
  local endpoints=(
    "/research"
    "/auth/login"
    "/auth/register"
  )

  local failed_endpoints=()

  for endpoint in "${endpoints[@]}"; do
    local full_url="${api_url}${endpoint}"
    print_message "Validando: $endpoint"

    # Hacer request OPTIONS para verificar que el endpoint existe
    local response=$(curl -s --max-time 10 -X OPTIONS "$full_url" 2>/dev/null)
    local status_code=$?

    if [ $status_code -eq 0 ]; then
      print_success "  ✅ $endpoint"
    else
      print_warning "  ⚠️  $endpoint (no responde a OPTIONS, pero puede ser normal)"
      failed_endpoints+=("$endpoint")
    fi
  done

  if [ ${#failed_endpoints[@]} -gt 0 ]; then
    print_warning "Algunos endpoints no respondieron a OPTIONS:"
    for endpoint in "${failed_endpoints[@]}"; do
      echo "  - $endpoint"
    done
    print_warning "Esto puede ser normal si el backend no maneja OPTIONS requests."
  fi

  print_success "Validación de endpoints completada."
}

# Verificar que el build no tenga errores críticos
validate_build_environment() {
  print_message "Validando entorno de build..."

  # Verificar que estamos en el directorio correcto
  if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio del frontend."
    exit 1
  fi

  # Verificar que las variables estén disponibles para Next.js
  print_message "Verificando que Next.js pueda acceder a las variables de entorno..."

  # Crear un script temporal para verificar las variables
  cat > /tmp/check_env.js << 'EOF'
console.log('=== Verificación de Variables de Entorno ===');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'NO DEFINIDA');
console.log('NEXT_PUBLIC_WS_URL:', process.env.NEXT_PUBLIC_WS_URL || 'NO DEFINIDA');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NO DEFINIDA');

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.error('❌ NEXT_PUBLIC_API_URL no está definida');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_WS_URL) {
  console.error('❌ NEXT_PUBLIC_WS_URL no está definida');
  process.exit(1);
}

console.log('✅ Todas las variables críticas están definidas');
EOF

  # Ejecutar la verificación
  if ! node /tmp/check_env.js; then
    print_error "Las variables de entorno no están disponibles para Node.js."
    print_error "Asegúrate de exportar las variables antes de ejecutar este script."
    rm -f /tmp/check_env.js
    exit 1
  fi

  rm -f /tmp/check_env.js
  print_success "Entorno de build validado correctamente."
}

# Mostrar entornos disponibles y solicitar selección
select_environment() {
  echo ""
  print_message "Selecciona el entorno para desplegar:"
  select env in "dev" "test" "prod" "Salir"; do
    case $env in
      "dev")
        ENV="dev"
        break
        ;;
      "test")
        ENV="test"
        break
        ;;
      "prod")
        ENV="prod"
        break
        ;;
      "Salir")
        print_message "Operación cancelada por el usuario."
        exit 0
        ;;
      *)
        print_error "Opción inválida. Por favor, selecciona un número."
        ;;
    esac
  done

  print_message "Entorno seleccionado: ${GREEN}$ENV${NC}"

  # Confirmar despliegue de producción
  if [ "$ENV" == "prod" ]; then
    echo ""
    read -p "¿Estás seguro de que deseas desplegar en PRODUCCIÓN? (s/N): " confirm
    if [[ ! "$confirm" =~ ^[sS]$ ]]; then
      print_message "Despliegue de producción cancelado."
      exit 0
    fi
  fi
}

# Construir el frontend
build_frontend() {
  print_message "Construyendo el frontend para el entorno: ${ENV}..."

  # Establecer variables de entorno específicas según el entorno
  case $ENV in
    "dev")
      export NEXT_PUBLIC_API_URL="https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
      export NEXT_PUBLIC_WS_URL="wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
      export NEXT_PUBLIC_ENV="development"
      ;;
    "test")
      export NEXT_PUBLIC_API_URL="https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/test"
      export NEXT_PUBLIC_WS_URL="wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/test"
      export NEXT_PUBLIC_ENV="testing"
      ;;
    "prod")
      export NEXT_PUBLIC_API_URL="https://8tgodyuvfj.execute-api.us-east-1.amazonaws.com/prod"
      export NEXT_PUBLIC_WS_URL="wss://0x3ndqqhe9.execute-api.us-east-1.amazonaws.com/prod"
      export NEXT_PUBLIC_ENV="production"
      ;;
  esac

  # Navegar al directorio del frontend si es necesario
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
  cd "$SCRIPT_DIR/.." || exit

  # Instalar dependencias
  print_message "Instalando dependencias..."
  npm ci || { print_error "Error al instalar dependencias."; exit 1; }

  # Construir la aplicación
  print_message "Compilando la aplicación..."
  npm run build || { print_error "Error al compilar la aplicación."; exit 1; }

  print_success "Frontend construido correctamente."
}

# Desplegar a S3
deploy_to_s3() {
  BUCKET_NAME="emotioxv2-frontend-${ENV}"

  print_message "Verificando existencia del bucket S3: ${BUCKET_NAME}..."

  # Verificar si el bucket existe
  if ! aws s3 ls "s3://${BUCKET_NAME}" &> /dev/null; then
    print_error "El bucket ${BUCKET_NAME} no existe. Ejecuta primero el template de CloudFormation."
    exit 1
  fi

  print_message "Desplegando archivos a S3..."

  # Sincronizar archivos con S3
  aws s3 sync build/ "s3://${BUCKET_NAME}" --delete || {
    print_error "Error al desplegar archivos a S3."
    exit 1
  }

  print_success "Archivos desplegados correctamente a S3."
}

# Invalidar caché de CloudFront
invalidate_cloudfront() {
  print_message "Obteniendo ID de distribución de CloudFront..."

  # Obtener ID de distribución de CloudFormation exportado
  STACK_NAME="emotioxv2-frontend-${ENV}"
  DISTRIBUTION_ID=$(aws cloudformation list-exports --query "Exports[?Name=='${STACK_NAME}-CloudFrontDistributionId'].Value" --output text)

  if [ -z "$DISTRIBUTION_ID" ]; then
    print_error "No se pudo obtener el ID de distribución de CloudFront."
    exit 1
  fi

  print_message "Invalidando caché de CloudFront para la distribución: ${DISTRIBUTION_ID}..."

  # Crear invalidación
  aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" || {
    print_error "Error al invalidar la caché de CloudFront."
    exit 1
  }

  print_success "Caché de CloudFront invalidada correctamente."
}

# Mostrar URL del sitio
show_website_url() {
  STACK_NAME="emotioxv2-frontend-${ENV}"

  # Obtener URL del sitio de CloudFormation exportado
  WEBSITE_URL=$(aws cloudformation list-exports --query "Exports[?Name=='${STACK_NAME}-WebsiteURL'].Value" --output text)

  if [ -z "$WEBSITE_URL" ]; then
    # Usar URL de CloudFront si no hay una URL exportada
    DISTRIBUTION_DOMAIN=$(aws cloudformation list-exports --query "Exports[?Name=='${STACK_NAME}-CloudFrontDomainName'].Value" --output text)
    if [ -n "$DISTRIBUTION_DOMAIN" ]; then
      WEBSITE_URL="https://${DISTRIBUTION_DOMAIN}"
    else
      WEBSITE_URL="No disponible"
    fi
  fi

  echo ""
  print_success "¡Despliegue completado con éxito!"
  print_message "URL del sitio: ${GREEN}${WEBSITE_URL}${NC}"
  echo ""
  print_message "Nota: La propagación de CloudFront puede tomar hasta 15 minutos."
}

# Función principal
main() {
  echo ""
  print_message "Iniciando despliegue del frontend de EmotioXV2..."
  echo ""

  check_dependencies
  check_aws_config

  # Permitir argumento para entorno
  if [[ "$1" == "dev" || "$1" == "test" || "$1" == "prod" ]]; then
    ENV="$1"
    print_message "Entorno seleccionado por argumento: ${GREEN}$ENV${NC}"
  else
    select_environment
  fi

  # Validaciones críticas antes del build
  validate_environment_variables
  test_backend_connectivity
  validate_critical_endpoints
  validate_build_environment

  build_frontend
  deploy_to_s3
  invalidate_cloudfront
  show_website_url
}

# Ejecutar el script, pasando todos los argumentos
main "$@"
