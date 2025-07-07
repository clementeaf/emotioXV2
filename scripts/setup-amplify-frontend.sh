#!/bin/bash

# 🚀 Script para configurar AWS Amplify para el frontend
# Este script te guía a través del proceso de configuración

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Variables
AWS_REGION=${AWS_REGION:-"us-east-1"}
REPO_NAME="emotioXV2"
FRONTEND_DIR="frontend"

# Función para verificar prerrequisitos
check_prerequisites() {
    log_info "Verificando prerrequisitos..."

    # Verificar AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI no está instalado. Instálalo desde: https://aws.amazon.com/cli/"
        exit 1
    fi

    # Verificar que AWS está configurado
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI no está configurado. Ejecuta: aws configure"
        exit 1
    fi

    # Verificar que estamos en el directorio correcto
    if [ ! -d "$FRONTEND_DIR" ]; then
        log_error "No se encontró el directorio frontend. Ejecuta este script desde la raíz del proyecto."
        exit 1
    fi

    log_success "Prerrequisitos verificados"
}

# Función para crear aplicación en Amplify
create_amplify_app() {
    log_info "Creando aplicación en AWS Amplify..."

    echo "📋 Configuración de la aplicación:"
    read -p "Nombre de la aplicación (default: emotioxv2-frontend): " APP_NAME
    APP_NAME=${APP_NAME:-"emotioxv2-frontend"}

    read -p "Descripción (default: Frontend de EmotioXV2): " APP_DESCRIPTION
    APP_DESCRIPTION=${APP_DESCRIPTION:-"Frontend de EmotioXV2"}

    read -p "Repositorio Git (dejar vacío si no quieres conectar ahora): " REPO_URL

    # Crear aplicación
    if [ -n "$REPO_URL" ]; then
        log_info "Creando aplicación con repositorio conectado..."
        APP_ID=$(aws amplify create-app \
            --name "$APP_NAME" \
            --description "$APP_DESCRIPTION" \
            --repository "$REPO_URL" \
            --region "$AWS_REGION" \
            --query 'app.appId' \
            --output text)
    else
        log_info "Creando aplicación sin repositorio..."
        APP_ID=$(aws amplify create-app \
            --name "$APP_NAME" \
            --description "$APP_DESCRIPTION" \
            --region "$AWS_REGION" \
            --query 'app.appId' \
            --output text)
    fi

    log_success "Aplicación creada con ID: $APP_ID"

    # Guardar ID para uso posterior
    echo "$APP_ID" > .amplify-app-id
}

# Función para crear branch principal
create_main_branch() {
    log_info "Creando branch principal..."

    if [ ! -f .amplify-app-id ]; then
        log_error "No se encontró el ID de la aplicación. Ejecuta primero create_amplify_app"
        exit 1
    fi

    APP_ID=$(cat .amplify-app-id)

    # Crear branch main
    aws amplify create-branch \
        --app-id "$APP_ID" \
        --branch-name main \
        --region "$AWS_REGION"

    log_success "Branch main creado"
}

# Función para configurar build settings
configure_build_settings() {
    log_info "Configurando build settings..."

    if [ ! -f .amplify-app-id ]; then
        log_error "No se encontró el ID de la aplicación"
        exit 1
    fi

    APP_ID=$(cat .amplify-app-id)

    # Verificar que existe amplify.yml
    if [ ! -f "$FRONTEND_DIR/amplify.yml" ]; then
        log_error "No se encontró $FRONTEND_DIR/amplify.yml"
        exit 1
    fi

    # Configurar build settings
    aws amplify update-app \
        --app-id "$APP_ID" \
        --build-spec file://$FRONTEND_DIR/amplify.yml \
        --region "$AWS_REGION"

    log_success "Build settings configurados"
}

# Función para configurar variables de entorno
configure_environment_variables() {
    log_info "Configurando variables de entorno..."

    if [ ! -f .amplify-app-id ]; then
        log_error "No se encontró el ID de la aplicación"
        exit 1
    fi

    APP_ID=$(cat .amplify-app-id)

    echo "🔧 Configurando variables de entorno:"
    read -p "NEXT_PUBLIC_API_URL (default: http://localhost:3001): " API_URL
    API_URL=${API_URL:-"http://localhost:3001"}

    read -p "NEXT_PUBLIC_WS_URL (default: ws://localhost:3001): " WS_URL
    WS_URL=${WS_URL:-"ws://localhost:3001"}

    read -p "NEXT_PUBLIC_PUBLIC_TESTS_URL (default: http://localhost:4700): " PUBLIC_TESTS_URL
    PUBLIC_TESTS_URL=${PUBLIC_TESTS_URL:-"http://localhost:4700"}

    # Crear archivo temporal con variables
    cat > /tmp/amplify-env.json << EOF
{
  "environmentVariables": {
    "NEXT_PUBLIC_API_URL": "$API_URL",
    "NEXT_PUBLIC_WS_URL": "$WS_URL",
    "NEXT_PUBLIC_PUBLIC_TESTS_URL": "$PUBLIC_TESTS_URL",
    "NODE_ENV": "production"
  }
}
EOF

    # Actualizar aplicación con variables de entorno
    aws amplify update-app \
        --app-id "$APP_ID" \
        --environment-variables file:///tmp/amplify-env.json \
        --region "$AWS_REGION"

    # Limpiar archivo temporal
    rm -f /tmp/amplify-env.json

    log_success "Variables de entorno configuradas"
}

# Función para configurar dominio personalizado (opcional)
configure_custom_domain() {
    log_info "Configurando dominio personalizado (opcional)..."

    if [ ! -f .amplify-app-id ]; then
        log_error "No se encontró el ID de la aplicación"
        exit 1
    fi

    APP_ID=$(cat .amplify-app-id)

    read -p "¿Quieres configurar un dominio personalizado? (y/n): " setup_domain

    if [[ $setup_domain =~ ^[Yy]$ ]]; then
        read -p "Dominio (ej: app.emotioxv2.com): " DOMAIN_NAME

        if [ -n "$DOMAIN_NAME" ]; then
            # Crear subdominio
            aws amplify create-domain-association \
                --app-id "$APP_ID" \
                --domain-name "$DOMAIN_NAME" \
                --sub-domains main="$DOMAIN_NAME" \
                --region "$AWS_REGION"

            log_success "Dominio personalizado configurado: $DOMAIN_NAME"
        fi
    else
        log_info "Saltando configuración de dominio personalizado"
    fi
}

# Función para configurar GitHub Actions
configure_github_actions() {
    log_info "Configurando GitHub Actions..."

    if [ ! -f .amplify-app-id ]; then
        log_error "No se encontró el ID de la aplicación"
        exit 1
    fi

    APP_ID=$(cat .amplify-app-id)

    echo "🔧 Configurando secret de GitHub..."
    echo "Ejecuta el siguiente comando para configurar el secret:"
    echo ""
    echo "gh secret set AMPLIFY_FRONTEND_APP_ID --body \"$APP_ID\""
    echo ""

    read -p "¿Quieres que ejecute el comando ahora? (y/n): " run_command

    if [[ $run_command =~ ^[Yy]$ ]]; then
        if command -v gh &> /dev/null; then
            gh secret set AMPLIFY_FRONTEND_APP_ID --body "$APP_ID"
            log_success "Secret configurado en GitHub"
        else
            log_warning "GitHub CLI no está instalado. Configura el secret manualmente."
        fi
    fi
}

# Función para hacer despliegue inicial
initial_deploy() {
    log_info "Haciendo despliegue inicial..."

    if [ ! -f .amplify-app-id ]; then
        log_error "No se encontró el ID de la aplicación"
        exit 1
    fi

    APP_ID=$(cat .amplify-app-id)

    read -p "¿Quieres hacer un despliegue inicial ahora? (y/n): " do_deploy

    if [[ $do_deploy =~ ^[Yy]$ ]]; then
        log_info "Iniciando despliegue inicial..."

        # Iniciar job de despliegue
        JOB_ID=$(aws amplify start-job \
            --app-id "$APP_ID" \
            --branch-name main \
            --job-type RELEASE \
            --region "$AWS_REGION" \
            --query 'jobSummary.jobId' \
            --output text)

        echo "🔄 Job ID: $JOB_ID"

        # Esperar a que termine el despliegue
        echo "⏳ Esperando que termine el despliegue..."
        aws amplify wait job-complete \
            --app-id "$APP_ID" \
            --branch-name main \
            --job-id "$JOB_ID" \
            --region "$AWS_REGION"

        # Obtener estado del job
        JOB_STATUS=$(aws amplify get-job \
            --app-id "$APP_ID" \
            --branch-name main \
            --job-id "$JOB_ID" \
            --region "$AWS_REGION" \
            --query 'job.summary.status' \
            --output text)

        if [ "$JOB_STATUS" = "SUCCEED" ]; then
            log_success "Despliegue inicial exitoso!"

            # Obtener URL de la aplicación
            APP_INFO=$(aws amplify get-app --app-id "$APP_ID" --region "$AWS_REGION")
            APP_DOMAIN=$(echo "$APP_INFO" | jq -r '.app.domain')
            echo "🌐 URL: https://main.$APP_DOMAIN.amplifyapp.com"
        else
            log_error "Despliegue falló con estado: $JOB_STATUS"
            exit 1
        fi
    else
        log_info "Saltando despliegue inicial"
    fi
}

# Función para mostrar resumen
show_summary() {
    log_info "Resumen de configuración:"

    if [ -f .amplify-app-id ]; then
        APP_ID=$(cat .amplify-app-id)
        echo "📱 App ID: $APP_ID"

        # Obtener información de la aplicación
        APP_INFO=$(aws amplify get-app --app-id "$APP_ID" --region "$AWS_REGION")
        APP_NAME=$(echo "$APP_INFO" | jq -r '.app.name')
        APP_DOMAIN=$(echo "$APP_INFO" | jq -r '.app.domain')

        echo "📱 Nombre: $APP_NAME"
        echo "🌐 Dominio: $APP_DOMAIN"
        echo "🌐 URL: https://main.$APP_DOMAIN.amplifyapp.com"
    fi

    echo ""
    echo "🎯 Próximos pasos:"
    echo "1. Configura el secret AMPLIFY_FRONTEND_APP_ID en GitHub"
    echo "2. Haz commit y push de los cambios"
    echo "3. Los workflows de GitHub Actions se ejecutarán automáticamente"
    echo "4. Monitorea el despliegue en AWS Amplify Console"
}

# Función principal
main() {
    echo "🚀 Configuración de AWS Amplify para Frontend"
    echo "=============================================="

    check_prerequisites

    echo ""
    echo "📋 Opciones de configuración:"
    echo "1. Crear aplicación completa (recomendado)"
    echo "2. Solo crear aplicación"
    echo "3. Solo configurar branch"
    echo "4. Solo configurar build settings"
    echo "5. Solo configurar variables de entorno"
    echo "6. Solo configurar dominio personalizado"
    echo "7. Solo configurar GitHub Actions"
    echo "8. Solo hacer despliegue inicial"
    echo "9. Mostrar resumen"
    echo "0. Salir"

    read -p "Selecciona una opción (1-9, 0 para salir): " choice

    case $choice in
        1)
            create_amplify_app
            create_main_branch
            configure_build_settings
            configure_environment_variables
            configure_custom_domain
            configure_github_actions
            initial_deploy
            show_summary
            ;;
        2)
            create_amplify_app
            ;;
        3)
            create_main_branch
            ;;
        4)
            configure_build_settings
            ;;
        5)
            configure_environment_variables
            ;;
        6)
            configure_custom_domain
            ;;
        7)
            configure_github_actions
            ;;
        8)
            initial_deploy
            ;;
        9)
            show_summary
            ;;
        0)
            log_info "Saliendo..."
            exit 0
            ;;
        *)
            log_error "Opción inválida"
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"
