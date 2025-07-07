#!/bin/bash

# 🔗 Script para conectar Amplify directamente al repositorio de GitHub
# Usa la API de AWS para configurar la conexión completa

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

log_info "🔗 Configurando conexión directa de Amplify con GitHub..."

# 1. Obtener token de GitHub
log_info "Obteniendo token de GitHub..."
GITHUB_TOKEN=$(gh auth token)

if [ -z "$GITHUB_TOKEN" ]; then
    log_error "No se pudo obtener el token de GitHub"
    exit 1
fi

log_success "Token de GitHub obtenido"

# 2. Crear una nueva app conectada al repositorio
log_info "Creando nueva app de Amplify conectada al repositorio..."

# Primero, eliminar la app actual si es necesario
log_info "Eliminando app actual..."
aws amplify delete-app --app-id $APP_ID --region $REGION || true

# Esperar un momento
sleep 10

# Crear nueva app conectada
log_info "Creando nueva app conectada..."
NEW_APP_RESPONSE=$(aws amplify create-app \
    --name "emotioxv2-frontend" \
    --repository "https://github.com/clementeaf/emotioXV2" \
    --oauth-token "$GITHUB_TOKEN" \
    --region $REGION \
    --output json)

NEW_APP_ID=$(echo $NEW_APP_RESPONSE | jq -r '.app.appId')
NEW_APP_ARN=$(echo $NEW_APP_RESPONSE | jq -r '.app.appArn')

log_success "Nueva app creada: $NEW_APP_ID"
log_success "ARN: $NEW_APP_ARN"

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
        - cd frontend
        - npm ci
    build:
      commands:
        - cd frontend
        - npm run build
  artifacts:
    baseDirectory: frontend/.next
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
EOF
    log_success "Archivo amplify.yml creado"
fi

# 4. Hacer commit y push
log_info "Haciendo commit y push..."
git add frontend/amplify.yml
git commit -m "🔗 Configurar Amplify build settings - $(date '+%Y-%m-%d %H:%M:%S')" || true
git push origin main

log_success "Commit y push completados"

# 5. Actualizar GitHub Secrets
log_info "Actualizando GitHub Secrets..."
echo $NEW_APP_ID | gh secret set AMPLIFY_FRONTEND_APP_ID --repo clementeaf/emotioXV2

log_success "GitHub Secrets actualizado"

# 6. Mostrar información final
log_success "=== CONEXIÓN COMPLETADA ==="
echo ""
echo "📱 Nueva App de Amplify: $NEW_APP_ID"
echo "🌐 URL: https://$NEW_APP_ID.amplifyapp.com"
echo "🔗 Repositorio: $REPO_URL"
echo "🔗 Branch: $BRANCH_NAME"
echo ""
echo "📊 Monitorea el progreso en:"
echo "   - AWS Amplify Console: https://console.aws.amazon.com/amplify"
echo "   - GitHub Actions: https://github.com/clementeaf/emotioXV2/actions"
echo ""
echo "⏱️  El primer build se iniciará automáticamente en unos minutos"

# 7. Guardar el nuevo App ID
echo $NEW_APP_ID > .amplify-frontend-app-id-new
log_success "Nuevo App ID guardado en .amplify-frontend-app-id-new"
