#!/bin/bash

# 🧹 EmotioXV2 - Limpieza de Scripts Antiguos
# Script para organizar y limpiar scripts de deployment antiguos

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

# Función principal
main() {
    echo ""
    log_info "🧹 Limpieza de Scripts Antiguos de EmotioXV2"
    echo ""

    # Crear directorio de backup
    create_backup_directory

    # Mover scripts antiguos a backup
    move_old_scripts

    # Mostrar resumen
    show_summary

    echo ""
    log_success "✅ Limpieza completada"
    echo ""
}

# Crear directorio de backup
create_backup_directory() {
    log_info "Creando directorio de backup..."

    BACKUP_DIR="scripts/old-scripts-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    log_success "Directorio de backup creado: $BACKUP_DIR"
}

# Mover scripts antiguos
move_old_scripts() {
    log_info "Moviendo scripts antiguos a backup..."

    # Scripts en directorio raíz
    if [ -f "deploy-frontend-simple.sh" ]; then
        mv "deploy-frontend-simple.sh" "$BACKUP_DIR/"
        log_info "Movido: deploy-frontend-simple.sh"
    fi

    if [ -f "deploy-frontend-s3-cloudfront.sh" ]; then
        mv "deploy-frontend-s3-cloudfront.sh" "$BACKUP_DIR/"
        log_info "Movido: deploy-frontend-s3-cloudfront.sh"
    fi

    # Scripts en directorio scripts/
    if [ -f "scripts/deploy-frontend-s3.sh" ]; then
        mv "scripts/deploy-frontend-s3.sh" "$BACKUP_DIR/"
        log_info "Movido: scripts/deploy-frontend-s3.sh"
    fi

    if [ -f "scripts/deploy-public-tests-s3.sh" ]; then
        mv "scripts/deploy-public-tests-s3.sh" "$BACKUP_DIR/"
        log_info "Movido: scripts/deploy-public-tests-s3.sh"
    fi

    if [ -f "scripts/deploy-all.sh" ]; then
        mv "scripts/deploy-all.sh" "$BACKUP_DIR/"
        log_info "Movido: scripts/deploy-all.sh"
    fi

    if [ -f "scripts/deploy-frontend-simple.sh" ]; then
        mv "scripts/deploy-frontend-simple.sh" "$BACKUP_DIR/"
        log_info "Movido: scripts/deploy-frontend-simple.sh"
    fi

    if [ -f "scripts/deploy-frontend-prod.sh" ]; then
        mv "scripts/deploy-frontend-prod.sh" "$BACKUP_DIR/"
        log_info "Movido: scripts/deploy-frontend-prod.sh"
    fi

    log_success "Scripts antiguos movidos a backup"
}

# Mostrar resumen
show_summary() {
    echo ""
    log_info "📋 Resumen de limpieza:"
    echo ""
    log_info "✅ Scripts nuevos organizados en scripts/deploy/:"
    echo "  🚀 deploy.sh (script principal)"
    echo "  🖥️  deploy-frontend.sh"
    echo "  📱 deploy-public-tests.sh"
    echo "  🚀 deploy-both.sh"
    echo "  📋 show-urls.sh"
    echo "  ✅ validate-deployment.sh"
    echo "  ⚙️  config.sh"
    echo ""
    log_info "📦 Scripts antiguos movidos a: $BACKUP_DIR"
    echo ""
    log_info "💡 Para usar los nuevos scripts:"
    echo "  bash scripts/deploy.sh"
    echo ""
    log_warning "⚠️  Los scripts antiguos están en backup por seguridad"
}

# Ejecutar función principal
main
