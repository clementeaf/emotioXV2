#!/bin/bash

# 🔗 Script automatizado para conectar Amplify con GitHub
# Configura la conexión completa sin intervención manual

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

# Configuración
APP_ID="diq999se9lnd8"
BRANCH_NAME="main"
REGION="us-east-1"
REPO_URL="https://github.com/clementeaf/emotioXV2"

# Verificar que estamos en el directorio correcto
if [ ! -f "frontend/package.json" ]; then
    log_error "No se encuentra frontend/package.json. Ejecuta desde el directorio raíz del proyecto."
    exit 1
fi

# Función para configurar la conexión usando AWS CLI
setup_amplify_connection() {
    log_info "Configurando conexión de Amplify con GitHub..."

    # 1. Crear webhook en Amplify
    log_info "Creando webhook en Amplify..."
    WEBHOOK_RESPONSE=$(aws amplify create-webhook \
        --app-id $APP_ID \
        --branch-name $BRANCH_NAME \
        --region $REGION \
        --output json)

    WEBHOOK_URL=$(echo $WEBHOOK_RESPONSE | jq -r '.webhook.webhookUrl')
    WEBHOOK_ID=$(echo $WEBHOOK_RESPONSE | jq -r '.webhook.webhookId')

    log_success "Webhook creado: $WEBHOOK_ID"
    log_success "URL del webhook: $WEBHOOK_URL"

    # 2. Configurar webhook en GitHub usando curl
    log_info "Configurando webhook en GitHub..."

    # Crear payload para GitHub webhook
    cat > github-webhook.json << EOF
{
  "name": "Amplify Build Trigger",
  "active": true,
  "events": ["push"],
  "config": {
    "url": "$WEBHOOK_URL",
    "content_type": "application/json"
  }
}
EOF

    # Crear webhook en GitHub usando GitHub API
    GITHUB_RESPONSE=$(curl -s -X POST \
        -H "Authorization: token $(gh auth token)" \
        -H "Accept: application/vnd.github.v3+json" \
        -d @github-webhook.json \
        https://api.github.com/repos/clementeaf/emotioXV2/hooks)

    if echo "$GITHUB_RESPONSE" | jq -e '.id' > /dev/null; then
        WEBHOOK_GITHUB_ID=$(echo "$GITHUB_RESPONSE" | jq -r '.id')
        log_success "Webhook configurado en GitHub: $WEBHOOK_GITHUB_ID"
    else
        log_warning "No se pudo crear webhook en GitHub automáticamente"
        log_info "Configura manualmente el webhook en GitHub:"
        log_info "URL: $WEBHOOK_URL"
        log_info "Events: push"
    fi

    # 3. Configurar build settings
    log_info "Configurando build settings..."

    # Crear amplify.yml si no existe
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

    # 4. Hacer commit y push para triggerear el build
    log_info "Haciendo commit para triggerear el build..."

    git add frontend/amplify.yml
    git commit -m "🔗 Configurar Amplify build - $(date '+%Y-%m-%d %H:%M:%S')" || true
    git push origin main

    log_success "Commit y push completados"
}

# Función para verificar la conexión
verify_connection() {
    log_info "Verificando conexión..."

    # Esperar un momento para que se procese
    sleep 10

    # Verificar si hay jobs en progreso
    JOBS_RESPONSE=$(aws amplify list-jobs \
        --app-id $APP_ID \
        --branch-name $BRANCH_NAME \
        --region $REGION \
        --output json)

    JOB_COUNT=$(echo $JOBS_RESPONSE | jq '.jobSummaries | length')

    if [ "$JOB_COUNT" -gt 0 ]; then
        log_success "✅ Conexión exitosa! Hay $JOB_COUNT job(s) en progreso"

        # Mostrar detalles del job
        JOB_ID=$(echo $JOBS_RESPONSE | jq -r '.jobSummaries[0].jobId')
        JOB_STATUS=$(echo $JOBS_RESPONSE | jq -r '.jobSummaries[0].status')

        log_info "Job ID: $JOB_ID"
        log_info "Estado: $JOB_STATUS"
    else
        log_warning "⚠️  No hay jobs en progreso. Verificando configuración..."

        # Verificar estado del branch
        BRANCH_RESPONSE=$(aws amplify get-branch \
            --app-id $APP_ID \
            --branch-name $BRANCH_NAME \
            --region $REGION \
            --output json)

        AUTO_BUILD=$(echo $BRANCH_RESPONSE | jq -r '.branch.enableAutoBuild')

        if [ "$AUTO_BUILD" = "true" ]; then
            log_info "✅ Auto build está habilitado"
        else
            log_warning "⚠️  Auto build no está habilitado"
        fi
    fi
}

# Función principal
main() {
    log_info "🚀 Iniciando configuración automática de conexión Amplify-GitHub..."

    setup_amplify_connection
    verify_connection

    log_success "=== CONFIGURACIÓN COMPLETADA ==="
    echo ""
    echo "📱 App de Amplify: $APP_ID"
    echo "🌐 URL: https://$APP_ID.amplifyapp.com"
    echo "🔗 Branch: $BRANCH_NAME"
    echo ""
    echo "📊 Monitorea el progreso en:"
    echo "   - AWS Amplify Console: https://console.aws.amazon.com/amplify"
    echo "   - GitHub Actions: https://github.com/clementeaf/emotioXV2/actions"
    echo ""
    echo "⏱️  El primer build puede tardar 3-5 minutos"
}

# Ejecutar función principal
main "$@"
