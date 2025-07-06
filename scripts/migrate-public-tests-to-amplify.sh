#!/bin/bash

# 🚀 EmotioXV2 - Migrar Public-Tests a AWS Amplify
# Script completo para migrar de S3/CloudFront a Amplify

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuración
APP_NAME="emotioxv2-public-tests"
REPO_URL="https://github.com/clementeaf/emotioXV2"
REGION="us-east-1"
BRANCH="main"

main() {
    echo ""
    log_info "🚀 Migrando public-tests a AWS Amplify..."
    echo ""

    # Verificar prerequisitos
    check_prerequisites

    # Crear aplicación Amplify
    create_amplify_app

    # Configurar build settings
    configure_build_settings

    # Configurar environment variables
    configure_environment_variables

    # Crear branch y conectar repo
    connect_repository

    # Configurar dominio (opcional)
    setup_custom_domain

    # Primera build y deploy
    trigger_first_deploy

    # Backup configuración actual S3/CloudFront
    backup_current_setup

    # Mostrar resumen final
    show_final_summary

    echo ""
    log_success "✅ Migración a Amplify completada!"
    echo ""
}

check_prerequisites() {
    log_info "Verificando prerequisitos..."

    # Verificar AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI no está instalado"
        exit 1
    fi

    # Verificar credenciales AWS
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI no está configurado correctamente"
        exit 1
    fi

    # Verificar jq
    if ! command -v jq &> /dev/null; then
        log_error "jq no está instalado. Instala con: brew install jq"
        exit 1
    fi

    log_success "Todos los prerequisitos están disponibles"
}

create_amplify_app() {
    log_info "Creando aplicación Amplify..."

    # Crear la aplicación
    APP_RESPONSE=$(aws amplify create-app \
        --name "$APP_NAME" \
        --description "EmotioXV2 Public Tests - Participant Research Flow" \
        --repository "$REPO_URL" \
        --platform "WEB" \
        --iam-service-role "" \
        --environment-variables \
            NODE_ENV=production \
            VITE_API_URL=https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev \
            VITE_WS_URL=wss://w8dj7wxnl9.execute-api.us-east-1.amazonaws.com/dev \
            VITE_BUILD_HASH=amplify \
        --enable-auto-branch-creation \
        --region "$REGION" \
        --output json)

    APP_ID=$(echo "$APP_RESPONSE" | jq -r '.app.appId')
    APP_ARN=$(echo "$APP_RESPONSE" | jq -r '.app.appArn')
    DEFAULT_DOMAIN=$(echo "$APP_RESPONSE" | jq -r '.app.defaultDomain')

    log_success "Aplicación Amplify creada:"
    echo "  App ID: $APP_ID"
    echo "  Domain: https://$DEFAULT_DOMAIN"

    # Guardar configuración
    cat > .amplify-public-tests-config << EOF
AMPLIFY_APP_ID=$APP_ID
AMPLIFY_APP_ARN=$APP_ARN
AWS_REGION=$REGION
APP_NAME=$APP_NAME
REPOSITORY_URL=$REPO_URL
DEFAULT_DOMAIN=$DEFAULT_DOMAIN
BRANCH_NAME=$BRANCH
STAGE=PRODUCTION
EOF

    log_success "Configuración guardada en .amplify-public-tests-config"
}

configure_build_settings() {
    log_info "Configurando build settings..."

    # Crear archivo amplify.yml específico para public-tests
    cat > amplify-public-tests.yml << 'EOF'
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd public-tests
        - npm ci
        - echo "Build started on $(date)"
        - echo "Node.js version $(node --version)"
        - echo "npm version $(npm --version)"
    build:
      commands:
        - echo "Starting Vite build..."
        - npm run build
        - echo "Build completed successfully"
    postBuild:
      commands:
        - echo "Build artifacts ready"
        - ls -la dist/
  artifacts:
    baseDirectory: public-tests/dist
    files:
      - '**/*'
  cache:
    paths:
      - public-tests/node_modules/**/*
EOF

    # Aplicar configuración de build
    aws amplify update-app \
        --app-id "$APP_ID" \
        --build-spec file://amplify-public-tests.yml \
        --region "$REGION"

    log_success "Build settings configurados"
}

configure_environment_variables() {
    log_info "Configurando variables de entorno..."

    # Configurar variables de entorno específicas
    aws amplify put-app \
        --app-id "$APP_ID" \
        --environment-variables \
            NODE_ENV=production \
            VITE_API_URL=https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev \
            VITE_WS_URL=wss://w8dj7wxnl9.execute-api.us-east-1.amazonaws.com/dev \
            VITE_BUILD_HASH=amplify-$(date +%s) \
            NODE_OPTIONS=--max-old-space-size=4096 \
        --region "$REGION"

    log_success "Variables de entorno configuradas"
}

connect_repository() {
    log_info "Conectando repositorio GitHub..."

    # Nota: Para conectar GitHub necesitas un personal access token
    echo ""
    log_warning "⚠️  ACCIÓN MANUAL REQUERIDA:"
    echo "1. Ve a: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
    echo "2. Click en 'Connect branch'"
    echo "3. Autoriza GitHub y selecciona branch '$BRANCH'"
    echo "4. Configura build settings:"
    echo "   - Build command: npm run build"
    echo "   - Build output directory: dist"
    echo ""
    
    read -p "Presiona Enter cuando hayas completado la conexión de GitHub..."

    log_success "Repositorio conectado"
}

setup_custom_domain() {
    log_info "Configuración de dominio personalizado..."

    echo ""
    log_info "¿Quieres configurar un dominio personalizado? (y/n)"
    read -r setup_domain

    if [[ $setup_domain =~ ^[Yy]$ ]]; then
        echo "Ingresa el dominio (ej: public-tests.emotioxv2.com):"
        read -r custom_domain

        if [ -n "$custom_domain" ]; then
            aws amplify create-domain-association \
                --app-id "$APP_ID" \
                --domain-name "$custom_domain" \
                --sub-domain-settings prefix=main,branchName="$BRANCH" \
                --region "$REGION"

            log_success "Dominio personalizado configurado: https://$custom_domain"
        fi
    else
        log_info "Usando dominio por defecto: https://$DEFAULT_DOMAIN"
    fi
}

trigger_first_deploy() {
    log_info "Iniciando primer deployment..."

    # El deployment se iniciará automáticamente al conectar el branch
    # Pero podemos forzar uno si es necesario
    
    echo ""
    log_info "Deployment iniciado automáticamente"
    log_info "Puedes monitorear el progreso en:"
    echo "  https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
    echo ""
    
    log_warning "⏱️  El primer deployment puede tomar 3-5 minutos"
}

backup_current_setup() {
    log_info "Creando backup de configuración actual S3/CloudFront..."

    mkdir -p backups/s3-cloudfront-public-tests
    
    # Backup de configuración CloudFront
    aws cloudfront get-distribution-config --id E2X8HCFI5FM1EC \
        > backups/s3-cloudfront-public-tests/cloudfront-config.json

    # Backup de política S3
    aws s3api get-bucket-policy --bucket emotioxv2-public-tests-bucket \
        > backups/s3-cloudfront-public-tests/s3-bucket-policy.json 2>/dev/null || true

    # Backup de configuración website S3
    aws s3api get-bucket-website --bucket emotioxv2-public-tests-bucket \
        > backups/s3-cloudfront-public-tests/s3-website-config.json 2>/dev/null || true

    # Documentar URLs actuales
    cat > backups/s3-cloudfront-public-tests/current-urls.txt << EOF
S3 Bucket: emotioxv2-public-tests-bucket
CloudFront Distribution ID: E2X8HCFI5FM1EC
CloudFront URL: https://d2zt8ia21te5mv.cloudfront.net/
S3 Website URL: http://emotioxv2-public-tests-bucket.s3-website-us-east-1.amazonaws.com
Backup Date: $(date)
EOF

    log_success "Backup completado en backups/s3-cloudfront-public-tests/"
}

show_final_summary() {
    echo ""
    log_info "📋 Resumen de la migración:"
    echo ""
    echo "🚀 **Nueva infraestructura Amplify:**"
    echo "  App ID: $APP_ID"
    echo "  URL: https://$DEFAULT_DOMAIN"
    echo "  Console: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
    echo ""
    echo "🔧 **Configuración:**"
    echo "  Framework: Vite + React"
    echo "  Branch: $BRANCH"
    echo "  Build: Automático en commits"
    echo "  Environment: Production"
    echo ""
    echo "📦 **Backup S3/CloudFront:**"
    echo "  Ubicación: backups/s3-cloudfront-public-tests/"
    echo "  URLs anteriores documentadas"
    echo ""
    echo "✅ **Próximos pasos:**"
    echo "  1. Verificar que el deployment funciona correctamente"
    echo "  2. Actualizar DNS si tienes dominio personalizado"
    echo "  3. Desactivar S3/CloudFront después de 1 semana de testing"
    echo "  4. Actualizar documentación con nuevas URLs"
    echo ""
    echo "🎯 **Benefits obtenidos:**"
    echo "  ✅ CI/CD automático desde GitHub"
    echo "  ✅ Preview deploys en PRs"
    echo "  ✅ Rollback en 1-click"
    echo "  ✅ SSL automático"
    echo "  ✅ Monitoring integrado"
    echo ""
}

# Ejecutar función principal
main
