#!/bin/bash

# Script para crear la infraestructura AWS para el frontend de EmotioXV2
# Este script despliega el template de CloudFormation para crear el bucket S3 y la distribución CloudFront

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
  
  # Verificar jq para procesar JSON
  if ! command -v jq &> /dev/null; then
    print_warning "jq no está instalado. Se recomienda para un mejor manejo de JSON: https://stedolan.github.io/jq/download/"
  fi
  
  print_success "Dependencias verificadas."
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

# Verificar si la pila ya existe
check_stack_exists() {
  local stack_name=$1
  
  print_message "Verificando si la pila ${stack_name} ya existe..."
  
  if aws cloudformation describe-stacks --stack-name "$stack_name" &> /dev/null; then
    return 0 # La pila existe
  else
    return 1 # La pila no existe
  fi
}

# Mostrar entornos disponibles y solicitar selección
select_environment() {
  echo ""
  print_message "Selecciona el entorno para crear la infraestructura:"
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
  
  STACK_NAME="emotioxv2-frontend-${ENV}"
  print_message "Entorno seleccionado: ${GREEN}$ENV${NC} (Nombre de pila: $STACK_NAME)"
  
  # Confirmar despliegue de producción
  if [ "$ENV" == "prod" ]; then
    echo ""
    read -p "¿Estás seguro de que deseas crear infraestructura de PRODUCCIÓN? (s/N): " confirm
    if [[ ! "$confirm" =~ ^[sS]$ ]]; then
      print_message "Creación de infraestructura de producción cancelada."
      exit 0
    fi
  fi
}

# Solicitar parámetros adicionales para el entorno de producción
request_prod_params() {
  local params=""
  
  if [ "$ENV" == "prod" ]; then
    echo ""
    print_message "Para el entorno de producción, se requieren parámetros adicionales:"
    
    # Solicitar dominio personalizado
    read -p "Nombre de dominio (sin www, ej: emotioxv2.com): " domain_name
    if [ -n "$domain_name" ]; then
      params="$params ParameterKey=DomainName,ParameterValue=$domain_name"
    fi
    
    # Solicitar ARN del certificado ACM
    read -p "ARN del certificado ACM (déjalo en blanco si no tienes): " cert_arn
    if [ -n "$cert_arn" ]; then
      params="$params ParameterKey=ACMCertificateARN,ParameterValue=$cert_arn"
    fi
    
    # Preguntar si desea crear registros de Route 53
    read -p "¿Crear registros DNS en Route 53? (s/N): " create_dns
    if [[ "$create_dns" =~ ^[sS]$ ]]; then
      params="$params ParameterKey=CreateRoute53Records,ParameterValue=true"
      
      # Solicitar ID de zona hospedada
      read -p "ID de zona hospedada de Route 53: " hosted_zone_id
      if [ -n "$hosted_zone_id" ]; then
        params="$params ParameterKey=HostedZoneId,ParameterValue=$hosted_zone_id"
      fi
    fi
  fi
  
  echo "$params"
}

# Crear o actualizar la pila de CloudFormation
deploy_stack() {
  local template_file="/Users/clementefalcone/Desktop/emotioXV2/frontend/aws/cloudformation-template.yml"
  local params="ParameterKey=EnvironmentName,ParameterValue=$ENV"
  
  # Añadir parámetros adicionales para producción
  if [ "$ENV" == "prod" ]; then
    local prod_params=$(request_prod_params)
    params="$params $prod_params"
  fi
  
  # Verificar si la pila existe
  if check_stack_exists "$STACK_NAME"; then
    print_message "La pila $STACK_NAME ya existe. Actualizando..."
    
    # Crear conjunto de cambios
    local change_set_name="${STACK_NAME}-change-$(date +%Y%m%d%H%M%S)"
    
    print_message "Creando conjunto de cambios: $change_set_name..."
    aws cloudformation create-change-set \
      --stack-name "$STACK_NAME" \
      --change-set-name "$change_set_name" \
      --template-body "file://$template_file" \
      --parameters $params \
      --capabilities CAPABILITY_IAM

    # Esperar a que el conjunto de cambios esté listo
    print_message "Esperando a que el conjunto de cambios esté listo..."
    aws cloudformation wait change-set-create-complete \
      --stack-name "$STACK_NAME" \
      --change-set-name "$change_set_name"
    
    # Verificar si hay cambios
    local change_set_status=$(aws cloudformation describe-change-set \
      --stack-name "$STACK_NAME" \
      --change-set-name "$change_set_name" \
      --query "Status" --output text)
    
    local change_set_status_reason=$(aws cloudformation describe-change-set \
      --stack-name "$STACK_NAME" \
      --change-set-name "$change_set_name" \
      --query "StatusReason" --output text)
    
    if [ "$change_set_status" == "FAILED" ] && [[ "$change_set_status_reason" == *"The submitted information didn't contain changes"* ]]; then
      print_warning "No hay cambios para aplicar a la pila."
      aws cloudformation delete-change-set \
        --stack-name "$STACK_NAME" \
        --change-set-name "$change_set_name"
    else
      # Ejecutar el conjunto de cambios
      print_message "Aplicando cambios a la pila $STACK_NAME..."
      aws cloudformation execute-change-set \
        --stack-name "$STACK_NAME" \
        --change-set-name "$change_set_name"
      
      # Esperar a que la actualización se complete
      print_message "Esperando a que la actualización se complete..."
      aws cloudformation wait stack-update-complete --stack-name "$STACK_NAME"
      
      print_success "¡Pila actualizada correctamente!"
    fi
  else
    print_message "Creando nueva pila: $STACK_NAME..."
    
    # Crear la pila
    aws cloudformation create-stack \
      --stack-name "$STACK_NAME" \
      --template-body "file://$template_file" \
      --parameters $params \
      --capabilities CAPABILITY_IAM
    
    # Esperar a que la creación se complete
    print_message "Esperando a que la creación de la pila se complete..."
    aws cloudformation wait stack-create-complete --stack-name "$STACK_NAME"
    
    print_success "¡Pila creada correctamente!"
  fi
}

# Mostrar las salidas de la pila
show_stack_outputs() {
  print_message "Obteniendo información de la infraestructura creada..."
  
  # Obtener las salidas de la pila
  local outputs=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs" --output json)
  
  echo ""
  print_message "Información de la infraestructura:"
  echo ""
  
  # Bucket S3
  local bucket_name=$(echo "$outputs" | grep -o '"OutputKey": "WebsiteBucketName".*"OutputValue": "[^"]*"' | grep -o '"OutputValue": "[^"]*"' | cut -d '"' -f 4)
  echo -e "  ${GREEN}Bucket S3:${NC} $bucket_name"
  
  # ID de distribución CloudFront
  local cf_id=$(echo "$outputs" | grep -o '"OutputKey": "CloudFrontDistributionId".*"OutputValue": "[^"]*"' | grep -o '"OutputValue": "[^"]*"' | cut -d '"' -f 4)
  echo -e "  ${GREEN}ID de CloudFront:${NC} $cf_id"
  
  # Dominio de CloudFront
  local cf_domain=$(echo "$outputs" | grep -o '"OutputKey": "CloudFrontDomainName".*"OutputValue": "[^"]*"' | grep -o '"OutputValue": "[^"]*"' | cut -d '"' -f 4)
  echo -e "  ${GREEN}Dominio de CloudFront:${NC} $cf_domain"
  
  # URL del sitio web
  local website_url=$(echo "$outputs" | grep -o '"OutputKey": "WebsiteURL".*"OutputValue": "[^"]*"' | grep -o '"OutputValue": "[^"]*"' | cut -d '"' -f 4)
  echo -e "  ${GREEN}URL del sitio web:${NC} $website_url"
  
  echo ""
  print_message "Para desplegar el frontend a esta infraestructura, ejecuta: ${YELLOW}./scripts/deploy-frontend.sh${NC}"
}

# Función principal
main() {
  echo ""
  print_message "Creación de infraestructura AWS para EmotioXV2 Frontend"
  echo ""
  
  # Ejecutar funciones en secuencia
  check_dependencies
  check_aws_config
  select_environment
  deploy_stack
  show_stack_outputs
}

# Ejecutar el script
main 