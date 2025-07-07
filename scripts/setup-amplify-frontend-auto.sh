#!/bin/bash

# 🚀 Script automatizado para crear app de Amplify para frontend
# Crea la app, la conecta al repo y configura GitHub Secrets

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Verificar AWS CLI
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI no está instalado"
        exit 1
    fi

    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "No estás autenticado en AWS"
        exit 1
    fi
}

# Obtener información del repo
get_repo_info() {
    log_info "Obteniendo información del repositorio..."

    # Obtener URL del repo
    REPO_URL=$(git remote get-url origin)
    REPO_NAME=$(echo $REPO_URL | sed 's/.*github.com[:/]//' | sed 's/\.git$//')
    REPO_OWNER=$(echo $REPO_NAME | cut -d'/' -f1)
    REPO_NAME_ONLY=$(echo $REPO_NAME | cut -d'/' -f2)

    log_success "Repo: $REPO_NAME"
    log_success "Owner: $REPO_OWNER"
    log_success "Name: $REPO_NAME_ONLY"
}

# Crear app de Amplify para frontend
create_amplify_app() {
    log_info "Creando app de Amplify para frontend..."

    APP_NAME="emotioxv2-frontend"
    REGION="us-east-1"

    # Crear la app
    APP_RESPONSE=$(aws amplify create-app \
        --name $APP_NAME \
        --region $REGION \
        --output json)

    APP_ID=$(echo $APP_RESPONSE | jq -r '.app.appId')
    APP_ARN=$(echo $APP_RESPONSE | jq -r '.app.appArn')

    log_success "App creada: $APP_ID"
    log_success "ARN: $APP_ARN"

    # Guardar App ID para uso posterior
    echo $APP_ID > .amplify-frontend-app-id
}

# Conectar repo a la app
connect_repo() {
    log_info "Conectando repositorio a la app de Amplify..."

    APP_ID=$(cat .amplify-frontend-app-id)
    REGION="us-east-1"

    # Conectar el repo
    aws amplify create-branch \
        --app-id $APP_ID \
        --branch-name main \
        --region $REGION

    # Configurar webhook para GitHub
    WEBHOOK_RESPONSE=$(aws amplify create-webhook \
        --app-id $APP_ID \
        --branch-name main \
        --region $REGION \
        --output json)

    WEBHOOK_URL=$(echo $WEBHOOK_RESPONSE | jq -r '.webhook.webhookUrl')

    log_success "Webhook creado: $WEBHOOK_URL"

    # Guardar webhook URL
    echo $WEBHOOK_URL > .amplify-webhook-url
}

# Configurar GitHub Secrets
setup_github_secrets() {
    log_info "Configurando GitHub Secrets..."

    APP_ID=$(cat .amplify-frontend-app-id)

    # Verificar si GitHub CLI está disponible
    if command -v gh &> /dev/null; then
        log_info "Configurando AMPLIFY_FRONTEND_APP_ID en GitHub..."

        # Configurar el secret
        echo $APP_ID | gh secret set AMPLIFY_FRONTEND_APP_ID --repo $REPO_NAME

        log_success "Secret AMPLIFY_FRONTEND_APP_ID configurado"
    else
        log_warning "GitHub CLI no está disponible"
        log_info "Configura manualmente el secret AMPLIFY_FRONTEND_APP_ID con valor: $APP_ID"
    fi
}

# Configurar build settings
configure_build() {
    log_info "Configurando build settings..."

    APP_ID=$(cat .amplify-frontend-app-id)
    REGION="us-east-1"

    # Crear archivo amplify.yml si no existe
    if [ ! -f "frontend/amplify.yml" ]; then
        cat > frontend/amplify.yml << 'EOF'
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
EOF
        log_success "Archivo amplify.yml creado"
    fi
}

# Probar el despliegue
test_deployment() {
    log_info "Probando despliegue..."

    APP_ID=$(cat .amplify-frontend-app-id)
    REGION="us-east-1"

    # Trigger manual build
    aws amplify start-job \
        --app-id $APP_ID \
        --branch-name main \
        --job-type RELEASE \
        --region $REGION

    log_success "Job de build iniciado"

    # Esperar y verificar estado
    log_info "Esperando que el build termine..."
    sleep 30

    # Obtener estado del job
    JOB_STATUS=$(aws amplify get-job \
        --app-id $APP_ID \
        --branch-name main \
        --job-id $(aws amplify list-jobs --app-id $APP_ID --branch-name main --region $REGION --query 'jobSummaries[0].jobId' --output text) \
        --region $REGION \
        --query 'job.summary.status' \
        --output text)

    log_info "Estado del job: $JOB_STATUS"
}

# Mostrar información final
show_final_info() {
    APP_ID=$(cat .amplify-frontend-app-id)
    WEBHOOK_URL=$(cat .amplify-webhook-url 2>/dev/null || echo "No disponible")

    log_success "=== CONFIGURACIÓN COMPLETADA ==="
    echo ""
    echo "📱 App de Amplify:"
    echo "   - Nombre: emotioxv2-frontend"
    echo "   - App ID: $APP_ID"
    echo "   - URL: https://$APP_ID.amplifyapp.com"
    echo ""
    echo "🔗 Webhook GitHub:"
    echo "   - URL: $WEBHOOK_URL"
    echo ""
    echo "⚙️  GitHub Secrets:"
    echo "   - AMPLIFY_FRONTEND_APP_ID: $APP_ID"
    echo ""
    echo "🚀 Próximos pasos:"
    echo "   1. Ve a GitHub → Settings → Secrets → Actions"
    echo "   2. Verifica que AMPLIFY_FRONTEND_APP_ID esté configurado"
    echo "   3. Haz un commit en la rama main para trigger automático"
    echo "   4. Monitorea el build en AWS Amplify Console"
    echo ""
    echo "🌐 URL de la app: https://$APP_ID.amplifyapp.com"
}

# Función principal
main() {
    log_info "🚀 Iniciando configuración automática de Amplify para frontend..."

    check_aws_cli
    get_repo_info
    create_amplify_app
    connect_repo
    setup_github_secrets
    configure_build
    test_deployment
    show_final_info

    log_success "✅ Configuración completada exitosamente"
}

# Ejecutar función principal
main "$@"
