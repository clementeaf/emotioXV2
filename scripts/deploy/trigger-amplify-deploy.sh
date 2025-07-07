#!/bin/bash

# 🚀 Script para triggerear despliegue automático en Amplify
# Hace commit y push para activar el workflow de GitHub Actions

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

# Verificar que estamos en el directorio correcto
if [ ! -f "frontend/package.json" ]; then
    log_error "No se encuentra frontend/package.json. Ejecuta desde el directorio raíz del proyecto."
    exit 1
fi

# Verificar que estamos en la rama main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log_warning "No estás en la rama main. Cambiando a main..."
    git checkout main
fi

# Verificar estado del repositorio
log_info "Verificando estado del repositorio..."
if [ -n "$(git status --porcelain)" ]; then
    log_info "Hay cambios sin commitear. Haciendo commit..."

    # Agregar todos los cambios
    git add .

    # Hacer commit
    COMMIT_MESSAGE="🚀 Trigger deploy frontend Amplify - $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MESSAGE"

    log_success "Commit realizado: $COMMIT_MESSAGE"
else
    log_info "No hay cambios pendientes. Creando commit vacío para trigger..."

    # Crear commit vacío
    COMMIT_MESSAGE="🚀 Trigger deploy frontend Amplify - $(date '+%Y-%m-%d %H:%M:%S')"
    git commit --allow-empty -m "$COMMIT_MESSAGE"

    log_success "Commit vacío creado: $COMMIT_MESSAGE"
fi

# Hacer push
log_info "Haciendo push a GitHub..."
git push origin main

log_success "✅ Push completado"

# Mostrar información
log_success "=== TRIGGER COMPLETADO ==="
echo ""
echo "🚀 El workflow de GitHub Actions se ha activado"
echo "📱 App ID: diq999se9lnd8"
echo "🌐 URL: https://diq999se9lnd8.amplifyapp.com"
echo ""
echo "📊 Puedes monitorear el progreso en:"
echo "   - GitHub Actions: https://github.com/clementeaf/emotioXV2/actions"
echo "   - AWS Amplify Console: https://console.aws.amazon.com/amplify"
echo ""
echo "⏱️  El despliegue tarda aproximadamente 3-5 minutos"
