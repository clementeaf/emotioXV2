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
      export REACT_APP_API_URL="https://api-dev.emotioxv2.com"
      export REACT_APP_ENV="development"
      ;;
    "test")
      export REACT_APP_API_URL="https://api-test.emotioxv2.com"
      export REACT_APP_ENV="testing"
      ;;
    "prod")
      export REACT_APP_API_URL="https://api.emotioxv2.com"
      export REACT_APP_ENV="production"
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
  
  # Ejecutar funciones en secuencia
  check_dependencies
  check_aws_config
  select_environment
  build_frontend
  deploy_to_s3
  invalidate_cloudfront
  show_website_url
}

# Ejecutar el script
main 